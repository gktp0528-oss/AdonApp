import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TextInput, View, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { authService } from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.required'), t('auth.emailRequired'));
      return;
    }
    if (!email.includes('@')) {
      Alert.alert(t('auth.emailInvalid'), t('auth.emailInvalid'));
      return;
    }
    if (!password) {
      Alert.alert(t('common.required'), t('auth.passwordRequired'));
      return;
    }

    try {
      await authService.login(email, password);
      // login successful, navigate to Home
      navigation.replace('Home');
    } catch (error: any) {
      Alert.alert(t('auth.loginFailed'), error.message || t('auth.loginFailedMsg'));
    }
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert(t('common.comingSoon'), t('common.comingSoonMsg', { feature }));
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.brand}>
        <View style={styles.logo}><Text style={styles.logoText}>A</Text></View>
        <Text style={styles.title}>ADON</Text>
        <Text style={styles.tag}>PREMIUM RESALE</Text>
      </View>

      <View style={styles.socialRow}>
        <Pressable style={styles.socialBtn} onPress={() => handleComingSoon('Apple ' + t('auth.login'))}>
          <Text style={styles.socialText}>Apple</Text>
        </Pressable>
        <Pressable style={styles.socialBtn} onPress={() => handleComingSoon('Google ' + t('auth.login'))}>
          <Text style={styles.socialText}>Google</Text>
        </Pressable>
        <Pressable style={styles.socialBtn} onPress={() => handleComingSoon('Meta ' + t('auth.login'))}>
          <Text style={styles.socialText}>Meta</Text>
        </Pressable>
      </View>

      <Text style={styles.orText}>{t('auth.loginWithEmail')}</Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>{t('auth.email')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('auth.emailPlaceholder')}
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>{t('auth.password')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('auth.passwordPlaceholder')}
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable accessibilityRole="button" onPress={() => handleComingSoon(t('auth.forgotPassword'))}>
          <Text style={styles.forgot}>{t('auth.forgotPassword')}</Text>
        </Pressable>
        <PrimaryButton label={t('auth.login')} onPress={handleLogin} />

        <Text style={styles.bottomText}>
          {t('auth.noAccount')}
          <Text style={styles.bottomLink} onPress={() => navigation.navigate('Signup')}> {t('auth.signup')}</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#bef264',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 38, fontWeight: '900', color: '#064e3b' },
  title: { marginTop: 10, fontSize: 36, fontWeight: '900', color: '#064e3b' },
  tag: { marginTop: 2, fontSize: 12, color: '#4b5563', fontWeight: '700', letterSpacing: 1 },
  socialRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  socialBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 12,
  },
  socialText: { fontWeight: '700', color: '#1f2937', fontSize: 13 },
  orText: { textAlign: 'center', marginBottom: 10, color: '#9ca3af', fontWeight: '600', fontSize: 12 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eef2ef',
    padding: 16,
  },
  label: { fontSize: 11, color: '#6b7280', fontWeight: '700', letterSpacing: 0.8, marginBottom: 6, marginTop: 6 },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  forgot: { marginTop: 10, marginBottom: 8, alignSelf: 'flex-end', fontSize: 12, color: '#065f46', fontWeight: '700' },
  bottomText: { textAlign: 'center', color: '#6b7280', marginTop: 6, fontSize: 13 },
  bottomLink: { color: '#064e3b', fontWeight: '800' },
});
