import algoliasearch from 'algoliasearch';
import { publicRuntimeConfig } from '../config/publicRuntimeConfig';

const ALGOLIA_APP_ID = publicRuntimeConfig.algoliaAppId;
const ALGOLIA_SEARCH_KEY = publicRuntimeConfig.algoliaSearchKey;

// Search-only client for frontend
export const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
export const listingsIndex = searchClient.initIndex('listings');

export const algoliaService = {
    /**
     * 보안상 클라이언트에서 전체 동기화는 비활성화합니다.
     */
    async syncAllListingsFromFirestore() {
        console.warn('[Algolia] syncAllListingsFromFirestore is disabled on client. Move this to Firebase Functions.');
        return 0;
    },

    /**
     * 상품 검색을 수행합니다.
     */
    async search(query: string, options: any = {}) {
        try {
            const result = await listingsIndex.search(query, {
                hitsPerPage: 50,
                ...options
            });
            return result.hits;
        } catch (error) {
            console.error('Algolia search failed:', error);
            return [];
        }
    },

    /**
     * 보안상 클라이언트에서 쓰기 동기화는 비활성화합니다.
     */
    async syncListing(_listing: any) {
        console.warn('[Algolia] syncListing is disabled on client. Move this to Firebase Functions.');
    },

    /**
     * 보안상 클라이언트에서 삭제 동기화는 비활성화합니다.
     */
    async deleteListing(_listingId: string) {
        console.warn('[Algolia] deleteListing is disabled on client. Move this to Firebase Functions.');
    }
};
