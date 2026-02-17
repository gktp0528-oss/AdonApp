import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

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
