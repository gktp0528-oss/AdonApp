import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions
} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

interface TransactionCompletionProps {
    onReviewPress: () => void;
    onHomePress: () => void;
    isChatView?: boolean;
    isSeller?: boolean;
    hasReview?: boolean;
}

const { width } = Dimensions.get('window');

export const TransactionCompletion: React.FC<TransactionCompletionProps> = ({
    onReviewPress,
    onHomePress,
    isChatView = false,
    isSeller = false,
    hasReview = false
}) => {
    const { t } = useTranslation();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <View style={[styles.container, isChatView && styles.chatContainer]}>
            <View style={styles.background} />

            <Animated.View
                style={[
                    styles.iconContainer,
                    isChatView && styles.chatIconContainer,
                    { transform: [{ scale: scaleAnim }] }
                ]}
            >
                <View style={[styles.iconCircle, isChatView && styles.chatIconCircle]}>
                    <MaterialIcons name="check" size={isChatView ? 32 : 48} color="#22c55e" />
                </View>
            </Animated.View>

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                <Text style={[styles.title, isChatView && styles.chatTitle]}>
                    {t('screen.transaction.celebration.title')}
                </Text>
                <Text style={[styles.subtitle, isChatView && styles.chatSubtitle]}>
                    {t('screen.transaction.celebration.subtitle')}
                </Text>

                <View style={styles.card}>
                    {!isSeller && !hasReview && (
                        <TouchableOpacity
                            style={styles.reviewButton}
                            onPress={onReviewPress}
                            activeOpacity={0.8}
                        >
                            <View style={styles.reviewContent}>
                                <MaterialIcons name="star" size={20} color="#fbbf24" style={{ marginRight: 8 }} />
                                <Text style={styles.reviewButtonText}>
                                    {t('screen.transaction.celebration.reviewBtn')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {!isSeller && hasReview && (
                        <View style={[styles.reviewButton, styles.reviewDoneContainer]}>
                            <View style={styles.reviewContent}>
                                <MaterialIcons name="check-circle" size={20} color="#16a34a" style={{ marginRight: 8 }} />
                                <Text style={[styles.reviewButtonText, { color: '#64748b' }]}>
                                    {t('screen.transaction.celebration.reviewDone')}
                                </Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={onHomePress}
                    >
                        <Text style={styles.homeButtonText}>
                            {t('screen.transaction.celebration.homeBtn')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 24,
        paddingTop: 40,
        width: '100%',
    },
    chatContainer: {
        width: '85%',
        padding: 20,
        borderRadius: 24,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
        backgroundColor: '#fff',
    },
    iconContainer: {
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatIconContainer: {
        marginBottom: 12,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0fdf4',
    },
    chatIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
        textAlign: 'center',
    },
    chatTitle: {
        fontSize: 18,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    chatSubtitle: {
        fontSize: 13,
        marginBottom: 16,
    },
    card: {
        width: '100%',
        gap: 10,
    },
    reviewButton: {
        width: '100%',
        borderRadius: 16,
        backgroundColor: '#0f172a',
        overflow: 'hidden',
    },
    reviewDoneContainer: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    reviewContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    reviewButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    homeButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#fff',
    },
    homeButtonText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
});
