import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    updateDoc,
    increment,
    limit,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Conversation, Message } from '../types/chat';

const CONVERSATIONS = 'conversations';
const MESSAGES = 'messages';

export const chatService = {
    /**
     * Find existing conversation between two users for a specific listing,
     * or create a new one if it doesn't exist.
     */
    async getOrCreateConversation(
        buyerId: string,
        sellerId: string,
        listing: { id: string; title: string; photo: string },
    ): Promise<string> {
        // Check if a conversation already exists for this buyer+seller+listing
        const q = query(
            collection(db, CONVERSATIONS),
            where('participants', 'array-contains', buyerId),
            where('listingId', '==', listing.id),
        );
        const snap = await getDocs(q);

        const existing = snap.docs.find((d) => {
            const data = d.data();
            return data.participants.includes(sellerId);
        });

        if (existing) return existing.id;

        // Create new conversation
        const now = Timestamp.now();
        const convRef = await addDoc(collection(db, CONVERSATIONS), {
            participants: [buyerId, sellerId],
            listingId: listing.id,
            listingTitle: listing.title,
            listingPhoto: listing.photo,
            lastMessage: '',
            lastMessageAt: now,
            lastSenderId: '',
            unreadCount: { [buyerId]: 0, [sellerId]: 0 },
            createdAt: now,
        });

        return convRef.id;
    },

    /**
     * Send a message in a conversation.
     */
    async sendMessage(conversationId: string, senderId: string, text: string, imageUrl?: string): Promise<void> {
        const now = Timestamp.now();

        // Add message to subcollection
        await addDoc(collection(db, CONVERSATIONS, conversationId, MESSAGES), {
            senderId,
            text,
            ...(imageUrl ? { imageUrl } : {}),
            createdAt: now,
            read: false,
        });

        // Get conversation to find the other participant
        const convDoc = await getDoc(doc(db, CONVERSATIONS, conversationId));
        if (!convDoc.exists()) return;

        const convData = convDoc.data() as Omit<Conversation, 'id'>;
        const otherUserId = convData.participants.find((p) => p !== senderId) || '';

        // Update conversation metadata
        await updateDoc(doc(db, CONVERSATIONS, conversationId), {
            lastMessage: text || (imageUrl ? '📷 Picture' : ''),
            lastMessageAt: now,
            lastSenderId: senderId,
            [`unreadCount.${otherUserId}`]: increment(1),
        });
    },

    /**
     * Subscribe to total unread count for a user.
     */
    watchTotalUnreadCount(userId: string, callback: (count: number) => void): () => void {
        const q = query(
            collection(db, CONVERSATIONS),
            where('participants', 'array-contains', userId)
        );
        return onSnapshot(q, (snapshot) => {
            let total = 0;
            snapshot.docs.forEach(doc => {
                const data = doc.data() as Conversation;
                if (data.unreadCount && typeof data.unreadCount[userId] === 'number') {
                    total += data.unreadCount[userId];
                }
            });
            callback(total);
        });
    },

    /**
     * Subscribe to messages in a conversation (real-time).
     */
    watchMessages(
        conversationId: string,
        callback: (messages: Message[]) => void,
        limitCount: number = 20,
    ): () => void {
        const q = query(
            collection(db, CONVERSATIONS, conversationId, MESSAGES),
            orderBy('createdAt', 'asc'),
            limit(limitCount),
        );
        return onSnapshot(
            q,
            (snapshot) => {
                const messages = snapshot.docs.map(
                    (d) => ({ id: d.id, ...d.data() } as Message),
                );
                callback(messages);
            },
            (error) => {
                console.error(`Error watching messages for ${conversationId}:`, error);
            },
        );
    },

    /**
     * Subscribe to all conversations for a user (real-time).
     */
    watchConversations(
        userId: string,
        callback: (conversations: Conversation[]) => void,
    ): () => void {
        const q = query(
            collection(db, CONVERSATIONS),
            where('participants', 'array-contains', userId),
            orderBy('lastMessageAt', 'desc'),
        );
        return onSnapshot(
            q,
            (snapshot) => {
                const conversations = snapshot.docs.map(
                    (d) => ({ id: d.id, ...d.data() } as Conversation),
                );
                callback(conversations);
            },
            (error) => {
                console.error(`Error watching conversations for ${userId}:`, error);
            },
        );
    },

    /**
     * Subscribe to a single conversation by ID (real-time).
     */
    watchConversationById(
        conversationId: string,
        callback: (conversation: Conversation | null) => void,
    ): () => void {
        const docRef = doc(db, CONVERSATIONS, conversationId);
        return onSnapshot(
            docRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    callback({ id: docSnap.id, ...docSnap.data() } as Conversation);
                } else {
                    callback(null);
                }
            },
            (error) => {
                console.error(`Error watching conversation ${conversationId}:`, error);
            },
        );
    },

    /**
     * Mark all messages in a conversation as read for the current user.
     */
    async markAsRead(conversationId: string, userId: string): Promise<void> {
        try {
            await updateDoc(doc(db, CONVERSATIONS, conversationId), {
                [`unreadCount.${userId}`]: 0,
            });
        } catch (error) {
            console.error(`Error marking conversation ${conversationId} as read:`, error);
        }
    },
};
