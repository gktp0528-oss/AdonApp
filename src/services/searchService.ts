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
    '애플': ['apple', 'iphone', 'macbook', 'ipad', 'airpods'],
    '에어팟': ['airpods', 'earbuds', 'headphones'], // Removed 'apple' to prevent matching MacBooks
    '아이폰': ['iphone', 'smartphone'], // Removed 'apple'
    '맥북': ['macbook', 'laptop'], // Removed 'apple'
    '나이키': ['nike', 'shoes', 'sneakers'],
    '아디다스': ['adidas', 'shoes'],
    '삼성': ['samsung', 'galaxy'],
    '갤럭시': ['galaxy', 'smartphone'], // Removed 'samsung'
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
            const lowerQuery = normalizedQuery.toLowerCase();
            const initialConsonants = getInitialConsonants(normalizedQuery);
            const useKoreanInitialMatch = hasKorean(normalizedQuery);

            // Collect synonyms for broader suggestion matching
            const querySynonyms = LOCAL_SYNONYMS[lowerQuery] || [];

            // Find matching listings
            const matchingListings = allListings.filter(listing => {
                const normalizedTitle = normalizeSearchText(listing.title || '');
                const titleInitials = getInitialConsonants(listing.title || '');

                // 1. Precise match
                if (normalizedTitle.includes(normalizedSearchText)) return true;

                // 2. Initial consonant match (초성 검색)
                if (useKoreanInitialMatch && titleInitials.includes(initialConsonants)) return true;

                // 3. Synonym matching (e.g., '에어팟' matches 'AirPods')
                for (const syn of querySynonyms) {
                    if (normalizedTitle.includes(syn)) return true;
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

    private async expandQueryWithAi(queryText: string): Promise<{ category: string | null, keywords: string[] }> {
        const normalized = queryText.toLowerCase().trim();
        if (!normalized) return { category: null, keywords: [] };

        try {
            // 1. Check Firestore Cache
            const cacheDoc = await getDoc(doc(db, SEARCH_CACHE_COLLECTION, normalized));
            if (cacheDoc.exists()) {
                const data = cacheDoc.data();
                if (data.timestamp && (Date.now() - data.timestamp.toMillis()) < (30 * 24 * 60 * 60 * 1000)) {
                    if (data.aiResult) return data.aiResult;
                    if (data.keywords) return { category: null, keywords: data.keywords };
                }
            }

            // 2. Call AI
            const model = getGenerativeModel(aiBackend, { model: "gemini-2.0-flash-exp" });
            const prompt = `You are a search optimizer for a used-goods app.
            Analyze the query and extract:
            1. Target Category (strictly one of: fashion, tech, home, hobbies, sports, mobility, or null)
            2. Keywords (synonyms, english translations)
            
            Query: "${queryText}"
            
            Return JSON only: { "category": "tech", "keywords": ["iphone", "apple"] }`;

            const result = await model.generateContent(prompt);
            const responseText = (await result.response).text();

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : { category: null, keywords: [] };

            const category = ['fashion', 'tech', 'home', 'hobbies', 'sports', 'mobility'].includes(aiData.category) ? aiData.category : null;
            const keywords = Array.isArray(aiData.keywords) ? aiData.keywords.map((s: string) => s.toLowerCase().trim()) : [];

            const resultObj = { category, keywords };

            // 3. Save to Cache
            if (keywords.length > 0 || category) {
                setDoc(doc(db, SEARCH_CACHE_COLLECTION, normalized), {
                    aiResult: resultObj,
                    timestamp: serverTimestamp()
                }).catch(err => console.warn('Search cache save failed:', err));
            }

            return resultObj;

        } catch (error) {
            console.warn('AI Query Expansion failed:', error);
            return { category: null, keywords: [normalized] };
        }
    }

    // Enhanced Search with Hybrid logic
    async searchListings(queryText: string, options?: { categoryId?: string }): Promise<Listing[]> {
        const normalizedQuery = queryText.trim();

        // Mode 1: Category Filter (Prefix Search)
        if (options?.categoryId) {
            try {
                const listingsRef = collection(db, 'listings');
                // Use range query for prefix matching (e.g. 'sports' matches 'sports_football')
                const q = query(
                    listingsRef,
                    where('category', '>=', options.categoryId),
                    where('category', '<', options.categoryId + '\uf8ff'),
                    orderBy('category'),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );

                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
            } catch (error) {
                console.error('Category search failed:', error);
                return [];
            }
        }

        // Mode 2: Text Search (Existing Logic)
        if (!normalizedQuery) {
            const all = await this.getAllListings();
            return all.slice(0, 20);
        }

        try {
            const allListings = await this.getAllListings();

            // Step 1: AI Analysis
            const { category: targetCategory, keywords: expandedKeywords } = await this.expandQueryWithAi(normalizedQuery);

            // Add local synonyms
            const lowerQuery = normalizedQuery.toLowerCase();
            if (LOCAL_SYNONYMS[lowerQuery]) {
                expandedKeywords.push(...LOCAL_SYNONYMS[lowerQuery]);
            }

            // Step 2: Fuse Search
            const indexedListings = allListings.map((listing) => ({
                ...listing,
                _searchTitle: normalizeSearchText(listing.title || ''),
                _searchDescription: normalizeSearchText(listing.description || ''),
            }));

            const fuseOptions = {
                keys: [
                    { name: 'title', weight: 4 },
                    { name: '_searchTitle', weight: 5 },
                    { name: 'description', weight: 1 },
                ],
                threshold: 0.35,
                includeScore: true,
                useExtendedSearch: true,
            };

            const fuse = new Fuse(indexedListings, fuseOptions);
            const resultsMap = new Map<string, { item: Listing, score: number }>();

            const mergeResults = (results: any[]) => {
                results.forEach(r => {
                    const existing = resultsMap.get(r.item.id);
                    if (!existing || r.score < existing.score) {
                        resultsMap.set(r.item.id, { item: r.item as Listing, score: r.score });
                    }
                });
            };

            // A. Search original
            mergeResults(fuse.search(normalizedQuery));

            // B. Search keywords
            for (const keyword of expandedKeywords) {
                if (keyword !== lowerQuery) {
                    mergeResults(fuse.search(keyword));
                }
            }

            // Step 3: Category Boosting and Sorting
            let finalResults = Array.from(resultsMap.values());

            if (targetCategory) {
                finalResults.forEach(r => {
                    const cat = (r.item.category || '').toLowerCase();
                    if (cat.startsWith(targetCategory)) {
                        r.score = (r.score || 1) * 0.5; // Boost score
                    }
                });
            }

            // Sort
            finalResults.sort((a, b) => (a.score || 1) - (b.score || 1));

            return finalResults.map(r => r.item).slice(0, 50);

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
