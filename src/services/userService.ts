import {
    collection,
    doc,
    getDoc,
    setDoc,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User } from '../types/user';
import { authService } from './authService';

const COLLECTION = 'users';

export const userService = {
    // Get a single user by ID
    async getUserById(id: string): Promise<User | null> {
        try {
            const docRef = doc(db, COLLECTION, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as User;
            } else {
                return null; // Or return a basic fallback user structure if allowed
            }
        } catch (error) {
            console.error(`Error getting user ${id}:`, error);
            throw error;
        }
    },

    // Subscribe to user profile updates
    watchUserById(id: string, callback: (user: User | null) => void): () => void {
        const docRef = doc(db, COLLECTION, id);
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback({ id: docSnap.id, ...docSnap.data() } as User);
            } else {
                callback(null);
            }
        }, (error) => {
            console.error(`Error watching user ${id}:`, error);
        });
    },

    // Get current user ID (Real Auth)
    getCurrentUserId(): string {
        const currentUser = authService.getCurrentUser();
        // Fallback to temp id if not logged in (for public view or dev)
        // In strict mode, this should return null or throw
        return currentUser ? currentUser.uid : 'temp_seller_123';
    },

    // Update user profile
    async updateUser(userId: string, data: Partial<User>): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION, userId);
            await setDoc(docRef, data, { merge: true });
        } catch (error) {
            console.error(`Error updating user ${userId}:`, error);
            throw error;
        }
    }
};
