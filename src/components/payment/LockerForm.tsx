import React from 'react';
import { StyleSheet, Text, TextInput, View, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LockerData } from '../../types/transaction';

interface Props {
    data: LockerData;
    onChange: (data: LockerData) => void;
}

// Mock locker locations for skeleton
const MOCK_LOCKERS = [
    { id: 'FP001', name: 'Foxpost - WestEnd Mall', provider: 'Foxpost' },
    { id: 'FP002', name: 'Foxpost - Corvin Plaza', provider: 'Foxpost' },
    { id: 'ZS001', name: 'Zasilkovna - Astoria Station', provider: 'Zasilkovna' },
    { id: 'ZS002', name: 'Zasilkovna - Deák Ferenc tér', provider: 'Zasilkovna' },
];

export function LockerForm({ data, onChange }: Props) {
    const { t } = useTranslation();

    const handleSelect = (locker: typeof MOCK_LOCKERS[0]) => {
        onChange({
            provider: locker.provider,
            locationId: locker.id,
            locationName: locker.name,
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.providerBadge}>
                <MaterialIcons name="inventory" size={16} color="#e11d48" />
                <Text style={styles.providerName}>{t('screen.payment.provider.packeta')}</Text>
            </View>

            <Text style={styles.label}>{t('screen.payment.locker.select')}</Text>

            <View style={styles.searchBar}>
                <MaterialIcons name="search" size={20} color="#94a3b8" />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('screen.payment.locker.search')}
                    placeholderTextColor="#94a3b8"
                />
            </View>

            <ScrollView style={styles.lockerList} nestedScrollEnabled>
                {MOCK_LOCKERS.map((locker) => (
                    <Pressable
                        key={locker.id}
                        style={[
                            styles.lockerItem,
                            data.locationId === locker.id && styles.lockerItemActive
                        ]}
                        onPress={() => handleSelect(locker)}
                    >
                        <View style={styles.lockerInfo}>
                            <Text style={styles.lockerName}>{locker.name}</Text>
                            <Text style={styles.lockerProvider}>{locker.provider}</Text>
                        </View>
                        {data.locationId === locker.id && (
                            <MaterialIcons name="check-circle" size={24} color="#22c55e" />
                        )}
                    </Pressable>
                ))}
            </ScrollView>
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
        maxHeight: 400,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        fontSize: 14,
        color: '#0f172a',
    },
    lockerList: {
        marginTop: 4,
    },
    lockerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    lockerItemActive: {
        borderColor: '#22c55e',
        backgroundColor: '#f0fdf4',
    },
    lockerInfo: {
        flex: 1,
    },
    lockerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
    },
    lockerProvider: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    providerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff1f2',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ffe4e6',
    },
    providerName: {
        fontSize: 12,
        fontWeight: '800',
        color: '#e11d48',
        marginLeft: 6,
        textTransform: 'uppercase',
    },
});
