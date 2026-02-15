import React, { useState, useEffect } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    Platform,
    Keyboard,
    KeyboardAvoidingView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { AdonHeader } from '../components/AdonHeader';
import { listingService } from '../services/listingService';
import { Listing, ListingCondition } from '../types/listing';
import { formatCurrency } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'EditListing'>;

export default function EditListingScreen({ navigation, route }: Props) {
    const { listingId } = route.params;
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [condition, setCondition] = useState<ListingCondition>('Good');
    const [description, setDescription] = useState('');
    const [listing, setListing] = useState<Listing | null>(null);

    const conditions: ListingCondition[] = ['New', 'Like New', 'Good', 'Fair'];
    const conditionLabelMap: Record<ListingCondition, string> = {
        New: t('common.condition.new'),
        'Like New': t('common.condition.likeNew'),
        Good: t('common.condition.good'),
        Fair: t('common.condition.fair'),
    };

    useEffect(() => {
        loadListing();

        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const loadListing = async () => {
        try {
            const data = await listingService.getListingById(listingId);
            if (data) {
                setListing(data);
                setTitle(data.title);
                setPrice(data.price.toString());
                setCategory(data.category);
                setCondition(data.condition);
                setDescription(data.description);
            } else {
                Alert.alert(t('screen.product.error.notFound'));
                navigation.goBack();
            }
        } catch (error) {
            console.error('Failed to load listing for edit:', error);
            Alert.alert(t('screen.product.error.load'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (isUpdating) return;

        const normalizedPrice = Number(price.replace(',', '.'));
        if (!title.trim() || !normalizedPrice || normalizedPrice <= 0 || !description.trim()) {
            Alert.alert(t('screen.aiListing.alert.title'), t('screen.aiListing.alert.description'));
            return;
        }

        setIsUpdating(true);
        try {
            await listingService.updateListing(listingId, {
                title: title.trim(),
                price: normalizedPrice,
                category,
                condition,
                description: description.trim(),
            });

            Alert.alert(t('common.success'), t('common.save'), [
                { text: t('common.confirm'), onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Failed to update listing:', error);
            Alert.alert(t('common.error'));
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color="#16a34a" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
            <AdonHeader
                title={t('screen.aiListing.edit.title', 'Edit Listing')}
                showBack={true}
                onBack={() => navigation.goBack()}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Price Input - Highlighted for importance */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('screen.aiListing.label.price')}</Text>
                        <View style={styles.priceContainer}>
                            <Text style={styles.currencySymbol}>€</Text>
                            <TextInput
                                style={styles.priceInput}
                                keyboardType="numeric"
                                value={price}
                                onChangeText={setPrice}
                            />
                        </View>
                        <Text style={styles.hint}>{t('screen.priceDrop.description_short')}</Text>
                    </View>

                    {/* Title */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('screen.aiListing.label.title')}</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    {/* Condition */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('screen.aiListing.label.condition')}</Text>
                        <View style={styles.conditionRow}>
                            {conditions.map((c) => (
                                <Pressable
                                    key={c}
                                    style={[styles.conditionChip, condition === c && styles.conditionChipActive]}
                                    onPress={() => setCondition(c)}
                                >
                                    <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
                                        {conditionLabelMap[c]}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('screen.aiListing.label.description')}</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            multiline
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                </ScrollView>

                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <Pressable
                        style={[styles.ctaBtn, isUpdating && styles.ctaBtnDisabled]}
                        onPress={handleUpdate}
                        disabled={isUpdating}
                    >
                        {isUpdating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.ctaText}>{t('common.save')}</Text>
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#fff' },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20 },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#0f172a',
    },
    textArea: { height: 120 },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    currencySymbol: { fontSize: 20, fontWeight: '700', color: '#16a34a', marginRight: 8 },
    priceInput: { flex: 1, height: 56, fontSize: 24, fontWeight: '800', color: '#16a34a' },
    hint: { fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' },
    conditionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    conditionChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    conditionChipActive: { backgroundColor: '#19e61b', borderColor: '#19e61b' },
    conditionText: { fontSize: 13, color: '#475569', fontWeight: '600' },
    conditionTextActive: { color: '#0f172a', fontWeight: '800' },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    ctaBtn: {
        backgroundColor: '#16a34a',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    ctaBtnDisabled: { opacity: 0.6 },
    ctaText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
