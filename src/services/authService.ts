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
    sendEmailVerification,
    deleteUser,
    sendPasswordResetEmail as sendFirebasePasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { User } from '../types/user';
import i18n from 'i18next';
import { publicRuntimeConfig } from '../config/publicRuntimeConfig';

import Constants, { ExecutionEnvironment } from 'expo-constants';

// Lazy load these to prevent crashes in Expo Go
let GoogleSignin: any;
let AppleAuthentication: any;

const USERS_COLLECTION = 'users';
const GOOGLE_WEB_CLIENT_ID = publicRuntimeConfig.googleWebClientId;
const GOOGLE_IOS_CLIENT_ID = publicRuntimeConfig.googleIosClientId;

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
                webClientId: GOOGLE_WEB_CLIENT_ID,
                iosClientId: GOOGLE_IOS_CLIENT_ID,
            });
        }
        return true;
    } catch (e) {
        console.warn('GoogleSignin module not found:', e);
        return false;
    }
};

export const authService = {
    // Helper: Create or Fetch User from Firestore. Returns isNew=true when doc was just created.
    async _handleUserInFirestore(user: FirebaseUser, name?: string | null, consentData?: { marketingOptIn?: boolean }): Promise<{ user: User; isNew: boolean }> {
        if (!db) {
            console.error('Firestore db is not initialized. Initialization order issue?');
            throw new Error('Database connection is temporary unavailable. Please try again in a few seconds.');
        }

        const docRef = doc(db, USERS_COLLECTION, user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { user: { id: docSnap.id, ...docSnap.data() } as User, isNew: false };
        } else {
            const normalizedName = ((name && name.trim()) || user.displayName || 'User').trim();
            const newUser: User = {
                id: user.uid,
                name: normalizedName,
                nameLower: normalizedName.toLowerCase(),
                email: user.email || '',
                avatar: user.photoURL || null,
                isVerified: false,
                positiveRate: 0,
                sales: 0,
                joinedAt: new Date().toISOString(),
                responseTime: 'screen.profile.stats.responseValue.unknown',
                reliabilityLabel: 'New Member',
                // consentedAt is only set when user explicitly agrees (consentData provided)
                ...(consentData ? {
                    consentedAt: new Date().toISOString(),
                    marketingOptIn: consentData.marketingOptIn ?? false,
                } : {}),
            };
            await setDoc(docRef, newUser);

            // Send real welcome notification (lazy import to avoid circular dependency)
            try {
                const { notificationService } = await import('./notificationService');
                await notificationService.sendNotification(
                    user.uid,
                    'system',
                    'Welcome to Adon! 🎉',
                    'Start buying and selling premium items today. Complete your profile to get started!'
                );
            } catch (e) {
                console.warn('Could not send welcome notification:', e);
            }

            return { user: newUser, isNew: true };
        }
    },

    // Sign Up (Email)
    async signUp(email: string, password: string, name?: string, marketingOptIn?: boolean): Promise<User> {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if (name) {
                await updateProfile(user, { displayName: name });
            }
            const { user: firestoreUser } = await this._handleUserInFirestore(user, name, { marketingOptIn });
            return firestoreUser;
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    },

    // Login (Email)
    async login(email: string, password: string): Promise<User> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const { user } = await this._handleUserInFirestore(userCredential.user);
            return user;
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    },

    // Google Sign-In — returns isNew=true when this is a brand-new account
    async signInWithGoogle(): Promise<{ user: User; isNew: boolean }> {
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

    // Apple Sign-In — returns isNew=true when this is a brand-new account
    async signInWithApple(): Promise<{ user: User; isNew: boolean }> {
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
    },

    // Check if nickname is already taken
    async checkNicknameAvailability(nickname: string): Promise<boolean> {
        if (!db) return true;
        try {
            const normalized = nickname.trim().toLowerCase();
            const q = query(
                collection(db, USERS_COLLECTION),
                where('nameLower', '==', normalized),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.empty;
        } catch (error) {
            console.error('Error checking nickname availability:', error);
            return true;
        }
    },

    // Send verification email to current user
    async sendVerificationEmail(): Promise<void> {
        const user = auth.currentUser;
        if (user) {
            // Sync Firebase Auth language with app language
            auth.languageCode = i18n.language || 'en';
            await sendEmailVerification(user);
        }
    },

    // Delete Account (GDPR Art. 17)
    async deleteAccount(): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        // Delete Firestore user document first
        const docRef = doc(db, USERS_COLLECTION, user.uid);
        await deleteDoc(docRef);

        // Delete Firebase Auth account (requires recent login)
        await deleteUser(user);
    },

    // Check if user's email is verified (reloads user state)
    async isEmailVerified(): Promise<boolean> {
        const user = auth.currentUser;
        if (user) {
            await user.reload();
            return auth.currentUser?.emailVerified || false;
        }
        return false;
    },

    // Send Password Reset Email
    async sendPasswordResetEmail(email: string): Promise<void> {
        try {
            auth.languageCode = i18n.language || 'en';
            await sendFirebasePasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw error;
        }
    }
};
