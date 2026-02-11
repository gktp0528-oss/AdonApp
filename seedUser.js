const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyA1cqQPP2y2-4dMfYN-HRoHZG44N4EXv7I",
    authDomain: "adon-315b7.firebaseapp.com",
    projectId: "adon-315b7",
    storageBucket: "adon-315b7.firebasestorage.app",
    messagingSenderId: "760431967573",
    appId: "1:760431967573:web:6f12693cdd82a6faee83dc"
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
