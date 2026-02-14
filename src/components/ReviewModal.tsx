import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StarRating } from './StarRating';

interface ReviewModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isVisible, onClose, onSubmit }) => {
    const { t } = useTranslation();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSubmit(rating, comment);
            // Reset form after successful submission (or let parent handle it)
            setComment('');
            setRating(5);
        } catch (error) {
            console.error('Submit review error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <View style={styles.contentContainer}>
                        <View style={styles.handle} />

                        <View style={styles.header}>
                            <Text style={styles.title}>{t('transaction.review.prompt')}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <MaterialIcons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.ratingContainer}>
                            <StarRating
                                rating={rating}
                                size={40}
                                onRatingChange={setRating}
                            />
                            <Text style={styles.ratingText}>{rating} / 5</Text>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder={t('transaction.review.placeholder')}
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={4}
                            value={comment}
                            onChangeText={setComment}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>{t('transaction.review.submit')}</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.laterButton} onPress={onClose}>
                            <Text style={styles.laterButtonText}>{t('transaction.review.later')}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    contentContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        lineHeight: 28,
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    ratingContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fbbf24',
        marginTop: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        minHeight: 120,
        fontSize: 16,
        color: '#0f172a',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    submitButton: {
        backgroundColor: '#0f172a',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    laterButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    laterButtonText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
});
