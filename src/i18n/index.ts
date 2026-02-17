import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Removed as it may cause issues in development builds
// import 'intl-pluralrules';

import ko from '../locales/ko.json';
import en from '../locales/en.json';
import hu from '../locales/hu.json';

const resources = {
    ko: { translation: ko },
    en: { translation: en },
    hu: { translation: hu },
};

const formatMissingKey = (key: string) => {
    const leaf = key.split('.').pop() || key;
    return leaf
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]/g, ' ')
        .trim()
        .replace(/^./, (c) => c.toUpperCase());
};

export const SUPPORTED_LANGUAGES = ['ko', 'en', 'hu'] as const;
export type AppLanguage = typeof SUPPORTED_LANGUAGES[number];
const LANGUAGE_STORAGE_KEY = 'adon.appLanguage';

const isSupportedLanguage = (value: string | null | undefined): value is AppLanguage => {
    return Boolean(value && SUPPORTED_LANGUAGES.includes(value as AppLanguage));
};

const initI18n = async () => {
    if (i18n.isInitialized) {
        // Keep resource bundles in sync during hot reload/dev updates.
        i18n.addResourceBundle('ko', 'translation', ko, true, true);
        i18n.addResourceBundle('en', 'translation', en, true, true);
        i18n.addResourceBundle('hu', 'translation', hu, true, true);
        return;
    }

    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    console.log('🌍 [i18n] Saved language from AsyncStorage:', savedLanguage);

    let language = savedLanguage;

    // Enforce English as default (ignore system locale)
    // if (!isSupportedLanguage(language)) {
    //     language = Localization.getLocales()[0].languageCode;
    // }

    // Fallback to English if language is not supported
    if (!isSupportedLanguage(language)) {
        console.log('🌍 [i18n] No valid saved language, falling back to English');
        language = 'en';
    } else {
        console.log('🌍 [i18n] Using saved language:', language);
    }

    await i18n.use(initReactI18next).init({
        resources,
        lng: language,
        fallbackLng: 'en',
        returnNull: false,
        returnEmptyString: false,
        parseMissingKeyHandler: (key) => formatMissingKey(key),
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        compatibilityJSON: 'v4', // for android
    });

    console.log('🌍 [i18n] Initialized with language:', i18n.language);
};

export const changeAppLanguage = async (language: AppLanguage) => {
    if (!isSupportedLanguage(language)) {
        console.log('🌍 [i18n] Invalid language:', language);
        return;
    }
    console.log('🌍 [i18n] Changing language to:', language);

    i18n.addResourceBundle('ko', 'translation', ko, true, true);
    i18n.addResourceBundle('en', 'translation', en, true, true);
    i18n.addResourceBundle('hu', 'translation', hu, true, true);

    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    console.log('🌍 [i18n] Saved to AsyncStorage:', language);

    await i18n.changeLanguage(language);
    console.log('🌍 [i18n] Language changed to:', i18n.language);
};

export default initI18n;
