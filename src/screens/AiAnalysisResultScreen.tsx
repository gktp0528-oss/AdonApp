import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    ScrollView,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';
import { aiBridge } from '../services/aiBridge';

type Props = NativeStackScreenProps<RootStackParamList, 'AiAnalysisResult'>;

export default function AiAnalysisResultScreen({ navigation, route }: Props) {
    const { report, imageUri } = route.params;
    const { t } = useTranslation();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                damping: 20,
                stiffness: 90,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleApply = () => {
        aiBridge.setReport(report);
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="close" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('screen.aiAnalysisResult.headerTitle')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Hero Image Section */}
                <View style={styles.heroSection}>
                    <Image source={{ uri: imageUri }} style={styles.heroImage} />
                    <View style={styles.heroOverlay} />
                    <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.badgeRow}>
                            <View style={styles.badge}>
                                <MaterialIcons name="auto-awesome" size={16} color="#000" />
                                <Text style={styles.badgeText}>{t('screen.aiAnalysisResult.badge')}</Text>
                            </View>
                            <View style={[styles.badge, styles.categoryBadge]}>
                                <MaterialIcons name="category" size={14} color="#166534" />
                                <Text style={styles.categoryBadgeText} numberOfLines={1} ellipsizeMode="middle">
                                    {report.category}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.itemName}>{report.itemName}</Text>
                        <Text style={styles.marketDemand}>
                            {t('screen.aiAnalysisResult.demand', { value: report.marketDemand })}
                        </Text>
                    </Animated.View>
                </View>

                {/* Score & Price Card */}
                <Animated.View style={[styles.statsCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('screen.aiAnalysisResult.label.condition')}</Text>
                        <View style={styles.scoreCircle}>
                            <Text style={styles.scoreValue}>{report.conditionScore ?? '?'}</Text>
                            <Text style={styles.scoreMax}>/10</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('screen.aiAnalysisResult.label.price')}</Text>
                        <Text style={styles.priceValue}>
                            {report.priceRange
                                ? `${report.priceRange.min} Ft - ${report.priceRange.max} Ft`
                                : 'N/A'}
                        </Text>
                    </View>
                </Animated.View>

                {/* Insights Section */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>{t('screen.aiAnalysisResult.label.insights')}</Text>
                    {report.insights.map((insight: string, index: number) => (
                        <View key={index} style={styles.insightRow}>
                            <MaterialIcons name="check-circle" size={20} color="#22c55e" />
                            <Text style={styles.insightText}>{insight}</Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Reasoning Section */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>{t('screen.aiAnalysisResult.label.summary')}</Text>
                    <Text style={styles.reasoningText}>{report.reasoning}</Text>
                </Animated.View>
            </ScrollView>

            {/* Floating Action Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                    <Text style={styles.applyBtnText}>{t('screen.aiAnalysisResult.submit')}</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#000" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f6f8f6' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#f6f8f6',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        color: '#0f172a',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    content: { paddingBottom: 120 },
    heroSection: {
        height: 300,
        justifyContent: 'flex-end',
        padding: 24,
        marginBottom: 24,
        marginHorizontal: 20,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    heroImage: {
        ...StyleSheet.absoluteFillObject,
        resizeMode: 'cover',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)', // Soft tint for text readability
    },
    heroContent: { gap: 6 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#19e61b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
        gap: 6,
        shadowColor: '#19e61b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    badgeText: { fontSize: 11, fontWeight: '900', color: '#0f172a' },
    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    categoryBadge: { backgroundColor: '#dcfce7', borderColor: '#bbf7d0', borderWidth: 1 },
    categoryBadgeText: { color: '#166534', fontSize: 10, fontWeight: '800', marginLeft: 4 },
    itemName: { fontSize: 28, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    marketDemand: { fontSize: 13, color: '#f0fdf4', fontWeight: '700', letterSpacing: 1 },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    statItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    divider: { width: 1, backgroundColor: '#f1f5f9', marginHorizontal: 10 },
    statLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
    scoreCircle: { flexDirection: 'row', alignItems: 'baseline' },
    scoreValue: { fontSize: 36, fontWeight: '900', color: '#0f172a' },
    scoreMax: { fontSize: 16, color: '#94a3b8', marginLeft: 2 },
    priceValue: { fontSize: 22, fontWeight: '900', color: '#16a34a' },
    section: {
        paddingHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#fff',
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
    },
    sectionTitle: { fontSize: 13, color: '#64748b', fontWeight: '900', marginBottom: 16, letterSpacing: 1 },
    insightRow: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'center' },
    insightText: { flex: 1, color: '#334155', fontSize: 14, fontWeight: '600', lineHeight: 20 },
    reasoningText: { color: '#64748b', fontSize: 14, lineHeight: 22, fontWeight: '500' },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f6f8f6',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 34,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    applyBtn: {
        backgroundColor: '#19e61b',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 16,
        gap: 10,
        shadowColor: '#19e61b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    applyBtnText: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
});
