import React, { useState, useEffect } from 'react';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';
import { DetailBackButton } from '../components/DetailBackButton';
import { listingService } from '../services/listingService';
import { userService } from '../services/userService';
import { Listing } from '../types/listing';
import { formatCurrency } from '../utils/format';
import { TradeType, MeetupData, DeliveryData, LockerData } from '../types/transaction';
import { MeetupForm } from '../components/payment/MeetupForm';
import { DeliveryForm } from '../components/payment/DeliveryForm';
import { LockerForm } from '../components/payment/LockerForm';
import { transactionService } from '../services/transactionService';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

export default function PaymentScreen({ navigation, route }: Props) {
    const { listingId, sellerId } = route.params;
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tradeType] = useState<TradeType>('meetup');

    // Form States
    const [meetupData, setMeetupData] = useState<MeetupData>({ date: '', time: '', place: '' });
    const [deliveryData, setDeliveryData] = useState<DeliveryData>({
        recipientName: '',
        phone: '',
        address: '',
        postcode: '',
        carrier: 'DPD',
    });
    const [lockerData, setLockerData] = useState<LockerData>({
        provider: 'Packeta',
        locationId: '',
        locationName: '',
    });

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const data = await listingService.getListingById(listingId);
                setListing(data);
            } catch (error) {
                Alert.alert(t('common.error'), t('screen.product.error.load'));
            } finally {
                setLoading(false);
            }
        };
        fetchListing();
    }, [listingId]);

    if (loading) {
        return (
            <View style={[styles.root, styles.center]}>
                <ActivityIndicator size="large" color="#22c55e" />
            </View>
        );
    }

    if (!listing) {
        return (
            <View style={[styles.root, styles.center]}>
                <Text>{t('screen.product.error.notFound')}</Text>
            </View>
        );
    }

    const getShippingFee = () => {
        if (tradeType === 'meetup') return 0;
        if (tradeType === 'locker') return 1100; // Packeta/Foxpost base fee
        if (tradeType === 'delivery') return 2500; // DPD base fee
        return 0;
    };

    const shippingFee = getShippingFee();
    const platformFee = Math.round(listing.price * 0.05); // 5% fee rounded
    const totalAmount = listing.price + shippingFee + platformFee;

    const handlePayment = async () => {
        // Validation
        if (tradeType === 'meetup' && (!meetupData.date || !meetupData.time || !meetupData.place)) {
            Alert.alert(t('common.error'), t('screen.payment.error.fieldsRequired'));
            return;
        }
        if (tradeType === 'delivery' && (!deliveryData.recipientName || !deliveryData.address)) {
            Alert.alert(t('common.error'), t('screen.payment.error.fieldsRequired'));
            return;
        }
        if (tradeType === 'locker' && !lockerData.locationId) {
            Alert.alert(t('common.error'), t('screen.payment.error.fieldsRequired'));
            return;
        }

        const currentUserId = userService.getCurrentUserId();
        if (!currentUserId) {
            Alert.alert(t('common.error'), 'Login Required');
            return;
        }

        setIsSubmitting(true);
        try {
            await transactionService.createTransaction({
                listingId,
                buyerId: currentUserId,
                sellerId,
                tradeType,
                amount: {
                    item: listing.price,
                    shipping: shippingFee,
                    platformFee: platformFee,
                    total: totalAmount,
                },
                currency: listing.currency,
                meetup: tradeType === 'meetup' ? meetupData : undefined,
                delivery: tradeType === 'delivery' ? deliveryData : undefined,
                locker: tradeType === 'locker' ? lockerData : undefined,
            });

            Alert.alert(
                t('screen.payment.submit'),
                'Your payment is now held in escrow. Please coordinate with the seller.',
                [{ text: 'OK', onPress: () => navigation.replace('TransactionDetail', { transactionId }) }]
            );
        } catch (error) {
            console.error('Payment failed:', error);
            Alert.alert(t('common.error'), 'Failed to initiate transaction.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.root}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <DetailBackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>{t('screen.payment.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('screen.payment.summary')}</Text>
                    <View style={styles.productCard}>
                        <Image source={{ uri: listing.photos?.[0] }} style={styles.productImage} />
                        <View style={styles.productInfo}>
                            <Text style={styles.productTitle} numberOfLines={1}>{listing.title}</Text>
                            <Text style={styles.productPrice}>{formatCurrency(listing.price, listing.currency)}</Text>
                        </View>
                    </View>
                </View>

                {/* Meetup-only implementation for initial launch */}
                <MeetupForm data={meetupData} onChange={setMeetupData} />

                {/* Escrow Notice */}
                <View style={styles.escrowBox}>
                    <MaterialIcons name="security" size={20} color="#16a34a" />
                    <View style={styles.escrowContent}>
                        <Text style={styles.escrowTitle}>{t('screen.payment.escrow.title')}</Text>
                        <Text style={styles.escrowDesc}>{t('screen.payment.escrow.desc')}</Text>
                    </View>
                </View>

                {/* Price Breakdown */}
                <View style={styles.section}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>{t('screen.payment.price.item')}</Text>
                        <Text style={styles.priceValue}>{formatCurrency(listing.price, listing.currency)}</Text>
                    </View>
                    {/* Shipping fee hidden for meetup-only phase */}
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>{t('screen.payment.price.fee')}</Text>
                        <Text style={styles.priceValue}>{formatCurrency(platformFee, listing.currency)}</Text>
                    </View>
                    <View style={[styles.priceRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>{t('screen.payment.price.total')}</Text>
                        <Text style={styles.totalValue}>{formatCurrency(totalAmount, listing.currency)}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Footer CTA */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <Pressable
                    style={styles.submitBtn}
                    onPress={handlePayment}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.submitBtnText}>{t('screen.payment.submit')}</Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f8fafc' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    productImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f1f5f9' },
    productInfo: { marginLeft: 12, flex: 1 },
    productTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    productPrice: { fontSize: 14, fontWeight: '600', color: '#22c55e', marginTop: 4 },
    methodTabs: { flexDirection: 'row', gap: 8 },
    methodTab: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    methodTabActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
    methodTabText: { fontSize: 12, fontWeight: '700', color: '#64748b', marginTop: 4 },
    methodTabTextActive: { color: '#16a34a' },
    escrowBox: {
        flexDirection: 'row',
        backgroundColor: '#ecfdf5',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#d1fae5',
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    escrowContent: { marginLeft: 12, flex: 1 },
    escrowTitle: { fontSize: 14, fontWeight: '800', color: '#065f46' },
    escrowDesc: { fontSize: 12, color: '#065f46', marginTop: 2, lineHeight: 18 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    priceLabel: { fontSize: 14, color: '#64748b' },
    priceValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
    totalLabel: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
    totalValue: { fontSize: 18, fontWeight: '900', color: '#22c55e' },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        paddingTop: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    submitBtn: {
        backgroundColor: '#22c55e',
        borderRadius: 12,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
});
