import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email.trim()) {
      Alert.alert('Missing Input', 'Please enter your email address.');
      return;
    }
    if (!email.includes('@')) {
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
      <View style={styles.brand}>
        <View style={styles.logo}><Text style={styles.logoText}>A</Text></View>
        <Text style={styles.title}>ADON</Text>
        <Text style={styles.tag}>PREMIUM RESALE</Text>
      </View>

      <View style={styles.socialRow}>
        <View style={styles.socialBtn}><Text style={styles.socialText}>Apple</Text></View>
        <View style={styles.socialBtn}><Text style={styles.socialText}>Google</Text></View>
        <View style={styles.socialBtn}><Text style={styles.socialText}>Meta</Text></View>
      </View>

      <Text style={styles.orText}>Or log in with email</Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput
          style={styles.input}
          placeholder="hello@adon.app"
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

        <Text style={styles.forgot}>Forgot Password?</Text>
        <PrimaryButton label="로그인" onPress={handleLogin} />

        <Text style={styles.bottomText}>
          Don't have an account?
          <Text style={styles.bottomLink} onPress={() => navigation.navigate('Signup')}> Sign Up</Text>
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
