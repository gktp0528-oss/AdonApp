import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Image, ActivityIndicator, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

import { RootStackParamList } from '../navigation/types';
import { userService } from '../services/userService';
import { PrimaryButton } from '../components/PrimaryButton';
import { User } from '../types/user';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const userId = userService.getCurrentUserId();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [avatar, setAvatar] = useState('');
    const [coverImage, setCoverImage] = useState('');

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            setLoadError(null);
            const user = await userService.getUserById(userId);
            if (user) {
                setName(user.name || '');
                setBio(user.bio || user.reliabilityLabel || '');
                setLocation(user.location || '');
                setAvatar(user.avatar || '');
                setCoverImage(user.coverImage || '');
            }
        } catch (error) {
            console.error('Failed to load user', error);
            setLoadError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const pickAvatar = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
        }
    };

    const pickCoverImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });

        if (!result.canceled) {
            setCoverImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert(t('common.error'), t('signup.emailPlaceholder'));
            return;
        }

        setSaving(true);
        try {
            // In a real app, upload avatar to Storage first if it's a local URI
            // For now, we just save the URI (if standard expo-image-picker local uri) 
            // or keep existing remote URL.
            // Note: Local URIs won't work on other devices, implementing storage upload is recommended.

            const updates: Partial<User> = {
                name,
                location,
                avatar,
                coverImage,
                bio,
            };

            await userService.updateUser(userId, updates);
            navigation.goBack();
        } catch (error) {
            console.error('Failed to update profile', error);
            Alert.alert(t('common.error'), t('product.shareError'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.root, styles.center]}>
                <ActivityIndicator size="large" color="#16a34a" />
            </View>
        );
    }

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
                </Pressable>
                <Text style={styles.headerTitle}>{t('seller.editProfile')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {loadError ? (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorBannerText}>{loadError}</Text>
                        <Pressable style={styles.retryBtn} onPress={loadUserProfile}>
                            <Text style={styles.retryBtnText}>{t('common.confirm')}</Text>
                        </Pressable>
                    </View>
                ) : null}
                <View style={styles.coverSection}>
                    <Image
                        source={{ uri: coverImage || 'https://via.placeholder.com/400x225' }}
                        style={styles.coverPreview}
                    />
                    <Pressable style={styles.coverEditBtn} onPress={pickCoverImage}>
                        <MaterialIcons name="camera-alt" size={20} color="#fff" />
                        <Text style={styles.coverEditBtnText}>{t('ai.studioTitle')}</Text>
                    </Pressable>
                </View>

                <View style={styles.avatarSection}>
                    <Pressable onPress={pickAvatar} style={styles.avatarBtn}>
                        <Image
                            source={{ uri: avatar || 'https://via.placeholder.com/150' }}
                            style={styles.avatar}
                        />
                        <View style={styles.editIconBadge}>
                            <MaterialIcons name="edit" size={16} color="#fff" />
                        </View>
                    </Pressable>
                    <Text style={styles.avatarHint}>{t('signup.profileImage')}</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>{t('signup.name')}</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="예: Haeun Kim"
                        placeholderTextColor="#6b7280"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>{t('common.online')}</Text>
                    <TextInput
                        style={styles.input}
                        value={location}
                        onChangeText={setLocation}
                        placeholder="예: Berlin, Germany"
                        placeholderTextColor="#6b7280"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>{t('seller.verifiedSellerMsg')}</Text>
                    <TextInput
                        style={styles.input}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="예: 빈티지 수집가, 패션 러버"
                        placeholderTextColor="#6b7280"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>{t('common.language')}</Text>
                    <View style={styles.langChips}>
                        <Pressable
                            style={[styles.langChip, i18n.language === 'ko' && styles.langChipActive]}
                            onPress={() => i18n.changeLanguage('ko')}
                        >
                            <Text style={[styles.langChipText, i18n.language === 'ko' && styles.langChipActiveText]}>
                                {t('common.korean')}
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[styles.langChip, i18n.language === 'en' && styles.langChipActive]}
                            onPress={() => i18n.changeLanguage('en')}
                        >
                            <Text style={[styles.langChipText, i18n.language === 'en' && styles.langChipActiveText]}>
                                {t('common.english')}
                            </Text>
                        </Pressable>
                    </View>
                </View>

            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <PrimaryButton
                    label={saving ? t('post.posting') : t('common.confirm')}
                    onPress={handleSave}
                    disabled={saving}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#fff' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    backBtn: { padding: 4 },
    content: { paddingBottom: 40 },
    errorBanner: {
        margin: 16,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
        backgroundColor: '#fff1f2',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    errorBannerText: {
        flex: 1,
        color: '#b91c1c',
        fontSize: 13,
        fontWeight: '600',
    },
    retryBtn: {
        borderRadius: 8,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#fecaca',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    retryBtnText: {
        color: '#b91c1c',
        fontWeight: '700',
        fontSize: 12,
    },
    coverSection: { height: 200, backgroundColor: '#f3f4f6', marginBottom: 60 },
    coverPreview: { width: '100%', height: '100%' },
    coverEditBtn: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    coverEditBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    avatarSection: { alignItems: 'center', marginTop: -50, marginBottom: 32 },
    avatarBtn: {
        borderWidth: 4,
        borderColor: '#fff',
        borderRadius: 54,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f3f4f6' },
    editIconBadge: {
        position: 'absolute',
        right: -4,
        bottom: -4,
        backgroundColor: '#16a34a',
        padding: 6,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarHint: { marginTop: 8, color: '#6b7280', fontSize: 13, fontWeight: '600' },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
    },
    langChips: { flexDirection: 'row', gap: 10 },
    langChip: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    langChipActive: {
        borderColor: '#16a34a',
        backgroundColor: '#f0fdf4',
    },
    langChipText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
    langChipActiveText: { color: '#16a34a' },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    }
});
