import { Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DocumentSnapshot } from 'firebase/firestore';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { resetToTab, TabKey } from '../navigation/tabRouting';
import { TabTransitionView } from '../components/TabTransitionView';
import { CATEGORIES, USERS } from '../data/mockData';
import { listingService } from '../services/listingService';
import { wishlistService } from '../services/wishlistService';
import { userService } from '../services/userService';
import { Listing } from '../types/listing';
import { formatCurrency } from '../utils/format';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'HomeTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop';

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const me = USERS.me;
  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  const toCategoryKey = (value?: string) => {
    const v = (value || '').toLowerCase();
    if (v.includes('fashion')) return 'fashion';
    if (v.includes('tech') || v.includes('electronic')) return 'tech';
    if (v.includes('home') || v.includes('living')) return 'home';
    if (v.includes('kid') || v.includes('baby')) return 'kids';
    return null;
  };

  useEffect(() => {
    void loadInitialListings();

    const userId = userService.getCurrentUserId();
    if (userId) {
      const unsubscribeWishlist = wishlistService.watchWishlist(userId, (items) => {
        setWishlistIds(new Set(items.map(i => i.listingId)));
      });
      return () => unsubscribeWishlist();
    }
  }, []);

  const loadInitialListings = async () => {
    try {
      setInitialLoading(true);
      const { listings, lastDoc: nextLastDoc } = await listingService.getLatestListings();
      setActiveListings(listings);
      setLastDoc(nextLastDoc);
      setHasMore(Boolean(nextLastDoc) && listings.length >= 20);
    } catch (error) {
      console.error('Failed to load listings:', error);
      setActiveListings([]);
      setLastDoc(null);
      setHasMore(false);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  const loadMoreListings = async () => {
    if (loadingMore || !hasMore || !lastDoc || initialLoading) {
      return;
    }

    try {
      setLoadingMore(true);
      const { listings, lastDoc: nextLastDoc } = await listingService.getLatestListings(lastDoc);
      if (listings.length === 0) {
        setHasMore(false);
        return;
      }

      setActiveListings((prev) => {
        const existing = new Set(prev.map((item) => item.id));
        const appended = listings.filter((item) => !existing.has(item.id));
        return [...prev, ...appended];
      });
      setLastDoc(nextLastDoc);
      setHasMore(Boolean(nextLastDoc) && listings.length >= 20);
    } catch (error) {
      console.error('Failed to load more listings:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialListings();
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

  const handleTabPress = (tab: TabKey) => resetToTab(navigation, tab, 'home');
  const chips = [
    { id: 'all', label: t('screen.home.chip.all') },
    ...CATEGORIES.map((cat) => ({
      ...cat,
      label: t(`screen.home.category.${cat.id}`, cat.label),
    })),
  ];

  const filteredListings = selectedCategory === 'all'
    ? activeListings
    : activeListings.filter((item) => {
      // Simple fallback: check if category string includes the chip label or ID
      const cat = (item.category || '').toLowerCase();
      const label = chips.find(c => c.id === selectedCategory)?.label.toLowerCase() || '';
      return cat.includes(label) || cat.includes(selectedCategory);
    });

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        {/* Left side: Adon Text Logo */}
        <Text style={styles.headerLogoText}>Adon</Text>

        {/* Right side: Search & Notification */}
        <View style={styles.headerIcons}>
          <Pressable
            onPress={() => {
              console.log('Navigating to QuerySearch');
              navigation.navigate('QuerySearch');
            }}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={t('screen.home.searchPlaceholder')}
          >
            <MaterialIcons name="search" size={26} color="#111827" />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            style={styles.iconButton}
          >
            <MaterialIcons name="notifications" size={26} color="#111827" />
            <View style={styles.notify} />
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {chips.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
            onPress={() => setSelectedCategory(cat.id)}
            accessibilityRole="button"
            accessibilityLabel={`${cat.label}`}
          >
            <Text style={selectedCategory === cat.id ? styles.chipActiveText : styles.chipText}>{cat.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* "Picked for you" Section - Currently hidden until personalized algo is ready, or shows subset of random items */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{t('screen.home.section.new')}</Text>
        <Text style={styles.sectionTag}>{t('screen.home.section.justIn')}</Text>
      </View>
    </View>
  );



  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <TabTransitionView style={{ flex: 1 }}>
        <FlatList
          data={filteredListings}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.freshRow}
          ListHeaderComponent={renderHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreListings}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreWrap}>
                <ActivityIndicator size="small" color="#16a34a" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            initialLoading ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="small" color="#16a34a" />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {selectedCategory === 'all'
                    ? t('screen.home.empty.all')
                    : t('screen.home.empty.category')}
                </Text>
                <Pressable style={styles.emptyBtn} onPress={onRefresh}>
                  <Text style={styles.emptyBtnText}>{t('screen.home.refresh')}</Text>
                </Pressable>
              </View>
            )
          }
          renderItem={({ item }) => (
            <Pressable
              key={item.id}
              style={styles.freshCard}
              onPress={() => navigation.navigate('Product', { listingId: item.id })}
            >
              <View>
                <Image
                  source={{ uri: item.photos?.[0] || FALLBACK_IMAGE }}
                  style={styles.freshImage}
                />
                <Pressable
                  style={styles.wishBtn}
                  onPress={async () => {
                    const userId = userService.getCurrentUserId();
                    if (!userId) {
                      Alert.alert(t('common.loginRequired'), t('screen.product.chat.loginPrompt'));
                      return;
                    }
                    try {
                      await wishlistService.toggleLike(userId, item.id, item.price);
                    } catch (error) {
                      console.error('Failed to toggle like on home:', error);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={wishlistIds.has(item.id) ? t('screen.product.accessibility.unlike') : t('screen.product.accessibility.like')}
                >
                  <MaterialIcons
                    name={wishlistIds.has(item.id) ? "favorite" : "favorite-border"}
                    size={18}
                    color={wishlistIds.has(item.id) ? "#ef4444" : "#4b5563"}
                  />
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
          )}
        />
      </TabTransitionView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' }, // Changed to white for Status Bar match
  content: { paddingBottom: 110, backgroundColor: '#f6f8f6' }, // Moved gray background here
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLogoText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#064e3b', // Brand dark green from LoginScreen
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    position: 'relative',
    padding: 4,
  },
  // profileRow, avatar, greet, name, notifyWrap - Removed
  notify: {
    position: 'absolute',
    right: 4,
    top: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#fff'
  },
  // searchWrap, searchTextPlaceholder - Removed
  chips: { paddingHorizontal: 16, paddingTop: 16, gap: 8, paddingBottom: 8 },
  chip: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#19e61b', borderColor: '#19e61b' },
  chipText: { color: '#4b5563', fontWeight: '600', fontSize: 13 },
  chipActiveText: { color: '#111827', fontWeight: '800', fontSize: 13 },
  sectionHead: { marginTop: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: '#111827' },
  sectionTag: { marginTop: 3, fontSize: 10, fontWeight: '800', color: '#166534', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },

  freshRow: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  freshCard: { width: '48%', marginBottom: 12 },
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
  categoryTag: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  categoryText: { fontSize: 10, color: '#6b7280', fontWeight: '600' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 16 },
  loadingMoreWrap: { paddingVertical: 16 },
  emptyBtn: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  emptyBtnText: {
    fontWeight: '700',
    color: '#1f2937',
    fontSize: 13,
  },
});
