import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList, RootStackParamList } from './src/navigation/types';
import { BottomTabMock } from './src/components/BottomTabMock';

import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
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
import AiPriceAssistantScreen from './src/screens/PriceAssistantScreen';
import AiAnalysisResultScreen from './src/screens/AiAnalysisResultScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { NicknameSetupScreen } from './src/screens/NicknameSetupScreen';
import { OnboardingFinishScreen } from './src/screens/OnboardingFinishScreen';
import { KeywordsScreen } from './src/screens/KeywordsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { WishlistScreen } from './src/screens/WishlistScreen';
import EditListingScreen from './src/screens/EditListingScreen';
import { UserListingsScreen } from './src/screens/UserListingsScreen';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import initI18n from './src/i18n';
import i18next from 'i18next';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabMock {...props} />}
      screenOptions={{
        headerShown: false,
      }}
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
  const [isI18nReady, setIsI18nReady] = React.useState(false);

  React.useEffect(() => {
    const setup = async () => {
      await initI18n();
      setIsI18nReady(true);
    };
    setup();
  }, []);

  // Presence Heartbeat
  React.useEffect(() => {
    import('./src/services/userService').then(({ userService }) => {
      // Update immediately on mount/resume
      const updatePresence = async () => {
        const userId = userService.getCurrentUserId();
        if (userId) {
          try {
            await userService.updateUser(userId, {
              lastActive: new Date(),
              isOnline: true
            });
          } catch (e) {
            console.log('Presence update failed', e);
          }
        }
      };

      updatePresence();
      const interval = setInterval(updatePresence, 60000); // 1 minute heartbeat
      return () => clearInterval(interval);
    });
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
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="NicknameSetup" component={NicknameSetupScreen} />
          <Stack.Screen name="OnboardingFinish" component={OnboardingFinishScreen} />
          <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ gestureEnabled: false }} />

          {/* Modal Screens - Slide from bottom */}
          <Stack.Screen
            name="AiListing"
            component={AiListingScreen}
            options={{
              presentation: 'fullScreenModal',
              animation: 'none'
            }}
          />

          {/* Sub Screens - Default Slide Animation */}
          <Stack.Screen
            name="CategoryList"
            component={SneakersListScreen}
            options={{
              animation: 'slide_from_right',
              presentation: 'card'
            }}
          />
          <Stack.Screen name="Product" component={ProductScreen} />
          <Stack.Screen name="Seller" component={SellerScreen as any} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen
            name="CategorySelect"
            component={CategorySelectScreen}
            options={{
              animation: 'slide_from_right',
              presentation: 'fullScreenModal',
            }}
          />
          <Stack.Screen name="AiIntro" component={AiIntroScreen} />
          <Stack.Screen name="AiPriceAssistant" component={AiPriceAssistantScreen} />
          <Stack.Screen name="AiAnalysisResult" component={AiAnalysisResultScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
          <Stack.Screen name="Review" component={ReviewScreen} />
          <Stack.Screen name="Keywords" component={KeywordsScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Wishlist" component={WishlistScreen} />
          <Stack.Screen name="QuerySearch" component={QuerySearchScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen
            name="SearchResult"
            component={SearchResultScreen}
            options={{
              animation: 'slide_from_right',
              presentation: 'card'
            }}
          />
          <Stack.Screen
            name="EditListing"
            component={EditListingScreen}
            options={{ title: i18next.t('screen.aiListing.edit.title', 'Edit Listing') }}
          />
          <Stack.Screen
            name="UserListings"
            component={UserListingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
