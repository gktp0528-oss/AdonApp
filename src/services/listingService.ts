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
import { Listing, CreateListingData } from '../types/listing';
import { wishlistService } from './wishlistService';
import { notificationService } from './notificationService';
import { algoliaService } from './algoliaService';

const COLLECTION = 'listings';
const PAGE_SIZE = 20;

export const listingService = {
    // Create a new listing
    async createListing(listingData: CreateListingData): Promise<string> {
        let listingId = '';
        const now = Timestamp.now();
        const finalData = {
            ...listingData,
            createdAt: now,
            updatedAt: now,
            status: listingData.status || 'active',
            currency: listingData.currency || 'HUF',
        };

        try {
            const docRef = await addDoc(collection(db, COLLECTION), finalData);
            listingId = docRef.id;
        } catch (error: any) {
            console.error('[ListingService] addDoc failed:', error);
            throw error;
        }

        // Keyword Matching Logic (Isolated)
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('keywords', '!=', []));
            const userSnapshots = await getDocs(q);
            const normalizedTitle = (listingData.title || '').toLowerCase();
            const notificationTasks: Promise<void>[] = [];

            for (const userDoc of userSnapshots.docs) {
                const userData = userDoc.data();
                const userId = userDoc.id;
                if (userId === listingData.sellerId) continue;

                const userKeywords = userData.keywords || [];
                const matchedKeyword = userKeywords.find((kw: string) =>
                    normalizedTitle.includes(kw.toLowerCase())
                );

                if (matchedKeyword) {
                    notificationTasks.push(
                        notificationService.sendNotification(
                            userId,
                            'keyword',
                            'New item matched! ✨',
                            `A new item matching your keyword "${matchedKeyword}" was just listed: ${listingData.title}`,
                            { listingId }
                        )
                    );
                }
            }

            await Promise.all(notificationTasks);
        } catch (err) {
            console.warn('[ListingService] Keyword matching failed (background):', err);
        }

        // Sync to Algolia (Isolated)
        try {
            const fullListing = {
                id: listingId,
                ...listingData,
                createdAt: now.toDate().getTime(),
                updatedAt: now.toDate().getTime(),
            };
            await algoliaService.syncListing(fullListing);
        } catch (algErr) {
            console.warn('[ListingService] Algolia initial sync failed (background):', algErr);
        }

        return listingId;
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
            if (data.price !== undefined) {
                const currentPrice = oldData.price;
                const initialPrice = oldData.oldPrice || currentPrice;

                if (data.price < currentPrice) {
                    if (!oldData.oldPrice) {
                        await updateDoc(docRef, { oldPrice: currentPrice });
                    }
                    const wishlists = await wishlistService.getWishlistByListing(id);
                    await Promise.all(
                        wishlists
                            .filter((item) => item.userId !== oldData.sellerId)
                            .map((item) =>
                                notificationService.sendNotification(
                                    item.userId,
                                    'priceDrop',
                                    'Price Drop! 💸',
                                    `An item you wishlisted "${oldData.title}" is now cheaper!`,
                                    { listingId: id }
                                )
                            )
                    );
                } else if (data.price >= initialPrice) {
                    await updateDoc(docRef, { oldPrice: null });
                }
            }

            // Sync updated data to Algolia
            try {
                const updatedDoc = await getDoc(docRef);
                if (updatedDoc.exists()) {
                    const fullData = { id: id, ...updatedDoc.data() };
                    await algoliaService.syncListing(fullData);
                }
            } catch (algErr) {
                console.warn('Algolia update sync failed:', algErr);
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
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Listing : null;
        } catch (error) {
            console.error(`Error getting listing ${id}:`, error);
            throw error;
        }
    },

    // Subscribe to a single listing updates
    watchListingById(id: string, callback: (listing: Listing | null) => void): () => void {
        const docRef = doc(db, COLLECTION, id);
        return onSnapshot(docRef, (docSnap) => {
            callback(docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Listing : null);
        }, (error) => {
            console.error(`Error watching listing ${id}:`, error);
        });
    },

    // Get latest active listings
    async getLatestListings(lastDoc?: DocumentSnapshot): Promise<{ listings: Listing[], lastDoc: DocumentSnapshot | null }> {
        try {
            const constraints: QueryConstraint[] = [
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc'),
                limit(PAGE_SIZE)
            ];
            if (lastDoc) constraints.push(startAfter(lastDoc));
            const q = query(collection(db, COLLECTION), ...constraints);
            const querySnapshot = await getDocs(q);
            const listings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
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
            const q = query(collection(db, COLLECTION), where('sellerId', '==', sellerId), where('status', 'in', ['active', 'sold']), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        } catch (error) {
            console.error(`Error fetching listings for seller ${sellerId}:`, error);
            throw error;
        }
    },

    // Real-time watches
    watchLatestListings(callback: (listings: Listing[]) => void): () => void {
        const q = query(collection(db, COLLECTION), where('status', '==', 'active'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));
        }, (error) => {
            console.error('Error watching latest listings:', error);
        });
    },

    watchListingsBySeller(sellerId: string, callback: (listings: Listing[]) => void): () => void {
        const q = query(collection(db, COLLECTION), where('sellerId', '==', sellerId), where('status', 'in', ['active', 'sold']), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));
        }, (error) => {
            console.error(`Error watching listings for seller ${sellerId}:`, error);
        });
    }
};
