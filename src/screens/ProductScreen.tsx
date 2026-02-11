import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { DetailBackButton } from '../components/DetailBackButton';
import { PRODUCTS, USERS } from '../data/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Product'>;

export function ProductScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  // For demo, we use the Trench Coat (id: p3)
  const product = PRODUCTS[2];
  const seller = USERS.seller;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View>
          <Image
            source={{ uri: product.image }}
            style={styles.hero}
          />
          <View style={[styles.topActions, { top: insets.top + 14 }]}>
            <DetailBackButton onPress={() => navigation.goBack()} />
            <View style={styles.rightActions}>
              <View style={styles.actionCircle}><MaterialIcons name="share" size={18} color="#0f172a" /></View>
              <View style={styles.actionCircle}><MaterialIcons name="favorite-border" size={18} color="#0f172a" /></View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.row}>
            <Text style={styles.title}>{product.name}</Text>
            {product.isPremium && <Text style={styles.premium}>PREMIUM</Text>}
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price}</Text>
            {product.oldPrice && <Text style={styles.oldPrice}>{product.oldPrice}</Text>}
          </View>

          <View style={styles.safeBox}>
            <MaterialIcons name="verified-user" size={16} color="#16a34a" />
            <Text style={styles.safeText}>Safe Payment Guaranteed</Text>
          </View>

          <View style={styles.sellerCard}>
            <View>
              <Text style={styles.sellerName}>{seller.name}</Text>
              <Text style={styles.sellerMeta}>{seller.positiveRate}% Positive • {seller.sales} Sales</Text>
            </View>
            <Text style={styles.follow}>Follow</Text>
          </View>

          <Text style={styles.section}>Description</Text>
          <Text style={styles.desc}>
            {product.description}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <PrimaryButton label="셀러 보기" onPress={() => navigation.navigate('Seller')} />
        <PrimaryButton label="채팅하기" tone="ghost" onPress={() => navigation.navigate('Chat')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { paddingBottom: 150 },
  hero: { width: '100%', height: 430 },
  topActions: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  rightActions: { flexDirection: 'row', gap: 8 },
  actionCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  body: { marginTop: -20, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, fontSize: 24, fontWeight: '800', color: '#0f172a', lineHeight: 30 },
  premium: { fontSize: 10, fontWeight: '800', color: '#16a34a', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 12 },
  price: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  oldPrice: { color: '#9ca3af', textDecorationLine: 'line-through', fontSize: 16, marginBottom: 4 },
  safeBox: { marginTop: 16, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  safeText: { color: '#15803d', fontWeight: '700', fontSize: 13 },
  sellerCard: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  sellerName: { fontWeight: '700', color: '#0f172a', fontSize: 15 },
  sellerMeta: { marginTop: 2, color: '#64748b', fontSize: 13 },
  follow: { fontWeight: '700', color: '#0f172a', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  section: { marginTop: 24, fontSize: 18, fontWeight: '800', color: '#0f172a' },
  desc: { marginTop: 8, lineHeight: 24, color: '#475569', fontSize: 15 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});
