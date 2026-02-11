import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { User } from '../types/user';

const USERS_COLLECTION = 'users';

export const authService = {
    // Sign Up: Create Auth User + Create Firestore User Document
    async signUp(email: string, password: string, name: string): Promise<User> {
        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update Auth Profile
            await updateProfile(user, { displayName: name });

            // 3. Create Firestore User Document
            const newUser: User = {
                id: user.uid,
                name: name,
                email: email,
                avatar: null, // Firestore doesn't support undefined
                isVerified: false,
                positiveRate: 0,
                sales: 0,
                joinedAt: new Date().toISOString(),
                responseTime: 'Within a few hours',
                reliabilityLabel: 'New Member'
            };

            await setDoc(doc(db, USERS_COLLECTION, user.uid), newUser);

            return newUser;
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    },

    // Login
    async login(email: string, password: string): Promise<User> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fetch user details from Firestore
            const docRef = doc(db, USERS_COLLECTION, user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as User;
            } else {
                // If auth exists but firestore doc missing (e.g. failed during signup)
                // Create a basic doc here to allow the user to proceed
                const newUser: User = {
                    id: user.uid,
                    name: user.displayName || 'User',
                    email: user.email || '',
                    avatar: null,
                    isVerified: false,
                    positiveRate: 0,
                    sales: 0,
                    joinedAt: new Date().toISOString(),
                    responseTime: 'Within a few hours',
                    reliabilityLabel: 'Member'
                };
                await setDoc(docRef, newUser);
                return newUser;
            }
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    },

    // Logout
    async logout(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    },

    // Observe Auth State
    observeAuthState(callback: (user: FirebaseUser | null) => void): () => void {
        return onAuthStateChanged(auth, callback);
    },

    // Get current user (Auth object)
    getCurrentUser(): FirebaseUser | null {
        return auth.currentUser;
    }
};
