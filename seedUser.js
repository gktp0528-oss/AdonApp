const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const getEnv = (name) => {
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MOCK_USER = {
    name: 'Haeun Kim',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    location: 'Berlin, Germany',
    isVerified: true,
    positiveRate: 98,
    sales: 124,
    responseTime: '1 hour',
    email: 'haeun@example.com',
    reliabilityLabel: 'Super Seller',
    createdAt: new Date().toISOString()
};

async function seedUser() {
    try {
        console.log('Seeding user temp_seller_123...');
        await setDoc(doc(db, 'users', 'temp_seller_123'), MOCK_USER);
        console.log('User created successfully!');
    } catch (error) {
        console.error('Error seeding user:', error);
    }
}

seedUser();
