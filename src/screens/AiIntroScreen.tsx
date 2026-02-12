import React, { useEffect, useRef } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AiIntro'>;

const { width } = Dimensions.get('window');

export function AiIntroScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const FEATURES = [
        {
            id: 'vision',
            icon: 'center-focus-strong',
            title: t('ai.visionTitle'),
            description: t('ai.visionDesc'),
        },
        {
            id: 'price',
            icon: 'candlestick-chart', // or query-stats
            title: t('ai.priceTitle'),
            description: t('ai.priceDesc'),
        },
        {
            id: 'studio',
            icon: 'photo-camera-back',
            title: t('ai.studioTitle'),
            description: t('ai.studioDesc'),
        },
    ];

    // Animations
    const scanAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 1. Scanning Line Animation (Loop)
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(scanAnim, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ])
        ).start();

        // 2. Pulse Animation (Loop)
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                })
            ])
        ).start();

        // 3. Shimmer/Rotate Animation (Loop)
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [scanAnim, pulseAnim, shimmerAnim]);

    const handleStartTrial = () => {
        navigation.goBack();
    };

    const spin = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const scanTranslateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 48] // Height of icon box
    });

    return (
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="close" size={24} color="#0f172a" />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.titleContainer}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{t('ai.beta')}</Text>
                    </View>
                    <Text style={styles.title}>Adon AI <Text style={{ color: '#16a34a' }}>Pro</Text></Text>
                    <Text style={styles.subtitle}>{t('ai.helperSubtitle')}</Text>
                </View>

                <View style={styles.featuresList}>
                    {/* Vision AI Card */}
                    <View style={styles.featureCard}>
                        <View style={styles.iconBox}>
                            <MaterialIcons name="center-focus-strong" size={32} color="#0f172a" />
                            {/* Scanning Line */}
                            <Animated.View style={[
                                styles.scanLine,
                                { transform: [{ translateY: scanTranslateY }] }
                            ]} />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>{FEATURES[0].title}</Text>
                            <Text style={styles.featureDesc}>{FEATURES[0].description}</Text>
                        </View>
                    </View>

                    {/* Price AI Card */}
                    <View style={styles.featureCard}>
                        <View style={styles.iconBox}>
                            {/* Pulse Background */}
                            <Animated.View style={[
                                styles.pulseCircle,
                                { transform: [{ scale: pulseAnim }] }
                            ]} />
                            <MaterialIcons name="candlestick-chart" size={32} color="#0f172a" />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>{FEATURES[1].title}</Text>
                            <Text style={styles.featureDesc}>{FEATURES[1].description}</Text>
                        </View>
                    </View>

                    {/* Studio AI Card */}
                    <View style={styles.featureCard}>
                        <View style={[styles.iconBox, { overflow: 'hidden' }]}>
                            <MaterialIcons name="photo-camera-back" size={32} color="#0f172a" />
                            {/* Shimmer/Sparkle */}
                            <Animated.View style={[
                                styles.sparkle,
                                { transform: [{ rotate: spin }] }
                            ]}>
                                <MaterialIcons name="auto-awesome" size={16} color="#19e61b" />
                            </Animated.View>
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>{FEATURES[2].title}</Text>
                            <Text style={styles.featureDesc}>{FEATURES[2].description}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.pricingContainer}>
                    <View style={styles.pricingBadge}>
                        <Text style={styles.proText}>{t('ai.limitedOffer')}</Text>
                    </View>
                    <Text style={styles.trialText}>
                        <Text style={styles.boldText}>Adon Pro</Text>{t('ai.tryFree')}
                    </Text>
                    <Text style={styles.subtext}>
                        {t('ai.trialPricing')}
                    </Text>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <Pressable style={styles.ctaBtn} onPress={handleStartTrial}>
                    <Text style={styles.ctaText}>{t('ai.startTrial')}</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#0f172a" />
                </Pressable>
                <Text style={styles.footerNote}>{t('ai.cancelNote')}</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f6f8f6' },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        alignItems: 'flex-end',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 100,
    },
    titleContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    badge: {
        backgroundColor: '#0f172a',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 12,
    },
    badgeText: {
        color: '#19e61b',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        fontWeight: '500',
    },
    featuresList: {
        gap: 16,
        marginBottom: 32,
    },
    featureCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    scanLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#19e61b',
        shadowColor: '#19e61b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    pulseCircle: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(25, 230, 27, 0.2)',
    },
    sparkle: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
        fontWeight: '500',
    },
    pricingContainer: {
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderRadius: 20,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    pricingBadge: {
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 99,
    },
    proText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#19e61b',
        letterSpacing: 1,
    },
    trialText: {
        textAlign: 'center',
        color: '#fff',
        fontSize: 20,
        fontWeight: '400',
        marginBottom: 6,
    },
    subtext: {
        color: '#94a3b8',
        fontSize: 14,
    },
    boldText: {
        fontWeight: '800',
        color: '#19e61b',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        backgroundColor: '#f6f8f6',
        alignItems: 'center',
    },
    ctaBtn: {
        width: '100%',
        backgroundColor: '#19e61b',
        height: 58,
        borderRadius: 18,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#19e61b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    ctaText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    footerNote: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
});
