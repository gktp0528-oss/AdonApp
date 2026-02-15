import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    startAfter,
    DocumentSnapshot,
    QueryConstraint,
    updateDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Listing } from '../types/listing';
import { wishlistService } from './wishlistService';
import { notificationService } from './notificationService';

const COLLECTION = 'listings';
const PAGE_SIZE = 20;

export const listingService = {
    // Create a new listing
    async createListing(listingData: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        try {
            const now = Timestamp.now();
            const docRef = await addDoc(collection(db, COLLECTION), {
                ...listingData,
                createdAt: now,
                updatedAt: now,
                // Ensure default values for critical fields
                status: listingData.status || 'active',
                currency: listingData.currency || 'EUR',
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating listing:', error);
            throw error;
        }
    },

    // Update a listing
    async updateListing(id: string, data: Partial<Listing>): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION, id);
            const oldDoc = await getDoc(docRef);

            if (!oldDoc.exists()) throw new Error('Listing not found');
            const oldData = oldDoc.data() as Listing;

            // Update identifying fields
            const now = Timestamp.now();
            await updateDoc(docRef, {
                ...data,
                updatedAt: now,
            });

            // Price Drop Detection
            if (data.price !== undefined && data.price < oldData.price) {
                console.log(`Price drop detected for ${id}: ${oldData.price} -> ${data.price}`);

                // Track old price in the document for UI display
                await updateDoc(docRef, {
                    oldPrice: oldData.price
                });

                // Notify users who have this in their wishlist
                const wishlists = await wishlistService.getWishlistByListing(id);
                for (const item of wishlists) {
                    // In a real app, this would be a server-side trigger (Cloud Function)
                    // For now, if the current user is in the wishlist, we'll send a local notification
                    // to simulate the experience.
                    if (item.userId === oldData.sellerId) continue; // Don't notify seller

                    // Mock: Send local notification if current user matches
                    // (Actually we'd want to notify everyone, but local notifications are device-specific)
                    await notificationService.sendLocalNotification(
                        'Price Drop! 💸',
                        `An item you wishlisted "${oldData.title}" is now cheaper!`,
                        { listingId: id }
                    );
                }
            }
        } catch (error) {
            console.error(`Error updating listing ${id}:`, error);
            throw error;
        }
    },

    // Get a single listing by ID
    async getListingById(id: string): Promise<Listing | null> {
        try {
            const docRef = doc(db, COLLECTION, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Listing;
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error getting listing ${id}:`, error);
            throw error;
        }
    },

    // Subscribe to a single listing updates
    watchListingById(id: string, callback: (listing: Listing | null) => void): () => void {
        const docRef = doc(db, COLLECTION, id);
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback({ id: docSnap.id, ...docSnap.data() } as Listing);
            } else {
                callback(null);
            }
        }, (error) => {
            console.error(`Error watching listing ${id}:`, error);
        });
    },

    // Get latest active listings for home screen with pagination
    async getLatestListings(lastDoc?: DocumentSnapshot): Promise<{ listings: Listing[], lastDoc: DocumentSnapshot | null }> {
        try {
            const constraints: QueryConstraint[] = [
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc'),
                limit(PAGE_SIZE)
            ];

            if (lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            const q = query(collection(db, COLLECTION), ...constraints);
            const querySnapshot = await getDocs(q);

            const listings: Listing[] = [];
            querySnapshot.forEach((doc) => {
                listings.push({ id: doc.id, ...doc.data() } as Listing);
            });

            return {
                listings,
                lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null
            };
        } catch (error) {
            console.error('Error fetching latest listings:', error);
            throw error;
        }
    },

    // Get listings by seller
    async getListingsBySeller(sellerId: string): Promise<Listing[]> {
        try {
            const q = query(
                collection(db, COLLECTION),
                where('sellerId', '==', sellerId),
                where('status', 'in', ['active', 'sold']), // Show active and sold items
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        } catch (error) {
            console.error(`Error fetching listings for seller ${sellerId}:`, error);
            throw error;
        }
    },

    // Subscribe to latest listings
    watchLatestListings(callback: (listings: Listing[]) => void): () => void {
        const q = query(
            collection(db, COLLECTION),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(PAGE_SIZE)
        );
        return onSnapshot(q, (snapshot) => {
            const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
            callback(listings);
        }, (error) => {
            console.error('Error watching latest listings:', error);
        });
    },

    // Subscribe to seller listings in real-time
    watchListingsBySeller(sellerId: string, callback: (listings: Listing[]) => void): () => void {
        const q = query(
            collection(db, COLLECTION),
            where('sellerId', '==', sellerId),
            where('status', 'in', ['active', 'sold']),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const listings = snapshot.docs.map((listingDoc) => ({ id: listingDoc.id, ...listingDoc.data() } as Listing));
            callback(listings);
        }, (error) => {
            console.error(`Error watching listings for seller ${sellerId}:`, error);
        });
    }
};
