import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TextInput, View, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { authService } from '../services/authService';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert(t('screen.signup.alert.inputNeeded'), t('screen.signup.alert.nameMissing'));
      return;
    }

    setLoading(true);
    try {
      await authService.signUp(email, password, name);
      Alert.alert(
        t('screen.signup.alert.success'),
        t('screen.signup.alert.successMsg'),
        [{ text: t('common.confirm'), onPress: () => navigation.replace('Home') }]
      );
    } catch (error: any) {
      Alert.alert(t('screen.signup.alert.failed'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('screen.signup.header')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>{t('screen.signup.subtitle')}</Text>

          <View style={styles.formContainer}>
            <Text style={styles.label}>{t('screen.signup.label.name')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('screen.signup.placeholder.name')}
              placeholderTextColor={theme.colors.muted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>{t('screen.signup.label.email')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('screen.signup.placeholder.email')}
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>{t('screen.signup.label.password')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('screen.signup.placeholder.password')}
              placeholderTextColor={theme.colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <View style={styles.spacer} />

            <PrimaryButton
              label={loading ? t('common.loading') : t('screen.signup.submit')}
              onPress={handleSignup}
              disabled={loading}
            />

            <Text style={styles.terms}>{t('screen.signup.terms')}</Text>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('screen.signup.loginText')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>{t('screen.signup.loginLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    marginBottom: 32,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.muted,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 20,
  },
  spacer: {
    height: 20,
  },
  terms: {
    marginTop: 16,
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  footerLink: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
