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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Transaction } from '../types/transaction';
import { transactionService } from '../services/transactionService';
import { userService } from '../services/userService';

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
            } else {
                Alert.alert(t('common.error'), t('screen.transaction.pinInvalid'));
            }
        } catch (error) {
            console.error('PIN Verification error:', error);
        } finally {
            setVerifying(false);
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
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('screen.transaction.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.statusCard}>
                    <Text style={styles.statusLabel}>{t('screen.transaction.status')}</Text>
                    <Text style={styles.statusValue}>{transaction?.status?.toUpperCase() || 'PAID'}</Text>
                </View>

                {/* Buyer Perspective: See the PIN */}
                {transaction?.buyerId === currentUserId && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('screen.transaction.safetyCode')}</Text>
                        <View style={styles.pinBox}>
                            <Text style={styles.pinText}>{transaction?.safetyCode}</Text>
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
                        <Text style={styles.successDesc}>The item has been successfully traded!</Text>
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
});
