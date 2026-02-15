import {
    collection,
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    Timestamp,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    increment,
    updateDoc
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

        const newTransaction: any = {
            ...data,
            id: transactionId,
            safetyCode,
            status: 'paid_held',
            escrowStatus: 'paid_held',
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
        };

        // Filter out undefined properties to avoid Firestore errors
        Object.keys(newTransaction).forEach(key => {
            if (newTransaction[key] === undefined) {
                delete newTransaction[key];
            }
        });

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

        // Increment seller's sales count when transaction is released (e.g. PIN verified)
        if (status === 'released') {
            try {
                const tDoc = await getDoc(transactionRef);
                if (tDoc.exists()) {
                    const { sellerId } = tDoc.data();
                    if (sellerId) {
                        const sellerRef = doc(db, 'users', sellerId);
                        await updateDoc(sellerRef, {
                            sales: increment(1)
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to increment sales count:', error);
                // Don't throw, as the transaction status update itself succeeded
            }
        }
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
            await this.updateTransactionStatus(transactionId, 'released');
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

    /**
     * Finds the latest transaction between a buyer and seller for a listing.
     */
    async getTransactionsByChat(listingId: string, buyerId: string, sellerId: string): Promise<Transaction | null> {
        const trRef = collection(db, 'transactions');
        const q = query(
            trRef,
            where('listingId', '==', listingId),
            where('buyerId', '==', buyerId),
            where('sellerId', '==', sellerId),
            limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            return { id: snap.docs[0].id, ...snap.docs[0].data() } as Transaction;
        }
        return null;
    },
};
