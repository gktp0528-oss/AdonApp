import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    // Mock notifications for now
    const notifications = [
        {
            id: '1',
            type: 'system',
            title: t('screen.notifications.welcome.title'),
            body: t('screen.notifications.welcome.body'),
            time: '2h',
            read: false,
        }
    ];

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

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={[styles.notiItem, !item.read && styles.notiUnread]}>
                        <View style={styles.notiIcon}>
                            <MaterialIcons
                                name={item.type === 'system' ? 'info' : 'notifications'}
                                size={20}
                                color="#6b7280"
                            />
                        </View>
                        <View style={styles.notiContent}>
                            <Text style={styles.notiTitle}>{item.title}</Text>
                            <Text style={styles.notiBody}>{item.body}</Text>
                            <Text style={styles.notiTime}>{item.time}</Text>
                        </View>
                        {!item.read && <View style={styles.unreadDot} />}
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="notifications-none" size={48} color="#d1d5db" />
                        <Text style={styles.emptyText}>{t('screen.notifications.empty')}</Text>
                    </View>
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
