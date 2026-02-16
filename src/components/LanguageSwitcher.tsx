import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Modal, Pressable, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage, SUPPORTED_LANGUAGES, AppLanguage } from '../i18n';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [modalVisible, setModalVisible] = useState(false);

    const currentLanguage = i18n.language as AppLanguage;

    const languageNames: Record<AppLanguage, string> = {
        ko: '한국어',
        en: 'English',
        hu: 'Magyar',
    };

    const handleLanguageChange = async (lang: AppLanguage) => {
        await changeAppLanguage(lang);
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={styles.triggerButton}
                activeOpacity={0.7}
            >
                <View style={[styles.blurWrapper, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>
                    <Text style={styles.triggerText}>{languageNames[currentLanguage] || currentLanguage.toUpperCase()}</Text>
                    <Ionicons name="chevron-down" size={14} color={theme.colors.text} />
                </View>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />

                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Language</Text>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <TouchableOpacity
                                key={lang}
                                style={[
                                    styles.langOption,
                                    currentLanguage === lang && styles.langOptionActive
                                ]}
                                onPress={() => handleLanguageChange(lang)}
                            >
                                <Text style={[
                                    styles.langText,
                                    currentLanguage === lang && styles.langTextActive
                                ]}>
                                    {languageNames[lang]}
                                </Text>
                                {currentLanguage === lang && (
                                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.text} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 10,
        right: 0,
        zIndex: 100,
    },
    triggerButton: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    blurWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
    },
    triggerText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 300,
        backgroundColor: theme.colors.bg,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    langOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 8,
        backgroundColor: theme.colors.surface,
    },
    langOptionActive: {
        backgroundColor: theme.colors.primary,
    },
    langText: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.text,
    },
    langTextActive: {
        fontWeight: '700',
    },
});
