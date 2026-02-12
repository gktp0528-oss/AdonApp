import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Keyboard, FlatList, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { searchService } from '../services/searchService';
import { Listing } from '../types/listing';

type Props = NativeStackScreenProps<RootStackParamList, 'QuerySearch'>;

type ViewMode = 'recents' | 'suggestions' | 'results';

export function QuerySearchScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('recents');

  // Data State
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<Listing[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Load recents on mount
  useEffect(() => {
    loadRecents();
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const loadRecents = async () => {
    const recents = await searchService.getRecentSearches();
    setRecentSearches(recents);
  };

  // Debounced suggestions fetch
  useEffect(() => {
    if (!query.trim()) {
      setViewMode('recents');
      setSuggestions([]);
      return;
    }

    // Only switch to suggestions if we are not currently viewing results 
    // OR if the user is typing (which implies they want suggestions)
    // We can detect "typing" by checking if viewMode is 'results' and query changed? 
    // Actually, simple rule: if query changes, we go back to suggestions unless it was a submit.
    // But we need to distinguish "query changed by typing" vs "query set by clicking suggestion".
    // For now, let's assume any text change means back to suggestions mode.
    if (viewMode === 'results') {
      // If we are in metrics result mode, we might want to stay there until user types?
      // But here query dependency triggers on every keystroke. 
      setViewMode('suggestions');
    }

    const timer = setTimeout(async () => {
      if (query.trim()) {
        const suggs = await searchService.getSuggestions(query);
        setSuggestions(suggs);
        if (viewMode !== 'results') {
          setViewMode('suggestions');
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (textOverride?: string) => {
    const searchText = textOverride ?? query;
    // Allow empty search to show "All Items"
    // if (!searchText.trim()) return;

    Keyboard.dismiss();
    setViewMode('results');
    setIsSearching(true);
    setQuery(searchText); // Ensure input matches what we searched

    try {
      await searchService.trackSearch(searchText);
      const searchResults = await searchService.searchListings(searchText);
      setResults(searchResults);
      await loadRecents(); // Refresh recents as we just added one
    } catch (error) {
      console.error('Search failed', error);
      Alert.alert('Search Error', 'Unable to fetch results. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setViewMode('recents');
    inputRef.current?.focus();
  };

  const handleKeywordPress = (keyword: string) => {
    // Determine source for analytics? For now just search.
    handleSearch(keyword);
  };

  const handleClearRecents = async () => {
    await searchService.clearRecentSearches();
    setRecentSearches([]);
  };

  const renderChip = (label: string, icon?: keyof typeof MaterialIcons.glyphMap) => (
    <Pressable key={label} style={styles.chip} onPress={() => handleKeywordPress(label)}>
      {icon ? <MaterialIcons name={icon} size={16} color="#6b7280" /> : null}
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );

  const renderSuggestionItem = ({ item }: { item: string }) => (
    <Pressable style={styles.keywordRow} onPress={() => handleKeywordPress(item)}>
      <MaterialIcons name="search" size={18} color="#9ca3af" />
      <Text style={styles.keywordText}>{item}</Text>
      <MaterialIcons name="north-west" size={16} color="#d1d5db" />
    </Pressable>
  );

  const renderResultItem = ({ item }: { item: Listing }) => (
    <Pressable
      style={styles.resultItem}
      onPress={() => {
        searchService.trackClick(query, item.id, 0); // TODO: Pass real index
        navigation.navigate('Product', {
          product: {
            id: item.id,
            name: item.title,
            price: item.price.toString(),
            image: item.photos?.[0] || '',
            description: item.description,
            sellerId: item.sellerId,
            isPremium: item.isPremium,
            oldPrice: item.oldPrice?.toString(),
            meta: `${item.condition} • ${item.category}`
          }
        });
      }}
    >
      <Image source={{ uri: item.photos?.[0] }} style={styles.resultImage} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.resultPrice}>{item.price} {item.currency}</Text>
        <Text style={styles.resultMeta}>{item.condition} • {item.category}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </Pressable>

        <View style={styles.inputContainer}>
          <MaterialIcons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={t('screen.home.searchPlaceholder', { defaultValue: 'Search Adon' })}
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch()}
          />
          {query.length > 0 ? (
            <Pressable onPress={clearQuery} style={styles.clearBtn}>
              <MaterialIcons name="close" size={16} color="#ffffff" />
            </Pressable>
          ) : null}
        </View>

        <Pressable style={styles.searchButton} onPress={() => handleSearch()}>
          <Text style={styles.searchButtonText}>{t('screen.home.search', { defaultValue: 'Search' })}</Text>
        </Pressable>
      </View>

      <View style={styles.container}>
        {/* State: Recents */}
        {viewMode === 'recents' && (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('screen.search.recent', { defaultValue: 'Recent' })}</Text>
              {recentSearches.length > 0 ? (
                <Pressable onPress={handleClearRecents}>
                  <Text style={styles.clearAll}>{t('common.action.clear', { defaultValue: 'Clear' })}</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.chipWrap}>
              {recentSearches.map((item) => renderChip(item, 'history'))}
            </View>
          </ScrollView>
        )}

        {/* State: Suggestions */}
        {viewMode === 'suggestions' && (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            renderItem={renderSuggestionItem}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
            ListEmptyComponent={
              query.trim().length > 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No related keywords found.</Text>
                </View>
              ) : null
            }
          />
        )}

        {/* State: Results */}
        {viewMode === 'results' && (
          isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#111827" />
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderResultItem}
              contentContainerStyle={styles.content}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No results found for "{query}"</Text>
                </View>
              }
            />
          )
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    height: '100%',
  },
  clearBtn: {
    backgroundColor: '#9ca3af',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  clearAll: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  keywordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  keywordText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center'
  },
  resultItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  resultMeta: {
    fontSize: 13,
    color: '#6b7280',
  }
});
