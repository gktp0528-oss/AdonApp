import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { wishlistService, WishlistItem } from '../services/wishlistService';
import { userService } from '../services/userService';
import { listingService } from '../services/listingService';
import { Listing } from '../types/listing';
import { formatCurrency } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Wishlist'>;

export function WishlistScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [wishlist, setWishlist] = useState<(WishlistItem & { product?: Listing })[]>([]);

    useEffect(() => {
        loadWishlist();
    }, []);

    const loadWishlist = async () => {
        const userId = userService.getCurrentUserId();
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const items = await wishlistService.getWishlist(userId);
            const itemsWithDetails = await Promise.all(
                items.map(async (item) => {
                    const product = await listingService.getListingById(item.listingId);
                    return { ...item, product: product || undefined };
                })
            );
            setWishlist(itemsWithDetails.filter(i => i.product));
        } catch (error) {
            console.error('Failed to load wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLike = async (listingId: string, currentPrice: number) => {
        const userId = userService.getCurrentUserId();
        if (!userId) return;

        try {
            await wishlistService.toggleLike(userId, listingId, currentPrice);
            setWishlist((prev) => prev.filter((item) => item.listingId !== listingId));
        } catch (error) {
            console.error('Failed to toggle like:', error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.root, styles.center]}>
                <ActivityIndicator size="large" color="#22c55e" />
            </View>
        );
    }

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
                </Pressable>
                <Text style={styles.headerTitle}>{t('screen.priceDrop.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={wishlist}
                keyExtractor={(item) => item.id || item.listingId}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const product = item.product!;
                    return (
                        <Pressable
                            style={styles.itemCard}
                            onPress={() => navigation.navigate('Product', { listingId: product.id })}
                        >
                            <Image source={{ uri: product.photos?.[0] }} style={styles.image} />
                            <View style={styles.content}>
                                <Text style={styles.title} numberOfLines={1}>{product.title}</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.price}>{formatCurrency(product.price, product.currency)}</Text>
                                    {product.oldPrice && (
                                        <Text style={styles.oldPrice}>{formatCurrency(product.oldPrice, product.currency)}</Text>
                                    )}
                                </View>
                                {product.oldPrice && (
                                    <View style={styles.dropBadge}>
                                        <MaterialIcons name="trending-down" size={12} color="#16a34a" />
                                        <Text style={styles.dropText}>Price Dropped!</Text>
                                    </View>
                                )}
                            </View>
                            <Pressable
                                onPress={() => handleToggleLike(product.id, product.price)}
                                style={styles.likeBtn}
                            >
                                <MaterialIcons name="favorite" size={22} color="#ef4444" />
                            </Pressable>
                        </Pressable>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="favorite-border" size={48} color="#d1d5db" />
                        <Text style={styles.emptyText}>{t('screen.keywords.empty')}</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f9fafb' },
    center: { justifyContent: 'center', alignItems: 'center' },
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
    listContent: { padding: 16 },
    itemCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    image: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f3f4f6' },
    content: { flex: 1, marginLeft: 12 },
    title: { fontSize: 15, fontWeight: '600', color: '#111827' },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    price: { fontSize: 16, fontWeight: '700', color: '#111827' },
    oldPrice: { fontSize: 13, color: '#9ca3af', textDecorationLine: 'line-through' },
    likeBtn: { padding: 8 },
    dropBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 6,
        alignSelf: 'flex-start',
        gap: 4
    },
    dropText: { color: '#16a34a', fontSize: 11, fontWeight: '700' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 12, fontSize: 14, color: '#9ca3af', textAlign: 'center' },
});
