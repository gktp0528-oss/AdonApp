import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { getGenerativeModel } from "firebase/ai";
import { aiBackend } from '../firebaseConfig';
import * as ImageManipulator from 'expo-image-manipulator';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'AiPriceAssistant'>;

export default function AiPriceAssistantScreen({ navigation, route }: Props) {
    const { t } = useTranslation();
    const { imageUris, initialPrice } = route.params || {};
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

    const processImage = async (uri: string) => {
        try {
            const manipulResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 512 } }],
                { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
            );
            return manipulResult.uri;
        } catch (error) {
            return uri;
        }
    };

    const runDeepAnalysis = async (originalUris: string[]) => {
        try {
            const model = getGenerativeModel(aiBackend, { model: "gemini-2.5-flash-lite" });

            // Image optimization
            const uris = await Promise.all(originalUris.map(uri => processImage(uri)));

            const imageParts = await Promise.all(uris.map(async (uri) => {
                const response = await fetch(uri);
                const blob = await response.blob();
                const reader = new FileReader();
                const base64: string = await new Promise((resolve) => {
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        resolve(result.split(',')[1]);
                    };
                    reader.readAsDataURL(blob);
                });
                return {
                    inlineData: { data: base64, mimeType: "image/jpeg" },
                };
            }));

            const prompt = `당신은 유럽(독일, 프랑스, 스페인 등)의 중고 마켓(eBay, Vinted, Wallapop) 시세에 정통한 매우 보수적이고 객관적인 가격 책정 전문가입니다.
      
      [분석 지침]
      1. 여러 장의 사진을 대조하여 제품의 정확한 모델명과 진위 여부를 확인하세요.
      2. 사진마다 스크래치, 찍힘, 오염, 사용감 등 '현실적인 감가 요인'을 정밀하게 찾아내십시오. 
      3. 가격 책정 시 매우 보수적이어야 합니다. 에어팟이나 가전제품에 미세한 스크래치라도 보인다면, 시장 평균가보다 훨씬 낮은 가격을 제시해야 합니다.
      4. 사용자가 보고한 상태보다 사진에서 직접 확인되는 물리적 훼손에 더 큰 가중치를 두어 가격을 깎으세요.
      
      다음 JSON 형식으로 상세 리포트를 작성해주세요:
      {
        "itemName": "식별된 정확한 모델명",
        "conditionScore": 1~10 사이 점수 (물리적 손상이 보이면 엄격하게 감점),
        "marketDemand": "유럽 내 수요 (High/Medium/Low)",
        "priceRange": { "min": 보수적 최소유로, "max": 현실적 최대유로 },
        "insights": ["구체적인 감가 요인 분석", "현지 마켓 실거래가와 비교 분석"],
        "reasoning": "왜 이 가격으로 산출했는지 사진 속의 구체적인 하자를 근거로 설명"
      }
      반드시 한국어로 작성하세요.`;


            const result = await model.generateContent([prompt, ...imageParts]);
            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

            setAnalysis(data);
        } catch (error) {
            console.error('Deep Analysis failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#30e86e" />
                    <Text style={styles.loadingText}>{t('ai.analyzingPrice')}</Text>
                </View>
            );
        }

        if (!analysis) {
            return (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{t('common.error')}</Text>
                    <Pressable
                        style={styles.retryBtn}
                        onPress={() => imageUris && imageUris.length > 0 && runDeepAnalysis(imageUris)}
                    >
                        <Text style={styles.retryBtnText}>{t('common.confirm')}</Text>
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
                            <Text style={styles.demandText}>{t('ai.demand')}: {analysis.marketDemand}</Text>
                        </View>
                        <View style={styles.conditionBadge}>
                            <Text style={styles.conditionText}>{t('ai.conditionScore')}: {analysis.conditionScore}/10</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.priceCard}>
                    <Text style={styles.cardTitle}>{t('ai.predictionRange')} 🎯</Text>
                    <Text style={styles.priceRange}>
                        €{analysis.priceRange.min} — €{analysis.priceRange.max}
                    </Text>
                    <View style={styles.graphContainer}>
                        <View style={styles.graphBar} />
                        <View style={[styles.graphIndicator, { left: '60%' }]} />
                    </View>
                    <Text style={styles.reasoning}>{analysis.reasoning}</Text>
                </View>

                <View style={styles.insightSection}>
                    <Text style={styles.sectionTitle}>{t('ai.marketReport')} ✨</Text>
                    {analysis.insights.map((insight: string, idx: number) => (
                        <View key={idx} style={styles.insightRow}>
                            <MaterialIcons name="insights" size={16} color="#30e86e" />
                            <Text style={styles.insightText}>{insight}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.actionRow}>
                    <Pressable style={styles.applyBtn} onPress={handleApplyPrice}>
                        <Text style={styles.applyBtnText}>{t('ai.applyPrice')}</Text>
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
                <Text style={styles.headerTitle}>Adon Vision AI</Text>
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
