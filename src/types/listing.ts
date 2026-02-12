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
    originLanguage: string; // Added for automatic translation support
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
}
