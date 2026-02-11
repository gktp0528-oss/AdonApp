import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, RefreshControl } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { resetToTab, TabKey } from '../navigation/tabRouting';
import { BottomTabMock } from '../components/BottomTabMock';
import { CATEGORIES, USERS } from '../data/mockData'; // Keeping basic mocks for static UI parts
import { listingService } from '../services/listingService';
import { Listing } from '../types/listing';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop';

function toRelativeTime(date?: any): string {
  if (!date) return 'just now';
  const d = date.toDate ? date.toDate() : new Date(date);
  const diffMin = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
}

export function HomeScreen({ navigation }: Props) {
  const me = USERS.me;
  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = listingService.watchLatestListings((listings) => {
      setActiveListings(listings);
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // watchLatestListings is real-time, but we can simulate a pull-to-refresh feel 
    // or re-establish connection if needed. For now just timeout.
    setTimeout(() => setRefreshing(false), 1000);
  };

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

        <Pressable
          style={styles.searchWrap}
          onPress={() => navigation.navigate('Search')}
        >
          <MaterialIcons name="search" size={20} color="#9ca3af" />
          <Text style={styles.searchTextPlaceholder}>Find clothes, decor, tech...</Text>
          <MaterialIcons name="tune" size={20} color="#6b7280" />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((cat, index) => (
          <View key={cat.id} style={[styles.chip, index === 0 && styles.chipActive]}>
            <Text style={index === 0 ? styles.chipActiveText : styles.chipText}>{cat.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* "Picked for you" Section - Currently hidden until personalized algo is ready, or shows subset of random items */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Fresh finds</Text>
        <Text style={styles.sectionTag}>JUST LANDED</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <FlatList
        data={activeListings}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.freshRow}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found. Be the first to post!</Text>
          </View>
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
              <Pressable style={styles.wishBtn}>
                <MaterialIcons name="favorite-border" size={18} color="#4b5563" />
              </Pressable>
            </View>
            <Text numberOfLines={1} style={styles.freshName}>{item.title}</Text>
            <View style={styles.freshMetaRow}>
              <Text style={styles.freshPrice}>
                {item.currency === 'USD' ? '$' : '€'}{item.price}
              </Text>
              <Text style={styles.freshTime}>{toRelativeTime(item.createdAt)}</Text>
            </View>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{item.category}</Text>
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
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchTextPlaceholder: { flex: 1, fontSize: 14, color: '#9ca3af' },
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
  emptyText: { color: '#94a3b8', fontSize: 16 }
});
