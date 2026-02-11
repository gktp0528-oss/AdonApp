import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { resetToTab, TabKey } from '../navigation/tabRouting';
import { BottomTabMock } from '../components/BottomTabMock';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

type HubCategory = {
  id: string;
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
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
  { id: 'women-fashion', name: 'Women Fashion', icon: 'human-female' },
  { id: 'men-fashion', name: 'Men Fashion', icon: 'human-male' },
  { id: 'sneakers', name: 'Sneakers', icon: 'shoe-sneaker' },
  { id: 'bags-wallets', name: 'Bags & Wallets', icon: 'bag-personal-outline' },
  { id: 'watches', name: 'Watches', icon: 'watch-variant' },
  { id: 'jewelry', name: 'Jewelry', icon: 'diamond-stone' },
  { id: 'home-decor', name: 'Home Decor', icon: 'sofa-outline' },
  { id: 'electronics', name: 'Electronics', icon: 'laptop' },
  { id: 'bicycles', name: 'Bicycles', icon: 'bicycle' },
  { id: 'baby-kids', name: 'Baby & Kids', icon: 'baby-face-outline' },
  { id: 'beauty', name: 'Beauty', icon: 'spray-bottle' },
  { id: 'collectibles', name: 'Collectibles', icon: 'toy-brick-search-outline' },
];

export function SearchScreen({ navigation }: Props) {
  const handleTabPress = (tab: TabKey) => resetToTab(navigation, tab, 'search');
  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    resetToTab(navigation, 'home', 'search');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.clock}>15:23</Text>
          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <MaterialCommunityIcons name="close" size={30} color="#171717" />
          </Pressable>
        </View>

        <Text style={styles.pageTitle}>All Categories</Text>

        <View style={styles.segmentRow}>
          <View style={styles.segmentItem}>
            <Text style={[styles.segmentText, styles.segmentTextActive]}>Category</Text>
            <View style={styles.segmentUnderline} />
          </View>
          <View style={styles.segmentItem}>
            <Text style={styles.segmentText}>Brands</Text>
          </View>
          <View style={styles.segmentItem}>
            <Text style={styles.segmentText}>Services</Text>
          </View>
        </View>

        <CategorySection
          title="Popular in Europe"
          categories={euPopularCategories}
          onPressCategory={(item) =>
            navigation.navigate('CategoryList', { categoryId: item.id, categoryName: item.name })
          }
        />

        <CategorySection
          title="Pre-Loved Essentials"
          categories={euPrelovedCategories}
          onPressCategory={(item) =>
            navigation.navigate('CategoryList', { categoryId: item.id, categoryName: item.name })
          }
        />
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
    width: 110,
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
