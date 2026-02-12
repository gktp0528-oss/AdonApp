import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <LinearGradient colors={['#ffffff', '#f3f4f6']} style={styles.card}>
        <View style={styles.dotBg} />

        <View style={styles.logoWrap}>
          <View style={styles.logoOuter}>
            <Text style={styles.logoA}>A</Text>
          </View>
          <Text style={styles.title}>ADON</Text>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>PREMIUM RESALE</Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.progressTrack}>
            <View style={styles.progressBar} />
          </View>
          <Text style={styles.loading}>안전한 마켓플레이스를 준비하고 있어요...</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="로그인" onPress={() => navigation.navigate('Login')} />
          <PrimaryButton label="회원가입" tone="ghost" onPress={() => navigation.navigate('Signup')} />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: 18,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#edf2ed',
    overflow: 'hidden',
    justifyContent: 'space-between',
    paddingVertical: 36,
    paddingHorizontal: 22,
  },
  dotBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
    backgroundColor: '#f8fbf8',
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 70,
  },
  logoOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#bef264',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#bef264',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  logoA: {
    fontSize: 56,
    fontWeight: '900',
    color: '#064e3b',
  },
  title: {
    marginTop: 24,
    fontSize: 52,
    letterSpacing: -1,
    fontWeight: '900',
    color: '#064e3b',
  },
  tagPill: {
    marginTop: 8,
    backgroundColor: '#bef264',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tagText: {
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
    color: '#064e3b',
  },
  bottom: {
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTrack: {
    width: 180,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    width: '40%',
    height: 4,
    backgroundColor: '#bef264',
  },
  loading: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  actions: {
    marginTop: 8,
  },
});
