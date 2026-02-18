import {
    addDoc,
    setDoc,
    doc,
    getDoc,
    serverTimestamp,
    collection,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, aiBackend } from '../firebaseConfig';
import { getGenerativeModel } from 'firebase/ai';
import { Listing } from '../types/listing';
import { algoliaService } from './algoliaService';

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
const RECENT_SEARCH_KEY = 'adon_recent_searches';
const MAX_RECENT_SEARCHES = 10;

class SearchServiceImpl implements SearchService {
    // Enhanced Suggestions using Algolia
    async getSuggestions(queryText: string, _userId?: string): Promise<string[]> {
        const normalizedQuery = queryText.trim();
        if (!normalizedQuery) return this.getRecentSearches();

        try {
            const hits = await algoliaService.search(normalizedQuery, {
                hitsPerPage: 8,
                attributesToRetrieve: ['itemName'],
            });
            return hits.map((hit: any) => hit.itemName);
        } catch (error) {
            console.warn('Error fetching suggestions:', error);
            return [];
        }
    }

    private async expandQueryWithAi(queryText: string): Promise<{ category: string | null, keywords: string[] }> {
        const normalized = queryText.toLowerCase().trim();
        if (!normalized) return { category: null, keywords: [] };

        try {
            const cacheDoc = await getDoc(doc(db, SEARCH_CACHE_COLLECTION, normalized));
            if (cacheDoc.exists()) {
                const data = cacheDoc.data();
                if (data.timestamp && (Date.now() - data.timestamp.toMillis()) < (30 * 24 * 60 * 60 * 1000)) {
                    return data.aiResult || { category: null, keywords: data.keywords || [] };
                }
            }

            const model = getGenerativeModel(aiBackend, { model: "gemini-2.0-flash-exp" });
            const prompt = `You are a search optimizer for a used-goods app operating in Hungary.
            Analyze the user's search query and extract technical data.
            
            [TASKS]
            1. Target Category: Strictly one of [fashion, tech, home, hobbies, sports, mobility] or null.
            2. Keywords: 
               - Extract core nouns from the query.
               - Provide synonyms.
               - IF the query is in Korean/Hungarian, PROVIDE the English translation.
               - IF the query is in English/Korean, PROVIDE the Hungarian translation (if relevant).
            
            Query: "${queryText}"
            
            Return JSON only: { "category": "tech", "keywords": ["headset", "earphones", "fülhallgató"] }`;

            const result = await model.generateContent(prompt);
            const responseText = (await result.response).text();
            const cleaned = responseText.replace(/```json|```/g, '').trim();
            const aiResult = JSON.parse(cleaned);

            const category = ['fashion', 'tech', 'home', 'hobbies', 'sports', 'mobility'].includes(aiResult.category) ? aiResult.category : null;
            const keywords = Array.isArray(aiResult.keywords) ? aiResult.keywords.map((s: string) => s.toLowerCase().trim()) : [];
            const resultObj = { category, keywords };

            setDoc(doc(db, SEARCH_CACHE_COLLECTION, normalized), {
                aiResult: resultObj,
                timestamp: serverTimestamp()
            }).catch(err => console.warn('Search cache save failed:', err));

            return resultObj;
        } catch (error) {
            console.warn('AI Query Expansion failed:', error);
            return { category: null, keywords: [normalized] };
        }
    }

    async searchListings(queryText: string, options?: { categoryId?: string }): Promise<Listing[]> {
        const normalizedQuery = queryText.trim();

        try {
            // Mode 1: Category Only
            if (!normalizedQuery && options?.categoryId) {
                const results = await algoliaService.search('', {
                    filters: `category:${options.categoryId}`,
                    hitsPerPage: 50
                });
                return results.map((hit: any) => ({ id: hit.objectID, ...hit } as Listing));
            }

            if (!normalizedQuery) return [];

            // Step 1: AI Expansion
            const { keywords } = await this.expandQueryWithAi(normalizedQuery);

            // Combine original query and keywords, remove duplicates
            const allTerms = Array.from(new Set([normalizedQuery, ...keywords]));
            const searchTerms = allTerms.join(' ');

            // Step 2: Algolia Search
            const algoliaOptions: any = { hitsPerPage: 50 };

            // ⭐ [CRITICAL] 
            // 1. 사용자가 홈 화면 등에서 카테고리를 '직접' 클릭해서 들어온 경우에만 하드 필터를 겁니다.
            // 2. 검색창에서 직접 입력한 경우, AI가 판단한 카테고리는 '참조'만 하고 전체에서 찾습니다.
            //    그래야 대표님이 말씀하신 대로 '전체에서 찾는게 먼저'인 원칙이 지켜집니다!
            if (options?.categoryId) {
                algoliaOptions.filters = `category:${options.categoryId}`;
            }

            const hits = await algoliaService.search(searchTerms, algoliaOptions);
            return hits.map((hit: any) => ({ id: hit.objectID, ...hit } as Listing));

        } catch (error) {
            console.error('Hybrid search with Algolia failed:', error);
            return [];
        }
    }

    async trackSearch(queryText: string, meta?: any): Promise<void> {
        if (!queryText.trim()) return;
        await this.addToRecentSearches(queryText);
        void addDoc(collection(db, SEARCH_LOGS_COLLECTION), {
            query: queryText,
            timestamp: serverTimestamp(),
            ...meta
        }).catch(err => console.warn('Failed to log search:', err));
    }

    async trackClick(queryText: string, listingId: string, position: number, meta?: any): Promise<void> {
        void addDoc(collection(db, 'search_clicks'), {
            query: queryText,
            listingId,
            position,
            timestamp: serverTimestamp(),
            ...meta
        }).catch(err => console.warn('Failed to log click:', err));
    }

    async getRecentSearches(): Promise<string[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(RECENT_SEARCH_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            return [];
        }
    }

    async clearRecentSearches(): Promise<void> {
        await AsyncStorage.removeItem(RECENT_SEARCH_KEY);
    }

    private async addToRecentSearches(queryText: string): Promise<void> {
        try {
            const current = await this.getRecentSearches();
            const normalized = queryText.trim();
            const updated = [normalized, ...current.filter(item => item !== normalized)].slice(0, MAX_RECENT_SEARCHES);
            await AsyncStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(updated));
        } catch (e) { }
    }
}

export const searchService = new SearchServiceImpl();
