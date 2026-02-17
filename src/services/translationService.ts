import { db } from '../firebaseConfig';
import { SUPPORTED_LANGUAGES } from '../i18n/index';

// [NOTE] 대표님이 제공해주신 최강 Azure 번역기 키를 적용했어요! 💖
const AZURE_TRANSLATOR_KEY = ''; // GitHub 보안 정책상 키를 제거했습니다. 환경 변수나 로컬 파일에서 관리해주세요.
const AZURE_REGION = 'westeurope'; // 헝가리에서 가장 가까운 westeurope으로 설정했어요.
const AZURE_ENDPOINT = 'https://api.cognitive.microsofttranslator.com';

const CONVERSATIONS = 'conversations';
const MESSAGES = 'messages';

import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';

export const translationService = {
    /**
     * Detect language of text using Gemini AI
     * Returns ISO code: 'ko', 'en', 'hu', or null
     */
    async detectLanguage(text: string): Promise<string | null> {
        try {
            if (!text || text.trim().length < 3) return null;

            const response = await fetch(`${AZURE_ENDPOINT}/detect?api-version=3.0`, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
                    'Ocp-Apim-Subscription-Region': AZURE_REGION,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([{ text }]),
            });

            if (!response.ok) {
                console.warn('Azure detect failed:', response.status);
                return null;
            }

            const data = await response.json();
            const detectedCode = data[0]?.language;

            return SUPPORTED_LANGUAGES.includes(detectedCode as any) ? detectedCode : null;
        } catch (error) {
            console.error('Language detection failed:', error);
            return null;
        }
    },

    /**
     * Translate text to target language using Azure Translator
     */
    async translateText(text: string, fromLang: string, toLang: string): Promise<string | null> {
        try {
            if (!text || fromLang === toLang) return text;

            const response = await fetch(
                `${AZURE_ENDPOINT}/translate?api-version=3.0&from=${fromLang}&to=${toLang}`,
                {
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
                        'Ocp-Apim-Subscription-Region': AZURE_REGION,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify([{ text }]),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 429) {
                    console.warn('Azure quota exceeded (429)');
                    throw new Error('QUOTA_EXCEEDED');
                }
                console.error('Azure translation failed:', errorData);
                return null;
            }

            const data = await response.json();
            return data[0]?.translations[0]?.text || null;
        } catch (error: any) {
            if (error.message === 'QUOTA_EXCEEDED') throw error;
            console.error('Translation failed:', error);
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
