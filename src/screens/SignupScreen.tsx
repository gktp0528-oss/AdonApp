import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = () => {
    if (!name.trim()) {
      Alert.alert('Missing Input', 'Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }

    // In a real app, API call would happen here
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.logoA}>A</Text>
        </View>
        <Text style={styles.title}>ADON</Text>
        <Text style={styles.subtitle}>Join the premium resale community</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Create Account</Text>

        <Text style={styles.label}>FULL NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput
          style={styles.input}
          placeholder="hello@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <PrimaryButton label="가입하고 홈으로" onPress={handleSignup} />

        <Text style={styles.terms}>By signing up, you agree to Terms and Privacy Policy</Text>
      </View>

      <Text style={styles.switchText}>
        Already have an account?
        <Text style={styles.switchLink} onPress={() => navigation.navigate('Login')}> Sign In</Text>
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#bef264',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoA: {
    fontSize: 30,
    fontWeight: '900',
    color: '#064e3b',
  },
  title: {
    marginTop: 8,
    fontWeight: '900',
    fontSize: 33,
    letterSpacing: -0.5,
    color: '#064e3b',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#edf2ed',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  formTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 14,
    color: '#1f2937',
  },
  label: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 4,
    fontSize: 15,
  },
  terms: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
  },
  switchText: {
    marginTop: 'auto',
    textAlign: 'center',
    color: '#4b5563',
    fontWeight: '500',
  },
  switchLink: {
    color: '#064e3b',
    fontWeight: '800',
  },
});
