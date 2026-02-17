import {
    collection,
    doc,
    addDoc,
    getDoc,
    setDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    updateDoc,
    increment,
    limit,
    deleteDoc,
    getDocs,
    arrayRemove,
    arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Conversation, Message } from '../types/chat';
import { userService } from './userService';
import { translationService } from './translationService';
import i18n from 'i18next';

const CONVERSATIONS = 'conversations';
const MESSAGES = 'messages';

const buildConversationId = (buyerId: string, sellerId: string, listingId: string) => {
    const [userA, userB] = [buyerId, sellerId].sort();
    return `${listingId}_${userA}_${userB}`;
};

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
        const conversationId = buildConversationId(buyerId, sellerId, listing.id);
        const conversationRef = doc(db, CONVERSATIONS, conversationId);
        const now = Timestamp.now();

        // Fetch participant profiles for denormalization
        const [buyerProfile, sellerProfile] = await Promise.all([
            userService.getUserById(buyerId),
            userService.getUserById(sellerId)
        ]);

        const participantsMetadata: Record<string, any> = {};
        if (buyerProfile) {
            participantsMetadata[buyerId] = {
                name: buyerProfile.name || 'User',
                avatar: buyerProfile.avatar || null
            };
        }
        if (sellerProfile) {
            participantsMetadata[sellerId] = {
                name: sellerProfile.name || 'User',
                avatar: sellerProfile.avatar || null
            };
        }

        // Upsert without pre-read to avoid permission-denied on non-existing documents.
        await setDoc(
            conversationRef,
            {
                participants: [buyerId, sellerId],
                listingId: listing.id,
                listingTitle: listing.title,
                listingPhoto: listing.photo,
                participantsMetadata,
                createdAt: now,
            },
            { merge: true },
        );

        return conversationId;
    },

    /**
     * Send a message in a conversation.
     */
    async sendMessage(conversationId: string, senderId: string, text: string, imageUrl?: string, systemType?: string): Promise<void> {
        const now = Timestamp.now();

        // Get conversation current state to calculate response time logic BEFORE updating it
        const convDoc = await getDoc(doc(db, CONVERSATIONS, conversationId));
        let otherUserId = '';

        if (convDoc.exists()) {
            const convData = convDoc.data() as Conversation;
            otherUserId = convData.participants.find((p) => p !== senderId) || '';

            // Calculate response time if:
            // 1. Last sender was the OTHER person (so this is a reply)
            // 2. Last message time exists
            if (convData.lastSenderId && convData.lastSenderId !== senderId && convData.lastMessageAt) {
                const lastTime = convData.lastMessageAt.toDate();
                const currentTime = now.toDate();
                const diffMs = currentTime.getTime() - lastTime.getTime();
                const diffMinutes = Math.floor(diffMs / (1000 * 60));

                // Update response time for the CURRENT sender (who exists and is replying)
                // We don't await this to not block the message sending UI
                userService.updateResponseTime(senderId, diffMinutes);
            }
        }

        // Add message to subcollection
        const messageRef = await addDoc(collection(db, CONVERSATIONS, conversationId, MESSAGES), {
            senderId,
            text,
            ...(imageUrl ? { imageUrl } : {}),
            ...(systemType ? { systemType } : {}),
            createdAt: now,
            read: false,
            // Translation fields
            senderLanguage: i18n.language || 'en',
            translations: {}
        });

        // Update conversation metadata
        await updateDoc(doc(db, CONVERSATIONS, conversationId), {
            lastMessage: text || (imageUrl ? '📷 Picture' : ''),
            lastMessageAt: now,
            lastSenderId: senderId,
            [`unreadCount.${senderId}`]: 0,
            ...(otherUserId ? { [`unreadCount.${otherUserId}`]: increment(1) } : {}),
            [`lastReadAt.${senderId}`]: now,
            // If sender had previously deleted, restore conversation for them
            deletedFor: arrayRemove(senderId),
        });

        // Async language detection (non-blocking)
        // Only detect for text messages, not images or system messages
        if (text && !systemType) {
            translationService.detectAndStoreLanguage(
                conversationId,
                messageRef.id,
                text,
                i18n.language || 'en'
            ).catch(error => {
                console.error('Background language detection failed:', error);
            });
        }
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
                if (data.deletedFor?.includes(userId)) return;
                if (data.unreadCount && typeof data.unreadCount[userId] === 'number') {
                    total += data.unreadCount[userId];
                }
            });
            callback(total);
        }, (error: any) => {
            if (error.code !== 'permission-denied') {
                console.error('Error watching total unread count:', error);
            }
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
            orderBy('createdAt', 'desc'),
            limit(limitCount),
        );
        return onSnapshot(
            q,
            (snapshot) => {
                const newestFirst = snapshot.docs.map(
                    (d) => ({ id: d.id, ...d.data() } as Message),
                );
                const messages = newestFirst.reverse();
                callback(messages);
            },
            (error: any) => {
                if (error.code !== 'permission-denied') {
                    console.error(`Error watching messages for ${conversationId}:`, error);
                }
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
                const conversations = snapshot.docs
                    .map((d) => ({ id: d.id, ...d.data() } as Conversation))
                    .filter((c) => !c.deletedFor?.includes(userId));
                callback(conversations);
            },
            (error: any) => {
                if (error.code !== 'permission-denied') {
                    console.error(`Error watching conversations for ${userId}:`, error);
                }
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
            (error: any) => {
                if (error.code !== 'permission-denied') {
                    console.error(`Error watching conversation ${conversationId}:`, error);
                }
            },
        );
    },

    /**
     * Mark all messages in a conversation as read for the current user.
     */
    async markAsRead(conversationId: string, userId: string): Promise<void> {
        try {
            const now = Timestamp.now();
            await updateDoc(doc(db, CONVERSATIONS, conversationId), {
                [`unreadCount.${userId}`]: 0,
                [`lastReadAt.${userId}`]: now,
            });
        } catch (error) {
            console.error(`Error marking conversation ${conversationId} as read:`, error);
        }
    },

    /**
     * Soft-delete a conversation for a specific user.
     * If both participants have deleted, the conversation is permanently removed.
     */
    async deleteConversation(conversationId: string, userId: string): Promise<void> {
        try {
            const convRef = doc(db, CONVERSATIONS, conversationId);
            const convSnap = await getDoc(convRef);

            if (!convSnap.exists()) return;

            const convData = convSnap.data() as Conversation;
            const updatedDeletedFor = [...(convData.deletedFor || []), userId];
            const allLeft = convData.participants.every(p => updatedDeletedFor.includes(p));

            if (allLeft) {
                // Both users have deleted — permanently remove
                const messagesRef = collection(db, CONVERSATIONS, conversationId, MESSAGES);
                const messagesSnap = await getDocs(messagesRef);
                await Promise.all(messagesSnap.docs.map(mDoc => deleteDoc(mDoc.ref)));
                await deleteDoc(convRef);
            } else {
                // Only this user deleted — soft delete
                await updateDoc(convRef, {
                    deletedFor: arrayUnion(userId),
                });
            }
        } catch (error) {
            console.error(`Error deleting conversation ${conversationId}:`, error);
            throw error;
        }
    },
};
