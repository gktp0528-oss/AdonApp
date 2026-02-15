import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { userService } from './userService';

// Configure how notifications should be handled when the app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
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
            // Note: For actual FCM, use getDevicePushTokenAsync or similar
            token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('Push Token:', token);

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
     * Send a notification locally (for testing)
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
