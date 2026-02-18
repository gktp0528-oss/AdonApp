import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    FlatList,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { RootStackParamList } from '../navigation/types';
import { userService } from '../services/userService';

type Props = NativeStackScreenProps<RootStackParamList, 'Keywords'>;

export function KeywordsScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [keyword, setKeyword] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const userId = userService.getCurrentUserId();

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const unsubscribe = userService.watchUserById(userId, (user) => {
            if (user) {
                setKeywords(user.keywords || []);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleAddKeyword = async () => {
        const trimmed = keyword.trim();
        if (!trimmed) return;
        if (keywords.includes(trimmed)) {
            Alert.alert(t('screen.keywords.alreadyExists'));
            return;
        }
        if (keywords.length >= 10) {
            Alert.alert(t('screen.keywords.maxLimit'));
            return;
        }

        try {
            setAdding(true);
            await userService.addKeyword(userId, trimmed);
            setKeyword('');
        } catch (error) {
            Alert.alert(t('common.error'), t('screen.keywords.addError'));
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveKeyword = (item: string) => {
        Alert.alert(
            t('screen.keywords.deleteTitle'),
            t('screen.keywords.deleteMessage', { keyword: item }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await userService.removeKeyword(userId, item);
                        } catch (error) {
                            Alert.alert(t('common.error'), t('screen.keywords.removeError'));
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
                </Pressable>
                <Text style={styles.headerTitle}>{t('screen.keywords.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.inputSection}>
                    <Text style={styles.description}>
                        {t('screen.keywords.description')}
                    </Text>
                    <View style={styles.searchBar}>
                        <TextInput
                            style={styles.input}
                            placeholder={t('screen.keywords.placeholder')}
                            value={keyword}
                            onChangeText={setKeyword}
                            onSubmitEditing={handleAddKeyword}
                        />
                        <Pressable
                            style={[styles.addBtn, !keyword.trim() && styles.addBtnDisabled]}
                            onPress={handleAddKeyword}
                            disabled={!keyword.trim() || adding}
                        >
                            {adding ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.addBtnText}>{t('common.add')}</Text>
                            )}
                        </Pressable>
                    </View>
                    <Text style={styles.limitText}>
                        {keywords.length} / 10
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color="#16a34a" />
                    </View>
                ) : (
                    <FlatList
                        data={keywords}
                        keyExtractor={(item) => item}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <View style={styles.keywordCard}>
                                <Text style={styles.keywordText}>{item}</Text>
                                <Pressable
                                    onPress={() => handleRemoveKeyword(item)}
                                    style={styles.deleteBtn}
                                >
                                    <MaterialIcons name="close" size={20} color="#9ca3af" />
                                </Pressable>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialIcons name="notifications-none" size={48} color="#d1d5db" />
                                <Text style={styles.emptyText}>
                                    {t('screen.keywords.empty')}
                                </Text>
                            </View>
                        }
                    />
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f9fafb' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    backBtn: { padding: 4 },
    inputSection: {
        padding: 16,
        backgroundColor: '#fff',
    },
    description: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
        lineHeight: 20,
    },
    searchBar: {
        flexDirection: 'row',
        gap: 8,
    },
    input: {
        flex: 1,
        height: 48,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#111827',
    },
    addBtn: {
        backgroundColor: '#16a34a',
        paddingHorizontal: 20,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtnDisabled: {
        backgroundColor: '#86efac',
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    limitText: {
        alignSelf: 'flex-end',
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 8,
    },
    listContent: {
        padding: 16,
    },
    keywordCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    keywordText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    deleteBtn: {
        padding: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
    },
});
