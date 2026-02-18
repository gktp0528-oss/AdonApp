import React from 'react';
import { StyleSheet, Text, View, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { RootStackParamList } from '../navigation/types';
import { notificationService, AdonNotification } from '../services/notificationService';
import { userService } from '../services/userService';
import { formatRelativeTime } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = React.useState<AdonNotification[]>([]);
    const [loading, setLoading] = React.useState(true);
    const userId = userService.getCurrentUserId();

    React.useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        // 인덱스 생성 중이거나 네트워크 지연 시 무한 로딩 방지를 위한 타임아웃
        const timeoutId = setTimeout(() => {
            if (loading) setLoading(false);
        }, 5000);

        const unsubscribe = notificationService.watchNotifications(
            userId,
            (data) => {
                clearTimeout(timeoutId);
                setNotifications(data);
                setLoading(false);
            },
            (err) => {
                clearTimeout(timeoutId);
                setLoading(false);
                const isIndexing = err.message?.includes('index') && err.message?.includes('building');
                if (isIndexing) {
                    console.warn('Index still building, showing empty state for now.');
                } else {
                    console.error('Watch notifications error:', err);
                }
            }
        );

        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [userId]);

    const handleNotiPress = (item: AdonNotification) => {
        if (!item.read && item.id) {
            notificationService.markAsRead(item.id);
        }

        if (item.data?.listingId) {
            navigation.navigate('Product', { listingId: item.data.listingId });
        }
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
                </Pressable>
                <Text style={styles.headerTitle}>{t('screen.notifications.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.keywordsBanner}>
                <View style={styles.bannerIcon}>
                    <MaterialIcons name="notifications-active" size={24} color="#16a34a" />
                </View>
                <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>{t('screen.keywords.title')}</Text>
                    <Text style={styles.bannerDesc}>{t('screen.keywords.description_short')}</Text>
                </View>
                <Pressable
                    onPress={() => navigation.navigate('Keywords')}
                    style={styles.bannerBtn}
                >
                    <Text style={styles.bannerBtnText}>{t('common.manage')}</Text>
                </Pressable>
            </View>

            <View style={[styles.keywordsBanner, { marginTop: 0 }]}>
                <View style={[styles.bannerIcon, { backgroundColor: '#eff6ff' }]}>
                    <MaterialIcons name="trending-down" size={24} color="#3b82f6" />
                </View>
                <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>{t('screen.priceDrop.title')}</Text>
                    <Text style={styles.bannerDesc}>{t('screen.priceDrop.description_short')}</Text>
                </View>
                <Pressable
                    onPress={() => navigation.navigate('Wishlist' as any)}
                    style={[styles.bannerBtn, { backgroundColor: '#3b82f6' }]}
                >
                    <Text style={styles.bannerBtnText}>{t('common.manage')}</Text>
                </Pressable>
            </View>

            {loading && (
                <View style={{ padding: 20 }}>
                    <ActivityIndicator color="#16a34a" />
                </View>
            )}

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id || ''}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <Pressable
                        style={[styles.notiItem, !item.read && styles.notiUnread]}
                        onPress={() => handleNotiPress(item)}
                    >
                        <View style={styles.notiIcon}>
                            <MaterialIcons
                                name={
                                    item.type === 'system' ? 'info' :
                                    item.type === 'keyword' ? 'notifications-active' :
                                    item.type === 'like' ? 'favorite' : 'trending-down'
                                }
                                size={20}
                                color={
                                    item.type === 'system' ? '#6b7280' :
                                    item.type === 'keyword' ? '#16a34a' :
                                    item.type === 'like' ? '#ef4444' : '#3b82f6'
                                }
                            />
                        </View>
                        <View style={styles.notiContent}>
                            <Text style={styles.notiTitle}>{item.title}</Text>
                            <Text style={styles.notiBody}>{item.body}</Text>
                            <Text style={styles.notiTime}>{formatRelativeTime(item.createdAt)}</Text>
                        </View>
                        {!item.read && <View style={styles.unreadDot} />}
                    </Pressable>
                )}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="notifications-none" size={48} color="#d1d5db" />
                            <Text style={styles.emptyText}>
                                {t('screen.notifications.empty')}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, paddingHorizontal: 40, textAlign: 'center' }}>
                                {t('screen.notifications.indexing_notice')}
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f9fafb' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    backBtn: { padding: 4 },
    keywordsBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 12,
    },
    bannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0fdf4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerContent: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    bannerDesc: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    bannerBtn: {
        backgroundColor: '#16a34a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    bannerBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    listContent: {
        paddingBottom: 20,
    },
    notiItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        alignItems: 'flex-start',
    },
    notiUnread: {
        backgroundColor: '#f0fdf4',
    },
    notiIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    notiContent: {
        flex: 1,
    },
    notiTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    notiBody: {
        fontSize: 14,
        color: '#4b5563',
        marginTop: 4,
    },
    notiTime: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 6,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#16a34a',
        marginLeft: 8,
        marginTop: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
    },
});
