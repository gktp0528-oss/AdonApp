import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    Alert,
    Pressable,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Transaction } from '../types/transaction';
import { transactionService } from '../services/transactionService';
import { userService } from '../services/userService';
import { chatService } from '../services/chatService';
import { listingService } from '../services/listingService';
import { DetailBackButton } from '../components/DetailBackButton';

type Props = NativeStackScreenProps<RootStackParamList, 'TransactionDetail'>;

export default function TransactionDetailScreen({ route, navigation }: Props) {
    const { transactionId } = route.params;
    const { t } = useTranslation();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const currentUserId = userService.getCurrentUserId();

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const data = await transactionService.getTransaction(transactionId);
                if (data) {
                    setTransaction(data);
                }
            } catch (error) {
                console.error('Error fetching transaction:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransaction();
    }, [transactionId]);

    const handleVerifyPin = async () => {
        if (pinInput.length !== 4) return;
        setVerifying(true);
        try {
            const success = await transactionService.verifySafetyCode(transactionId, pinInput);
            if (success) {
                Alert.alert(t('common.success'), t('screen.transaction.pinVerified'));

                // Refresh data
                const updated = await transactionService.getTransaction(transactionId);
                if (updated) {
                    setTransaction(updated);

                    // Send system message to chat
                    try {
                        const listing = await listingService.getListingById(updated.listingId);
                        if (listing) {
                            const convId = await chatService.getOrCreateConversation(
                                updated.buyerId,
                                updated.sellerId,
                                { id: listing.id, title: listing.title, photo: listing.photos?.[0] || '' }
                            );
                            await chatService.sendMessage(convId, currentUserId || 'system', t('chat.system.transactionCompleted'));
                        }
                    } catch (chatError) {
                        console.error('Failed to send completion message:', chatError);
                    }
                }
            } else {
                Alert.alert(t('common.error'), t('screen.transaction.pinInvalid'));
            }
        } catch (error) {
            console.error('PIN Verification error:', error);
        } finally {
            setVerifying(false);
        }
    };

    const copyToClipboard = async () => {
        if (transaction?.safetyCode) {
            await Clipboard.setStringAsync(transaction.safetyCode);
            Alert.alert(t('common.success'), t('screen.transaction.pinCopied'));
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid_held': return t('screen.transaction.statusLabel.paidHeld');
            case 'released': return t('screen.transaction.statusLabel.released');
            case 'cancelled': return t('screen.transaction.statusLabel.cancelled');
            default: return status.toUpperCase();
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#22c55e" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <DetailBackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>{t('screen.transaction.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.statusCard}>
                    <Text style={styles.statusLabel}>{t('screen.transaction.status')}</Text>
                    <Text style={styles.statusValue}>{transaction?.status ? getStatusLabel(transaction.status) : '-'}</Text>
                </View>

                {/* Buyer Perspective: See the PIN */}
                {transaction?.buyerId === currentUserId && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('screen.transaction.safetyCode')}</Text>
                        <View style={styles.pinContainer}>
                            <View style={styles.pinBox}>
                                <Text style={styles.pinText}>{transaction?.safetyCode}</Text>
                            </View>
                            <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
                                <MaterialIcons name="content-copy" size={20} color="#64748b" />
                                <Text style={styles.copyText}>{t('common.copy')}</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.helperText}>{t('screen.transaction.safetyCodeDesc')}</Text>
                    </View>
                )}

                {/* Seller Perspective: Input the PIN */}
                {transaction?.sellerId === currentUserId && transaction?.status === 'paid_held' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('screen.transaction.verifyBuyer')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter 4-digit PIN"
                            keyboardType="number-pad"
                            maxLength={4}
                            value={pinInput}
                            onChangeText={setPinInput}
                        />
                        <TouchableOpacity
                            style={[styles.button, verifying && styles.buttonDisabled]}
                            onPress={handleVerifyPin}
                            disabled={verifying}
                        >
                            {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('common.verify')}</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Completion Message */}
                {(transaction?.status === 'released' || transaction?.status === 'delivered') && (
                    <View style={[styles.section, styles.successSection]}>
                        <MaterialIcons name="check-circle" size={48} color="#22c55e" />
                        <Text style={styles.successTitle}>{t('common.success')}</Text>
                        <Text style={styles.successDesc}>{t('screen.transaction.completeMsg')}</Text>
                        <TouchableOpacity
                            style={styles.homeBtn}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.homeBtnText}>{t('screen.transaction.backHome')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    scrollContent: { padding: 16 },
    statusCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusLabel: { fontSize: 14, color: '#64748b', marginBottom: 4 },
    statusValue: { fontSize: 24, fontWeight: '800', color: '#22c55e' },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
    pinBox: {
        backgroundColor: '#f1f5f9',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
    },
    pinText: { fontSize: 32, fontWeight: '800', color: '#0f172a', letterSpacing: 8 },
    helperText: { fontSize: 13, color: '#64748b', marginTop: 12, textAlign: 'center', lineHeight: 18 },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#0f172a',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    successSection: { alignItems: 'center', padding: 40 },
    successTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginVertical: 12 },
    successDesc: { fontSize: 14, color: '#64748b', textAlign: 'center' },
    pinContainer: { alignItems: 'center', gap: 12 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 4 },
    copyText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
    homeBtn: { marginTop: 20, backgroundColor: '#f1f5f9', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 },
    homeBtnText: { color: '#0f172a', fontWeight: '700' },
});
