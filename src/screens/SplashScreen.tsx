import React, { useEffect, useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, Animated, Platform, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';
import { authService } from '../services/authService';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedBackground } from '../components/AnimatedBackground';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const [loading, setLoading] = React.useState(false);
  const [appleAvailable, setAppleAvailable] = React.useState(false);

  useEffect(() => {
    const checkAppleAuth = async () => {
      try {
        const { isAvailableAsync } = require('expo-apple-authentication');
        const available = await isAvailableAsync();
        setAppleAvailable(available);
      } catch (e) {
        setAppleAvailable(false);
      }
    };

    if (Platform.OS === 'ios') {
      checkAppleAuth();
    }
  }, []);

  const handleSocialLogin = async (provider: 'Google' | 'Apple') => {
    if (loading) return;
    setLoading(true);
    try {
      if (provider === 'Google') {
        await authService.signInWithGoogle();
      } else {
        if (!appleAvailable) {
          throw new Error('Apple Sign-In is not supported on this device or account (Personal Team)');
        }
        await authService.signInWithApple();
      }
      navigation.replace('Home');
    } catch (error: any) {
      if (error.message !== 'User canceled Apple Sign-In') {
        alert(t('screen.login.alert.failed') + ': ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
            <View style={styles.brandingRow}>
              {/* Box 'A' */}
              <View style={styles.logoBox}>
                <Text style={styles.logoBoxText}>A</Text>
              </View>
              {/* Text 'don' */}
              <Text style={styles.brandTextSuffix}>don</Text>
            </View>
            <Text style={styles.tagline}>{t('screen.landing.subtitle')}</Text>
          </Animated.View>
        </View>

        {/* Action Section */}
        <Animated.View style={{ opacity: fadeAnim, width: '100%', paddingBottom: Platform.OS === 'ios' ? 10 : 30 }}>

          {/* Apple Button - Only show if available */}
          {appleAvailable && (
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Apple')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={20} color="#fff" style={styles.btnIcon} />
              <Text style={styles.socialBtnText}>{t('screen.landing.apple')}</Text>
            </TouchableOpacity>
          )}

          {/* Google Button */}
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={() => handleSocialLogin('Google')}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color="#000" style={styles.btnIcon} />
            <Text style={[styles.socialBtnText, { color: '#000' }]}>{t('screen.landing.google')}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>{t('screen.landing.or')}</Text>
            <View style={styles.line} />
          </View>

          {/* Email Login */}
          <TouchableOpacity
            style={styles.emailButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.emailButtonText}>{t('screen.landing.email')}</Text>
          </TouchableOpacity>

          {/* Signup Link */}
          <TouchableOpacity
            style={styles.signupContainer}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.signupText}>{t('screen.landing.signup')}</Text>
          </TouchableOpacity>

        </Animated.View>
      </SafeAreaView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  // root style removed, handled by AnimatedBackground
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  heroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: 16, // Box shape with rounded corners
    backgroundColor: theme.colors.primary, // Green/Lime
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4, // Slight spacing between A and don
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoBoxText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#000',
    marginTop: -2, // Optical alignment
  },
  brandTextSuffix: {
    fontSize: 48,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: -1, // Tighten up to look like one word
  },
  tagline: {
    fontSize: 14,
    color: theme.colors.muted,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#000000', // Apple Button: Black
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: '#ffffff', // Google Button: White
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnIcon: {
    marginRight: 10,
  },
  socialBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff', // Apple Text: White
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    paddingHorizontal: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  orText: {
    marginHorizontal: 16,
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  emailButton: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginBottom: 12,
  },
  emailButtonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  signupContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  signupText: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
});
