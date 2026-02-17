import { initializeApp, getApps, getApp } from "firebase/app";
// @ts-ignore - getReactNativePersistence is available in React Native specific Firebase exports
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Conditionally import AI - might not be available in Expo Go
let getAI: any, VertexAIBackend: any;
try {
    const aiModule = require("firebase/ai");
    getAI = aiModule?.getAI;
    VertexAIBackend = aiModule?.VertexAIBackend;
    if (!getAI || !VertexAIBackend) {
        console.warn('Firebase AI module loaded but exports not found');
    }
} catch (e) {
    console.warn('Firebase AI not available (this is OK):', e);
}

const firebaseConfig = {
    apiKey: "AIzaSyA1cqQPP2y2-4dMfYN-HRoHZG44N4EXv7I",
    authDomain: "adon-315b7.firebaseapp.com",
    projectId: "adon-315b7",
    storageBucket: "adon-315b7.firebasestorage.app",
    messagingSenderId: "760431967573",
    appId: "1:760431967573:web:6f12693cdd82a6faee83dc"
};

// Initialize Firebase (check if already initialized to prevent hot reload issues)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
let auth;
try {
    // Initialize with AsyncStorage persistence (survives app restarts)
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} catch {
    // Already initialized (e.g. hot reload) — reuse existing instance
    auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize AI (replaces vertexai in v12+)
export const aiBackend = getAI && VertexAIBackend ? getAI(app, {
    backend: new VertexAIBackend('global')
}) : null;

export default app;
