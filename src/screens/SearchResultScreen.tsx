import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { searchService } from '../services/searchService';
import { Listing } from '../types/listing';
import { formatCurrency } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'SearchResult'>;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop';

export function SearchResultScreen({ route, navigation }: Props) {
  const { query, categoryId, categoryName } = route.params;
  const { t } = useTranslation();
  const [results, setResults] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void performSearch();
  }, [query, categoryId]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      // Pass categoryId if present, otherwise just query
      const searchResults = await searchService.searchListings(query || '', { categoryId });
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toRelativeTime = (date?: any): string => {
    if (!date) return t('common.time.justNow');
    const d = date.toDate ? date.toDate() : new Date(date);
    const diffMin = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60000));
    if (diffMin < 60) return t('common.time.ago.m', { count: diffMin });
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return t('common.time.ago.h', { count: diffHour });
    return t('common.time.ago.d', { count: Math.floor(diffHour / 24) });
  };

  const toCategoryKey = (value?: string) => {
    // Keep existing helper
    const v = (value || '').toLowerCase();
    if (v.includes('fashion')) return 'fashion';
    if (v.includes('tech') || v.includes('electronic')) return 'tech';
    if (v.includes('home') || v.includes('living')) return 'home';
    if (v.includes('kid') || v.includes('baby')) return 'kids';
    return null;
  };

  const renderResultItem = ({ item }: { item: Listing }) => (
    <Pressable
      style={styles.freshCard}
      onPress={() => {
        // Track only if query exists, or just skip
        if (query) searchService.trackClick(query, item.id, 0);
        navigation.navigate('Product', { listingId: item.id });
      }}
    >
      <View>
        <Image
          source={{ uri: item.photos?.[0] || FALLBACK_IMAGE }}
          style={styles.freshImage}
        />
        <Pressable
          style={styles.wishBtn}
          accessibilityRole="button"
          accessibilityLabel={t('screen.home.accessibility.addToWishlist')}
        >
          <MaterialIcons name="favorite-border" size={18} color="#4b5563" />
        </Pressable>
      </View>
      <Text numberOfLines={1} style={styles.freshName}>{item.title}</Text>
      <View style={styles.freshMetaRow}>
        <Text style={styles.freshPrice}>
          {formatCurrency(item.price, item.currency)}
        </Text>
        <Text style={styles.freshTime}>{toRelativeTime(item.createdAt)}</Text>
      </View>
      <View style={styles.categoryTag}>
        <Text style={styles.categoryText}>
          {toCategoryKey(item.category)
            ? t(`screen.home.category.${toCategoryKey(item.category)}`)
            : item.category}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </Pressable>
        <View style={styles.searchBar}>
          {/* If category search, show title. If text search, show query */}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {categoryId ? (categoryName || t('screen.searchResult.categoryTitle')) : `"${query}"`}
          </Text>
        </View>
      </View>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>"{query}"</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Results Count */}
      {!isLoading && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {results.length > 0
              ? t('screen.search.resultCount', { count: results.length })
              : t('screen.search.empty.title')}
          </Text>
        </View>
      )}

      {/* Results List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>
            {t('screen.search.ai_analyzing', { defaultValue: 'Adon AI is expanding your search...' })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderResultItem}
          numColumns={2}
          columnWrapperStyle={styles.freshRow}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons name="search" size={48} color="#f3f4f6" />
              </View>
              <Text style={styles.emptyTitle}>{t('screen.search.empty.title')}</Text>
              <Text style={styles.emptyText}>
                {t('screen.search.empty.description', { query })}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  countText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  content: {
    paddingTop: 16,
    paddingBottom: 36,
    backgroundColor: '#f6f8f6',
    flexGrow: 1,
  },
  freshRow: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  freshCard: { width: '48%', marginBottom: 16 },
  freshImage: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#eee' },
  wishBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freshName: { marginTop: 8, fontWeight: '700', color: '#111827', fontSize: 13 },
  freshMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  freshPrice: { color: '#16a34a', fontWeight: '800', fontSize: 14 },
  freshTime: { color: '#9ca3af', fontSize: 11 },
  categoryTag: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  categoryText: { fontSize: 10, color: '#6b7280', fontWeight: '600' },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
});
