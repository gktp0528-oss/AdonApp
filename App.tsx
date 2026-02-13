import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/navigation/types';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { QuerySearchScreen } from './src/screens/QuerySearchScreen';
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

import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator<RootStackParamList>();

import initI18n from './src/i18n';

export default function App() {
  const [isI18nReady, setIsI18nReady] = React.useState(false);

  React.useEffect(() => {
    const setup = async () => {
      await initI18n();
      setIsI18nReady(true);
    };
    setup();
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

          {/* Main Tabs - Use Fade for smooth tab switching feel */}
          <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Category" component={CategoryScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="AiListing" component={AiListingScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="ChatList" component={ChatListScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Seller" component={SellerScreen} options={{ animation: 'fade' }} />

          {/* Sub Screens - Default Slide Animation */}
          <Stack.Screen name="CategoryList" component={SneakersListScreen} />
          <Stack.Screen name="Product" component={ProductScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="CategorySelect" component={CategorySelectScreen} />
          <Stack.Screen name="AiIntro" component={AiIntroScreen} />
          <Stack.Screen name="AiPriceAssistant" component={AiPriceAssistantScreen} />
          <Stack.Screen name="AiAnalysisResult" component={AiAnalysisResultScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
          <Stack.Screen name="Review" component={ReviewScreen} />
          <Stack.Screen name="QuerySearch" component={QuerySearchScreen} options={{ animation: 'slide_from_bottom' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
