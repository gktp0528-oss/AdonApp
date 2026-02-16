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
    Timestamp,
    updateDoc,
    increment
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

            const listingRef = doc(db, 'listings', listingId);
            let isLiked = false;

            if (docSnap.exists()) {
                console.log(`[WishlistService] Removing like for ${id}`);
                await deleteDoc(docRef);
                // Decrement likes count
                await updateDoc(listingRef, {
                    likes: increment(-1)
                });
                isLiked = false; // Unliked
            } else {
                console.log(`[WishlistService] Adding like for ${id}`);
                await setDoc(docRef, {
                    userId,
                    listingId,
                    priceAtWhishlist: currentPrice,
                    createdAt: Timestamp.now()
                });
                // Increment likes count
                await updateDoc(listingRef, {
                    likes: increment(1)
                });
                isLiked = true; // Liked
            }

            // Calculate 24-hour likes count and update HOT status
            await this.updateHotStatus(listingId);

            return isLiked;
        } catch (error) {
            console.error('[WishlistService] Error toggling like:', error);
            throw error;
        }
    },

    // Update HOT badge status based on 24-hour likes
    async updateHotStatus(listingId: string): Promise<void> {
        try {
            const wishlists = await this.getWishlistByListing(listingId);
            const now = Date.now();
            const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

            // Count likes in the last 24 hours
            const recentLikesCount = wishlists.filter(item => {
                const createdAt = item.createdAt.toDate().getTime();
                return createdAt >= twentyFourHoursAgo;
            }).length;

            const listingRef = doc(db, 'listings', listingId);

            if (recentLikesCount >= 10) {
                // Set HOT badge to expire 24 hours from now
                const hotUntil = Timestamp.fromMillis(now + (24 * 60 * 60 * 1000));
                await updateDoc(listingRef, { hotUntil });
                console.log(`[WishlistService] Listing ${listingId} is HOT with ${recentLikesCount} likes in 24h`);
            } else {
                // Remove HOT badge if less than 10 likes in 24h
                await updateDoc(listingRef, { hotUntil: null });
            }
        } catch (error) {
            console.error('[WishlistService] Error updating hot status:', error);
            // Don't throw - this is a non-critical operation
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
