import React, { useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';

interface ConditionSliderProps {
    value: number;
    onValueChange: (value: number) => void;
    disabled?: boolean;
}

export function ConditionSlider({ value, onValueChange, disabled = false }: ConditionSliderProps) {
    const { t } = useTranslation();
    const sliderWidth = useRef(0);

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

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !disabled,
            onMoveShouldSetPanResponder: () => !disabled,
            onPanResponderGrant: (evt) => {
                if (disabled) return;
                const locationX = evt.nativeEvent.locationX;
                updateValue(locationX);
            },
            onPanResponderMove: (evt) => {
                if (disabled) return;
                const locationX = evt.nativeEvent.locationX;
                updateValue(locationX);
            },
        })
    ).current;

    const updateValue = (locationX: number) => {
        const percentage = Math.max(0, Math.min(100, (locationX / sliderWidth.current) * 100));
        const steppedValue = Math.round(percentage / 10) * 10;
        onValueChange(steppedValue);
    };

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

            {/* Custom Slider */}
            <View
                style={styles.sliderContainer}
                onLayout={(e) => {
                    sliderWidth.current = e.nativeEvent.layout.width;
                }}
                {...panResponder.panHandlers}
            >
                <View style={styles.track}>
                    <View style={[styles.trackFilled, { width: `${value}%`, backgroundColor: activeColor }]} />
                </View>
                <View style={[styles.thumb, { left: `${value}%`, backgroundColor: activeColor }]} />
            </View>

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
    sliderContainer: {
        height: 40,
        justifyContent: 'center',
        marginTop: -8,
        marginBottom: -4,
    },
    track: {
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
    },
    trackFilled: {
        height: 4,
        borderRadius: 2,
    },
    thumb: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        marginLeft: -10,
        backgroundColor: '#30e86e',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
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
