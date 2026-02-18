import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Navigation Types
import { MainTabParamList, RootStackParamList } from './src/navigation/types';

// Components
import { BottomTabMock } from './src/components/BottomTabMock';

// Screens
import { LaunchScreen } from './src/screens/LaunchScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { QuerySearchScreen } from './src/screens/QuerySearchScreen';
import { SearchResultScreen } from './src/screens/SearchResultScreen';
import { SneakersListScreen } from './src/screens/SneakersListScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import { ProductScreen } from './src/screens/ProductScreen';
import { SellerScreen } from './src/screens/SellerScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { AiListingScreen } from './src/screens/AiListingScreen';
import { CategorySelectScreen } from './src/screens/CategorySelectScreen';
import { AiIntroScreen } from './src/screens/AiIntroScreen';
import AiAnalysisResultScreen from './src/screens/AiAnalysisResultScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { NicknameSetupScreen } from './src/screens/NicknameSetupScreen';
import { OnboardingFinishScreen } from './src/screens/OnboardingFinishScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';
import { KeywordsScreen } from './src/screens/KeywordsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { WishlistScreen } from './src/screens/WishlistScreen';
import EditListingScreen from './src/screens/EditListingScreen';
import { UserListingsScreen } from './src/screens/UserListingsScreen';
import { LegalScreen } from './src/screens/LegalScreen';
import { SocialConsentScreen } from './src/screens/SocialConsentScreen';

import initI18n from './src/i18n';
import i18next from 'i18next';
import * as Notifications from 'expo-notifications';
import { notificationService } from './src/services/notificationService';
import { InAppNotification, InAppNotificationRef } from './src/components/InAppNotification';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './src/firebaseConfig';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabMock {...props} />}
      screenOptions={{ headerShown: false }}
      backBehavior="none"
    >
      <Tab.Screen name="HomeTab" component={HomeScreen as any} />
      <Tab.Screen name="CategoryTab" component={CategoryScreen as any} />
      <Tab.Screen name="ChatTab" component={ChatListScreen as any} />
      <Tab.Screen name="ProfileTab" component={SellerScreen as any} />
    </Tab.Navigator>
  );
}

export default function App() {
  console.log('🏗️ [App] Render start (Full Recovery)');
  const [isI18nReady, setIsI18nReady] = React.useState(false);
  const notificationRef = React.useRef<InAppNotificationRef>(null);

  const handleNotificationClick = (data: any) => {
    console.log('[Notification] Handling click with data:', data);
    if (navigationRef.isReady()) {
      if (data?.listingId) {
        navigationRef.navigate('Product', { listingId: data.listingId } as any);
      } else if (data?.conversationId) {
        navigationRef.navigate('Chat', { conversationId: data.conversationId });
      } else if (data?.screen === 'Notifications') {
        navigationRef.navigate('Notifications');
      }
    }
  };

  React.useEffect(() => {
    const setup = async () => {
      try {
        await initI18n();
        setIsI18nReady(true);
      } catch (error) {
        console.error('initI18n failed:', error);
      }
    };
    setup();
  }, []);

  // Presence Heartbeat
  React.useEffect(() => {
    import('./src/services/userService').then(({ userService }) => {
      const updatePresence = async () => {
        const userId = userService.getCurrentUserId();
        if (userId) {
          try {
            await userService.updateUser(userId, { lastActive: new Date(), isOnline: true });
          } catch (e) {
            console.log('Presence update failed', e);
          }
        }
      };
      updatePresence();
      const interval = setInterval(updatePresence, 60000);
      return () => clearInterval(interval);
    });
  }, []);

  // Firestore-based in-app notification listener
  React.useEffect(() => {
    let notifUnsubscribe: (() => void) | null = null;
    const authUnsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (notifUnsubscribe) { notifUnsubscribe(); notifUnsubscribe = null; }
      if (!user) return;
      const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), where('read', '==', false));
      let isFirstSnapshot = true;
      notifUnsubscribe = onSnapshot(q, (snapshot) => {
        if (isFirstSnapshot) { isFirstSnapshot = false; return; }
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added' && notificationRef.current) {
            const data = change.doc.data();
            notificationRef.current.show(data.title, data.body, data.data || {});
          }
        });
      }, (error: any) => {
        if (error.code !== 'permission-denied') console.warn('[Notification listener]', error);
      });
    });
    return () => { authUnsubscribe(); if (notifUnsubscribe) notifUnsubscribe(); };
  }, []);

  // Notification Setup
  React.useEffect(() => {
    const setupNotifications = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') await notificationService.registerForPushNotificationsAsync();
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        const { title, body, data } = notification.request.content;
        if (notificationRef.current) notificationRef.current.show(title || 'Adon', body || '', data);
      });
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        handleNotificationClick(data);
      });
      return () => { notificationListener.remove(); responseListener.remove(); };
    };
    setupNotifications();
  }, []);

  if (!isI18nReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#ffffff' }} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName="Launch" screenOptions={{ headerShown: false, gestureEnabled: true }}>
          <Stack.Screen name="Launch" component={LaunchScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
          <Stack.Screen name="SocialConsent" component={SocialConsentScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="NicknameSetup" component={NicknameSetupScreen} />
          <Stack.Screen name="OnboardingFinish" component={OnboardingFinishScreen} />
          <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ gestureEnabled: false }} />
          <Stack.Screen name="AiListing" component={AiListingScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="CategoryList" component={SneakersListScreen} options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="Product" component={ProductScreen} />
          <Stack.Screen name="Seller" component={SellerScreen as any} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="CategorySelect" component={CategorySelectScreen} options={{ animation: 'slide_from_right', presentation: 'fullScreenModal' }} />
          <Stack.Screen name="AiIntro" component={AiIntroScreen} />
          <Stack.Screen name="AiAnalysisResult" component={AiAnalysisResultScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Review" component={ReviewScreen} />
          <Stack.Screen name="Keywords" component={KeywordsScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Wishlist" component={WishlistScreen} />
          <Stack.Screen name="QuerySearch" component={QuerySearchScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="SearchResult" component={SearchResultScreen} options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="EditListing" component={EditListingScreen} options={{ title: i18next.t('screen.aiListing.edit.title', 'Edit Listing') }} />
          <Stack.Screen name="UserListings" component={UserListingsScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Legal" component={LegalScreen} options={{ animation: 'slide_from_right' }} />
        </Stack.Navigator>
        <InAppNotification ref={notificationRef} onPress={handleNotificationClick} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

/*
// Original code commented out for debugging
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
// ... rest of code
*/
