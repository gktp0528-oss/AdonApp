import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { resetToTab, TabKey } from '../navigation/tabRouting';
import { BottomTabMock } from '../components/BottomTabMock';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

interface ChatPreview {
  id: string;
  userName: string;
  lastMessage: string;
  time: string;
  avatar: string;
  unreadCount: number;
  productImage?: string;
  status?: 'online' | 'offline' | 'away';
}

const mockChats: ChatPreview[] = [
  {
    id: '1',
    userName: 'Elena Schmidt',
    lastMessage: 'Is the price negotiable?',
    time: '2m',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    unreadCount: 2,
    productImage: 'https://images.unsplash.com/photo-1585123334904-845d60e97b29?w=100',
    status: 'online',
  },
  {
    id: '2',
    userName: 'Marcus Weber',
    lastMessage: 'I would like to pick it up tomorrow.',
    time: '1h',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    unreadCount: 0,
    productImage: 'https://images.unsplash.com/photo-1611186871348-b1ec696e52c9?w=100',
    status: 'away',
  },
  {
    id: '3',
    userName: 'Sophie Martin',
    lastMessage: 'Thanks! The item is great.',
    time: '3h',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    unreadCount: 0,
    status: 'offline',
  },
];

export function ChatListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabPress = (tab: TabKey) => resetToTab(navigation, tab, 'chat');

  const filteredChats = mockChats.filter((chat) => {
    const matchesFilter = filter === 'all' || chat.unreadCount > 0;
    const matchesSearch = chat.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderItem = ({ item }: { item: ChatPreview }) => (
    <Pressable
      style={styles.chatCard}
      onPress={() => navigation.navigate('Chat')}
      accessibilityRole="button"
    >
      <View style={styles.avatarWrap}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.status === 'online' && <View style={styles.statusDot} />}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={[styles.lastMsg, item.unreadCount > 0 && styles.lastMsgUnread]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {item.productImage && (
        <Image source={{ uri: item.productImage }} style={styles.productThumb} />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('chat.title')}</Text>
          <Pressable style={styles.iconBtn}>
            <MaterialIcons name="settings" size={24} color="#1f2937" />
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('chat.searchPlaceholder')}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              {t('chat.allConversations')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filter === 'unread' && styles.filterChipActive]}
            onPress={() => setFilter('unread')}
          >
            {mockChats.some(c => c.unreadCount > 0) && <View style={styles.unreadDot} />}
            <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
              {t('chat.unreadOnly')}
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredChats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialIcons name="chat-bubble-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>{t('chat.noConversations')}</Text>
          </View>
        }
      />

      <BottomTabMock active="chat" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  iconBtn: { padding: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#111827',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  filterTextActive: {
    color: '#fff',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  listContent: {
    paddingVertical: 8,
  },
  chatCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatInfo: {
    flex: 1,
    marginRight: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  time: {
    fontSize: 12,
    color: '#6b7280',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMsg: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  lastMsgUnread: {
    color: '#111827',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#111827',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  productThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '600',
  },
});
