import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAI, VertexAIBackend } from "firebase/ai";

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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize AI (replaces vertexai in v12+)
export const aiBackend = getAI(app, {
    backend: new VertexAIBackend('us-central1')
});

export default app;
