"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPriceDropped = exports.onWishlistCreated = exports.onMessageCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
exports.onMessageCreated = (0, firestore_1.onDocumentCreated)("conversations/{conversationId}/messages/{messageId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const message = snapshot.data();
    const conversationId = event.params.conversationId;
    const conversationDoc = await admin.firestore().doc(`conversations/${conversationId}`).get();
    const conversationData = conversationDoc.data();
    if (!conversationData)
        return;
    const participants = conversationData.participants || [];
    const senderId = message.senderId;
    const recipientId = participants.find((id) => id !== senderId);
    if (!recipientId)
        return;
    const recipientDoc = await admin.firestore().doc(`users/${recipientId}`).get();
    const recipientData = recipientDoc.data();
    if (!recipientData || !recipientData.pushToken) {
        console.log(`No push token for user ${recipientId}`);
        return;
    }
    const settings = recipientData.notificationSettings;
    if (settings) {
        if (settings.pushEnabled === false || settings.chatEnabled === false) {
            console.log(`User ${recipientId} has disabled chat notifications.`);
            return;
        }
    }
    const pushToken = recipientData.pushToken;
    const lang = recipientData.language || "en";
    const titles = {
        en: "New Message",
        ko: "새 메시지가 도착했습니다",
        hu: "Új üzenet",
    };
    const defaultBodies = {
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
    }
    catch (error) {
        console.error("Error sending notification:", error);
    }
});
exports.onWishlistCreated = (0, firestore_1.onDocumentCreated)("wishlists/{wishlistId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const wishlistData = snapshot.data();
    const likerId = wishlistData.userId;
    const listingId = wishlistData.listingId;
    const listingDoc = await admin.firestore().doc(`listings/${listingId}`).get();
    const listingData = listingDoc.data();
    if (!listingData)
        return;
    const sellerId = listingData.sellerId;
    if (sellerId === likerId)
        return;
    const sellerDoc = await admin.firestore().doc(`users/${sellerId}`).get();
    const sellerData = sellerDoc.data();
    if (!sellerData)
        return;
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
    const titles = {
        en: "Someone liked your listing! ❤️",
        ko: "누군가 회원님의 상품을 찜했어요! ❤️",
        hu: "Valaki kedvencekbe tette a termékedet! ❤️",
    };
    const bodies = {
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
    }
    catch (error) {
        console.error(`Error sending like notification to ${sellerId}:`, error);
    }
});
exports.onPriceDropped = (0, firestore_1.onDocumentUpdated)("listings/{listingId}", async (event) => {
    const change = event.data;
    if (!change)
        return;
    const listingId = event.params.listingId;
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after)
        return;
    const oldPrice = before.price;
    const newPrice = after.price;
    if (newPrice >= oldPrice)
        return;
    console.log(`Price drop detected for ${listingId}: ${oldPrice} -> ${newPrice}`);
    const wishlistsSnapshot = await admin.firestore()
        .collection("wishlists")
        .where("listingId", "==", listingId)
        .get();
    if (wishlistsSnapshot.empty)
        return;
    const userIds = wishlistsSnapshot.docs.map(doc => doc.data().userId);
    const promises = userIds.map(async (userId) => {
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        const userData = userDoc.data();
        if (!userData || !userData.pushToken)
            return null;
        const settings = userData.notificationSettings;
        if (settings) {
            if (settings.pushEnabled === false || settings.priceDropEnabled === false) {
                console.log(`User ${userId} has disabled price drop notifications.`);
                return null;
            }
        }
        const lang = userData.language || "en";
        const titles = {
            en: "Price Drop! 💸",
            ko: "가격 인하! 💸",
            hu: "Árcsökkenés! 💸",
        };
        const bodies = {
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
        }
        catch (error) {
            console.error(`Error sending price drop notification to ${userId}:`, error);
            return null;
        }
    });
    await Promise.all(promises);
});
//# sourceMappingURL=index.js.map