import { getGenerativeModel } from "firebase/ai";
import { aiBackend } from '../firebaseConfig';
import i18n from '../i18n';

/**
 * Service to handle on-the-fly translation of user-generated content.
 * Mimics Airbnb's "Translation Engine" by seamlessly providing 
 * translated text when source and viewer languages differ.
 */
class TranslationService {
    private model = getGenerativeModel(aiBackend, { model: "gemini-2.5-flash-lite" });

    /**
     * Translates a string to the current target language defined in i18n.
     */
    async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
        if (!text || sourceLang === targetLang) return text;

        try {
            const prompt = `Translate the following user-generated content from '${sourceLang}' to '${targetLang}'. 
            Maintain the original tone and context (marketplace listing or chat).
            Return ONLY the translated text without any explanations.
            
            Text: ${text}`;

            const result = await this.model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            console.error('Translation failed:', error);
            return text; // Return original on failure
        }
    }

    /**
     * Automatically translates a listing's title and description if needed.
     */
    async translateListing(title: string, description: string, originLang: string) {
        const targetLang = i18n.language;
        if (originLang === targetLang) return { title, description, translated: false };

        const [translatedTitle, translatedDescription] = await Promise.all([
            this.translate(title, originLang, targetLang),
            this.translate(description, originLang, targetLang)
        ]);

        return {
            title: translatedTitle,
            description: translatedDescription,
            translated: true
        };
    }
}

export const translationService = new TranslationService();
