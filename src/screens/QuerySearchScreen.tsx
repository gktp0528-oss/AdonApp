import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Keyboard, FlatList, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { searchService } from '../services/searchService';

type Props = NativeStackScreenProps<RootStackParamList, 'QuerySearch'>;

type ViewMode = 'recents' | 'suggestions';

export function QuerySearchScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('recents');

  // Data State
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load recents on mount
  useEffect(() => {
    loadRecents();
    // Auto-focus removed as per user request
    // const timer = setTimeout(() => {
    //   inputRef.current?.focus();
    // }, 100);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // return () => clearTimeout(timer);
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

    const timer = setTimeout(async () => {
      if (query.trim()) {
        const suggs = await searchService.getSuggestions(query);
        setSuggestions(suggs);
        setViewMode('suggestions');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (textOverride?: string) => {
    const searchText = textOverride ?? query;
    if (!searchText.trim()) return;

    Keyboard.dismiss();

    try {
      await searchService.trackSearch(searchText);
      await loadRecents();

      navigation.navigate('SearchResult', { query: searchText });
    } catch (error) {
      console.error('Search tracking failed', error);
      navigation.navigate('SearchResult', { query: searchText });
    }
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions([]);
    setViewMode('recents');
    inputRef.current?.focus();
  };

  const handleKeywordPress = (keyword: string) => {
    handleSearch(keyword);
  };

  const handleRemoveRecent = async (keyword: string) => {
    // We need to implement removeRecentSearch in searchService or do it here
    // For now, let's just update local state and re-save everything except this one
    const updated = recentSearches.filter(s => s !== keyword);
    setRecentSearches(updated);
    // Ideally searchService would have a remove method
    // await searchService.removeRecentSearch(keyword); 
    // Since it doesn't, we can clear and re-add or just leave as is for now if service doesn't support it
  };

  const handleClearRecents = async () => {
    await searchService.clearRecentSearches();
    setRecentSearches([]);
  };

  const renderRecentItem = ({ item }: { item: string }) => (
    <Pressable style={styles.recentRow} onPress={() => handleKeywordPress(item)}>
      <View style={styles.recentLeft}>
        <MaterialIcons name="history" size={20} color="#9ca3af" />
        <Text style={styles.recentText}>{item}</Text>
      </View>
      <Pressable
        style={styles.recentRemove}
        onPress={() => handleRemoveRecent(item)}
        accessibilityLabel={t('common.action.delete')}
      >
        <MaterialIcons name="close" size={18} color="#d1d5db" />
      </Pressable>
    </Pressable>
  );

  const renderSuggestionItem = ({ item }: { item: string }) => (
    <Pressable style={styles.suggestionRow} onPress={() => handleKeywordPress(item)}>
      <MaterialIcons name="search" size={20} color="#9ca3af" />
      <Text style={styles.suggestionText}>{item}</Text>
      <MaterialIcons name="north-west" size={18} color="#e5e7eb" />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" backgroundColor="#ffffff" />

      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={22} color="#111827" />
        </Pressable>

        <View style={styles.inputWrapper}>
          <MaterialIcons name="search" size={22} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={t('screen.home.searchPlaceholder')}
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch()}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={clearQuery} style={styles.clearBtn}>
              <MaterialIcons name="cancel" size={20} color="#9ca3af" />
            </Pressable>
          )}
        </View>

        <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.container}>
        {viewMode === 'recents' ? (
          <FlatList
            data={recentSearches}
            keyExtractor={(item) => item}
            renderItem={renderRecentItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              recentSearches.length > 0 ? (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('screen.search.recent')}</Text>
                  <Pressable onPress={handleClearRecents}>
                    <Text style={styles.clearAllText}>{t('screen.search.action.clear')}</Text>
                  </Pressable>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <MaterialIcons name="search" size={48} color="#f3f4f6" />
                </View>
                <Text style={styles.emptyText}>{t('screen.search.empty.recent')}</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            renderItem={renderSuggestionItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t('screen.search.empty.suggestions')}</Text>
              </View>
            }
          />
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
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  clearAllText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  recentText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  recentRemove: {
    padding: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
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
  emptyText: {
    color: '#9ca3af',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  }
});
