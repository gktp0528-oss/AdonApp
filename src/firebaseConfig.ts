import { initializeApp, getApps, getApp } from "firebase/app";
// @ts-ignore - getReactNativePersistence is available in React Native specific Firebase exports
import { initializeAuth, getReactNativePersistence, getAuth, type Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { publicRuntimeConfig } from './config/publicRuntimeConfig';

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
    apiKey: publicRuntimeConfig.firebaseApiKey,
    authDomain: publicRuntimeConfig.firebaseAuthDomain,
    projectId: publicRuntimeConfig.firebaseProjectId,
    storageBucket: publicRuntimeConfig.firebaseStorageBucket,
    messagingSenderId: publicRuntimeConfig.firebaseMessagingSenderId,
    appId: publicRuntimeConfig.firebaseAppId,
};

// Initialize Firebase (check if already initialized to prevent hot reload issues)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
let auth: Auth;
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
export const functions = getFunctions(app, 'europe-west1');

// Initialize AI (replaces vertexai in v12+)
export const aiBackend = getAI && VertexAIBackend ? getAI(app, {
    backend: new VertexAIBackend('global')
}) : null;

export default app;
