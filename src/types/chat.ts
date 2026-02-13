import { Timestamp } from 'firebase/firestore';

export interface Message {
    id: string;
    senderId: string;
    text: string;
    imageUrl?: string;
    createdAt: Timestamp;
    read: boolean;
}

export interface Conversation {
    id: string;
    participants: string[]; // [buyerId, sellerId]
    listingId: string;
    listingTitle: string;
    listingPhoto: string;
    lastMessage: string;
    lastMessageAt: Timestamp;
    lastSenderId: string;
    unreadCount: Record<string, number>; // { [userId]: count }
    lastReadAt?: Record<string, Timestamp>;
    createdAt: Timestamp;
}
