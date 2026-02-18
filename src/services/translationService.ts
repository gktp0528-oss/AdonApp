import { db, functions } from '../firebaseConfig';
import { SUPPORTED_LANGUAGES } from '../i18n/index';
import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const CONVERSATIONS = 'conversations';
const MESSAGES = 'messages';

const detectLanguageSecure = httpsCallable<{ text: string }, { language: string | null }>(
    functions,
    'detectLanguageSecure'
);
const translateTextSecure = httpsCallable<
    { text: string; fromLang: string; toLang: string },
    { text: string | null }
>(functions, 'translateTextSecure');

export const translationService = {
    /**
     * Detect language via secure Firebase Function (Azure Translator backend)
     * Returns ISO code: 'ko', 'en', 'hu', or null
     */
    async detectLanguage(text: string): Promise<string | null> {
        try {
            if (!text || text.trim().length < 3) return null;
            const response = await detectLanguageSecure({ text });
            const detectedCode = response.data?.language;
            return SUPPORTED_LANGUAGES.includes(detectedCode as any) ? detectedCode : null;
        } catch (error) {
            console.error('Language detection failed (secure function):', error);
            return null;
        }
    },

    /**
     * Translate text via secure Firebase Function (Azure Translator backend)
     */
    async translateText(text: string, fromLang: string, toLang: string): Promise<string | null> {
        try {
            if (!text || fromLang === toLang) return text;

            const response = await translateTextSecure({ text, fromLang, toLang });
            return response.data?.text || null;
        } catch (error: any) {
            if (error?.code === 'functions/resource-exhausted' || error?.message === 'QUOTA_EXCEEDED') {
                throw new Error('QUOTA_EXCEEDED');
            }
            console.error('Translation failed (secure function):', error);
            return null;
        }
    },

    /**
     * Get or create translation for a message
     * Checks cache first, then translates if needed
     */
    async getTranslation(
        conversationId: string,
        messageId: string,
        messageText: string,
        senderLanguage: string,
        targetLanguage: string
    ): Promise<string | null> {
        try {
            // 1. Check if translation already exists in Firestore
            const messageRef = doc(db, CONVERSATIONS, conversationId, MESSAGES, messageId);
            const messageDoc = await getDoc(messageRef);

            if (messageDoc.exists()) {
                const data = messageDoc.data();
                const cachedTranslation = data.translations?.[targetLanguage];

                if (cachedTranslation?.text) {
                    console.log('Using cached translation');
                    return cachedTranslation.text;
                }
            }

            // 2. Translate using AI
            const translatedText = await this.translateText(
                messageText,
                senderLanguage,
                targetLanguage
            );

            if (!translatedText) return null;

            // 3. Store translation in Firestore for future use
            await updateDoc(messageRef, {
                [`translations.${targetLanguage}`]: {
                    text: translatedText,
                    translatedAt: Timestamp.now()
                }
            });

            return translatedText;
        } catch (error) {
            console.error('Get translation failed:', error);
            return null;
        }
    },

    /**
     * Batch detect and store sender language for messages
     * Called when sending a message
     */
    async detectAndStoreLanguage(
        conversationId: string,
        messageId: string,
        messageText: string,
        fallbackLanguage: string
    ): Promise<string> {
        try {
            const detectedLang = await this.detectLanguage(messageText);
            const finalLang = detectedLang || fallbackLanguage;

            const messageRef = doc(db, CONVERSATIONS, conversationId, MESSAGES, messageId);
            await updateDoc(messageRef, {
                senderLanguage: finalLang
            });

            return finalLang;
        } catch (error) {
            console.error('Store language failed:', error);
            return fallbackLanguage;
        }
    }
};
