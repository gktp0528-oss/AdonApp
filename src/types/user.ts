export interface User {
    id: string;
    name: string;
    nameLower?: string;
    email: string; // Private field, maybe keep it out of public profile type if needed
    avatar?: string | null;
    coverImage?: string | null;
    location?: string;
    bio?: string;
    positiveRate?: number;
    sales?: number;
    responseTime?: string; // e.g. "within 1 hour"
    responseTotalTime?: number; // Total minutes for calculation
    responseCount?: number; // Total count for calculation
    rating?: number;
    ratingCount?: number;
    reliabilityLabel?: string;
    joinedAt: Date | any; // Timestamp or Date
    isVerified?: boolean;
    lastActive?: any; // Timestamp
    isOnline?: boolean;
    pushToken?: string;
    keywords?: string[];
    language?: string; // 'ko', 'en', 'hu'
    // Notification Settings
    notificationSettings?: {
        pushEnabled: boolean;
        chatEnabled: boolean;
        priceDropEnabled: boolean;
        marketingEnabled: boolean;
    };
    // Consent & Legal
    consentedAt?: string;   // ISO timestamp when user accepted terms
    marketingOptIn?: boolean; // Whether user opted in to marketing emails
}
