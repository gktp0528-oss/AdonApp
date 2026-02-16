import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';

interface ConditionSliderProps {
    value: number;
    onValueChange: (value: number) => void;
    onInteractionChange?: (active: boolean) => void;
    disabled?: boolean;
}

export function ConditionSlider({ value, onValueChange, onInteractionChange, disabled = false }: ConditionSliderProps) {
    const { t } = useTranslation();
    const sliderWidth = useRef(0);
    const sliderPageX = useRef(0);
    const isInteracting = useRef(false);
    const animatedValue = useRef(new Animated.Value(value)).current;
    const thumbScale = useRef(new Animated.Value(1)).current;

    // Keep animated value in sync with prop for smooth transitions when AI or parent updates it
    useEffect(() => {
        // Only animate if not currently interacting to avoid drag lag
        if (!isInteracting.current) {
            Animated.timing(animatedValue, {
                toValue: value,
                duration: 300,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }).start();
        }
    }, [value]);

    // Determine dynamic color based on value
    const getColor = (val: number) => {
        if (val >= 80) return '#19e61b'; // Brighter Green (Adon Primary)
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
            // Capture the touch if it's more horizontal than vertical, or if already interacting
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                if (disabled) return false;
                return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) || isInteracting.current;
            },
            onStartShouldSetPanResponderCapture: () => !disabled,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
                if (disabled) return false;
                // Aggressively capture if we detect horizontal movement
                return Math.abs(gestureState.dx) > 2;
            },
            onPanResponderGrant: (evt, gestureState) => {
                if (disabled) return;
                isInteracting.current = true;
                onInteractionChange?.(true);

                // Visual feedback: grow thumb
                Animated.spring(thumbScale, {
                    toValue: 1.4,
                    friction: 8,
                    tension: 100,
                    useNativeDriver: false,
                }).start();

                handleTouch(evt.nativeEvent.pageX);
            },
            onPanResponderMove: (evt, gestureState) => {
                if (disabled) return;
                handleTouch(evt.nativeEvent.pageX);
            },
            onPanResponderRelease: () => {
                isInteracting.current = false;
                onInteractionChange?.(false);

                // Visual feedback: shrink thumb back
                Animated.spring(thumbScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 100,
                    useNativeDriver: false,
                }).start();

                // Ensure value is snapped and parent informed
                const currentValue = (animatedValue as any)._value;
                const snappedValue = Math.round(currentValue / 10) * 10;
                onValueChange(snappedValue);
            },
            onPanResponderTerminate: () => {
                isInteracting.current = false;
                onInteractionChange?.(false);
                Animated.spring(thumbScale, {
                    toValue: 1,
                    useNativeDriver: false,
                }).start();
            },
            // CRITICAL: Block parent ScrollView from stealing the touch
            onPanResponderTerminationRequest: () => false,
        })
    ).current;

    const handleTouch = (pageX: number) => {
        if (sliderWidth.current <= 0) return;

        const relativeX = pageX - sliderPageX.current;
        const percentage = Math.max(0, Math.min(100, (relativeX / sliderWidth.current) * 100));

        // Update visual position IMMEDIATELY for zero-lag feel
        animatedValue.setValue(percentage);

        // Inform parent for UI updates (label, color)
        const steppedValue = Math.round(percentage / 10) * 10;
        if (steppedValue !== value) {
            onValueChange(steppedValue);
        }
    };

    const leftPosition = animatedValue.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    const trackWidth = animatedValue.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            {/* Header with Label and Percentage - Stabilized Layout */}
            <View style={styles.header}>
                <View style={styles.statusInfoArea}>
                    <Text style={styles.label}>{t('screen.aiListing.label.condition')}</Text>
                    <View style={styles.statusLabelWrap}>
                        <Text style={[styles.statusText, { color: activeColor }]}>
                            {statusInfo.label}
                        </Text>
                    </View>
                </View>
                <View style={styles.percentageWrap}>
                    <Text style={[styles.valueText, { color: activeColor }]}>
                        {value}%
                    </Text>
                </View>
            </View>

            {/* Custom Slider */}
            <View
                style={styles.sliderInteractArea}
                onLayout={(e) => {
                    sliderWidth.current = e.nativeEvent.layout.width;
                    // Measure pageX to handle absolute touch coordinates correctly
                    e.currentTarget.measure((x, y, width, height, pageX, pageY) => {
                        sliderPageX.current = pageX;
                    });
                }}
                {...panResponder.panHandlers}
            >
                <View style={styles.track}>
                    <Animated.View
                        style={[
                            styles.trackFilled,
                            {
                                width: trackWidth,
                                backgroundColor: activeColor
                            }
                        ]}
                    />
                </View>
                <Animated.View
                    style={[
                        styles.thumb,
                        {
                            left: leftPosition,
                            backgroundColor: activeColor,
                            transform: [{ scale: thumbScale }]
                        }
                    ]}
                />
            </View>

            {/* Footer with Description */}
            <View style={styles.footer}>
                <View style={styles.descriptionArea}>
                    <Text style={styles.description} numberOfLines={2}>
                        {statusInfo.desc}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
        paddingHorizontal: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 16,
        height: 52,
    },
    statusInfoArea: {
        flex: 1,
    },
    statusLabelWrap: {
        height: 28,
        justifyContent: 'center',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
        marginBottom: 2,
    },
    statusText: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    percentageWrap: {
        width: 80,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
    },
    valueText: {
        fontSize: 28,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
        letterSpacing: -1,
    },
    sliderInteractArea: {
        height: 60, // Much larger hit area vertically
        justifyContent: 'center',
        marginHorizontal: -20, // Horizontal spill for easier catching from edges
        paddingHorizontal: 20,
    },
    track: {
        height: 8, // Slightly thicker track for better visibility
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    trackFilled: {
        height: 8,
        borderRadius: 4,
    },
    thumb: {
        position: 'absolute',
        width: 32, // Larger default thumb
        height: 32,
        borderRadius: 16,
        marginLeft: -16,
        backgroundColor: '#19e61b',
        borderWidth: 4, // Stronger border
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        zIndex: 10,
    },
    footer: {
        marginTop: 4,
    },
    descriptionArea: {
        height: 40,
    },
    description: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
    },
});
