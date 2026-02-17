import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
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
    type: 'system' | 'keyword' | 'priceDrop' | 'like';
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

        // 1. Check if it's a physical device (iOS simulator doesn't support real push tokens reliably)
        if (!Constants.isDevice) {
            console.log('[NotificationService] Running on simulator, skipping push token registration.');
            return undefined;
        }

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

        // 2. Get the token with robust error handling
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
        } catch (e: any) {
            // Log warning instead of throwing to prevent app crash/scary red screen
            console.warn('[NotificationService] Error getting push token:', e.message);
            console.log('Note: On iOS, this requires "Push Notifications" capability in Xcode and potentially a paid developer account.');
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

            // Note: We removed the local Notifications.scheduleNotificationAsync call here 
            // because App.tsx has a Firestore listener that will trigger the 
            // in-app notification banner automatically for the current user.
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
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // send immediately
        });
    },

    /**
     * Trigger a delayed test notification (for simulating background test)
     * @param seconds delay in seconds
     */
    async triggerTestNotification(seconds: number = 3) {
        console.log(`[NotificationService] Test notification scheduled in ${seconds}s...`);
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Adon 🌟',
                body: 'Haeun-nim! This is a test notification from the future! 🚀',
                data: { test: true },
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds,
            },
        });
    }
};
