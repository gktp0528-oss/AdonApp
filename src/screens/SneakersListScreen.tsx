import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { DetailBackButton } from '../components/DetailBackButton';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryList'>;

type ListItem = { id: string; name: string; price: string; meta: string; image: string };
type SortKey = 'latest' | 'priceLow' | 'nearby' | 'rating';

const IMG_SNEAKER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCEcEftcal76cLHG7bwAUxxxtwMFdSYWvLCgiOCdkOD48VeuNZX38RzYfjXjA0gEstCMHZTfOzV_bEYDOprbuCyKH2QA-I1U-qnBf2UUqIYLBPgX24kZMgszA4xz-OQSv69TZEi6p6qs-PUJTcF9YSBggqnND7L17hswYPdrmtXqa6463Eqm03TfGSvDFS-79AjbsF59SEVKEjGP1zA5vWCgsyDhrfcPlLdbD10jYUC5sfMaL3gWVDUSiPRP-UEJ8g25-ImRKwO1JUS';
const IMG_FASHION =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBGxoqvamMizPivBvJTFdAbsg12BZ0NYThOAyfvLnsfZxFseoc0R3aROCgPRp_OsaG0LKOgNDnKIS4_OuvfQ3UeI7l8bU-H43fVEMpKQ3nUWUx_cr8VziKtHajoihos-LvxAdfoFLGshjFO9T11D3GTayO0PZHrJo8ZlpaC5bZgyC3xkyYJB_vH05MKY7ADu5lz3Fxgg0f9Rc4Tq0kgFPgYhoy_YKc9FHi3w-ADF1l28B0F4dnM2yVSASnsUgabbx4TE7sLPgYPjnft';
const IMG_BAG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDMHAAPKynYBOfc-Zp2BAL7d9tAS3fng-PstAEik2Oiy2TPGGZm1W3xhEngh7X2SWcIJL6t9Qbi12rbX7rNVo2sJuGu0j88bM2eJqfTPnPN9r5NNigIs-a_twMTgsgfSbodWFT5iZwt5FiDy2TVVUBg44lbBUwNf1rE1yV7REANbq46D8aivStgkA4OG4O_Ow31LcILd0FV9NxpQBhlO43a2ntkpKFHgemuP53Y2hlYNh-9NabDZ8LOcbKJFy2XKrNTykzpJG0P32d-';
const IMG_ELEC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAR7kGg7Kg9-A1ze6SFFAAvgU1snfHhzREXTwcw5jfxpFqbG_3i6SHrTadyrcMXwu2dXS61zG-M-IZ4TBSkz6f_QfuV8_-Z_g9NDZNtO_kr1OTPIau0gMuhTqjGemp80-TQCY44haJLJkHn1c9hI9tcbdz62PQ3dWBXP6rohOACCcH3KI_Zlln49mxievzwnO9ODidPYWpVAMsXWewn6MuUVUzsh2QNmq4szSFsVTPUdRlrtOwFPN-4DGNgEFmiyellGjq6Nhkx0_4r';
const IMG_ART =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuByGiURZuUZuJgVeqR_XhtENsg0S-oD20NaibKGFn9LshPaucIGge_8O7n4gLknwSRcS2GcTxTrd9rgvn-1jM24y9D_UTSSbqXI-aNJST5ef9OYsAqZjYabcTp2NtLdy-9N-aC_Mb4ryo_kjEjq0TMApkuJy1xaZmC-CKFe4JQeipxqAy1kzwML2oE5y4zPBjbLyxVWtezGHi6kaB3Lp93UrL80LOh_szjfxr8Z8huHpSheTxGgU_O5EcPyYizMY7Zc8yFxZP9Y8ebr';

const fallbackItems: ListItem[] = [
  {
    id: 'fallback-1',
    name: 'Daily Pick Item',
    price: '€59',
    meta: 'Great condition',
    image: IMG_SNEAKER,
  },
  {
    id: 'fallback-2',
    name: 'Editor Choice',
    price: '€79',
    meta: 'Ready to ship',
    image: IMG_FASHION,
  },
];

const itemsByCategory: Record<string, ListItem[]> = {
  cycling: [
    { id: 'cyc-1', name: 'Road Bike Carbon 54', price: '€890', meta: 'Serviced • Good', image: IMG_ELEC },
    { id: 'cyc-2', name: 'City Helmet Matte Black', price: '€48', meta: 'Like New', image: IMG_ART },
  ],
  football: [
    { id: 'fbl-1', name: 'FG Boots Pro Match', price: '€95', meta: 'EU 43 • Clean', image: IMG_SNEAKER },
    { id: 'fbl-2', name: 'Team Jersey 24/25', price: '€44', meta: 'Size L • Excellent', image: IMG_FASHION },
  ],
  running: [
    { id: 'run-1', name: 'Daily Trainer Nimbus', price: '€110', meta: 'EU 42 • Good', image: IMG_SNEAKER },
    { id: 'run-2', name: 'GPS Running Watch', price: '€159', meta: 'Battery 96%', image: IMG_ELEC },
  ],
  hiking: [
    { id: 'hik-1', name: 'Trail Jacket Waterproof', price: '€86', meta: 'Size M • Good', image: IMG_FASHION },
    { id: 'hik-2', name: 'Hiking Boots Mid GTX', price: '€121', meta: 'EU 44', image: IMG_SNEAKER },
  ],
  skiing: [
    { id: 'ski-1', name: 'Ski Jacket Alpine Pro', price: '€170', meta: 'Insulated', image: IMG_FASHION },
    { id: 'ski-2', name: 'Snow Goggles Anti-Fog', price: '€60', meta: 'Box included', image: IMG_ART },
  ],
  tennis: [
    { id: 'ten-1', name: 'Performance Racket 300g', price: '€129', meta: 'Grip 3', image: IMG_ART },
    { id: 'ten-2', name: 'Clay Court Shoes', price: '€82', meta: 'EU 41', image: IMG_SNEAKER },
  ],
  camping: [
    { id: 'cam-1', name: '2P Trekking Tent', price: '€149', meta: 'Lightweight', image: IMG_ART },
    { id: 'cam-2', name: 'Portable Stove Kit', price: '€39', meta: 'Used twice', image: IMG_ELEC },
  ],
  gaming: [
    { id: 'gam-1', name: 'Nintendo Switch OLED', price: '€245', meta: 'With dock', image: IMG_ELEC },
    { id: 'gam-2', name: 'Controller Pro Black', price: '€55', meta: 'No drift', image: IMG_ART },
  ],
  photography: [
    { id: 'pho-1', name: 'Mirrorless Camera Body', price: '€680', meta: 'Shutter 11k', image: IMG_ELEC },
    { id: 'pho-2', name: '35mm Prime Lens', price: '€199', meta: 'Clean glass', image: IMG_ART },
  ],
  vinyl: [
    { id: 'vin-1', name: 'Turntable Belt Drive', price: '€128', meta: 'Works perfectly', image: IMG_ELEC },
    { id: 'vin-2', name: 'Jazz Classics Bundle', price: '€58', meta: '12 records', image: IMG_ART },
  ],
  books: [
    { id: 'bok-1', name: 'Modern Fiction Set', price: '€36', meta: '8 books', image: IMG_ART },
    { id: 'bok-2', name: 'Photography Theory', price: '€18', meta: 'Like New', image: IMG_FASHION },
  ],
  'board-games': [
    { id: 'brd-1', name: 'Strategy Box Complete', price: '€42', meta: 'All pieces', image: IMG_ART },
    { id: 'brd-2', name: 'Party Game Bundle', price: '€29', meta: '3 titles', image: IMG_FASHION },
  ],
  'women-fashion': [
    { id: 'wf-1', name: 'Wool Coat Tailored', price: '€129', meta: 'Size S', image: IMG_FASHION },
    { id: 'wf-2', name: 'Midi Dress Satin', price: '€49', meta: 'Size M', image: IMG_FASHION },
  ],
  'men-fashion': [
    { id: 'mf-1', name: 'Overshirt Olive', price: '€52', meta: 'Size L', image: IMG_FASHION },
    { id: 'mf-2', name: 'Selvedge Denim', price: '€74', meta: 'W32', image: IMG_FASHION },
  ],
  sneakers: [
    { id: 'snk-1', name: 'Nike Air Max 97 Beige', price: '€149', meta: 'EU 43 • Like New', image: IMG_SNEAKER },
    { id: 'snk-2', name: 'Adidas Samba OG Cream', price: '€112', meta: 'EU 42 • Excellent', image: IMG_SNEAKER },
    { id: 'snk-3', name: 'New Balance 990v5 Gray', price: '€176', meta: 'EU 44 • Mint', image: IMG_SNEAKER },
    { id: 'snk-4', name: 'Jordan 1 Low Black Toe', price: '€189', meta: 'EU 43 • Great', image: IMG_SNEAKER },
  ],
  'bags-wallets': [
    { id: 'bag-1', name: 'Leather Shoulder Bag', price: '€320', meta: 'Authentic', image: IMG_BAG },
    { id: 'bag-2', name: 'Card Holder Wallet', price: '€65', meta: 'Like New', image: IMG_BAG },
  ],
  watches: [
    { id: 'wat-1', name: 'Automatic Diver 40mm', price: '€260', meta: 'Serviced', image: IMG_ART },
    { id: 'wat-2', name: 'Minimal Quartz Steel', price: '€90', meta: 'Great condition', image: IMG_ART },
  ],
  jewelry: [
    { id: 'jew-1', name: 'Sterling Silver Chain', price: '€49', meta: '925', image: IMG_BAG },
    { id: 'jew-2', name: 'Gold Plated Ring', price: '€39', meta: 'EU 54', image: IMG_ART },
  ],
  'home-decor': [
    { id: 'hom-1', name: 'Minimal Ceramic Vase', price: '€44', meta: 'Handmade', image: IMG_ART },
    { id: 'hom-2', name: 'Wood Table Lamp', price: '€58', meta: 'Warm white', image: IMG_ELEC },
  ],
  electronics: [
    { id: 'elc-1', name: 'Noise Cancel Headphones', price: '€185', meta: 'Excellent', image: IMG_ELEC },
    { id: 'elc-2', name: 'Tablet 10-inch 128GB', price: '€210', meta: 'Battery healthy', image: IMG_ELEC },
  ],
  bicycles: [
    { id: 'bic-1', name: 'Urban Commuter Bike', price: '€340', meta: 'Tune-up done', image: IMG_ELEC },
    { id: 'bic-2', name: 'Bike Lock U-Type', price: '€24', meta: 'Hardened steel', image: IMG_ART },
  ],
  'baby-kids': [
    { id: 'bbk-1', name: 'Kids Balance Bike', price: '€55', meta: 'Age 3-5', image: IMG_SNEAKER },
    { id: 'bbk-2', name: 'Baby Carrier Soft', price: '€42', meta: 'Washed', image: IMG_FASHION },
  ],
  beauty: [
    { id: 'bea-1', name: 'Skincare Bundle', price: '€31', meta: 'Unopened', image: IMG_ART },
    { id: 'bea-2', name: 'Hair Dryer Pro', price: '€63', meta: '220V', image: IMG_ELEC },
  ],
  collectibles: [
    { id: 'col-1', name: 'Limited Figure Boxed', price: '€88', meta: 'Mint', image: IMG_ART },
    { id: 'col-2', name: 'Retro Poster Signed', price: '€95', meta: 'With certificate', image: IMG_FASHION },
  ],
};

export function SneakersListScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { categoryId, categoryName } = route.params;
  const [sortKey, setSortKey] = useState<SortKey>('latest');
  const items = useMemo(() => itemsByCategory[categoryId] ?? fallbackItems, [categoryId]);
  const sortedItems = useMemo(() => {
    const withSignal = items.map((item) => {
      const price = Number(item.price.replace(/[^0-9.]/g, '')) || 0;
      const seed = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const distanceKm = 0.8 + (seed % 42) / 3.7;
      const rating = 3.7 + (seed % 14) / 10;

      return { ...item, priceValue: price, distanceKm, rating };
    });

    if (sortKey === 'priceLow') {
      return [...withSignal].sort((a, b) => a.priceValue - b.priceValue);
    }
    if (sortKey === 'nearby') {
      return [...withSignal].sort((a, b) => a.distanceKm - b.distanceKm);
    }
    if (sortKey === 'rating') {
      return [...withSignal].sort((a, b) => b.rating - a.rating);
    }
    return withSignal;
  }, [items, sortKey]);
  const sortOptions: SortKey[] = ['latest', 'priceLow', 'nearby', 'rating'];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <DetailBackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerText}>
          <Text style={styles.title}>{categoryName}</Text>
          <Text style={styles.subtitle}>{t('screen.categoryList.itemsCount', { count: items.length })}</Text>
        </View>
        <View style={styles.filterBtn}>
          <MaterialIcons name="inventory-2" size={18} color="#334155" />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsScroll}>
        {sortOptions.map((option) => {
          const isActive = option === sortKey;
          return (
            <Pressable key={option} style={[styles.chip, isActive && styles.chipActive]} onPress={() => setSortKey(option)}>
              <Text style={isActive ? styles.chipActiveText : styles.chipText}>{t(`screen.categoryList.sort.${option}`)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {sortedItems.map((item) => (
          <Pressable
            key={item.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate('Product', {
                product: {
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  image: item.image,
                  meta: item.meta,
                },
              })
            }
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.pricePill}>
              <Text style={styles.price}>{item.price}</Text>
            </View>
            <Text numberOfLines={1} style={styles.name}>
              {item.name}
            </Text>
            <View style={styles.statsRow}>
              <Text style={styles.statText}>★ {item.rating.toFixed(1)}</Text>
              <Text style={styles.statDivider}>•</Text>
              <Text style={styles.statText}>{item.distanceKm.toFixed(1)} km</Text>
            </View>
            <Text style={styles.meta}>{item.meta}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f8f6' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 4, color: '#64748b', fontWeight: '600' },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsScroll: { marginBottom: 10 },
  chips: { paddingHorizontal: 16, gap: 8 },
  chip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  chipActive: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  chipText: { color: '#64748b', fontWeight: '600', fontSize: 12 },
  chipActiveText: { color: '#166534', fontWeight: '800', fontSize: 12 },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 130,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: { width: '48%', marginBottom: 14 },
  image: { width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: '#d1d5db' },
  pricePill: {
    position: 'absolute',
    left: 9,
    top: 9,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  price: { color: '#14532d', fontWeight: '800', fontSize: 12 },
  name: { marginTop: 9, color: '#0f172a', fontWeight: '700', fontSize: 14 },
  statsRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center' },
  statText: { color: '#475569', fontSize: 11, fontWeight: '700' },
  statDivider: { marginHorizontal: 4, color: '#94a3b8', fontSize: 12 },
  meta: { marginTop: 3, color: '#64748b', fontSize: 12 },
});
