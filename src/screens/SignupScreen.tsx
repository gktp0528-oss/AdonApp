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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordStrong = hasMinLength && hasNumber && hasSpecialChar;

  const handleSignup = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert(t('screen.signup.alert.inputNeeded'), t('screen.signup.alert.emailMissing', 'Email and password are required'));
      return;
    }

    if (!isPasswordStrong) {
      Alert.alert(t('screen.signup.alert.passwordError'), t('screen.signup.alert.passwordLength'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('screen.signup.alert.passwordError'), t('screen.signup.alert.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await authService.signUp(email, password, undefined, marketingOptIn);
      // Send verification email right after signup
      await authService.sendVerificationEmail();
      navigation.replace('EmailVerification', { email });
    } catch (error: any) {
      Alert.alert(t('screen.signup.alert.failed'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordRule = (label: string, isValid: boolean) => (
    <View style={styles.passwordRuleRow}>
      <Ionicons
        name={isValid ? "checkmark-circle" : "ellipse-outline"}
        size={16}
        color={isValid ? theme.colors.primary : theme.colors.muted}
      />
      <Text style={[styles.passwordRuleText, isValid && styles.passwordRuleTextValid]}>
        {label}
      </Text>
    </View>
  );

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
              style={[styles.input, { marginBottom: 12 }]}
              placeholder={t('screen.signup.placeholder.password')}
              placeholderTextColor={theme.colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* Password Policy UI */}
            <View style={styles.passwordRulesContainer}>
              {renderPasswordRule(t('screen.signup.passwordRuleLength'), hasMinLength)}
              {renderPasswordRule(t('screen.signup.passwordRuleNumber'), hasNumber)}
              {renderPasswordRule(t('screen.signup.passwordRuleSpecial'), hasSpecialChar)}
            </View>

            <Text style={styles.label}>{t('screen.signup.label.confirmPassword')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('screen.signup.placeholder.confirmPassword')}
              placeholderTextColor={theme.colors.muted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.spacer} />

            {/* Consent Checkboxes */}
            <View style={styles.consentSection}>
              {/* Terms & Privacy — required */}
              <View style={styles.checkboxRow}>
                <TouchableOpacity onPress={() => setAgreedToTerms(!agreedToTerms)} style={styles.checkboxTouch}>
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
                <Text style={styles.checkboxLabel} onPress={() => setAgreedToTerms(!agreedToTerms)}>
                  {t('screen.signup.termsPrefix')}{' '}
                  <Text style={styles.termsLink} onPress={() => navigation.navigate('Legal', { type: 'terms' })}>
                    {t('screen.signup.termsLink')}
                  </Text>
                  {' '}{t('screen.signup.termsAnd')}{' '}
                  <Text style={styles.termsLink} onPress={() => navigation.navigate('Legal', { type: 'privacy' })}>
                    {t('screen.signup.privacyLink')}
                  </Text>
                  {' *'}
                </Text>
              </View>

              {/* Age confirmation — required */}
              <View style={styles.checkboxRow}>
                <TouchableOpacity onPress={() => setAgeConfirmed(!ageConfirmed)} style={styles.checkboxTouch}>
                  <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
                    {ageConfirmed && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
                <Text style={styles.checkboxLabel} onPress={() => setAgeConfirmed(!ageConfirmed)}>
                  {t('screen.signup.consentAge')}{' *'}
                </Text>
              </View>

              {/* Marketing opt-in — optional */}
              <View style={styles.checkboxRow}>
                <TouchableOpacity onPress={() => setMarketingOptIn(!marketingOptIn)} style={styles.checkboxTouch}>
                  <View style={[styles.checkbox, marketingOptIn && styles.checkboxChecked]}>
                    {marketingOptIn && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
                <Text style={styles.checkboxLabel} onPress={() => setMarketingOptIn(!marketingOptIn)}>
                  {t('screen.signup.consentMarketing')}
                </Text>
              </View>

            </View>

            <View style={{ height: 16 }} />

            <PrimaryButton
              label={loading ? t('common.loading') : t('screen.signup.submit')}
              onPress={handleSignup}
              disabled={loading || !agreedToTerms || !ageConfirmed}
            />

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
  passwordRulesContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
    gap: 8,
  },
  passwordRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordRuleText: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '500',
  },
  passwordRuleTextValid: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
  consentSection: {
    gap: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkboxTouch: {
    paddingTop: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
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
