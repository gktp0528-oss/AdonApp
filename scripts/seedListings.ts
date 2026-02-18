
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";

const getEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return value;
};

const firebaseConfig = {
    apiKey: getEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('EXPO_PUBLIC_FIREBASE_APP_ID')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

// Minimal Listing Type for seeding
interface SeedListing {
    title: string;
    description: string;
    price: number;
    currency: string;
    photos: string[];
    category: string;
    condition: string;
    sellerId: string;
    status: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    views: number;
    likes: number;
}

const generateRandomListing = (index: number): SeedListing => {
    const isSold = Math.random() > 0.8; // 20% chance of being sold
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];

    return {
        title: `${category} Item #${index + 1}`,
        description: `This is a dummy description for item #${index + 1}. It is in ${condition} condition. Great deal!`,
        price: Math.floor(Math.random() * 500) + 10,
        currency: 'EUR',
        photos: [
            `https://placehold.co/400x400/png?text=Item+${index + 1}`,
            `https://placehold.co/400x400/orange/white/png?text=Item+${index + 1}+Back`
        ],
        category: category,
        condition: condition as any,
        sellerId: `dummy_seller_${Math.floor(Math.random() * 5) + 1}`,
        status: isSold ? 'sold' : 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        views: Math.floor(Math.random() * 100),
        likes: Math.floor(Math.random() * 20),
    };
};

async function seedListings() {
    console.log('Starting seed...');

    const BATCH_SIZE = 100;

    for (let i = 0; i < BATCH_SIZE; i++) {
        const listing = generateRandomListing(i);
        try {
            const docRef = await addDoc(collection(db, 'listings'), listing);
            console.log(`[${i + 1}/${BATCH_SIZE}] Added listing: ${docRef.id}`);
        } catch (e) {
            console.error(`Error adding listing ${i}:`, e);
        }
    }

    console.log('Seeding complete!');
    process.exit(0);
}

seedListings();
