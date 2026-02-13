import {
    collection,
    doc,
    setDoc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Transaction, TransactionStatus, EscrowStatus, TradeType } from '../types/transaction';

export const transactionService = {
    /**
     * Creates a new transaction document in Firestore.
     */
    async createTransaction(data: {
        listingId: string;
        buyerId: string;
        sellerId: string;
        tradeType: TradeType;
        amount: {
            item: number;
            shipping: number;
            platformFee: number;
            total: number;
        };
        currency: string;
        meetup?: any;
        delivery?: any;
        locker?: any;
    }): Promise<string> {
        const transactionRef = doc(collection(db, 'transactions'));
        const transactionId = transactionRef.id;

        const newTransaction: Partial<Transaction> = {
            ...data,
            id: transactionId,
            status: 'pending_payment',
            escrowStatus: 'pending_payment',
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
        };

        await setDoc(transactionRef, newTransaction);
        return transactionId;
    },

    /**
     * Updates a transaction's status.
     */
    async updateTransactionStatus(
        transactionId: string,
        status: TransactionStatus,
        escrowStatus?: EscrowStatus
    ) {
        const transactionRef = doc(db, 'transactions', transactionId);
        const updates: any = {
            status,
            updatedAt: serverTimestamp(),
        };
        if (escrowStatus) {
            updates.escrowStatus = escrowStatus;
        }
        await setDoc(transactionRef, updates, { merge: true });
    },
};
