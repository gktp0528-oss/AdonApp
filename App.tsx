import 'react-native-gesture-handler'; // Required for JS Stack
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackCardInterpolationProps, TransitionSpecs, CardStyleInterpolators } from '@react-navigation/stack';
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
import { Easing } from 'react-native';

const Stack = createStackNavigator<RootStackParamList>();

// Custom "Scale Fade" Transition (Spotify-like)
const forFadeAndScale = ({ current }: StackCardInterpolationProps) => {
  const opacity = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const scale = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1], // Subtle zoom in
  });

  return {
    cardStyle: {
      opacity,
      transform: [{ scale }],
    },
  };
};

const fastTransitionSpec = {
  open: {
    animation: 'timing' as const,
    config: {
      duration: 200,
      easing: Easing.out(Easing.poly(4)),
    },
  },
  close: {
    animation: 'timing' as const,
    config: {
      duration: 200,
      easing: Easing.out(Easing.poly(4)),
    },
  },
};


export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            // Default to fast transitions globally
            transitionSpec: fastTransitionSpec,
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />

          {/* Main Tabs - Use Scale Fade for premium, fast switching */}
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ cardStyleInterpolator: forFadeAndScale }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ cardStyleInterpolator: forFadeAndScale }}
          />
          <Stack.Screen
            name="AiListing"
            component={AiListingScreen}
            options={{ cardStyleInterpolator: forFadeAndScale }}
          />
          <Stack.Screen
            name="ChatList"
            component={ChatListScreen}
            options={{ cardStyleInterpolator: forFadeAndScale }}
          />
          <Stack.Screen
            name="Seller" // Profile Tab
            component={SellerScreen}
            options={{ cardStyleInterpolator: forFadeAndScale }}
          />

          {/* Sub Screens - Default iOS-like Slide (Horizontal) */}
          <Stack.Screen
            name="CategoryList"
            component={SneakersListScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
          />
          <Stack.Screen
            name="Product"
            component={ProductScreen}
            options={{
              cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
              // Keep gestures native-like
              gestureDirection: 'horizontal',
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
          />
          <Stack.Screen
            name="CategorySelect"
            component={CategorySelectScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
          />
          <Stack.Screen
            name="AiIntro"
            component={AiIntroScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
          />
          <Stack.Screen
            name="AiPriceAssistant"
            component={AiPriceAssistantScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
