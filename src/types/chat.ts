import { Timestamp } from 'firebase/firestore';

export interface Message {
    id: string;
    senderId: string;
    text: string;
    imageUrl?: string;
    systemType?: string;
    createdAt: Timestamp;
    read: boolean;

    // Translation fields
    senderLanguage?: string; // ISO code: 'ko', 'en', 'hu'
    translations?: {
        [languageCode: string]: {
            text: string;
            translatedAt: Timestamp;
        }
    };
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
    participantsMetadata?: Record<string, {
        name: string;
        avatar?: string | null;
    }>;
    createdAt: Timestamp;
}
