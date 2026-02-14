import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View, ActivityIndicator, useWindowDimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { DetailBackButton } from '../components/DetailBackButton';
import { MapComponent } from '../components/MapComponent';
import { listingService } from '../services/listingService';
import { userService } from '../services/userService';
import { chatService } from '../services/chatService';
import { Listing } from '../types/listing';
import { User } from '../types/user';
import { formatCurrency, formatDate } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Product'>;

export function ProductScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const toCategoryKey = (value?: string) => {
    const v = (value || '').toLowerCase();
    if (v.includes('fashion')) return 'fashion';
    if (v.includes('tech') || v.includes('electronic')) return 'tech';
    if (v.includes('home') || v.includes('living')) return 'home';
    if (v.includes('kid') || v.includes('baby')) return 'kids';
    return null;
  };

  const toConditionLabel = (condition: string) => {
    const map: Record<string, string> = {
      New: 'new',
      'Like New': 'likeNew',
      Good: 'good',
      Fair: 'fair',
    };
    const key = map[condition];
    return key ? t(`common.condition.${key}`) : condition;
  };

  // Params
  const { listingId, productId, product: paramProduct } = route.params || {};
  const targetId = listingId || productId || paramProduct?.id;

  // State
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isChatStarting, setIsChatStarting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      setError(t('screen.product.error.idMissing'));
      return;
    }

    // Subscribe to listing updates
    const unsubscribeListing = listingService.watchListingById(targetId, (data) => {
      setListing(data);
      setLoading(false);

      if (!data) {
        setError(t('screen.product.error.notFound'));
      } else {
        setError(null);
      }
    });

    return () => unsubscribeListing();
  }, [targetId, retryCount, t]);

  // Fetch seller info when listing is loaded
  useEffect(() => {
    if (listing?.sellerId) {
      const unsubscribeUser = userService.watchUserById(listing.sellerId, (userData) => {
        setSeller(userData);
      });
      return () => unsubscribeUser();
    }
  }, [listing?.sellerId]);

  // Loading State
  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  // Error/Empty State
  if (!listing) {
    return (
      <View style={[styles.root, styles.center]}>
        <MaterialIcons name="error-outline" size={48} color="#94a3b8" />
        <Text style={styles.errorText}>{error || t('screen.product.error.load')}</Text>
        <View style={styles.errorBtnRow}>
          <Pressable style={styles.retryBtn} onPress={() => setRetryCount((prev) => prev + 1)}>
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </Pressable>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>{t('screen.product.action.back')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Display Logic
  const priceDisplay = formatCurrency(listing.price, listing.currency);

  const images = listing.photos?.length
    ? listing.photos.map(uri => ({ uri }))
    : [{ uri: 'https://via.placeholder.com/400' }];

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setCurrentImageIndex(roundIndex);
  };

  const handleShareListing = async () => {
    try {
      await Share.share({
        message: `${listing.title} - ${priceDisplay}`,
      });
    } catch {
      Alert.alert(t('common.error'), t('screen.profile.shareErrorMessage'));
    }
  };

  const listingDate = listing.createdAt?.toDate ? listing.createdAt.toDate() : new Date();

  const handleStartChat = async () => {
    const currentUserId = userService.getCurrentUserId();

    if (!currentUserId) {
      Alert.alert(
        t('common.loginRequired') || 'Login Required',
        t('screen.product.chat.loginPrompt') || 'Please login to start a chat.',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('common.login') || 'Login',
            onPress: () => navigation.navigate('Login' as any)
          },
        ]
      );
      return;
    }

    if (!listing.sellerId) {
      Alert.alert(t('common.error'), t('screen.product.chat.error'));
      return;
    }
    if (currentUserId === listing.sellerId) {
      Alert.alert(
        t('common.info', 'Info'),
        t('screen.product.chat.ownListing', '내 상품에는 채팅을 시작할 수 없어요.')
      );
      return;
    }

    setIsChatStarting(true);
    try {
      const conversationId = await chatService.getOrCreateConversation(
        currentUserId,
        listing.sellerId,
        {
          id: listing.id,
          title: listing.title,
          photo: listing.photos?.[0] || '',
        },
      );
      navigation.navigate('Chat', { conversationId });
    } catch (error) {
      console.error('Failed to start chat:', error);
      Alert.alert(
        t('common.error'),
        `${t('screen.product.chat.error')}\n${(error as any)?.code ? `(${(error as any).code})` : ''}`
      );
    } finally {
      setIsChatStarting(false);
    }
  };

  const handleBuyNow = () => {
    if (!listing) return;

    const currentUserId = userService.getCurrentUserId();
    if (currentUserId === listing.sellerId) {
      Alert.alert(
        t('common.info') || 'Info',
        t('screen.product.action.ownListing') || 'You cannot buy your own product.'
      );
      return;
    }

    console.log('--- Handle Buy Now Clicked ---');
    console.log('Listing ID:', listing.id);
    console.log('Seller ID:', listing.sellerId);

    navigation.navigate('Payment', {
      listingId: listing.id,
      sellerId: listing.sellerId!,
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            renderItem={({ item, index }) => (
              <Pressable onPress={() => {
                setCurrentImageIndex(index);
                setIsViewerVisible(true);
              }}>
                <Image
                  source={{ uri: item.uri }}
                  style={[styles.hero, { width: screenWidth }]}
                  contentFit="cover"
                  transition={200}
                />
              </Pressable>
            )}
            keyExtractor={(_, index) => index.toString()}
          />

          <ImageViewing
            images={images}
            imageIndex={currentImageIndex}
            visible={isViewerVisible}
            onRequestClose={() => setIsViewerVisible(false)}
            swipeToCloseEnabled={true}
            doubleTapToZoomEnabled={true}
          />

          <View style={[styles.topActions, { top: insets.top + 12 }]}>
            <DetailBackButton onPress={() => navigation.goBack()} />
            <View style={styles.rightActions}>
              <Pressable
                style={styles.iconCircle}
                onPress={handleShareListing}
                accessibilityRole="button"
                accessibilityLabel={t('screen.product.accessibility.share')}
              >
                <MaterialIcons name="share" size={18} color="#0f172a" />
              </Pressable>
              <Pressable
                style={styles.iconCircle}
                onPress={() => setLiked((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={liked ? t('screen.product.accessibility.unlike') : t('screen.product.accessibility.like')}
              >
                <MaterialIcons name={liked ? 'favorite' : 'favorite-border'} size={18} color={liked ? '#ef4444' : '#0f172a'} />
              </Pressable>
            </View>
          </View>

          {(listing.isVerifiedAuthentic) && (
            <View style={styles.authWrap}>
              <View style={styles.authPill}>
                <MaterialIcons name="verified" size={14} color="#22c55e" />
                <Text style={styles.authText}>{t('screen.product.auth')}</Text>
              </View>
            </View>
          )}

          {/* Pagination dots if multiple photos */}
          {listing.photos.length > 1 && (
            <View style={[styles.authWrap, { justifyContent: 'center', bottom: 10 }]}>
              <View style={styles.dots}>
                {listing.photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === currentImageIndex && styles.dotActive]} />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{listing.title}</Text>
            {listing.isPremium && <Text style={styles.premium}>{t('screen.product.premium')}</Text>}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{priceDisplay}</Text>
            {listing.oldPrice && <Text style={styles.oldPrice}>{formatCurrency(listing.oldPrice, listing.currency)}</Text>}
          </View>

          <View style={styles.safeBox}>
            <MaterialIcons name="verified-user" size={16} color="#22c55e" />
            <Text style={styles.safeText}>{t('screen.product.safePay')}</Text>
          </View>

          {/* Seller Card */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerTop}>
              <View style={styles.sellerLeft}>
                <Image
                  source={{ uri: seller?.avatar || 'https://via.placeholder.com/100' }}
                  style={styles.avatar}
                />
                <View style={styles.sellerTextWrap}>
                  <Text style={styles.sellerName}>{seller?.name || t('screen.product.seller.unknown')}</Text>
                  <Text style={styles.sellerMeta}>
                    {seller?.positiveRate
                      ? t('screen.product.seller.positive', { rate: seller.positiveRate })
                      : t('screen.product.seller.new')}
                    {' · '}
                    {seller?.sales
                      ? t('screen.product.seller.sales', { count: seller.sales })
                      : t('screen.product.seller.sales', { count: 0 })}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.followBtn}
                onPress={() => setFollowing((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={following ? t('screen.product.accessibility.unfollow') : t('screen.product.accessibility.follow')}
              >
                <Text style={styles.followText}>{following ? t('screen.product.seller.following') : t('screen.product.seller.follow')}</Text>
              </Pressable>
            </View>

            <View style={styles.trustRow}>
              <View style={styles.trustCard}>
                <Text style={styles.trustLabel}>{t('screen.product.trust.response')}</Text>
                <Text style={styles.trustValue}>{seller?.responseTime || '-'}</Text>
              </View>
              <View style={styles.trustCard}>
                <Text style={styles.trustLabel}>{t('screen.product.trust.reliability')}</Text>
                <Text style={styles.trustValue}>{seller?.reliabilityLabel || '-'}</Text>
              </View>
            </View>
          </View>

          {/* Specs */}
          <View style={styles.specGrid}>
            <View style={styles.specCol}>
              <Text style={styles.specKey}>{t('screen.product.spec.category')}</Text>
              <Text style={styles.specValue}>
                {toCategoryKey(listing.category)
                  ? t(`screen.home.category.${toCategoryKey(listing.category)}`)
                  : listing.category}
              </Text>
            </View>
            <View style={styles.specCol}>
              <Text style={styles.specKey}>{t('screen.product.spec.condition')}</Text>
              <View style={styles.inlineValue}>
                <Text style={styles.specValue}>{toConditionLabel(listing.condition)}</Text>
                <View style={[styles.colorDot, { backgroundColor: '#22c55e' }]} />
              </View>
            </View>
            {listing.brand && (
              <View style={styles.specCol}>
                <Text style={styles.specKey}>{t('screen.product.spec.brand')}</Text>
                <Text style={styles.specValue}>{listing.brand}</Text>
              </View>
            )}
            {listing.size && (
              <View style={styles.specCol}>
                <Text style={styles.specKey}>{t('screen.product.spec.size')}</Text>
                <Text style={styles.specValue}>{listing.size}</Text>
              </View>
            )}
            {listing.colorName && (
              <View style={styles.specCol}>
                <Text style={styles.specKey}>{t('screen.product.spec.color')}</Text>
                <View style={styles.inlineValue}>
                  <Text style={styles.specValue}>{listing.colorName}</Text>
                  {listing.colorHex && <View style={[styles.colorDot, { backgroundColor: listing.colorHex }]} />}
                </View>
              </View>
            )}
            <View style={styles.specCol}>
              <Text style={styles.specKey}>{t('screen.product.spec.date')}</Text>
              <Text style={styles.specValue}>{listingDate ? formatDate(listingDate) : ''}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>{t('screen.product.desc.title')}</Text>
          <Text style={styles.desc}>
            {listing.description || t('screen.product.desc.empty')}
          </Text>

          {/* Shipping & Location (Static/Placeholder for now as per schema optional) */}
          <Text style={[styles.sectionTitle, styles.sectionGap]}>{t('screen.product.location.title')}</Text>
          <View style={styles.locationHead}>
            <Text style={styles.locationText}>{seller?.location || t('screen.product.location.private')}</Text>
          </View>

          <View style={{ marginTop: 10 }}>
            <MapComponent
              latitude={listing.pickupLocation?.latitude}
              longitude={listing.pickupLocation?.longitude}
              height={180}
            />
          </View>

        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={styles.chatBtn}
          onPress={handleStartChat}
          disabled={isChatStarting}
          accessibilityRole="button"
          accessibilityLabel={t('screen.product.action.chat')}
        >
          {isChatStarting ? (
            <ActivityIndicator size="small" color="#1f2937" />
          ) : (
            <MaterialIcons name="chat-bubble-outline" size={22} color="#1f2937" />
          )}
        </Pressable>
        <Pressable
          style={styles.buyBtn}
          onPress={handleBuyNow}
          accessibilityRole="button"
          accessibilityLabel={t('screen.product.action.buy')}
        >
          <MaterialIcons name="shopping-bag" size={18} color="#ffffff" />
          <Text style={styles.buyText}>{t('screen.product.action.buy')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f4f3' },
  content: { paddingBottom: 140 },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { marginTop: 16, fontSize: 16, color: '#64748b', marginBottom: 20 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#0f172a', borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: 'bold' },
  errorBtnRow: { flexDirection: 'row', gap: 8 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  retryBtnText: { color: '#0f172a', fontWeight: '700' },

  heroWrap: { position: 'relative' },
  hero: { width: '100%', height: 500, backgroundColor: '#d6c79b' },
  topActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  rightActions: { flexDirection: 'row', gap: 8 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20,20,20,0.72)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  authText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center', alignSelf: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.62)' },
  dotActive: { width: 26, borderRadius: 999, backgroundColor: '#22c55e' },

  body: {
    marginTop: -4,
    backgroundColor: '#f5f6f5',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, fontSize: 44 / 2, fontWeight: '900', color: '#0f172a', lineHeight: 31 },
  premium: {
    marginTop: 4,
    color: '#22c55e',
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: '800',
    fontSize: 11,
  },
  priceRow: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  price: { fontSize: 48 / 2, fontWeight: '900', color: '#111827' },
  oldPrice: { fontSize: 16, color: '#94a3b8', textDecorationLine: 'line-through', marginBottom: 3 },

  safeBox: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eafaf0',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  safeText: { color: '#16a34a', fontWeight: '700' },

  sellerCard: {
    marginTop: 14,
    backgroundColor: '#eef1ef',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  sellerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sellerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#ccc' },
  sellerTextWrap: { flex: 1 },
  sellerName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  sellerMeta: { marginTop: 2, color: '#16a34a', fontWeight: '700', fontSize: 13 },
  followBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  followText: { color: '#0f172a', fontWeight: '700' },
  trustRow: { marginTop: 10, flexDirection: 'row', gap: 8 },
  trustCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    alignItems: 'center',
  },
  trustLabel: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  trustValue: { marginTop: 4, fontSize: 14, color: '#0f172a', fontWeight: '700' },

  specGrid: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap' },
  specCol: { width: '50%', marginBottom: 14 },
  specKey: { color: '#94a3b8', fontSize: 14 },
  specValue: { marginTop: 2, color: '#111827', fontSize: 16, fontWeight: '600' },
  inlineValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorDot: { width: 9, height: 9, borderRadius: 4.5, marginTop: 3 },

  divider: { height: 1, backgroundColor: '#e5e7eb', marginBottom: 14, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  desc: { marginTop: 10, color: '#475569', lineHeight: 25, fontSize: 16 },
  readMore: { marginTop: 8, color: '#22c55e', fontWeight: '800', fontSize: 16 },

  sectionGap: { marginTop: 18 },
  shipCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#dbe2e8',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shipCardActive: {
    borderColor: '#86efac',
    backgroundColor: '#ecfdf3',
  },
  shipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eef2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipIconWrapActive: { backgroundColor: '#d1fae5' },
  shipTextWrap: { flex: 1 },
  shipTitle: { fontSize: 21 / 2, fontWeight: '800', color: '#0f172a' },
  shipMeta: { marginTop: 2, fontSize: 12, color: '#64748b' },
  shipPrice: { fontWeight: '800', color: '#111827', fontSize: 22 / 2 },
  shipPriceFree: { fontWeight: '800', color: '#16a34a', fontSize: 22 / 2 },

  locationHead: { marginTop: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationText: { color: '#94a3b8', fontSize: 15 },


  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'rgba(245,246,245,0.98)',
  },
  chatBtn: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtn: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buyText: { color: '#fff', fontSize: 26 / 2, fontWeight: '800' },
});
