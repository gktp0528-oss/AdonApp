import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DeliveryData } from '../../types/transaction';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface Props {
    data: DeliveryData;
    onChange: (data: DeliveryData) => void;
}

export function DeliveryForm({ data, onChange }: Props) {
    const { t } = useTranslation();

    const handleChange = (key: keyof DeliveryData, value: string) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <View style={styles.container}>
            <View style={styles.providerBadge}>
                <MaterialIcons name="local-shipping" size={16} color="#2563eb" />
                <Text style={styles.providerName}>{t('screen.payment.provider.dpd')}</Text>
            </View>

            <Text style={styles.label}>{t('screen.payment.delivery.recipient')}</Text>
            <TextInput
                style={styles.input}
                value={data.recipientName}
                onChangeText={(v) => handleChange('recipientName', v)}
                placeholder={t('screen.payment.delivery.placeholder.recipient')}
                placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>{t('screen.payment.delivery.phone')}</Text>
            <TextInput
                style={styles.input}
                value={data.phone}
                onChangeText={(v) => handleChange('phone', v)}
                placeholder={t('screen.payment.delivery.placeholder.phone')}
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
            />

            <Text style={styles.label}>{t('screen.payment.delivery.address')}</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                value={data.address}
                onChangeText={(v) => handleChange('address', v)}
                placeholder={t('screen.payment.delivery.placeholder.address')}
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
            />

            <Text style={styles.label}>{t('screen.payment.delivery.postcode')}</Text>
            <TextInput
                style={styles.input}
                value={data.postcode}
                onChangeText={(v) => handleChange('postcode', v)}
                placeholder={t('screen.payment.delivery.placeholder.postcode')}
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#0f172a',
        marginBottom: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    providerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    providerName: {
        fontSize: 12,
        fontWeight: '800',
        color: '#2563eb',
        marginLeft: 6,
        textTransform: 'uppercase',
    },
});
