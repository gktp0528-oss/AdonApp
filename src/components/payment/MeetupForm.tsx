import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MeetupData } from '../../types/transaction';

interface Props {
    data: MeetupData;
    onChange: (data: MeetupData) => void;
}

export function MeetupForm({ data, onChange }: Props) {
    const { t } = useTranslation();

    const handleChange = (key: keyof MeetupData, value: string) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{t('screen.payment.meetup.date')}</Text>
            <TextInput
                style={styles.input}
                value={data.date}
                onChangeText={(v) => handleChange('date', v)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>{t('screen.payment.meetup.time')}</Text>
            <TextInput
                style={styles.input}
                value={data.time}
                onChangeText={(v) => handleChange('time', v)}
                placeholder="HH:MM"
                placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>{t('screen.payment.meetup.place')}</Text>
            <TextInput
                style={styles.input}
                value={data.place}
                onChangeText={(v) => handleChange('place', v)}
                placeholder={t('screen.payment.meetup.placeholder.place')}
                placeholderTextColor="#94a3b8"
                multiline
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
});
