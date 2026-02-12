import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    startAt,
    endAt,
    addDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebaseConfig'; // Corrected path
import { Listing } from '../types/listing';

export interface SearchService {
    getSuggestions(queryText: string, userId?: string): Promise<string[]>;
    searchListings(queryText: string, options?: any): Promise<Listing[]>;
    trackSearch(queryText: string, meta?: any): Promise<void>;
    trackClick(queryText: string, listingId: string, position: number, meta?: any): Promise<void>;
    getRecentSearches(): Promise<string[]>;
    clearRecentSearches(): Promise<void>;
}

const SEARCH_LOGS_COLLECTION = 'search_logs';
const KEYWORD_STATS_COLLECTION = 'keyword_stats';
const RECENT_SEARCH_KEY = 'adon_recent_searches';
const MAX_RECENT_SEARCHES = 10;

class SearchServiceImpl implements SearchService {

    // Phase 1: Real Data Suggestions (Recent + Prefix Match)
    async getSuggestions(queryText: string, userId?: string): Promise<string[]> {
        const normalizedQuery = queryText.trim().toLowerCase();
        if (!normalizedQuery) return this.getRecentSearches();

        const suggestions: Set<string> = new Set();

        try {
            // 1. Fetch from Firestore listings (Prefix match on title)
            // Note: This is case-sensitive in Firestore without specific setup. 
            // For Phase 0/1, we'll do a simple query. Real separate index recommended later.
            const listingsRef = collection(db, 'listings');
            // Capitalize first letter for better matching if titles are Title Case
            // This is a naive implementation for Phase 0
            const searchPrefix = normalizedQuery;
            const endPrefix = normalizedQuery + '\uf8ff';

            // We might need a separate 'keywords' collection or 'searchTags' field for efficient consistent querying
            // For now, let's try querying the 'title' field directly
            const q = query(
                listingsRef,
                where('title', '>=', searchPrefix),
                where('title', '<=', endPrefix),
                limit(5)
            );

            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.title) {
                    suggestions.add(data.title.trim());
                }
            });

            // If we have few results, maybe try category?
            if (suggestions.size < 3) {
                // Category logic here if needed
            }

        } catch (error) {
            console.warn('Error fetching suggestions:', error);
            // Fallback to local logic or empty
        }

        return Array.from(suggestions).slice(0, 8);
    }

    // Phase 0: Search Listings (Firestore Fallback)
    async searchListings(queryText: string, options?: any): Promise<Listing[]> {
        const normalizedQuery = queryText.trim();
        // if (!normalizedQuery) return []; <-- Old: Returned empty

        try {
            const listingsRef = collection(db, 'listings');

            let q;
            if (!normalizedQuery) {
                // Return latest 20 listings if query is empty
                q = query(listingsRef, orderBy('createdAt', 'desc'), limit(20));
            } else {
                // Simple prefix search
                q = query(
                    listingsRef,
                    where('title', '>=', normalizedQuery),
                    where('title', '<=', normalizedQuery + '\uf8ff'),
                    limit(20)
                );
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Listing));
        } catch (error) {
            console.error('Error searching listings:', error);
            // Return empty list on error to prevent crash
            return [];
        }
    }

    async trackSearch(queryText: string, meta?: any): Promise<void> {
        if (!queryText.trim()) return;

        // 1. Save to local recent searches
        await this.addToRecentSearches(queryText);

        // 2. Log to Firestore
        try {
            // We log asynchronously and don't await to avoid blocking UI
            addDoc(collection(db, SEARCH_LOGS_COLLECTION), {
                query: queryText,
                timestamp: serverTimestamp(),
                ...meta
            }).catch(err => console.warn('Failed to log search:', err));
        } catch (e) {
            // Ignore logging errors in client
        }
    }

    async trackClick(queryText: string, listingId: string, position: number, meta?: any): Promise<void> {
        try {
            addDoc(collection(db, 'search_clicks'), {
                query: queryText,
                listingId,
                position,
                timestamp: serverTimestamp(),
                ...meta
            }).catch(err => console.warn('Failed to log click:', err));
        } catch (e) {
            // Ignore
        }
    }

    async getRecentSearches(): Promise<string[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(RECENT_SEARCH_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Failed to load recent searches', e);
            return [];
        }
    }

    async clearRecentSearches(): Promise<void> {
        try {
            await AsyncStorage.removeItem(RECENT_SEARCH_KEY);
        } catch (e) {
            console.error('Failed to clear recent searches', e);
        }
    }

    private async addToRecentSearches(queryText: string): Promise<void> {
        try {
            const current = await this.getRecentSearches();
            const normalized = queryText.trim();

            // Remove duplicates and move to top
            const updated = [
                normalized,
                ...current.filter(item => item !== normalized)
            ].slice(0, MAX_RECENT_SEARCHES);

            await AsyncStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save recent search', e);
        }
    }
}

export const searchService = new SearchServiceImpl();
