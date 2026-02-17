import {
    collection,
    doc,
    getDoc,
    setDoc,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User } from '../types/user';
import { auth } from '../firebaseConfig';

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
        }, (error: any) => {
            // Silence permission-denied errors as they are expected during logout/account deletion
            if (error.code !== 'permission-denied') {
                console.error(`Error watching user ${id}:`, error);
            }
        });
    },

    // Get current user ID.
    // This app requires login, so we do not use any shared fallback account.
    getCurrentUserId(): string {
        const currentUser = auth.currentUser;
        return currentUser ? currentUser.uid : '';
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
    },

    // Update response time statistics
    async updateResponseTime(userId: string, minutes: number): Promise<void> {
        try {
            const user = await this.getUserById(userId);
            if (!user) return;

            const currentTotal = user.responseTotalTime || 0;
            const currentCount = user.responseCount || 0;

            const newTotal = currentTotal + minutes;
            const newCount = currentCount + 1;
            const averageMinutes = newTotal / newCount;

            let label = 'screen.profile.stats.responseValue.fewDays';
            if (averageMinutes < 60) {
                label = 'screen.profile.stats.responseValue.hour';
            } else if (averageMinutes < 12 * 60) {
                label = 'screen.profile.stats.responseValue.12hours';
            } else if (averageMinutes < 24 * 60) {
                label = 'screen.profile.stats.responseValue.day';
            }

            await this.updateUser(userId, {
                responseTotalTime: newTotal,
                responseCount: newCount,
                responseTime: label, // We store the translation key to handle i18n dynamically
            });
        } catch (error) {
            console.error(`Error updating response time for ${userId}:`, error);
        }
    },

    // Keyword management
    async addKeyword(userId: string, keyword: string): Promise<void> {
        try {
            const user = await this.getUserById(userId);
            const currentKeywords = user?.keywords || [];
            if (currentKeywords.includes(keyword)) return;

            await this.updateUser(userId, {
                keywords: [...currentKeywords, keyword]
            });
        } catch (error) {
            console.error('Error adding keyword:', error);
            throw error;
        }
    },

    async removeKeyword(userId: string, keyword: string): Promise<void> {
        try {
            const user = await this.getUserById(userId);
            const currentKeywords = user?.keywords || [];
            await this.updateUser(userId, {
                keywords: currentKeywords.filter(k => k !== keyword)
            });
        } catch (error) {
            console.error('Error removing keyword:', error);
            throw error;
        }
    }
};
