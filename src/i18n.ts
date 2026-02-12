import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import ko from './locales/ko.json';
import en from './locales/en.json';

// Get system language (e.g., 'ko-KR' -> 'ko')
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'ko';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            ko: { translation: ko },
            en: { translation: en },
        },
        lng: deviceLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
