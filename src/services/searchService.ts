import {
    addDoc,
    setDoc,
    doc,
    getDoc,
    serverTimestamp,
    Timestamp,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    startAt,
    endAt,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Fuse from 'fuse.js';
import { db, aiBackend } from '../firebaseConfig';
import { getGenerativeModel } from 'firebase/ai';
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
const SEARCH_CACHE_COLLECTION = 'search_query_cache';
const KEYWORD_STATS_COLLECTION = 'keyword_stats';
const RECENT_SEARCH_KEY = 'adon_recent_searches';
const MAX_RECENT_SEARCHES = 10;

// High-reliability local synonyms for common brands/terms
const LOCAL_SYNONYMS: Record<string, string[]> = {
    '애플': ['apple', 'iphone', 'macbook', 'ipad'],
    '에어팟': ['airpods', 'apple', 'headphones'],
    '아이폰': ['iphone', 'apple', 'phone'],
    '맥북': ['macbook', 'apple', 'laptop'],
    '나이키': ['nike', 'shoes', 'sneakers'],
    '아디다스': ['adidas', 'shoes'],
    '삼성': ['samsung', 'galaxy'],
    '갤럭시': ['galaxy', 'samsung'],
};

// Multilingual normalization (Korean + Latin with accent folding)
const normalizeSearchText = (text: string): string => {
    if (!text) return '';

    let normalized = text.toLowerCase().trim();

    // Fold accents (e.g. á, é, ő, ű -> a, e, o, u)
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Re-combine Jamo into finished characters (NFC) for regex compatibility
    normalized = normalized.normalize('NFC');

    // Keep alphanumeric, spaces, and all Korean characters (including Jamo)
    normalized = normalized.replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ');

    return normalized.trim();
};

const hasKorean = (text: string): boolean => /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text);

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

            const normalizedSearchText = normalizeSearchText(normalizedQuery);
            const initialConsonants = getInitialConsonants(normalizedQuery);
            const useKoreanInitialMatch = hasKorean(normalizedQuery);

            // Find matching listings
            const matchingListings = allListings.filter(listing => {
                const normalizedTitle = normalizeSearchText(listing.title || '');
                const titleInitials = getInitialConsonants(listing.title || '');

                // Normalized match (no spaces)
                if (normalizedTitle.includes(normalizedSearchText)) {
                    return true;
                }

                // Initial consonant match (초성 검색) only for Korean input
                if (useKoreanInitialMatch && titleInitials.includes(initialConsonants)) {
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

    private async expandQueryWithAi(queryText: string): Promise<string[]> {
        const normalized = queryText.toLowerCase().trim();
        if (!normalized) return [];

        try {
            // 1. Check Firestore Cache first
            const cacheDoc = await getDoc(doc(db, SEARCH_CACHE_COLLECTION, normalized));
            if (cacheDoc.exists()) {
                const data = cacheDoc.data();
                // Cache valid for 30 days
                if (data.keywords && (Date.now() - data.timestamp.toMillis()) < (30 * 24 * 60 * 60 * 1000)) {
                    return data.keywords;
                }
            }

            // 2. Call AI if not cached
            const model = getGenerativeModel(aiBackend, { model: "gemini-2.0-flash-exp" });
            const prompt = `You are a professional search engine optimizer for a global used-goods marketplace.
            Translate and expand the following search query into technical English keywords, global brand names, and related categories.
            The input language could be Korean, Hungarian, or English.
            
            Inputs: "${queryText}"
            
            Return ONLY a comma-separated list of the most relevant 3-5 keywords (lower case).
            Example 1 (Korean): "에어팟" -> "airpods, apple, wireless earbuds"
            Example 2 (Hungarian): "macska" -> "cat, pet, kitten"
            Example 3 (Mixed): "나이키 신발" -> "nike, shoes, sneakers"`;

            const result = await model.generateContent(prompt);
            const responseText = (await result.response).text();
            const keywords = responseText.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);

            if (keywords.length > 0) {
                // 3. Save to Cache
                setDoc(doc(db, SEARCH_CACHE_COLLECTION, normalized), {
                    keywords,
                    timestamp: serverTimestamp()
                }).catch(err => console.warn('Search cache save failed:', err));

                return keywords;
            }
        } catch (error) {
            console.warn('AI Query Expansion failed:', error);
        }

        return [normalized];
    }

    // Enhanced Search with Hybrid logic
    async searchListings(queryText: string, options?: any): Promise<Listing[]> {
        const normalizedQuery = queryText.trim();

        try {
            const allListings = await this.getAllListings();
            if (!normalizedQuery) return allListings.slice(0, 20);

            // Step 1: Query Expansion (Local + Optional AI)
            const lowerQuery = normalizedQuery.toLowerCase();
            let expandedKeywords: string[] = [];

            // Add local synonyms first (very fast, high precision)
            if (LOCAL_SYNONYMS[lowerQuery]) {
                expandedKeywords.push(...LOCAL_SYNONYMS[lowerQuery]);
            }

            // AI-Powered Expansion (Optional, with timeout-like behavior if possible)
            try {
                const aiKeywords = await this.expandQueryWithAi(normalizedQuery);
                aiKeywords.forEach(k => {
                    if (!expandedKeywords.includes(k) && k !== lowerQuery) {
                        expandedKeywords.push(k);
                    }
                });
            } catch (e) {
                console.warn('AI expansion skipped for speed/error');
            }

            // Step 2: Prepare Search Index
            const indexedListings = allListings.map((listing) => ({
                ...listing,
                _searchTitle: normalizeSearchText(listing.title || ''),
                _searchDescription: normalizeSearchText(listing.description || ''),
                _searchInitials: getInitialConsonants(listing.title || ''),
            }));

            // Step 3: Progressive Fuzzy Search
            const fuseOptions = {
                keys: [
                    { name: 'title', weight: 4 },
                    { name: '_searchTitle', weight: 5 },
                    { name: 'description', weight: 1 },
                ],
                threshold: 0.35, // Balanced threshold
                includeScore: true,
                useExtendedSearch: true,
            };

            const fuse = new Fuse(indexedListings, fuseOptions);
            let resultsMap = new Map<string, Listing>();

            // A. Search original query
            const originalResults = fuse.search(normalizedQuery);
            originalResults.forEach(r => resultsMap.set(r.item.id, r.item as Listing));

            // B. Search expanded synonyms
            for (const keyword of expandedKeywords) {
                const synonymResults = fuse.search(keyword);
                synonymResults.forEach(r => {
                    if (!resultsMap.has(r.item.id)) {
                        resultsMap.set(r.item.id, r.item as Listing);
                    }
                });
            }

            // Step 4: Fallback Matching (Literal + Initial Consonants)
            if (resultsMap.size === 0) {
                const queryTextNorm = normalizeSearchText(normalizedQuery);
                const queryInitials = getInitialConsonants(normalizedQuery);
                const hasKo = hasKorean(normalizedQuery);

                allListings.forEach(listing => {
                    const titleText = normalizeSearchText(listing.title || '');
                    const titleInitials = getInitialConsonants(listing.title || '');
                    const descText = normalizeSearchText(listing.description || '');

                    const isMatch = titleText.includes(queryTextNorm) ||
                        descText.includes(queryTextNorm) ||
                        (hasKo && titleInitials.includes(queryInitials));

                    if (isMatch) {
                        resultsMap.set(listing.id, listing);
                    }
                });
            }

            return Array.from(resultsMap.values()).slice(0, 50);
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
