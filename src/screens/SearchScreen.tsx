import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { resetToTab, TabKey } from '../navigation/tabRouting';
import { BottomTabMock } from '../components/BottomTabMock';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

type HubCategory = {
  id: string;
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

function getCurrentClock() {
  const now = new Date();
  const h = `${now.getHours()}`.padStart(2, '0');
  const m = `${now.getMinutes()}`.padStart(2, '0');
  return `${h}:${m}`;
}

export function SearchScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const handleTabPress = (tab: TabKey) => resetToTab(navigation, tab, 'search');
  const [clock, setClock] = useState(getCurrentClock());
  const [activeSegment, setActiveSegment] = useState<'category' | 'brands' | 'services'>('category');

  useEffect(() => {
    const updateClock = () => setClock(getCurrentClock());
    const timer = setInterval(updateClock, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    resetToTab(navigation, 'home', 'search');
  };

  const handlePressNonCategory = (name: string) => {
    Alert.alert(t('common.comingSoon'), t('common.comingSoonMsg', { feature: name }));
  };

  const euPopularCategories: HubCategory[] = [
    { id: 'cycling', name: 'Cycling', icon: 'bike' },
    { id: 'football', name: 'Football', icon: 'soccer' },
    { id: 'running', name: 'Running', icon: 'run' },
    { id: 'hiking', name: 'Hiking', icon: 'hiking' },
    { id: 'skiing', name: 'Skiing', icon: 'ski' },
    { id: 'tennis', name: 'Tennis', icon: 'tennis' },
    { id: 'camping', name: 'Camping', icon: 'tent' },
    { id: 'gaming', name: 'Gaming', icon: 'controller-classic-outline' },
    { id: 'photography', name: 'Photography', icon: 'camera-outline' },
    { id: 'vinyl', name: 'Vinyl', icon: 'album' },
    { id: 'books', name: 'Books', icon: 'book-open-page-variant-outline' },
    { id: 'board-games', name: 'Board Games', icon: 'puzzle-outline' },
  ];

  const euPrelovedCategories: HubCategory[] = [
    { id: 'women-fashion', name: t('post.fashion'), icon: 'human-female' },
    { id: 'men-fashion', name: t('post.fashion'), icon: 'human-male' },
    { id: 'sneakers', name: 'Sneakers', icon: 'shoe-sneaker' },
    { id: 'bags-wallets', name: 'Bags & Wallets', icon: 'bag-personal-outline' },
    { id: 'watches', name: t('post.luxury'), icon: 'watch-variant' },
    { id: 'jewelry', name: t('post.luxury'), icon: 'diamond-stone' },
    { id: 'home-decor', name: t('post.homeLiving'), icon: 'sofa-outline' },
    { id: 'electronics', name: t('post.electronics'), icon: 'laptop' },
    { id: 'bicycles', name: 'Bicycles', icon: 'bicycle' },
    { id: 'baby-kids', name: 'Baby & Kids', icon: 'baby-face-outline' },
    { id: 'beauty', name: 'Beauty', icon: 'spray-bottle' },
    { id: 'collectibles', name: 'Collectibles', icon: 'toy-brick-search-outline' },
  ];

  const featuredBrands: HubCategory[] = [
    { id: 'nike', name: 'Nike', icon: 'shoe-sneaker' },
    { id: 'adidas', name: 'Adidas', icon: 'shoe-sneaker' },
    { id: 'apple', name: 'Apple', icon: 'apple' },
    { id: 'sony', name: 'Sony', icon: 'headphones' },
    { id: 'ikea', name: 'IKEA', icon: 'sofa-outline' },
    { id: 'lego', name: 'LEGO', icon: 'toy-brick' },
  ];

  const marketplaceServices: HubCategory[] = [
    { id: 'auth-check', name: 'Authenticity Check', icon: 'shield-check-outline' },
    { id: 'safe-pay', name: 'Safe Payment', icon: 'credit-card-check-outline' },
    { id: 'pickup', name: 'Pickup Scheduler', icon: 'calendar-clock-outline' },
    { id: 'delivery', name: 'Delivery Helper', icon: 'truck-fast-outline' },
    { id: 'price-ai', name: 'Price Assistant', icon: 'chart-line' },
    { id: 'photo-ai', name: 'Photo Studio', icon: 'image-filter-hdr' },
  ];

  const renderSegmentContent = () => {
    if (activeSegment === 'brands') {
      return (
        <CategorySection
          title={t('category.recommendedBrands')}
          categories={featuredBrands}
          onPressCategory={(item) => handlePressNonCategory(item.name)}
        />
      );
    }

    if (activeSegment === 'services') {
      return (
        <CategorySection
          title={t('category.marketServices')}
          categories={marketplaceServices}
          onPressCategory={(item) => handlePressNonCategory(item.name)}
        />
      );
    }

    return (
      <>
        <CategorySection
          title={t('category.popularEu')}
          categories={euPopularCategories}
          onPressCategory={(item) =>
            navigation.navigate('CategoryList', { categoryId: item.id, categoryName: item.name })
          }
        />

        <CategorySection
          title={t('category.prelovedPopular')}
          categories={euPrelovedCategories}
          onPressCategory={(item) =>
            navigation.navigate('CategoryList', { categoryId: item.id, categoryName: item.name })
          }
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.clock}>{clock}</Text>
          <Pressable style={styles.closeBtn} onPress={handleClose} accessibilityRole="button">
            <MaterialCommunityIcons name="close" size={30} color="#171717" />
          </Pressable>
        </View>

        <Text style={styles.pageTitle}>{t('category.all')}</Text>

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="#64748b" />
          <TextInput
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.segmentRow}>
          <Pressable style={styles.segmentItem} onPress={() => setActiveSegment('category')} accessibilityRole="button">
            <Text style={[styles.segmentText, activeSegment === 'category' && styles.segmentTextActive]}>{t('product.category')}</Text>
            {activeSegment === 'category' ? <View style={styles.segmentUnderline} /> : null}
          </Pressable>
          <Pressable style={styles.segmentItem} onPress={() => setActiveSegment('brands')} accessibilityRole="button">
            <Text style={[styles.segmentText, activeSegment === 'brands' && styles.segmentTextActive]}>{t('category.brands')}</Text>
            {activeSegment === 'brands' ? <View style={styles.segmentUnderline} /> : null}
          </Pressable>
          <Pressable style={styles.segmentItem} onPress={() => setActiveSegment('services')} accessibilityRole="button">
            <Text style={[styles.segmentText, activeSegment === 'services' && styles.segmentTextActive]}>{t('category.services')}</Text>
            {activeSegment === 'services' ? <View style={styles.segmentUnderline} /> : null}
          </Pressable>
        </View>

        {renderSegmentContent()}
      </ScrollView>
      <BottomTabMock active="search" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

function CategorySection({
  title,
  categories,
  onPressCategory,
}: {
  title: string;
  categories: HubCategory[];
  onPressCategory: (item: HubCategory) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>
        {categories.map((item) => (
          <Pressable
            key={item.id}
            style={styles.categoryItem}
            onPress={() => onPressCategory(item)}
            accessibilityRole="button"
          >
            <View style={styles.categoryIconCircle}>
              <MaterialCommunityIcons name={item.icon} size={29} color="#0f5f33" />
            </View>
            <Text style={styles.categoryLabel}>{item.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7f6' },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  topRow: {
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clock: { fontSize: 17, fontWeight: '600', color: '#111827', marginLeft: 2 },
  closeBtn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: '800',
    color: '#0b1324',
  },
  searchWrap: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1e293b',
  },
  segmentRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  segmentItem: { alignItems: 'center', minWidth: 100 },
  segmentText: {
    fontSize: 11,
    color: '#a3a3a3',
    fontWeight: '700',
  },
  segmentTextActive: { color: '#171717' },
  segmentUnderline: {
    marginTop: 10,
    width: '100%',
    height: 5,
    borderRadius: 999,
    backgroundColor: '#111827',
  },
  section: { marginTop: 18 },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#171717',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '24%',
    alignItems: 'center',
    marginBottom: 18,
  },
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#e8f5ec',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d6eddc',
  },
  categoryLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 17,
  },
});
