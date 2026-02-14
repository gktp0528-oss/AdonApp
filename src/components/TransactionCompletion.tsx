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
}

const { width } = Dimensions.get('window');

export const TransactionCompletion: React.FC<TransactionCompletionProps> = ({ onReviewPress, onHomePress, isChatView = false }) => {
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
            <LinearGradient
                colors={['#f0fdf4', '#ffffff']}
                style={styles.background}
            />

            <Animated.View
                style={[
                    styles.iconContainer,
                    { transform: [{ scale: scaleAnim }] }
                ]}
            >
                <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    style={styles.iconCircle}
                >
                    <MaterialIcons name="check" size={48} color="#fff" />
                </LinearGradient>
            </Animated.View>

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                <Text style={styles.title}>{t('transaction.celebration.title')}</Text>
                <Text style={styles.subtitle}>{t('transaction.celebration.subtitle')}</Text>

                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.reviewButton}
                        onPress={onReviewPress}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#0f172a', '#1e293b']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.reviewGradient}
                        >
                            <MaterialIcons name="star" size={20} color="#fbbf24" style={{ marginRight: 8 }} />
                            <Text style={styles.reviewButtonText}>
                                {t('transaction.celebration.reviewBtn')}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={onHomePress}
                    >
                        <Text style={styles.homeButtonText}>
                            {t('transaction.celebration.homeBtn')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
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
        width: '90%',
        padding: 16,
        paddingTop: 24,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
    },
    iconContainer: {
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    card: {
        width: '100%',
        gap: 12,
    },
    reviewButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    reviewGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    reviewButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    homeButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#fff',
    },
    homeButtonText: {
        color: '#64748b',
        fontSize: 15,
        fontWeight: '600',
    },
});
