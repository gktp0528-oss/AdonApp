import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { PRODUCTS, FRESH_FINDS, USERS, CATEGORIES } from '../data/mockData';

export const migrateData = async () => {
    console.log('🚀 Migration started...');

    try {
        // 1. Migrate Categories
        console.log('--- Migrating Categories ---');
        for (const cat of CATEGORIES) {
            await setDoc(doc(db, 'categories', cat.id), {
                label: cat.label,
                createdAt: serverTimestamp(),
            });
        }

        // 2. Migrate Users
        console.log('--- Migrating Users ---');
        for (const key of Object.keys(USERS)) {
            const user = (USERS as any)[key];
            await setDoc(doc(db, 'users', user.id), {
                ...user,
                createdAt: serverTimestamp(),
            });
        }

        // 3. Migrate Products (listings)
        console.log('--- Migrating Products ---');
        const allProducts = [...PRODUCTS, ...FRESH_FINDS];
        for (const item of allProducts) {
            await addDoc(collection(db, 'listings'), {
                title: item.name,
                price: Number(item.price.replace(/[^0-9]/g, '')), // Clean numeric price
                description: (item as any).description || `${item.name} in great condition.`,
                category: (item as any).meta || 'Uncategorized',
                photos: [item.image],
                sellerId: (item as any).sellerId || 'u2',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isMock: true, // Flag to identify old mock items
                originalId: item.id
            });
        }

        console.log('✅ Migration completed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return false;
    }
};
