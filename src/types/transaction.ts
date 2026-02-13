import { Timestamp } from 'firebase/firestore';

export type TradeType = 'meetup' | 'delivery' | 'locker';

export type TransactionStatus =
    | 'initiated'
    | 'pending_payment'
    | 'paid_held'
    | 'meetup_scheduled'
    | 'shipped'
    | 'delivered'
    | 'locker_reserved'
    | 'deposited'
    | 'picked_up'
    | 'buyer_confirmed'
    | 'released'
    | 'cancelled'
    | 'disputed'
    | 'refunded';

export type EscrowStatus = 'pending_payment' | 'paid_held' | 'released' | 'refunded';

export interface MeetupData {
    date: string;
    time: string;
    place: string;
    buyerCheckin?: boolean;
    sellerCheckin?: boolean;
}

export interface DeliveryData {
    recipientName: string;
    phone: string;
    address: string;
    postcode: string;
    carrier?: string;
    trackingNo?: string;
}

export interface LockerData {
    provider: string; // e.g., "Foxpost", "Zasilkovna"
    locationId: string;
    locationName: string;
    slotId?: string;
    dropoffCode?: string;
    pickupCode?: string;
}

export interface Transaction {
    id: string;
    listingId: string;
    conversationId?: string;
    buyerId: string;
    sellerId: string;
    tradeType: TradeType;
    status: TransactionStatus;
    escrowStatus: EscrowStatus;
    amount: {
        item: number;
        shipping: number;
        platformFee: number;
        total: number;
    };
    currency: string;
    paymentMethod?: string;
    paymentProviderRef?: string;
    safetyCode?: string; // 4-digit PIN for meetup verification
    reviewId?: string; // Reference to the submitted review
    confirmBy?: Timestamp;
    meetup?: MeetupData;
    delivery?: DeliveryData;
    locker?: LockerData;
    dispute?: {
        openedBy: string;
        reason: string;
        openedAt: Timestamp;
        status: 'open' | 'resolved' | 'escalated';
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
