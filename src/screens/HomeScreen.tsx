import React from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { resetToTab, TabKey } from '../navigation/tabRouting';
import { BottomTabMock } from '../components/BottomTabMock';
import { PRODUCTS, USERS, CATEGORIES, fetchFreshFinds } from '../data/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const me = USERS.me;
  const [freshItems, setFreshItems] = React.useState<any[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);

  const loadMore = React.useCallback(async (isInitial = false) => {
    if (loading || (!isInitial && !cursor)) return;
    setLoading(true);
    try {
      const result = await fetchFreshFinds(isInitial ? null : cursor);
      setFreshItems(prev => isInitial ? result.items : [...prev, ...result.items]);
      setCursor(result.nextCursor);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      if (isInitial) setIsInitialLoading(false);
    }
  }, [cursor, loading]);

  React.useEffect(() => {
    loadMore(true);
  }, []);

  const handleTabPress = (tab: TabKey) => resetToTab(navigation, tab, 'home');

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Image source={{ uri: me.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.greet}>Good Morning,</Text>
            <Text style={styles.name}>{me.name}</Text>
          </View>
          <View style={styles.notifyWrap}>
            <MaterialIcons name="notifications" size={20} color="#4b5563" />
            <View style={styles.notify} />
          </View>
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="#9ca3af" />
          <TextInput style={styles.search} placeholder="Find clothes, decor, tech..." />
          <MaterialIcons name="tune" size={20} color="#6b7280" />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((cat, index) => (
          <View key={cat.id} style={[styles.chip, index === 0 && styles.chipActive]}>
            <Text style={index === 0 ? styles.chipActiveText : styles.chipText}>{cat.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Picked for you</Text>
        <Text style={styles.sectionTag}>AI CURATED</Text>
        <Pressable style={styles.seeAll}><Text style={styles.seeAllText}>See all</Text></Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickRow}>
        {PRODUCTS.map((item) => (
          <Pressable
            key={item.id}
            style={styles.pickCard}
            onPress={() => navigation.navigate('Product', { productId: item.id })}
          >
            <Image source={{ uri: item.image }} style={styles.pickImage} />
            <View style={styles.trustPill}>
              <MaterialIcons name="verified" size={12} color="#16a34a" />
              <Text style={styles.trustText}>Trusted</Text>
            </View>
            <View style={styles.pricePill}><Text style={styles.price}>{item.price}</Text></View>
            <Text numberOfLines={1} style={styles.pickName}>{item.name}</Text>
            <Text style={styles.pickMeta}>{item.meta}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Fresh finds</Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return <View style={{ height: 120 }} />;
    return (
      <View style={styles.footerLoader}>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <FlatList
        data={freshItems}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.freshRow}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable key={item.id} style={styles.freshCard}>
            <View>
              <Image source={{ uri: item.image }} style={styles.freshImage} />
              <Pressable style={styles.wishBtn}>
                <MaterialIcons name="favorite-border" size={18} color="#4b5563" />
              </Pressable>
            </View>
            <Text numberOfLines={1} style={styles.freshName}>{item.name}</Text>
            <View style={styles.freshMetaRow}>
              <Text style={styles.freshPrice}>{item.price}</Text>
              <Text style={styles.freshTime}>{item.time}</Text>
            </View>
          </Pressable>
        )}
      />
      <BottomTabMock active="home" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { paddingBottom: 110 },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ef',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  greet: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  name: { fontSize: 18, color: '#111827', fontWeight: '800' },
  notifyWrap: { marginLeft: 'auto' },
  notify: { position: 'absolute', right: 1, top: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  searchWrap: {
    backgroundColor: '#f2f5f2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  search: { flex: 1, fontSize: 14 },
  chips: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  chip: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#19e61b', borderColor: '#19e61b' },
  chipText: { color: '#4b5563', fontWeight: '600', fontSize: 13 },
  chipActiveText: { color: '#111827', fontWeight: '800', fontSize: 13 },
  sectionHead: { marginTop: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: '#111827' },
  sectionTag: { marginTop: 3, fontSize: 10, fontWeight: '800', color: '#166534', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  seeAll: { marginLeft: 'auto' },
  seeAllText: { color: '#166534', fontWeight: '700', fontSize: 13 },
  pickRow: { gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  pickCard: { width: 210 },
  pickImage: { width: 210, height: 252, borderRadius: 14 },
  trustPill: {
    position: 'absolute',
    right: 8,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trustText: { fontSize: 10, color: '#111827', fontWeight: '700' },
  pricePill: { position: 'absolute', left: 10, bottom: 52, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  price: { color: '#15803d', fontWeight: '800', fontSize: 12 },
  pickName: { marginTop: 8, fontWeight: '700', color: '#111827', fontSize: 14 },
  pickMeta: { marginTop: 2, color: '#6b7280', fontSize: 12 },
  freshGrid: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  freshRow: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  footerLoader: {
    paddingVertical: 20,
    paddingHorizontal: 16,
        paddingBottom: 130,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
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
});
