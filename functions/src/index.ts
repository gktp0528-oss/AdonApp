import { onDocumentCreated, onDocumentUpdated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";

admin.initializeApp();

const AZURE_TRANSLATOR_KEY = defineSecret("AZURE_TRANSLATOR_KEY");
const AZURE_TRANSLATOR_REGION = defineSecret("AZURE_TRANSLATOR_REGION");
const AZURE_ENDPOINT = "https://api.cognitive.microsofttranslator.com";
const SUPPORTED_TRANSLATION_LANGUAGES = new Set(["en", "ko", "hu"]);
const ALGOLIA_APP_ID = defineSecret("ALGOLIA_APP_ID");
const ALGOLIA_ADMIN_KEY = defineSecret("ALGOLIA_ADMIN_KEY");
const ALGOLIA_INDEX_NAME = "listings";

/**
 * Triggered when a new message is created in a conversation.
 * Sends a push notification to the recipient.
 */
export const onMessageCreated = onDocumentCreated("conversations/{conversationId}/messages/{messageId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const message = snapshot.data();
    const conversationId = event.params.conversationId;

    // 1. Get conversation details to find participants
    const conversationDoc = await admin.firestore().doc(`conversations/${conversationId}`).get();
    const conversationData = conversationDoc.data();

    if (!conversationData) return;

    const participants: string[] = conversationData.participants || [];
    const senderId = message.senderId;

    // Find the recipient (the other participant)
    const recipientId = participants.find((id) => id !== senderId);

    if (!recipientId) return;

    // 2. Get recipient's push token and settings
    const recipientDoc = await admin.firestore().doc(`users/${recipientId}`).get();
    const recipientData = recipientDoc.data();

    if (!recipientData || !recipientData.pushToken) {
        console.log(`No push token for user ${recipientId}`);
        return;
    }

    // --- CHECK USER SETTINGS ---
    const settings = recipientData.notificationSettings;
    if (settings) {
        if (settings.pushEnabled === false || settings.chatEnabled === false) {
            console.log(`User ${recipientId} has disabled chat notifications.`);
            return;
        }
    }
    // ---------------------------

    const pushToken = recipientData.pushToken;

    // 3. Prepare localized message
    const lang = recipientData.language || "en";
    const titles: Record<string, string> = {
        en: "New Message",
        ko: "새 메시지가 도착했습니다",
        hu: "Új üzenet",
    };
    const defaultBodies: Record<string, string> = {
        en: "You have a new message",
        ko: "새로운 메시지를 확인해보세요",
        hu: "Új üzeneted érkezett",
    };

    const payload = {
        notification: {
            title: titles[lang] || titles.en,
            body: message.text || defaultBodies[lang] || defaultBodies.en,
        },
        data: {
            conversationId,
            type: "chat",
        },
    };

    try {
        await admin.messaging().send({
            token: pushToken,
            ...payload
        });
        console.log(`Notification sent to ${recipientId} in ${lang}`);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
});

/**
 * Triggered when a new wishlist document is created (someone hearts a listing).
 * Sends a push notification to the listing's seller.
 */
export const onWishlistCreated = onDocumentCreated("wishlists/{wishlistId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const wishlistData = snapshot.data();
    const likerId = wishlistData.userId;
    const listingId = wishlistData.listingId;

    // 1. Get the listing to find the seller
    const listingDoc = await admin.firestore().doc(`listings/${listingId}`).get();
    const listingData = listingDoc.data();

    if (!listingData) return;

    const sellerId = listingData.sellerId;

    // Don't notify if the seller liked their own listing
    if (sellerId === likerId) return;

    // 2. Get seller's push token and settings
    const sellerDoc = await admin.firestore().doc(`users/${sellerId}`).get();
    const sellerData = sellerDoc.data();

    if (!sellerData) return;

    // 3. Save notification to Firestore (shows up in NotificationsScreen)
    await admin.firestore().collection("notifications").add({
        userId: sellerId,
        type: "like",
        title: sellerData.language === "ko" ? "누군가 회원님의 상품을 찜했어요! ❤️" :
               sellerData.language === "hu" ? "Valaki kedvencekbe tette a termékedet! ❤️" :
               "Someone liked your listing! ❤️",
        body: sellerData.language === "ko" ? `${listingData.title}에 새로운 관심이 생겼어요.` :
              sellerData.language === "hu" ? `${listingData.title} új kedvencet kapott.` :
              `${listingData.title} got a new like.`,
        data: { listingId },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. Send FCM push notification if seller has a push token
    if (!sellerData.pushToken) {
        console.log(`No push token for seller ${sellerId}`);
        return;
    }

    const settings = sellerData.notificationSettings;
    if (settings && settings.pushEnabled === false) {
        console.log(`Seller ${sellerId} has disabled push notifications.`);
        return;
    }

    const lang = sellerData.language || "en";
    const titles: Record<string, string> = {
        en: "Someone liked your listing! ❤️",
        ko: "누군가 회원님의 상품을 찜했어요! ❤️",
        hu: "Valaki kedvencekbe tette a termékedet! ❤️",
    };
    const bodies: Record<string, string> = {
        en: `${listingData.title} got a new like.`,
        ko: `${listingData.title}에 새로운 관심이 생겼어요.`,
        hu: `${listingData.title} új kedvencet kapott.`,
    };

    try {
        await admin.messaging().send({
            token: sellerData.pushToken,
            notification: {
                title: titles[lang] || titles.en,
                body: bodies[lang] || bodies.en,
            },
            data: {
                listingId,
                type: "like",
            },
        });
        console.log(`Like notification sent to seller ${sellerId}`);
    } catch (error) {
        console.error(`Error sending like notification to ${sellerId}:`, error);
    }
});

/**
 * Triggered when a listing's price is updated.
 * If price drops, sends notification to all users who wishlisted it.
 */
export const onPriceDropped = onDocumentUpdated("listings/{listingId}", async (event) => {
    const change = event.data;
    if (!change) return;

    const listingId = event.params.listingId;
    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) return;

    const oldPrice = before.price;
    const newPrice = after.price;

    // Only trigger if price dropped
    if (newPrice >= oldPrice) return;

    console.log(`Price drop detected for ${listingId}: ${oldPrice} -> ${newPrice}`);

    // 1. Find all wishlists containing this listingId
    const wishlistsSnapshot = await admin.firestore()
        .collection("wishlists")
        .where("listingId", "==", listingId)
        .get();

    if (wishlistsSnapshot.empty) return;

    const userIds = wishlistsSnapshot.docs.map(doc => doc.data().userId);

    // 2. Send notifications to all relevant users
    const promises = userIds.map(async (userId: string) => {
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        const userData = userDoc.data();

        if (!userData || !userData.pushToken) return null;

        // --- CHECK USER SETTINGS ---
        const settings = userData.notificationSettings;
        if (settings) {
            if (settings.pushEnabled === false || settings.priceDropEnabled === false) {
                console.log(`User ${userId} has disabled price drop notifications.`);
                return null;
            }
        }
        // ---------------------------

        const lang = userData.language || "en";
        const titles: Record<string, string> = {
            en: "Price Drop! 💸",
            ko: "가격 인하! 💸",
            hu: "Árcsökkenés! 💸",
        };
        const bodies: Record<string, string> = {
            en: `${after.title} is now ${after.price}!`,
            ko: `${after.title}의 가격이 ${after.price}로 내려갔어요!`,
            hu: `${after.title} már csak ${after.price}!`,
        };

        try {
            return await admin.messaging().send({
                token: userData.pushToken,
                notification: {
                    title: titles[lang] || titles.en,
                    body: bodies[lang] || bodies.en,
                },
                data: {
                    listingId,
                    type: "priceDrop",
                },
            });
        } catch (error) {
            console.error(`Error sending price drop notification to ${userId}:`, error);
            return null;
        }
    });

    await Promise.all(promises);
});

function toAlgoliaSerializable(value: unknown): unknown {
    if (value instanceof admin.firestore.Timestamp) {
        return value.toMillis();
    }
    if (value instanceof admin.firestore.GeoPoint) {
        return { lat: value.latitude, lng: value.longitude };
    }
    if (value instanceof Date) {
        return value.getTime();
    }
    if (Array.isArray(value)) {
        return value.map((item) => toAlgoliaSerializable(item));
    }
    if (value && typeof value === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
            result[key] = toAlgoliaSerializable(nestedValue);
        }
        return result;
    }
    return value;
}

async function algoliaRequest(
    appId: string,
    adminKey: string,
    method: "PUT" | "DELETE",
    path: string,
    body?: unknown
): Promise<void> {
    const response = await fetch(`https://${appId}.algolia.net${path}`, {
        method,
        headers: {
            "X-Algolia-Application-Id": appId,
            "X-Algolia-API-Key": adminKey,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`Algolia request failed (${response.status}): ${details}`);
    }
}

export const onListingWriteToAlgolia = onDocumentWritten(
    {
        document: "listings/{listingId}",
        region: "europe-west1",
        secrets: [ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY],
    },
    async (event) => {
        const appId = ALGOLIA_APP_ID.value();
        const adminKey = ALGOLIA_ADMIN_KEY.value();
        if (!appId || !adminKey) {
            throw new HttpsError("failed-precondition", "Algolia secrets are not configured.");
        }

        const listingId = event.params.listingId;
        const indexPath = `/1/indexes/${encodeURIComponent(ALGOLIA_INDEX_NAME)}/${encodeURIComponent(listingId)}`;
        const after = event.data?.after;

        // Document deleted -> remove from Algolia
        if (!after?.exists) {
            await algoliaRequest(appId, adminKey, "DELETE", indexPath);
            console.log(`[Algolia] Deleted listing ${listingId}`);
            return;
        }

        // Document created/updated -> upsert into Algolia
        const rawData = after.data() || {};
        const normalized = toAlgoliaSerializable(rawData) as Record<string, unknown>;
        const payload = {
            objectID: listingId,
            id: listingId,
            ...normalized,
        };

        await algoliaRequest(appId, adminKey, "PUT", indexPath, payload);
        console.log(`[Algolia] Upserted listing ${listingId}`);
    }
);

function requireStringField(value: unknown, fieldName: string): string {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new HttpsError("invalid-argument", `${fieldName} must be a non-empty string.`);
    }
    return value.trim();
}

export const detectLanguageSecure = onCall(
    {
        region: "europe-west1",
        secrets: [AZURE_TRANSLATOR_KEY, AZURE_TRANSLATOR_REGION],
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Authentication required.");
        }

        const text = requireStringField(request.data?.text, "text");
        if (text.length < 3) {
            return { language: null };
        }

        const key = AZURE_TRANSLATOR_KEY.value();
        const region = AZURE_TRANSLATOR_REGION.value();
        if (!key || !region) {
            throw new HttpsError("failed-precondition", "Azure Translator secrets are not configured.");
        }

        const response = await fetch(`${AZURE_ENDPOINT}/detect?api-version=3.0`, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": key,
                "Ocp-Apim-Subscription-Region": region,
                "Content-Type": "application/json",
            },
            body: JSON.stringify([{ text }]),
        });

        if (!response.ok) {
            throw new HttpsError("internal", `Azure detect failed (${response.status}).`);
        }

        const data = await response.json() as Array<{ language?: string }>;
        const detectedLanguage = data[0]?.language;
        if (!detectedLanguage || !SUPPORTED_TRANSLATION_LANGUAGES.has(detectedLanguage)) {
            return { language: null };
        }

        return { language: detectedLanguage };
    }
);

export const translateTextSecure = onCall(
    {
        region: "europe-west1",
        secrets: [AZURE_TRANSLATOR_KEY, AZURE_TRANSLATOR_REGION],
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Authentication required.");
        }

        const text = requireStringField(request.data?.text, "text");
        const fromLang = requireStringField(request.data?.fromLang, "fromLang");
        const toLang = requireStringField(request.data?.toLang, "toLang");

        if (!SUPPORTED_TRANSLATION_LANGUAGES.has(toLang)) {
            throw new HttpsError("invalid-argument", "Unsupported target language.");
        }
        if (fromLang === toLang) {
            return { text };
        }

        const key = AZURE_TRANSLATOR_KEY.value();
        const region = AZURE_TRANSLATOR_REGION.value();
        if (!key || !region) {
            throw new HttpsError("failed-precondition", "Azure Translator secrets are not configured.");
        }

        const response = await fetch(
            `${AZURE_ENDPOINT}/translate?api-version=3.0&from=${encodeURIComponent(fromLang)}&to=${encodeURIComponent(toLang)}`,
            {
                method: "POST",
                headers: {
                    "Ocp-Apim-Subscription-Key": key,
                    "Ocp-Apim-Subscription-Region": region,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify([{ text }]),
            }
        );

        if (response.status === 429) {
            throw new HttpsError("resource-exhausted", "QUOTA_EXCEEDED");
        }
        if (!response.ok) {
            throw new HttpsError("internal", `Azure translate failed (${response.status}).`);
        }

        const data = await response.json() as Array<{ translations?: Array<{ text?: string }> }>;
        const translatedText = data[0]?.translations?.[0]?.text ?? null;
        return { text: translatedText };
    }
);
