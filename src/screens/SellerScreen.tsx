import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { resetToTab, TabKey } from '../navigation/tabRouting';
import { PrimaryButton } from '../components/PrimaryButton';
import { DetailBackButton } from '../components/DetailBackButton';
import { BottomTabMock } from '../components/BottomTabMock';
import { USERS } from '../data/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Seller'>;

export function SellerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const seller = USERS.seller;
  const handleTabPress = (tab: TabKey) => resetToTab(navigation, tab, 'profile');

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View>
          <Image source={{ uri: seller.avatar }} style={styles.cover} />

          {/* Back Button */}
          <View style={[styles.backButton, { top: insets.top + 14 }]}>
            <DetailBackButton onPress={() => navigation.goBack()} />
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{seller.name}</Text>
            <View style={styles.badge}><MaterialIcons name="verified" size={14} color="#166534" /><Text style={styles.badgeText}>PRO</Text></View>
          </View>
          <Text style={styles.meta}>{seller.meta}</Text>

          <View style={styles.statRow}>
            <View style={styles.stat}><Text style={styles.statValue}>{seller.rating}</Text><Text style={styles.statLabel}>Rating</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>{seller.sales}+</Text><Text style={styles.statLabel}>Vouched</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>{seller.shipTime}</Text><Text style={styles.statLabel}>Ship Time</Text></View>
          </View>

          <View style={styles.bioBox}>
            <Text style={styles.bioHead}>SELLER BIO</Text>
            <Text style={styles.bioText}>
              {seller.bio}
            </Text>
          </View>

          <Text style={styles.section}>Fall Favorites</Text>
          <View style={styles.favorites}>
            <View style={styles.favCard}><Text style={styles.favName}>Cream Knit</Text><Text style={styles.favPrice}>$45</Text></View>
            <View style={styles.favCard}><Text style={styles.favName}>Leather Coat</Text><Text style={styles.favPrice}>$120</Text></View>
            <View style={styles.favCard}><Text style={styles.favName}>Plaid Skirt</Text><Text style={styles.favPrice}>$28</Text></View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 62 }]}>
        <PrimaryButton label="상품 보기" onPress={() => navigation.navigate('Product')} />
        <PrimaryButton label="채팅 시작" tone="ghost" onPress={() => navigation.navigate('ChatList')} />
      </View>
      <BottomTabMock active="profile" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  content: { paddingBottom: 220 },
  cover: { width: '100%', height: 250 },
  backButton: {
    position: 'absolute',
    left: 16,
  },
  profileCard: { marginTop: -22, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#fff', padding: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 24, fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#dcfce7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#166534' },
  meta: { marginTop: 4, color: '#64748b', fontWeight: '600' },
  statRow: {
    marginTop: 16,
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 12,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  statLabel: { marginTop: 4, fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  bioBox: { marginTop: 16, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 16, padding: 14 },
  bioHead: { color: '#166534', fontWeight: '800', fontSize: 12, letterSpacing: 0.8 },
  bioText: { marginTop: 8, color: '#065f46', lineHeight: 21, fontWeight: '500' },
  section: { marginTop: 16, fontSize: 18, fontWeight: '800', color: '#0f172a' },
  favorites: { marginTop: 8, gap: 8 },
  favCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between' },
  favName: { fontWeight: '700', color: '#0f172a' },
  favPrice: { fontWeight: '900', color: '#0f172a' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
  },
});
