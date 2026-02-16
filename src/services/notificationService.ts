import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    Timestamp,
    getDocs
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { userService } from './userService';

const NOTIFICATIONS_COLLECTION = 'notifications';

export interface AdonNotification {
    id?: string;
    userId: string;
    type: 'system' | 'keyword' | 'priceDrop';
    title: string;
    body: string;
    data?: any;
    read: boolean;
    createdAt: Timestamp;
}

// Configure how notifications should be handled when the app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const notificationService = {
    /**
     * Request permissions and get FCM token
     */
    async registerForPushNotificationsAsync(): Promise<string | undefined> {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        // Get the token that uniquely identifies this device
        try {
            // For native FCM integration, we use getDevicePushTokenAsync
            const tokenResponse = await Notifications.getDevicePushTokenAsync();
            token = tokenResponse.data;
            console.log('Native Push Token:', token);

            // Save token to user profile
            const userId = userService.getCurrentUserId();
            if (userId) {
                await userService.updateUser(userId, { pushToken: token });
            }
        } catch (e) {
            console.error('Error getting push token:', e);
        }

        return token;
    },

    /**
     * Send a notification locally AND save to database
     */
    async sendNotification(userId: string, type: AdonNotification['type'], title: string, body: string, data = {}) {
        try {
            // 1. Save to Firestore
            await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
                userId,
                type,
                title,
                body,
                data,
                read: false,
                createdAt: Timestamp.now(),
            });

            // 2. If it's the current user, also send a local notification for immediate feedback
            const currentUserId = userService.getCurrentUserId();
            if (userId === currentUserId) {
                await Notifications.scheduleNotificationAsync({
                    content: { title, body, data },
                    trigger: null,
                });
            }
        } catch (error) {
            console.error('[NotificationService] Error sending notification:', error);
        }
    },

    /**
     * Watch notifications for a user
     */
    watchNotifications(userId: string, callback: (notifications: AdonNotification[]) => void, errorCallback?: (error: any) => void): () => void {
        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AdonNotification));
            callback(notifications);
        }, (error) => {
            const isIndexing = error.message?.includes('index') && error.message?.includes('building');
            if (isIndexing) {
                console.warn('[NotificationService] Index is still building, please wait a few minutes.');
            } else {
                console.error('[NotificationService] Error watching notifications:', error.code, error.message);
            }
            if (errorCallback) errorCallback(error);
        });
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId: string) {
        try {
            const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
            await updateDoc(docRef, { read: true });
        } catch (error) {
            console.error('[NotificationService] Error marking as read:', error);
        }
    },

    /**
     * Send a notification locally (for testing/immediate feedback only)
     */
    async sendLocalNotification(title: string, body: string, data = {}) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger: null, // send immediately
        });
    }
};
