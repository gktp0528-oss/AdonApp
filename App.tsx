import React from 'react';
import './src/i18n';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/navigation/types';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { SneakersListScreen } from './src/screens/SneakersListScreen';
import { ChatListScreen } from './src/screens/ChatListScreen';
import { ProductScreen } from './src/screens/ProductScreen';
import { SellerScreen } from './src/screens/SellerScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { AiListingScreen } from './src/screens/AiListingScreen';
import { CategorySelectScreen } from './src/screens/CategorySelectScreen';
import { AiIntroScreen } from './src/screens/AiIntroScreen';
import AiPriceAssistantScreen from './src/screens/PriceAssistantScreen';

import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
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
          <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="AiListing" component={AiListingScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="ChatList" component={ChatListScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Seller" component={SellerScreen} options={{ animation: 'fade' }} />

          {/* Sub Screens - Default Slide Animation */}
          <Stack.Screen name="CategoryList" component={SneakersListScreen} />
          <Stack.Screen name="Product" component={ProductScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="CategorySelect" component={CategorySelectScreen} />
          <Stack.Screen name="AiIntro" component={AiIntroScreen} />
          <Stack.Screen name="AiPriceAssistant" component={AiPriceAssistantScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
