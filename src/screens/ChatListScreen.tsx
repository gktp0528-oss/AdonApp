import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { TabTransitionView } from '../components/TabTransitionView';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { Conversation } from '../types/chat';
import { User } from '../types/user';

type Props = CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, 'ChatTab'>,
    NativeStackScreenProps<RootStackParamList>
>;

export default function ChatListScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const currentUserId = userService.getCurrentUserId();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [userCache, setUserCache] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Watch conversations
    useEffect(() => {
        const unsub = chatService.watchConversations(currentUserId, (convs) => {
            setConversations(convs);
            setLoading(false);
        });
        return () => unsub();
    }, [currentUserId]);

    // Watch user profiles for the other participant in each conversation
    useEffect(() => {
        const otherUserIds = conversations
            .map((c) => c.participants.find((p) => p !== currentUserId))
            .filter((id): id is string => !!id);

        const uniqueIds = [...new Set(otherUserIds)];

        const unsubs = uniqueIds.map((uid) => {
            return userService.watchUserById(uid, (user) => {
                if (user) {
                    setUserCache((prev) => ({ ...prev, [uid]: user }));
                }
            });
        });

        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, [conversations, currentUserId]);

    const toRelativeTime = (timestamp: any): string => {
        if (!timestamp?.toDate) return '';
        const diff = Date.now() - timestamp.toDate().getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return t('common.time.justNow');
        if (minutes < 60) return t('common.time.ago.m', { count: minutes });
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return t('common.time.ago.h', { count: hours });
        return t('common.time.ago.d', { count: Math.floor(hours / 24) });
    };

    const filteredConversations = useMemo(() => {
        const q = keyword.trim().toLowerCase();
        if (!q) return conversations;
        return conversations.filter((conv) => {
            const otherUserId = conv.participants.find((p) => p !== currentUserId) || '';
            const otherUser = userCache[otherUserId];
            const name = otherUser?.name || '';
            return (
                name.toLowerCase().includes(q) ||
                conv.lastMessage.toLowerCase().includes(q) ||
                conv.listingTitle.toLowerCase().includes(q)
            );
        });
    }, [keyword, conversations, currentUserId, userCache]);

    const enterSelectMode = (id?: string) => {
        setIsSelectMode(true);
        if (id) setSelectedIds(new Set([id]));
    };

    const exitSelectMode = () => {
        setIsSelectMode(false);
        setSelectedIds(new Set());
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleDeleteSelected = () => {
        const count = selectedIds.size;
        if (count === 0) return;
        Alert.alert(
            t('common.confirm.delete.title', { defaultValue: 'Delete Chats' }),
            t('screen.chat.delete.multi.message', { count, defaultValue: `Delete ${count} conversation(s)?` }),
            [
                { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
                {
                    text: t('common.delete', { defaultValue: 'Delete' }),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await Promise.all(
                                [...selectedIds].map((id) =>
                                    chatService.deleteConversation(id, currentUserId!)
                                )
                            );
                            exitSelectMode();
                        } catch (error) {
                            Alert.alert(t('common.error', { defaultValue: 'Error' }), t('screen.chat.delete.error', { defaultValue: 'Failed to delete chat.' }));
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.root} edges={['top']}>
            <TabTransitionView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('screen.chat.title')}</Text>
                    {isSelectMode ? (
                        <View style={styles.selectActions}>
                            {selectedIds.size > 0 && (
                                <Pressable style={styles.deleteButton} onPress={handleDeleteSelected}>
                                    <Text style={styles.deleteButtonText}>
                                        {t('screen.chat.button.delete')} ({selectedIds.size})
                                    </Text>
                                </Pressable>
                            )}
                            <Pressable style={styles.cancelButton} onPress={exitSelectMode}>
                                <Text style={styles.cancelButtonText}>
                                    {t('screen.chat.button.cancel')}
                                </Text>
                            </Pressable>
                        </View>
                    ) : (
                        <Pressable style={styles.selectButton} onPress={() => enterSelectMode()}>
                            <Text style={styles.selectButtonText}>
                                {t('screen.chat.button.select')}
                            </Text>
                        </Pressable>
                    )}
                </View>

                <View style={styles.searchWrap}>
                    <MaterialIcons name="search" size={18} color="#9ca3af" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('screen.chat.placeholder')}
                        placeholderTextColor="#6b7280"
                        value={keyword}
                        onChangeText={setKeyword}
                    />
                </View>

                {loading ? (
                    <View style={styles.emptyWrap}>
                        <ActivityIndicator size="large" color="#22c55e" />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                        {filteredConversations.map((conv) => {
                            const otherUserId = conv.participants.find((p) => p !== currentUserId) || '';
                            const meta = conv.participantsMetadata?.[otherUserId];
                            const otherUser = userCache[otherUserId];

                            const displayName = meta?.name || otherUser?.name || '...';
                            const displayAvatar = meta?.avatar || otherUser?.avatar || 'https://via.placeholder.com/100';

                            const unreadCount = conv.unreadCount?.[currentUserId] || 0;
                            const hasUnread = unreadCount > 0;
                            const isOnline = otherUser?.isOnline;
                            const isSelected = selectedIds.has(conv.id);

                            return (
                                <Pressable
                                    key={conv.id}
                                    style={[styles.row, isSelected && styles.rowSelected]}
                                    onPress={() => {
                                        if (isSelectMode) {
                                            toggleSelect(conv.id);
                                        } else {
                                            navigation.navigate('Chat', { conversationId: conv.id });
                                        }
                                    }}
                                    onLongPress={() => {
                                        if (!isSelectMode) enterSelectMode(conv.id);
                                    }}
                                    accessibilityRole="button"
                                    accessibilityLabel={t('screen.chat.accessibility.openThread', { name: displayName })}
                                >
                                    {isSelectMode && (
                                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                            {isSelected && <MaterialIcons name="check" size={14} color="#fff" />}
                                        </View>
                                    )}
                                    <View>
                                        <Image
                                            source={{ uri: displayAvatar }}
                                            style={styles.avatar}
                                        />
                                        {isOnline ? <View style={styles.onlineDot} /> : null}
                                    </View>
                                    <View style={styles.textWrap}>
                                        <View style={styles.rowTop}>
                                            <Text style={styles.name}>{displayName}</Text>
                                            <Text style={styles.time}>{toRelativeTime(conv.lastMessageAt)}</Text>
                                        </View>
                                        <Text numberOfLines={1} style={[styles.message, hasUnread && styles.messageUnread]}>
                                            {conv.lastMessage || conv.listingTitle}
                                        </Text>
                                    </View>
                                    {!isSelectMode && hasUnread ? <View style={styles.unreadDot} /> : null}
                                </Pressable>
                            );
                        })}
                        {filteredConversations.length === 0 && !loading ? (
                            <View style={styles.emptyWrap}>
                                <Text style={styles.emptyText}>{t('screen.chat.empty')}</Text>
                            </View>
                        ) : null}
                    </ScrollView>
                )}
            </TabTransitionView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f6f8f6' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
    },
    title: { fontSize: 32, fontWeight: '800', color: '#064e3b' },
    selectButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    selectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    selectActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deleteButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#fee2e2',
        borderWidth: 1,
        borderColor: '#fca5a5',
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#dc2626',
    },
    cancelButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    searchWrap: {
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        height: 46,
    },
    searchInput: { flex: 1, fontSize: 14 },
    list: { paddingHorizontal: 16, paddingBottom: 120 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#edf2ed',
        paddingVertical: 14,
    },
    rowSelected: {
        backgroundColor: '#f0fdf4',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    checkboxSelected: {
        backgroundColor: '#22c55e',
        borderColor: '#22c55e',
    },
    avatar: { width: 56, height: 56, borderRadius: 28 },
    onlineDot: {
        position: 'absolute',
        right: 2,
        bottom: 1,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#19e61b',
        borderWidth: 2,
        borderColor: '#fff',
    },
    textWrap: { flex: 1 },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, gap: 8 },
    name: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
    time: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
    message: { fontSize: 13, color: '#6b7280' },
    messageUnread: { color: '#111827', fontWeight: '600' },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#19e61b',
    },
    emptyWrap: {
        paddingVertical: 48,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
});
