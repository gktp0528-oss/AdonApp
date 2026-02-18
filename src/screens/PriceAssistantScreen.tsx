import '../lib/polyfills';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { aiListingService } from '../services/aiListingService';

import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, 'AiPriceAssistant'>;

export default function AiPriceAssistantScreen({ navigation, route }: Props) {
    const { t, i18n } = useTranslation();
    const { imageUris } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<any>(null);

    const getRecommendedPrice = (): string | null => {
        const min = Number(analysis?.priceRange?.min);
        const max = Number(analysis?.priceRange?.max);
        if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) {
            return null;
        }
        return String(Math.round((min + max) / 2));
    };

    const handleApplyPrice = () => {
        const recommendedPrice = getRecommendedPrice();
        if (!recommendedPrice) {
            navigation.goBack();
            return;
        }

        navigation.navigate('AiListing', { selectedPrice: recommendedPrice });
    };

    useEffect(() => {
        if (imageUris && imageUris.length > 0) {
            runDeepAnalysis(imageUris);
        } else {
            setLoading(false);
        }
    }, [imageUris]);

    const runDeepAnalysis = async (originalUris: string[]) => {
        setLoading(true);
        try {
            // Optimize images
            const uris = await Promise.all(originalUris.map(uri => aiListingService.processImage(uri, 512)));

            const languageMap: Record<string, string> = {
                ko: '한국어 (Korean)',
                en: 'English',
                hu: 'Magyar (Hungarian)'
            };
            const targetLang = languageMap[i18n.language] || 'English';

            const report = await aiListingService.analyzeListing(uris, targetLang);

            if (report) {
                setAnalysis(report);
            } else {
                setAnalysis(null);
            }
        } catch (error) {
            console.error('Deep Analysis failed:', error);
            setAnalysis(null);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#30e86e" />
                    <Text style={styles.loadingText}>{t('screen.priceAssistant.loading')}</Text>
                </View>
            );
        }

        if (!analysis) {
            return (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{t('screen.priceAssistant.error')}</Text>
                    <Pressable
                        style={styles.retryBtn}
                        onPress={() => imageUris && imageUris.length > 0 && runDeepAnalysis(imageUris)}
                    >
                        <Text style={styles.retryBtnText}>{t('screen.priceAssistant.retry')}</Text>
                    </Pressable>
                </View>
            );
        }

        return (
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                    {imageUris?.map((uri, idx) => (
                        <Image key={idx} source={{ uri }} style={styles.listImage} />
                    ))}
                </ScrollView>

                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{analysis.itemName}</Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.demandBadge}>
                            <Text style={styles.demandText}>{t('screen.priceAssistant.demand')}: {analysis.marketDemand}</Text>
                        </View>
                        <View style={styles.conditionBadge}>
                            <Text style={styles.conditionText}>{t('screen.priceAssistant.conditionScore')}: {analysis.conditionScore}/10</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.priceCard}>
                    <Text style={styles.cardTitle}>{t('screen.priceAssistant.priceRangeTitle')}</Text>
                    <Text style={styles.priceRange}>
                        {analysis.priceRange.min} Ft — {analysis.priceRange.max} Ft
                    </Text>
                    <View style={styles.graphContainer}>
                        <View style={styles.graphBar} />
                        <View style={[styles.graphIndicator, { left: '60%' }]} />
                    </View>
                    <Text style={styles.reasoning}>{analysis.reasoning}</Text>
                </View>

                <View style={styles.insightSection}>
                    <Text style={styles.sectionTitle}>{t('screen.priceAssistant.insightsTitle')}</Text>
                    {analysis.insights.map((insight: string, idx: number) => (
                        <View key={idx} style={styles.insightRow}>
                            <MaterialIcons name="insights" size={16} color="#30e86e" />
                            <Text style={styles.insightText}>{insight}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.actionRow}>
                    <Pressable style={styles.applyBtn} onPress={handleApplyPrice}>
                        <Text style={styles.applyBtnText}>{t('screen.priceAssistant.applyBtn')}</Text>
                    </Pressable>
                </View>
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#1e293b" />
                </Pressable>
                <Text style={styles.headerTitle}>{t('screen.priceAssistant.headerTitle')}</Text>
                <View style={{ width: 44 }} />
            </View>
            {renderContent()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { color: '#1e293b', fontSize: 18, fontWeight: '800' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { color: '#64748b', marginTop: 24, textAlign: 'center', lineHeight: 24, fontSize: 16, fontWeight: '500' },
    errorText: { color: '#ef4444', textAlign: 'center', marginBottom: 14, fontWeight: '600' },
    retryBtn: {
        borderWidth: 1,
        borderColor: '#fecaca',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    retryBtnText: { color: '#b91c1c', fontWeight: '700', fontSize: 13 },
    scrollContent: { padding: 20 },
    photoList: { flexDirection: 'row', marginBottom: 24 },
    listImage: { width: 140, height: 140, borderRadius: 20, marginRight: 12 },
    itemInfo: { marginBottom: 24, paddingHorizontal: 4 },
    itemName: { color: '#1e293b', fontSize: 26, fontWeight: '800', marginBottom: 12 },
    badgeRow: { flexDirection: 'row', gap: 8 },
    demandBadge: { backgroundColor: '#30e86e20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    demandText: { color: '#059669', fontSize: 13, fontWeight: '700' },
    conditionBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    conditionText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
    priceCard: { backgroundColor: '#fff', borderRadius: 32, padding: 28, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: '#f1f5f9' },
    cardTitle: { color: '#64748b', fontSize: 14, fontWeight: '600', marginBottom: 12 },
    priceRange: { color: '#30e86e', fontSize: 38, fontWeight: '900', marginBottom: 20, letterSpacing: -1 },
    graphContainer: { height: 12, backgroundColor: '#f1f5f9', borderRadius: 6, marginBottom: 24, position: 'relative', overflow: 'hidden' },
    graphBar: { position: 'absolute', left: '20%', right: '20%', height: '100%', backgroundColor: '#30e86e', opacity: 0.2 },
    graphIndicator: { position: 'absolute', width: 6, height: 12, backgroundColor: '#30e86e', borderRadius: 3 },
    reasoning: { color: '#475569', fontSize: 15, lineHeight: 26, fontWeight: '400' },
    insightSection: { marginBottom: 32, paddingHorizontal: 4 },
    sectionTitle: { color: '#1e293b', fontSize: 20, fontWeight: '800', marginBottom: 20 },
    insightRow: { flexDirection: 'row', gap: 14, marginBottom: 16, alignItems: 'flex-start' },
    insightText: { color: '#64748b', fontSize: 15, flex: 1, lineHeight: 24 },
    actionRow: { marginTop: 16 },
    applyBtn: { backgroundColor: '#30e86e', height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#30e86e', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    applyBtnText: { color: '#fff', fontSize: 19, fontWeight: '900' },
});
