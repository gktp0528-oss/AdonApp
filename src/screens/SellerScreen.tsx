import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { resetToTab, TabKey } from '../navigation/tabRouting';
import { PrimaryButton } from '../components/PrimaryButton';
import { DetailBackButton } from '../components/DetailBackButton';
import { TabTransitionView } from '../components/TabTransitionView';
import { StarRating } from '../components/StarRating';
import { userService } from '../services/userService';
import { listingService } from '../services/listingService';
import { User } from '../types/user';
import { Listing } from '../types/listing';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'ProfileTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function SellerScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const handleTabPress = (tab: TabKey) => resetToTab(navigation, tab, 'profile');

  // Params - Default to current user if no param (mock current user ID)
  const sellerId = route.params?.sellerId || userService.getCurrentUserId();

  const [seller, setSeller] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    const unsubscribeUser = userService.watchUserById(sellerId, (userData) => {
      setSeller(userData);
      setLoading(false);
      if (!userData) {
        setLoadError(t('screen.profile.loadError'));
      }
    });
    const unsubscribeListings = listingService.watchListingsBySeller(sellerId, (userListings) => {
      setListings(userListings);
    });

    return () => {
      unsubscribeUser();
      unsubscribeListings();
    };
  }, [sellerId, retryCount]);

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!seller) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.errorTitle}>{loadError || t('screen.profile.loadError')}</Text>
        <Pressable style={styles.retryBtn} onPress={() => setRetryCount((prev) => prev + 1)}>
          <Text style={styles.retryText}>{t('screen.profile.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: t('screen.profile.shareMessage', { name: seller.name }),
      });
    } catch {
      Alert.alert(t('screen.profile.shareErrorTitle'), t('screen.profile.shareErrorMessage'));
    }
  };

  return (
    <View style={styles.root}>
      <TabTransitionView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.headerContainer}>
            <Image
              source={{ uri: seller.coverImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80' }}
              style={styles.cover}
            />
            <View style={styles.coverOverlay} />

            {/* Back Button */}
            <View style={[styles.backButton, { top: insets.top + 14 }]}>
              {route.params?.sellerId && navigation.canGoBack() && (
                <DetailBackButton onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  }
                }} />
              )}
            </View>

            {/* Settings Button - Only for current user's profile */}
            {sellerId === userService.getCurrentUserId() && (
              <Pressable
                style={[styles.settingsButton, { top: insets.top + 14 }]}
                onPress={() => navigation.navigate('Settings')}
                accessibilityRole="button"
                accessibilityLabel={t('screen.profile.settings')}
              >
                <View style={styles.settingsButtonInner}>
                  <MaterialIcons name="settings" size={22} color="#1f2937" />
                </View>
              </Pressable>
            )}

            {/* Centered Avatar Overlapping */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBorder}>
                <Image
                  source={{ uri: seller.avatar || 'https://via.placeholder.com/200' }}
                  style={styles.avatar}
                />
              </View>
              {seller.isVerified && (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={16} color="#fff" />
                </View>
              )}
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameSection}>
              <Text style={styles.name}>{seller.name}</Text>
              <Text style={styles.location}>{seller.location || t('screen.profile.locationDefault')}</Text>
              {seller.bio ? <Text style={styles.bio}>{seller.bio}</Text> : null}
            </View>

            <View style={styles.statRow}>
              {/* Reliability/Rating */}
              <View style={styles.statItem}>
                <View style={styles.statIconCircle}>
                  <MaterialIcons name="star" size={20} color="#eab308" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>
                    {seller.positiveRate ? `${(seller.positiveRate / 20).toFixed(1)}` : '0.0'}
                  </Text>
                  <Text style={styles.statLabel}>{t('screen.profile.stats.reliability')}</Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              {/* Sales */}
              <View style={styles.statItem}>
                <View style={[styles.statIconCircle, { backgroundColor: '#eff6ff' }]}>
                  <MaterialIcons name="shopping-bag" size={20} color="#3b82f6" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{seller.sales || 0}</Text>
                  <Text style={styles.statLabel}>{t('screen.profile.stats.sales')}</Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              {/* Response Time */}
              <View style={styles.statItem}>
                <View style={[styles.statIconCircle, { backgroundColor: '#f0fdf4' }]}>
                  <MaterialIcons name="access-time" size={20} color="#22c55e" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>
                    {seller.responseCount && seller.responseCount > 0
                      ? t(seller.responseTime || 'screen.profile.stats.responseValue.unknown')
                      : t('screen.profile.stats.responseValue.unknown')}
                  </Text>
                  <Text style={styles.statLabel}>{t('screen.profile.stats.response')}</Text>
                </View>
              </View>
            </View>

            <View style={styles.reliabilityCard}>
              <Text style={styles.cardTitle}>{t('screen.profile.reliabilityLabel')}</Text>
              <View style={styles.reliabilityContent}>
                <MaterialIcons name="security" size={20} color="#16a34a" />
                <Text style={styles.reliabilityText}>
                  {seller.reliabilityLabel || t('screen.profile.reliabilityDefault')}
                </Text>
              </View>
            </View>

            <View style={styles.productsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('screen.profile.products.title')}</Text>
                <Pressable>
                  <Text style={styles.seeAllText}>{t('screen.profile.products.seeAll')} ({listings.length})</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {listings.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{t('screen.profile.products.empty')}</Text>
                    {sellerId === userService.getCurrentUserId() && (
                      <Pressable style={styles.startSellingBtn} onPress={() => handleTabPress('post')}>
                        <Text style={styles.startSellingText}>{t('screen.profile.products.emptyButton')}</Text>
                      </Pressable>
                    )}
                  </View>
                ) : (
                  listings.map(item => (
                    <Pressable
                      key={item.id}
                      style={styles.productCard}
                      onPress={() => navigation.navigate('Product', { listingId: item.id })}
                    >
                      <Image
                        source={{ uri: item.photos?.[0] || 'https://via.placeholder.com/150' }}
                        style={styles.productImage}
                      />
                      <View style={styles.productInfo}>
                        <Text numberOfLines={1} style={styles.productTitle}>{item.title}</Text>
                        <Text style={styles.productPrice}>
                          {item.currency === 'USD' ? '$' : '€'}{item.price}
                        </Text>
                      </View>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </TabTransitionView>

      {sellerId !== userService.getCurrentUserId() && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 62 }]}>
          <PrimaryButton label={t('screen.profile.button.share')} onPress={handleShareProfile} />
          <PrimaryButton label={t('screen.profile.button.chat')} tone="ghost" onPress={() => navigation.navigate('ChatList')} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  content: { paddingBottom: 120 },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorTitle: { color: '#64748b', fontSize: 15, fontWeight: '600' },
  retryBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  retryText: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
  headerContainer: {
    height: 280,
    width: '100%',
    position: 'relative',
    backgroundColor: '#000',
  },
  cover: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  settingsButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  settingsButtonInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -40,
    alignSelf: 'center',
    zIndex: 20,
  },
  avatarBorder: {
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 60,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#f1f5f9',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    marginTop: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  location: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },
  bio: {
    marginTop: 8,
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fefce8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  reliabilityCard: {
    backgroundColor: '#f0fdf4',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#166534',
    letterSpacing: 1,
    marginBottom: 10,
  },
  reliabilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reliabilityText: {
    flex: 1,
    fontSize: 14,
    color: '#14532d',
    lineHeight: 20,
    fontWeight: '500',
  },
  productsSection: {
    width: '100%',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  seeAllText: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '700',
  },
  horizontalScroll: {
    paddingRight: 20,
    gap: 12,
  },
  productCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f8fafc',
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 4,
  },
  emptyContainer: {
    marginLeft: 4,
    justifyContent: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  startSellingBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  startSellingText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 16,
  },
});
