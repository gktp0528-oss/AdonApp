import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { StarRating } from '../components/StarRating';
import { reviewService } from '../services/reviewService';
import { userService } from '../services/userService';
import { DetailBackButton } from '../components/DetailBackButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export default function ReviewScreen({ route, navigation }: Props) {
    const { transactionId, sellerId, listingId } = route.params;
    const { t } = useTranslation();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const currentUserId = userService.getCurrentUserId();

    const handleSubmit = async () => {
        if (!currentUserId) return;

        setSubmitting(true);
        try {
            await reviewService.submitReview({
                transactionId,
                listingId,
                reviewerId: currentUserId,
                revieweeId: sellerId,
                rating,
                comment,
            });

            // Send system message to chat if possible (we need conversationId)
            // For now, we just show success and go back
            Alert.alert(t('common.success'), t('screen.review.success'));

            navigation.navigate('Home');
        } catch (error) {
            console.error('Review submission error:', error);
            Alert.alert(t('common.error'), t('common.error'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <DetailBackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>{t('screen.review.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <Text style={styles.prompt}>{t('screen.review.ratingPrompt')}</Text>
                        <View style={styles.starContainer}>
                            <StarRating
                                rating={rating}
                                size={40}
                                onRatingChange={setRating}
                            />
                            <Text style={styles.ratingValue}>{rating} / 5</Text>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder={t('screen.review.commentPlaceholder')}
                            multiline
                            numberOfLines={4}
                            value={comment}
                            onChangeText={setComment}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && styles.btnDisabled]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>{t('screen.review.submit')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    scrollContent: { padding: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    prompt: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 20, textAlign: 'center' },
    starContainer: { alignItems: 'center', marginBottom: 30 },
    ratingValue: { fontSize: 16, fontWeight: '700', color: '#fbbf24', marginTop: 12 },
    input: {
        width: '100%',
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        padding: 16,
        height: 120,
        fontSize: 16,
        color: '#0f172a',
        marginBottom: 24,
    },
    submitBtn: {
        width: '100%',
        backgroundColor: '#0f172a',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    btnDisabled: { opacity: 0.7 },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
