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
import { RootStackParamList } from '../navigation/types';
import { getGenerativeModel } from "firebase/ai";
import { aiBackend } from '../firebaseConfig';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'AiPriceAssistant'>;

export default function AiPriceAssistantScreen({ navigation, route }: Props) {
    const { imageUris, initialPrice } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<any>(null);

    useEffect(() => {
        if (imageUris && imageUris.length > 0) {
            runDeepAnalysis(imageUris);
        } else {
            setLoading(false);
        }
    }, [imageUris]);

    const runDeepAnalysis = async (uris: string[]) => {
        try {
            const model = getGenerativeModel(aiBackend, { model: "gemini-2.0-flash" });

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

            const prompt = `당신은 유럽 전역의 중고 마켓을 꿰뚫고 있는 시세 전문가입니다. 
      어떤 종류의 제품이든(전자제품, 명품, 패션 등) 사진 속의 마커(단자, 각인, 로고, 재질 패턴 등)를 통해 정확한 이름과 가치를 뽑아내세요.
      
      다음 JSON 형식으로 상세 리포트를 작성해주세요:
      {
        "itemName": "식별된 정확한 모델명 (예: Apple AirPods Pro 2nd Gen USB-C / Hermès Birkin 30 등)",
        "conditionScore": 1~10 사이 점수,
        "marketDemand": "유럽 내 수요 (High/Medium/Low)",
        "priceRange": { "min": 최소유로, "max": 최대유로 },
        "insights": ["모델별 사양 차이", "상태 분석 결과", "유럽 주요 도시별 시세"],
        "reasoning": "왜 이 모델로 판정했는지 사진 속의 시각적 근거를 바탕으로 한 상세 설명"
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
                    <Text style={styles.loadingText}>모든 상품 사진을 정밀 분석 중이에요... ✨</Text>
                </View>
            );
        }

        if (!analysis) {
            return (
                <View style={styles.center}>
                    <Text style={styles.errorText}>분석 정보를 가져오지 못했어요. 😢</Text>
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
                            <Text style={styles.demandText}>수요: {analysis.marketDemand}</Text>
                        </View>
                        <View style={styles.conditionBadge}>
                            <Text style={styles.conditionText}>상태 점수: {analysis.conditionScore}/10</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.priceCard}>
                    <Text style={styles.cardTitle}>추천 거래 범위 (Multi-Photo Analyzed)</Text>
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
                    <Text style={styles.sectionTitle}>전문가 인사이트 ✨</Text>
                    {analysis.insights.map((insight: string, idx: number) => (
                        <View key={idx} style={styles.insightRow}>
                            <MaterialIcons name="insights" size={16} color="#30e86e" />
                            <Text style={styles.insightText}>{insight}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.actionRow}>
                    <Pressable style={styles.applyBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.applyBtnText}>이 가격으로 확정하기</Text>
                    </Pressable>
                </View>
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </Pressable>
                <Text style={styles.headerTitle}>AI Multi-Price Assistant</Text>
                <View style={{ width: 24 }} />
            </View>
            {renderContent()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { color: '#94a3b8', marginTop: 16, textAlign: 'center', lineHeight: 24 },
    errorText: { color: '#ef4444', textAlign: 'center' },
    scrollContent: { padding: 20 },
    photoList: { flexDirection: 'row', marginBottom: 24, gap: 12 },
    listImage: { width: 140, height: 140, borderRadius: 16 },
    itemInfo: { marginBottom: 24 },
    itemName: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 12 },
    badgeRow: { flexDirection: 'row', gap: 8 },
    demandBadge: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    demandText: { color: '#30e86e', fontSize: 13, fontWeight: '600' },
    conditionBadge: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    conditionText: { color: '#94a3b8', fontSize: 13 },
    priceCard: { backgroundColor: '#1e293b', borderRadius: 28, padding: 28, marginBottom: 24 },
    cardTitle: { color: '#94a3b8', fontSize: 14, marginBottom: 12 },
    priceRange: { color: '#30e86e', fontSize: 36, fontWeight: '800', marginBottom: 20 },
    graphContainer: { height: 10, backgroundColor: '#334155', borderRadius: 5, marginBottom: 24, position: 'relative' },
    graphBar: { position: 'absolute', left: '20%', right: '20%', height: '100%', backgroundColor: '#30e86e', borderRadius: 5, opacity: 0.3 },
    graphIndicator: { position: 'absolute', width: 4, height: 20, backgroundColor: '#30e86e', borderRadius: 2, top: -5 },
    reasoning: { color: '#cbd5e1', fontSize: 15, lineHeight: 24 },
    insightSection: { marginBottom: 32 },
    sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 20 },
    insightRow: { flexDirection: 'row', gap: 14, marginBottom: 14, alignItems: 'flex-start' },
    insightText: { color: '#94a3b8', fontSize: 15, flex: 1, lineHeight: 22 },
    actionRow: { marginTop: 16 },
    applyBtn: { backgroundColor: '#30e86e', height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#30e86e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    applyBtnText: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
});
