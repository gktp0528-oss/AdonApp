import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { DetailBackButton } from '../components/DetailBackButton';
import { PRODUCTS, USERS } from '../data/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Product'>;

export function ProductScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const fromRoute = route.params?.product;
  const byId = route.params?.productId
    ? PRODUCTS.find((item) => item.id === route.params?.productId)
    : undefined;
  const product = fromRoute ?? byId ?? PRODUCTS[2];
  const seller = USERS.seller;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: product.image }} style={styles.hero} />

          <View style={[styles.topActions, { top: insets.top + 12 }]}>
            <DetailBackButton onPress={() => navigation.goBack()} />
            <View style={styles.rightActions}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="share" size={18} color="#0f172a" />
              </View>
              <View style={styles.iconCircle}>
                <MaterialIcons name="favorite-border" size={18} color="#0f172a" />
              </View>
            </View>
          </View>

          <View style={styles.authWrap}>
            <View style={styles.authPill}>
              <MaterialIcons name="verified" size={14} color="#22c55e" />
              <Text style={styles.authText}>AI Verified Authentic</Text>
            </View>
            <View style={styles.dots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.name}</Text>
            {(product.isPremium ?? false) ? <Text style={styles.premium}>PREMIUM</Text> : null}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price}</Text>
            {product.oldPrice ? <Text style={styles.oldPrice}>{product.oldPrice}</Text> : null}
          </View>

          <View style={styles.safeBox}>
            <MaterialIcons name="verified-user" size={16} color="#22c55e" />
            <Text style={styles.safeText}>Safe Payment Guaranteed</Text>
          </View>

          <View style={styles.sellerCard}>
            <View style={styles.sellerTop}>
              <View style={styles.sellerLeft}>
                <Image source={{ uri: seller.avatar }} style={styles.avatar} />
                <View style={styles.sellerTextWrap}>
                  <Text style={styles.sellerName}>{seller.name}</Text>
                  <Text style={styles.sellerMeta}>{seller.positiveRate}% Positive · {seller.sales} Sales</Text>
                </View>
              </View>
              <Pressable style={styles.followBtn}>
                <Text style={styles.followText}>Follow</Text>
              </Pressable>
            </View>

            <View style={styles.trustRow}>
              <View style={styles.trustCard}>
                <Text style={styles.trustLabel}>RESPONSE TIME</Text>
                <Text style={styles.trustValue}>&lt; 1 hour</Text>
              </View>
              <View style={styles.trustCard}>
                <Text style={styles.trustLabel}>RELIABILITY</Text>
                <Text style={styles.trustValue}>Top Rated</Text>
              </View>
            </View>
          </View>

          <View style={styles.specGrid}>
            <View style={styles.specCol}>
              <Text style={styles.specKey}>Brand</Text>
              <Text style={styles.specValue}>Heritage Lux</Text>
            </View>
            <View style={styles.specCol}>
              <Text style={styles.specKey}>Size</Text>
              <Text style={styles.specValue}>Medium (EU 38)</Text>
            </View>
            <View style={styles.specCol}>
              <Text style={styles.specKey}>Condition</Text>
              <View style={styles.inlineValue}>
                <Text style={styles.specValue}>Like New</Text>
                <View style={[styles.colorDot, { backgroundColor: '#22c55e' }]} />
              </View>
            </View>
            <View style={styles.specCol}>
              <Text style={styles.specKey}>Color</Text>
              <View style={styles.inlineValue}>
                <Text style={styles.specValue}>Beige</Text>
                <View style={[styles.colorDot, { backgroundColor: '#d6c8b2' }]} />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.desc}>
            {product.description ??
              'Well-maintained item in great condition. Clean details and ready to wear. No major flaws reported by seller.'}
          </Text>
          <Pressable>
            <Text style={styles.readMore}>Read More</Text>
          </Pressable>

          <Text style={[styles.sectionTitle, styles.sectionGap]}>Shipping & Pickup</Text>
          <View style={styles.shipCard}>
            <View style={styles.shipIconWrap}>
              <MaterialIcons name="local-shipping" size={18} color="#64748b" />
            </View>
            <View style={styles.shipTextWrap}>
              <Text style={styles.shipTitle}>Express Shipping</Text>
              <Text style={styles.shipMeta}>Arrives in 2-3 business days</Text>
            </View>
            <Text style={styles.shipPrice}>$12.50</Text>
          </View>

          <View style={[styles.shipCard, styles.shipCardActive]}>
            <View style={[styles.shipIconWrap, styles.shipIconWrapActive]}>
              <MaterialIcons name="storefront" size={18} color="#16a34a" />
            </View>
            <View style={styles.shipTextWrap}>
              <Text style={styles.shipTitle}>In-store Verification</Text>
              <Text style={styles.shipMeta}>Secure pickup at local hub</Text>
            </View>
            <Text style={styles.shipPriceFree}>Free</Text>
          </View>

          <View style={styles.locationHead}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.locationText}>London, United Kingdom</Text>
          </View>

          <View style={styles.mapCard}>
            <View style={styles.mapPinOuter}>
              <View style={styles.mapPinInner} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}> 
        <Pressable style={styles.chatBtn} onPress={() => navigation.navigate('Chat')}>
          <MaterialIcons name="chat-bubble-outline" size={22} color="#1f2937" />
        </Pressable>
        <Pressable style={styles.buyBtn} onPress={() => navigation.navigate('Chat')}>
          <MaterialIcons name="shopping-bag" size={18} color="#ffffff" />
          <Text style={styles.buyText}>Buy Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f4f3' },
  content: { paddingBottom: 140 },

  heroWrap: { position: 'relative' },
  hero: { width: '100%', height: 500, backgroundColor: '#d6c79b' },
  topActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightActions: { flexDirection: 'row', gap: 8 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20,20,20,0.72)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  authText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.62)' },
  dotActive: { width: 26, borderRadius: 999, backgroundColor: '#22c55e' },

  body: {
    marginTop: -4,
    backgroundColor: '#f5f6f5',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, fontSize: 44 / 2, fontWeight: '900', color: '#0f172a', lineHeight: 31 },
  premium: {
    marginTop: 4,
    color: '#22c55e',
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: '800',
    fontSize: 11,
  },
  priceRow: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  price: { fontSize: 48 / 2, fontWeight: '900', color: '#111827' },
  oldPrice: { fontSize: 16, color: '#94a3b8', textDecorationLine: 'line-through', marginBottom: 3 },

  safeBox: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eafaf0',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  safeText: { color: '#16a34a', fontWeight: '700' },

  sellerCard: {
    marginTop: 14,
    backgroundColor: '#eef1ef',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  sellerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sellerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  sellerTextWrap: { flex: 1 },
  sellerName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  sellerMeta: { marginTop: 2, color: '#16a34a', fontWeight: '700', fontSize: 13 },
  followBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  followText: { color: '#0f172a', fontWeight: '700' },
  trustRow: { marginTop: 10, flexDirection: 'row', gap: 8 },
  trustCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    alignItems: 'center',
  },
  trustLabel: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  trustValue: { marginTop: 4, fontSize: 14, color: '#0f172a', fontWeight: '700' },

  specGrid: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap' },
  specCol: { width: '50%', marginBottom: 14 },
  specKey: { color: '#94a3b8', fontSize: 14 },
  specValue: { marginTop: 2, color: '#111827', fontSize: 16, fontWeight: '600' },
  inlineValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorDot: { width: 9, height: 9, borderRadius: 4.5, marginTop: 3 },

  divider: { height: 1, backgroundColor: '#e5e7eb', marginBottom: 14, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  desc: { marginTop: 10, color: '#475569', lineHeight: 25, fontSize: 16 },
  readMore: { marginTop: 8, color: '#22c55e', fontWeight: '800', fontSize: 16 },

  sectionGap: { marginTop: 18 },
  shipCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#dbe2e8',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shipCardActive: {
    borderColor: '#86efac',
    backgroundColor: '#ecfdf3',
  },
  shipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eef2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipIconWrapActive: { backgroundColor: '#d1fae5' },
  shipTextWrap: { flex: 1 },
  shipTitle: { fontSize: 21 / 2, fontWeight: '800', color: '#0f172a' },
  shipMeta: { marginTop: 2, fontSize: 12, color: '#64748b' },
  shipPrice: { fontWeight: '800', color: '#111827', fontSize: 22 / 2 },
  shipPriceFree: { fontWeight: '800', color: '#16a34a', fontSize: 22 / 2 },

  locationHead: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationText: { color: '#94a3b8', fontSize: 15 },
  mapCard: {
    marginTop: 10,
    height: 126,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mapPinOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  mapPinInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e' },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'rgba(245,246,245,0.98)',
  },
  chatBtn: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtn: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buyText: { color: '#fff', fontSize: 26 / 2, fontWeight: '800' },
});
