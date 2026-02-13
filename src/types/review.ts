import { Timestamp } from 'firebase/firestore';

export interface Review {
    id: string;
    transactionId: string;
    listingId: string;
    reviewerId: string;
    revieweeId: string;
    rating: number; // 0 to 5
    comment: string;
    createdAt: Timestamp;
}
