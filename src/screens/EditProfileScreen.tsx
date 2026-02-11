import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Image, ActivityIndicator, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';

import { RootStackParamList } from '../navigation/types';
import { userService } from '../services/userService';
import { PrimaryButton } from '../components/PrimaryButton';
import { User } from '../types/user';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const userId = userService.getCurrentUserId();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
            const user = await userService.getUserById(userId);
            if (user) {
                setName(user.name || '');
                setBio(user.reliabilityLabel || ''); // Using reliabilityLabel as bio for now, or add bio field later
                setLocation(user.location || '');
                setAvatar(user.avatar || '');
                setCoverImage(user.coverImage || '');
            }
        } catch (error) {
            console.error('Failed to load user', error);
            Alert.alert('Error', 'Failed to load profile');
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
            Alert.alert('Validation', 'Name cannot be empty');
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
                reliabilityLabel: bio, // Using this as bio/tagline
            };

            await userService.updateUser(userId, updates);
            navigation.goBack();
        } catch (error) {
            console.error('Failed to update profile', error);
            Alert.alert('Error', 'Failed to update profile');
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
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.coverSection}>
                    <Image
                        source={{ uri: coverImage || 'https://via.placeholder.com/400x225' }}
                        style={styles.coverPreview}
                    />
                    <Pressable style={styles.coverEditBtn} onPress={pickCoverImage}>
                        <MaterialIcons name="camera-alt" size={20} color="#fff" />
                        <Text style={styles.coverEditBtnText}>Change Cover</Text>
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
                    <Text style={styles.avatarHint}>Profile Photo</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Display Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Haeun Kim"
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Location</Text>
                    <TextInput
                        style={styles.input}
                        value={location}
                        onChangeText={setLocation}
                        placeholder="e.g. Berlin, Germany"
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Bio / Tagline</Text>
                    <TextInput
                        style={styles.input}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="e.g. Vintage collector & fashion lover"
                        placeholderTextColor="#9ca3af"
                    />
                </View>

            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <PrimaryButton
                    label={saving ? "Saving..." : "Save Changes"}
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
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    }
});
