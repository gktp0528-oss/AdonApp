import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { getGenerativeModel } from 'firebase/ai';
import { db, aiBackend } from '../firebaseConfig';
import { SUPPORTED_LANGUAGES } from '../i18n/index';

const CONVERSATIONS = 'conversations';
const MESSAGES = 'messages';
const TRANSLATION_TIMEOUT = 10000; // 10 seconds

export const translationService = {
    /**
     * Detect language of text using Gemini AI
     * Returns ISO code: 'ko', 'en', 'hu', or null
     */
    async detectLanguage(text: string): Promise<string | null> {
        try {
            if (!text || text.trim().length < 3) return null;

            const model = getGenerativeModel(aiBackend, { model: "gemini-2.0-flash-exp" });
            const prompt = `Detect the language of this text and respond with ONLY the ISO 639-1 code (ko, en, hu).
If unsure or mixed languages, return the dominant language.
Supported: ko (Korean), en (English), hu (Hungarian)

Text: "${text}"

Response (ISO code only):`;

            const response = await model.generateContent(prompt);
            const detectedCode = response.response.text().trim().toLowerCase();

            // Validate against supported languages
            return SUPPORTED_LANGUAGES.includes(detectedCode as any) ? detectedCode : null;
        } catch (error) {
            console.error('Language detection failed:', error);
            return null;
        }
    },

    /**
     * Translate text to target language using Gemini AI
     */
    async translateText(text: string, fromLang: string, toLang: string): Promise<string | null> {
        try {
            if (!text || fromLang === toLang) return text;

            const languageNames: Record<string, string> = {
                ko: 'Korean',
                en: 'English',
                hu: 'Hungarian'
            };

            const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Translation timeout')), TRANSLATION_TIMEOUT)
            );

            const translationPromise = (async () => {
                const model = getGenerativeModel(aiBackend, { model: "gemini-2.0-flash-exp" });

                const prompt = `Translate this ${languageNames[fromLang]} message to ${languageNames[toLang]}.
Preserve the tone and style. Return ONLY the translated text, no explanations.

Original: "${text}"

Translation:`;

                const response = await model.generateContent(prompt);
                const translatedText = response.response.text().trim();

                return translatedText || null;
            })();

            return await Promise.race([translationPromise, timeoutPromise]);
        } catch (error: any) {
            if (error instanceof Error && error.message === 'Translation timeout') {
                console.warn('Translation timed out');
            } else if (error?.status === 429 || error?.message?.includes('429')) {
                console.warn('AI quota exceeded (429)');
                throw new Error('QUOTA_EXCEEDED');
            } else {
                console.error('Translation failed:', error);
            }
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
