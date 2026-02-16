import { Timestamp } from 'firebase/firestore';

export type ListingCondition = 'New' | 'Like New' | 'Good' | 'Fair';
export type ListingStatus = 'active' | 'sold' | 'hidden';

export interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    photos: string[];
    category: string;
    condition: ListingCondition;
    sellerId: string;
    status: ListingStatus;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Optional fields
    brand?: string;
    size?: string;
    colorName?: string;
    colorHex?: string;
    oldPrice?: number;
    isPremium?: boolean;
    isVerifiedAuthentic?: boolean;
    shippingOptions?: string[]; // e.g., ['shipping', 'pickup']
    pickupLocation?: {
        latitude: number;
        longitude: number;
        address: string;
    };
    views?: number;
    likes?: number;
    hotUntil?: Timestamp; // HOT badge active until this timestamp (24h from 10th like)
}

export type UnifiedAiReport = {
    itemName: string;
    category: string;
    marketDemand: string;
    conditionScore: number | null;
    priceRange: { min: number; max: number } | null;
    insights: string[];
    reasoning: string;
};
