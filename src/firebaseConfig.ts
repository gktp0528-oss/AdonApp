import { initializeApp } from "firebase/app";
// @ts-ignore - getReactNativePersistence is available in React Native specific Firebase exports
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Conditionally import AI - might not be available in Expo Go
let getAI: any, VertexAIBackend: any;
try {
    const aiModule = require("firebase/ai");
    getAI = aiModule.getAI;
    VertexAIBackend = aiModule.VertexAIBackend;
} catch (e) {
    console.warn('Firebase AI not available:', e);
}

const firebaseConfig = {
    apiKey: "AIzaSyA1cqQPP2y2-4dMfYN-HRoHZG44N4EXv7I",
    authDomain: "adon-315b7.firebaseapp.com",
    projectId: "adon-315b7",
    storageBucket: "adon-315b7.firebasestorage.app",
    messagingSenderId: "760431967573",
    appId: "1:760431967573:web:6f12693cdd82a6faee83dc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize AI (replaces vertexai in v12+)
export const aiBackend = getAI && VertexAIBackend ? getAI(app, {
    backend: new VertexAIBackend('us-central1')
}) : null;

export default app;
