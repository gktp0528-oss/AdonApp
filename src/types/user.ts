export interface User {
    id: string;
    name: string;
    email: string; // Private field, maybe keep it out of public profile type if needed
    avatar?: string | null;
    coverImage?: string | null;
    location?: string;
    bio?: string;
    positiveRate?: number;
    sales?: number;
    responseTime?: string; // e.g. "within 1 hour"
    reliabilityLabel?: string; // e.g. "Reliable Seller"
    joinedAt: Date | any; // Timestamp or Date
    isVerified?: boolean;
    lastActive?: any; // Timestamp
    isOnline?: boolean;
}
