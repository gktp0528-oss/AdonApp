import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';
import { UnifiedAiReport } from '../types/listing';

type Props = NativeStackScreenProps<RootStackParamList, 'AiAnalysisResult'>;

const { width } = Dimensions.get('window');

export default function AiAnalysisResultScreen({ navigation, route }: Props) {
    const { report, imageUri } = route.params;
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
        navigation.navigate('AiListing', { appliedReport: report });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>ADON AI REPORT</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Hero Image Section */}
                <View style={styles.heroSection}>
                    <Image source={{ uri: imageUri }} style={styles.heroImage} />
                    <View style={styles.heroOverlay} />
                    <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.badge}>
                            <MaterialIcons name="auto-awesome" size={16} color="#000" />
                            <Text style={styles.badgeText}>AI ANALYZED</Text>
                        </View>
                        <Text style={styles.itemName}>{report.itemName}</Text>
                        <Text style={styles.marketDemand}>{report.marketDemand} DEMAND</Text>
                    </Animated.View>
                </View>

                {/* Score & Price Card */}
                <Animated.View style={[styles.statsCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>CONDITION</Text>
                        <View style={styles.scoreCircle}>
                            <Text style={styles.scoreValue}>{report.conditionScore ?? '?'}</Text>
                            <Text style={styles.scoreMax}>/10</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>ESTIMATED VALUE</Text>
                        <Text style={styles.priceValue}>
                            {report.priceRange
                                ? `€${report.priceRange.min} - €${report.priceRange.max}`
                                : 'N/A'}
                        </Text>
                    </View>
                </Animated.View>

                {/* Insights Section */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>KEY INSIGHTS</Text>
                    {report.insights.map((insight: string, index: number) => (
                        <View key={index} style={styles.insightRow}>
                            <MaterialIcons name="check-circle" size={20} color="#22c55e" />
                            <Text style={styles.insightText}>{insight}</Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Reasoning Section */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>ANALYSIS SUMMARY</Text>
                    <Text style={styles.reasoningText}>{report.reasoning}</Text>
                </Animated.View>
            </ScrollView>

            {/* Floating Action Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                    <Text style={styles.applyBtnText}>Apply to Listing</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#000" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    content: { paddingBottom: 100 },
    heroSection: {
        height: 350,
        justifyContent: 'flex-end',
        padding: 20,
        marginBottom: 20,
    },
    heroImage: {
        ...StyleSheet.absoluteFillObject,
        resizeMode: 'cover',
        opacity: 0.6,
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 100%)', // Mock gradient
        opacity: 0.8,
    },
    heroContent: { gap: 8 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#30e86e',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
        gap: 6,
    },
    badgeText: { fontSize: 12, fontWeight: '800', color: '#000' },
    itemName: { fontSize: 32, fontWeight: '800', color: '#fff', lineHeight: 36 },
    marketDemand: { fontSize: 14, color: '#94a3b8', fontWeight: '600', letterSpacing: 1 },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: '#111',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 30,
    },
    statItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    divider: { width: 1, backgroundColor: '#333', marginHorizontal: 20 },
    statLabel: { fontSize: 12, color: '#64748b', fontWeight: '700', marginBottom: 8 },
    scoreCircle: { flexDirection: 'row', alignItems: 'baseline' },
    scoreValue: { fontSize: 36, fontWeight: '800', color: '#fff' },
    scoreMax: { fontSize: 16, color: '#64748b', marginLeft: 2 },
    priceValue: { fontSize: 24, fontWeight: '800', color: '#30e86e' },
    section: { paddingHorizontal: 20, marginBottom: 30 },
    sectionTitle: { fontSize: 14, color: '#64748b', fontWeight: '800', marginBottom: 16, letterSpacing: 0.5 },
    insightRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    insightText: { flex: 1, color: '#e2e8f0', fontSize: 15, lineHeight: 22 },
    reasoningText: { color: '#94a3b8', fontSize: 15, lineHeight: 24 },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    applyBtn: {
        backgroundColor: '#30e86e',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 8,
        shadowColor: '#30e86e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    applyBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
