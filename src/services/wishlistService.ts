import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const COLLECTION = 'wishlists';

export interface WishlistItem {
    id?: string;
    userId: string;
    listingId: string;
    priceAtWhishlist: number;
    createdAt: Timestamp;
}

export const wishlistService = {
    // Toggle like/unlike
    async toggleLike(userId: string, listingId: string, currentPrice: number): Promise<boolean> {
        try {
            const id = `${userId}_${listingId}`;
            console.log(`[WishlistService] Toggling like for ${id}`);
            const docRef = doc(db, COLLECTION, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log(`[WishlistService] Removing like for ${id}`);
                await deleteDoc(docRef);
                return false; // Unliked
            } else {
                console.log(`[WishlistService] Adding like for ${id}`);
                await setDoc(docRef, {
                    userId,
                    listingId,
                    priceAtWhishlist: currentPrice,
                    createdAt: Timestamp.now()
                });
                return true; // Liked
            }
        } catch (error) {
            console.error('[WishlistService] Error toggling like:', error);
            throw error;
        }
    },

    // Check if user liked a listing
    async isLiked(userId: string, listingId: string): Promise<boolean> {
        if (!userId || !listingId) return false;
        try {
            const id = `${userId}_${listingId}`;
            const docRef = doc(db, COLLECTION, id);
            const docSnap = await getDoc(docRef);
            return docSnap.exists();
        } catch (error) {
            console.error('Error checking like status:', error);
            return false;
        }
    },

    // Get all wishlisted items for a user
    async getWishlist(userId: string): Promise<WishlistItem[]> {
        try {
            const q = query(collection(db, COLLECTION), where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WishlistItem));
        } catch (error) {
            console.error('Error getting wishlist:', error);
            throw error;
        }
    },

    // Watch wishlist status for a specific listing
    watchLikeStatus(userId: string, listingId: string, callback: (isLiked: boolean) => void): () => void {
        const id = `${userId}_${listingId}`;
        const docRef = doc(db, COLLECTION, id);
        return onSnapshot(docRef, (docSnap) => {
            callback(docSnap.exists());
        });
    },

    // Get all users who wishlisted a specific listing
    async getWishlistByListing(listingId: string): Promise<WishlistItem[]> {
        try {
            const q = query(collection(db, COLLECTION), where('listingId', '==', listingId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WishlistItem));
        } catch (error) {
            console.error('Error getting wishlist by listing:', error);
            throw error;
        }
    },

    // Watch a user's entire wishlist
    watchWishlist(userId: string, callback: (items: WishlistItem[]) => void): () => void {
        const q = query(collection(db, COLLECTION), where('userId', '==', userId));
        return onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WishlistItem));
            callback(items);
        });
    }
};
