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
import Fuse from 'fuse.js';
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

// Korean text normalization utilities
const normalizeKorean = (text: string): string => {
    if (!text) return '';

    // Remove all spaces
    let normalized = text.replace(/\s+/g, '');

    // Convert to lowercase
    normalized = normalized.toLowerCase();

    return normalized;
};

// Extract Korean initial consonants (초성)
const getInitialConsonants = (text: string): string => {
    const CHO = [
        'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
        'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ];

    let result = '';
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        // Check if Korean character (가-힣)
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const choIndex = Math.floor((code - 0xAC00) / 588);
            result += CHO[choIndex];
        } else {
            result += text[i];
        }
    }
    return result;
};

class SearchServiceImpl implements SearchService {
    private listingsCache: Listing[] = [];
    private lastCacheTime: number = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Enhanced Suggestions with Fuzzy Matching
    async getSuggestions(queryText: string, userId?: string): Promise<string[]> {
        const normalizedQuery = queryText.trim();
        if (!normalizedQuery) return this.getRecentSearches();

        const suggestions: Set<string> = new Set();

        try {
            // Get all listings from cache
            const allListings = await this.getAllListings();

            const normalizedSearchText = normalizeKorean(normalizedQuery);
            const initialConsonants = getInitialConsonants(normalizedQuery);

            // Find matching listings
            const matchingListings = allListings.filter(listing => {
                const listingTitle = (listing.title || '').toLowerCase();
                const normalizedTitle = normalizeKorean(listing.title || '');
                const titleInitials = getInitialConsonants(listing.title || '');

                // Direct substring match
                if (listingTitle.includes(normalizedQuery.toLowerCase())) {
                    return true;
                }

                // Normalized match (no spaces)
                if (normalizedTitle.includes(normalizedSearchText)) {
                    return true;
                }

                // Initial consonant match (초성 검색)
                if (titleInitials.includes(initialConsonants)) {
                    return true;
                }

                return false;
            });

            // Add unique titles to suggestions
            matchingListings.forEach(listing => {
                if (listing.title) {
                    suggestions.add(listing.title.trim());
                }
            });

        } catch (error) {
            console.warn('Error fetching suggestions:', error);
        }

        return Array.from(suggestions).slice(0, 8);
    }

    // Fetch and cache all listings
    private async getAllListings(): Promise<Listing[]> {
        const now = Date.now();

        // Return cache if still valid
        if (this.listingsCache.length > 0 && (now - this.lastCacheTime) < this.CACHE_DURATION) {
            return this.listingsCache;
        }

        try {
            const listingsRef = collection(db, 'listings');
            const q = query(listingsRef, orderBy('createdAt', 'desc'), limit(500)); // Limit to prevent too much data

            const snapshot = await getDocs(q);
            this.listingsCache = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Listing));

            this.lastCacheTime = now;
            return this.listingsCache;
        } catch (error) {
            console.error('Error fetching all listings:', error);
            return this.listingsCache; // Return old cache on error
        }
    }

    // Enhanced Search with Fuzzy Matching
    async searchListings(queryText: string, options?: any): Promise<Listing[]> {
        const normalizedQuery = queryText.trim();

        try {
            // Get all listings (from cache or Firestore)
            const allListings = await this.getAllListings();

            // If query is empty, return latest 20
            if (!normalizedQuery) {
                return allListings.slice(0, 20);
            }

            // Normalize query for better matching
            const normalizedSearchText = normalizeKorean(normalizedQuery);
            const initialConsonants = getInitialConsonants(normalizedQuery);

            // Configure Fuse.js for fuzzy search
            const fuse = new Fuse(allListings, {
                keys: [
                    { name: 'title', weight: 2 },
                    { name: 'description', weight: 1 },
                    { name: 'category', weight: 1.5 }
                ],
                threshold: 0.4, // 0 = perfect match, 1 = match anything
                distance: 100,
                ignoreLocation: true,
                useExtendedSearch: true,
                minMatchCharLength: 1
            });

            // Perform fuzzy search
            let results = fuse.search(normalizedQuery).map(result => result.item);

            // If fuzzy search yields few results, try additional matching strategies
            if (results.length < 5) {
                const additionalResults = allListings.filter(listing => {
                    const listingTitle = normalizeKorean(listing.title || '');
                    const listingTitleInitials = getInitialConsonants(listing.title || '');

                    // Check if normalized title includes normalized query (handles spacing)
                    if (listingTitle.includes(normalizedSearchText)) {
                        return true;
                    }

                    // Check initial consonant matching (초성 검색)
                    if (listingTitleInitials.includes(initialConsonants)) {
                        return true;
                    }

                    return false;
                });

                // Merge and deduplicate results
                const resultIds = new Set(results.map(r => r.id));
                additionalResults.forEach(item => {
                    if (!resultIds.has(item.id)) {
                        results.push(item);
                        resultIds.add(item.id);
                    }
                });
            }

            return results.slice(0, 50); // Limit to 50 results
        } catch (error) {
            console.error('Error searching listings:', error);
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
