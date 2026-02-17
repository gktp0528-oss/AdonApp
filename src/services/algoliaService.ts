import algoliasearch from 'algoliasearch';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const ALGOLIA_APP_ID = process.env.EXPO_PUBLIC_ALGOLIA_APP_ID || '';
const ALGOLIA_SEARCH_KEY = process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_KEY || '';
const ALGOLIA_ADMIN_KEY = process.env.EXPO_PUBLIC_ALGOLIA_ADMIN_KEY || '';

// Search-only client for frontend
export const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
export const listingsIndex = searchClient.initIndex('listings');

// Admin client for syncing data (use with caution)
export const adminClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
export const adminListingsIndex = adminClient.initIndex('listings');

export const algoliaService = {
    /**
     * Firestore의 모든 상품 데이터를 Algolia로 일괄 동기화합니다.
     */
    async syncAllListingsFromFirestore() {
        try {
            console.log('Starting full sync from Firestore to Algolia...');
            const snapshot = await getDocs(collection(db, 'listings'));
            const listings = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    objectID: doc.id,
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamps to plain numbers
                    createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now(),
                    updatedAt: data.updatedAt?.seconds ? data.updatedAt.seconds * 1000 : Date.now(),
                };
            });

            await adminListingsIndex.saveObjects(listings);
            console.log(`Successfully migrated ${listings.length} listings!`);
            return listings.length;
        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
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
     * 단일 상품 데이터를 동기화합니다.
     */
    async syncListing(listing: any) {
        try {
            // Ensure no circular references and Timestamps are converted
            const cleanListing = JSON.parse(JSON.stringify(listing, (key, value) => {
                if (value && typeof value === 'object' && value.seconds) {
                    return value.seconds * 1000;
                }
                return value;
            }));

            await adminListingsIndex.saveObject({
                objectID: cleanListing.id,
                ...cleanListing
            });
        } catch (error) {
            console.error('Algolia single sync failed:', error);
        }
    },

    /**
     * 상품을 삭제합니다.
     */
    async deleteListing(listingId: string) {
        try {
            await adminListingsIndex.deleteObject(listingId);
        } catch (error) {
            console.error('Algolia delete failed:', error);
        }
    }
};
