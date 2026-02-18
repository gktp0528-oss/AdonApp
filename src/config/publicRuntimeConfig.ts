import Constants from 'expo-constants';

type RuntimeConfig = Record<string, string | undefined>;

const extraConfig = (Constants.expoConfig?.extra || {}) as RuntimeConfig;

const getPublicConfig = (key: string): string => {
    const value = process.env[key] || extraConfig[key];
    if (!value) {
        throw new Error(`[Config] Missing required public config: ${key}`);
    }
    return value;
};

export const publicRuntimeConfig = {
    firebaseApiKey: getPublicConfig('EXPO_PUBLIC_FIREBASE_API_KEY'),
    firebaseAuthDomain: getPublicConfig('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    firebaseProjectId: getPublicConfig('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    firebaseStorageBucket: getPublicConfig('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    firebaseMessagingSenderId: getPublicConfig('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    firebaseAppId: getPublicConfig('EXPO_PUBLIC_FIREBASE_APP_ID'),
    googlePlacesApiKey: getPublicConfig('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY'),
    googleWebClientId: getPublicConfig('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
    googleIosClientId: getPublicConfig('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
    algoliaAppId: getPublicConfig('EXPO_PUBLIC_ALGOLIA_APP_ID'),
    algoliaSearchKey: getPublicConfig('EXPO_PUBLIC_ALGOLIA_SEARCH_KEY'),
};
