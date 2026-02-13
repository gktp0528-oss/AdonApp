import {
    collection,
    doc,
    setDoc,
    getDoc,
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

        // Generate a 4-digit safety code for meetup trades
        const safetyCode = data.tradeType === 'meetup'
            ? Math.floor(1000 + Math.random() * 9000).toString()
            : undefined;

        const newTransaction: Partial<Transaction> = {
            ...data,
            id: transactionId,
            safetyCode,
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

    /**
     * Verifies a safety code and updates status if correct.
     */
    async verifySafetyCode(transactionId: string, inputCode: string): Promise<boolean> {
        const transactionRef = doc(db, 'transactions', transactionId);
        // In a real app, we'd use a transaction or a Cloud Function for security.
        // For this demo/v1, we'll do a simple check.
        const snap = await getDoc(transactionRef);
        if (snap.exists() && snap.data().safetyCode === inputCode) {
            await this.updateTransactionStatus(transactionId, 'delivered');
            return true;
        }
        return false;
    },

    /**
     * Retrieves a single transaction by ID.
     */
    async getTransaction(transactionId: string): Promise<Transaction | null> {
        const transactionRef = doc(db, 'transactions', transactionId);
        const snap = await getDoc(transactionRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as Transaction;
        }
        return null;
    },
};
