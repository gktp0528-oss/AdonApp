import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDocs,
    query,
    where,
    Timestamp,
    orderBy,
    runTransaction
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Review } from '../types/review';

const COLLECTION = 'reviews';

export const reviewService = {
    // Submit a new review
    async submitReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
        try {
            return await runTransaction(db, async (transaction) => {
                // 1. Read user data (Must be done before any writes)
                const userRef = doc(db, 'users', reviewData.revieweeId);
                const userDoc = await transaction.get(userRef);

                const reviewRef = collection(db, COLLECTION);
                const newReviewDoc = doc(reviewRef);
                const createdAt = Timestamp.now();

                const fullReview: Review = {
                    id: newReviewDoc.id,
                    ...reviewData,
                    createdAt
                };

                // 2. Create review document (Write)
                transaction.set(newReviewDoc, fullReview);

                // 3. Update transaction with reviewId (Write)
                const transRef = doc(db, 'transactions', reviewData.transactionId);
                transaction.update(transRef, { reviewId: newReviewDoc.id });

                // 4. Update reviewee (seller) rating (Write)
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const currentRating = userData.rating || 0;
                    const currentCount = userData.ratingCount || 0;

                    const newCount = currentCount + 1;
                    const newRating = (currentRating * currentCount + reviewData.rating) / newCount;

                    transaction.update(userRef, {
                        rating: Number(newRating.toFixed(2)),
                        ratingCount: newCount
                    });
                }

                return newReviewDoc.id;
            });
        } catch (error) {
            console.error('Error submitting review:', error);
            throw error;
        }
    },

    // Get reviews for a specific user
    async getReviewsForUser(userId: string): Promise<Review[]> {
        try {
            const q = query(
                collection(db, COLLECTION),
                where('revieweeId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        } catch (error) {
            console.error('Error getting reviews:', error);
            throw error;
        }
    }
};
