import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged,
    User as FirebaseUser,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential,
    AuthCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { User } from '../types/user';

import Constants, { ExecutionEnvironment } from 'expo-constants';

// Lazy load these to prevent crashes in Expo Go
let GoogleSignin: any;
let AppleAuthentication: any;

const USERS_COLLECTION = 'users';

const initializeGoogleSignin = () => {
    // Check if running in Expo Go or Store Client
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
        console.warn('Google Sign-In is not supported in Expo Go');
        return false;
    }

    try {
        if (!GoogleSignin) {
            GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
            GoogleSignin.configure({
                webClientId: '760431967573-0escabmjg96unsnad2ispl0hh9g1ub9c.apps.googleusercontent.com',
                iosClientId: '760431967573-b2er6jj8p9aph4bo407sf276j0umb73m.apps.googleusercontent.com',
            });
        }
        return true;
    } catch (e) {
        console.warn('GoogleSignin module not found:', e);
        return false;
    }
};

export const authService = {
    // Helper: Create or Fetch User from Firestore
    async _handleUserInFirestore(user: FirebaseUser, name?: string | null): Promise<User> {
        if (!db) {
            console.error('Firestore db is not initialized. Initialization order issue?');
            throw new Error('Database connection is temporary unavailable. Please try again in a few seconds.');
        }

        const docRef = doc(db, USERS_COLLECTION, user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as User;
        } else {
            const newUser: User = {
                id: user.uid,
                name: (name && name.trim()) || user.displayName || 'User',
                email: user.email || '',
                avatar: user.photoURL || null,
                isVerified: false,
                positiveRate: 0,
                sales: 0,
                joinedAt: new Date().toISOString(),
                responseTime: 'screen.profile.stats.responseValue.unknown',
                reliabilityLabel: 'New Member'
            };
            await setDoc(docRef, newUser);
            return newUser;
        }
    },

    // Sign Up (Email)
    async signUp(email: string, password: string, name: string): Promise<User> {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: name });
            return await this._handleUserInFirestore(user, name);
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    },

    // Login (Email)
    async login(email: string, password: string): Promise<User> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return await this._handleUserInFirestore(userCredential.user);
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    },

    // Google Sign-In
    async signInWithGoogle(): Promise<User> {
        if (!initializeGoogleSignin()) {
            throw new Error('Google Sign-In is not supported in Expo Go. Please use a Development Build.');
        }
        try {
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            const idToken = response.data?.idToken;
            if (!idToken) throw new Error('No ID token found');

            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            return await this._handleUserInFirestore(userCredential.user);
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    },

    // Apple Sign-In
    async signInWithApple(): Promise<User> {
        try {
            if (!AppleAuthentication) {
                try {
                    AppleAuthentication = require('expo-apple-authentication');
                } catch (e) {
                    throw new Error('Apple Sign-In is not supported in Expo Go. Please use a Development Build.');
                }
            }

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            const { identityToken, fullName } = credential;
            if (!identityToken) throw new Error('No identity token found');

            const provider = new OAuthProvider('apple.com');
            const authCredential = provider.credential({
                idToken: identityToken,
                rawNonce: 'nonce', // Optional, usually required for strict security
            });

            const userCredential = await signInWithCredential(auth, authCredential);

            // Apple only returns fullName on the first sign-in
            const name = fullName ? `${fullName.givenName} ${fullName.familyName}`.trim() : null;

            return await this._handleUserInFirestore(userCredential.user, name);
        } catch (error: any) {
            // Check for various cancellation signals
            if (error.code === 'ERR_CANCELED' || (error.message && error.message.includes('canceled'))) {
                throw new Error('User canceled Apple Sign-In');
            }
            console.error('Error signing in with Apple:', error);
            throw error;
        }
    },

    // Logout
    async logout(): Promise<void> {
        try {
            await signOut(auth);
            try {
                await GoogleSignin.signOut();
            } catch (e) {
                // Ignore if not signed in with Google
            }
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
