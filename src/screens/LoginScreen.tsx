import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TextInput, View, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { authService } from '../services/authService';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t('screen.login.alert.inputNeeded'), t('screen.login.alert.emailMissing'));
      return;
    }

    setLoading(true);
    try {
      await authService.login(email, password);
      navigation.replace('Home');
    } catch (error: any) {
      Alert.alert(t('screen.login.alert.failed'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('screen.login.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.formContainer}>
            <Text style={styles.label}>{t('screen.login.label.email')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('screen.login.placeholder.email')}
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>{t('screen.login.label.password')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('screen.login.placeholder.password')}
              placeholderTextColor={theme.colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Password Reset feature')}>
              <Text style={styles.forgot}>{t('screen.login.forgot')}</Text>
            </TouchableOpacity>

            <View style={styles.spacer} />

            <PrimaryButton
              label={loading ? t('common.loading') : t('screen.login.submit')}
              onPress={handleLogin}
              disabled={loading}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('screen.login.signupText')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.footerLink}>{t('screen.login.signupLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
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
  forgot: {
    alignSelf: 'flex-end',
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 20,
  },
  spacer: {
    height: 20,
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
