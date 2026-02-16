import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';

interface ConditionSliderProps {
    value: number;
    onValueChange: (value: number) => void;
    disabled?: boolean;
}

export function ConditionSlider({ value, onValueChange, disabled = false }: ConditionSliderProps) {
    const { t } = useTranslation();

    // Determine dynamic color based on value
    const getColor = (val: number) => {
        if (val >= 80) return '#30e86e'; // Green
        if (val >= 50) return '#facc15'; // Yellow
        return '#fb7185'; // Red
    };

    const activeColor = getColor(value);

    // Determine status text and description
    const getStatusInfo = (val: number) => {
        if (val === 100) return { label: t('common.condition.new'), desc: t('common.condition.newDesc') };
        if (val >= 80) return { label: t('common.condition.likeNew'), desc: t('common.condition.likeNewDesc') };
        if (val >= 60) return { label: t('common.condition.good'), desc: t('common.condition.goodDesc') };
        if (val >= 40) return { label: t('common.condition.fair'), desc: t('common.condition.fairDesc') };
        return { label: t('common.condition.poor'), desc: t('common.condition.poorDesc') };
    };

    const statusInfo = getStatusInfo(value);

    return (
        <View style={styles.container}>
            {/* Header with Label and Percentage */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.label}>{t('screen.aiListing.label.condition')}</Text>
                    <Text style={[styles.statusText, { color: activeColor }]}>
                        {statusInfo.label}
                    </Text>
                </View>
                <Text style={[styles.valueText, { color: activeColor }]}>
                    {value}%
                </Text>
            </View>

            {/* Slider */}
            <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={10}
                value={value}
                onValueChange={onValueChange}
                minimumTrackTintColor={activeColor}
                maximumTrackTintColor="#e2e8f0"
                thumbTintColor={activeColor}
                disabled={disabled}
            />

            {/* Footer with Description and Scale */}
            <View style={styles.footer}>
                <Text style={styles.description}>{statusInfo.desc}</Text>
                <View style={styles.scaleLabels}>
                    <Text style={styles.scaleText}>0%</Text>
                    <Text style={styles.scaleText}>100%</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 4,
    },
    statusText: {
        fontSize: 18,
        fontWeight: '800',
    },
    valueText: {
        fontSize: 24,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    slider: {
        width: '100%',
        height: 40,
        marginTop: -8, // Pull slider up slightly to reduce gap
        marginBottom: -4,
    },
    footer: {
        marginTop: 4,
    },
    description: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 8,
        lineHeight: 18,
    },
    scaleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
    },
    scaleText: {
        fontSize: 11,
        color: '#cbd5e1',
        fontWeight: '600',
    },
});
