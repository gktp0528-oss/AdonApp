import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';
import { authService } from '../services/authService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'NicknameSetup'>;

export function NicknameSetupScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!nickname.trim()) {
            Alert.alert(t('common.error'), t('screen.nickname.error.empty'));
            return;
        }
        if (nickname.trim().length < 2) {
            Alert.alert(t('common.error'), t('screen.nickname.error.tooShort'));
            return;
        }

        setLoading(true);
        try {
            const user = authService.getCurrentUser();
            if (user) {
                await updateDoc(doc(db, 'users', user.uid), {
                    name: nickname.trim()
                });
                navigation.replace('OnboardingFinish');
            } else {
                throw new Error('User not found');
            }
        } catch (error: any) {
            console.error('Failed to update nickname:', error);
            Alert.alert(t('common.error'), t('screen.nickname.error.failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <View style={styles.content}>
                        <Text style={styles.title}>{t('screen.nickname.title')}</Text>
                        <Text style={styles.subtitle}>{t('screen.nickname.subtitle')}</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('screen.nickname.label')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('screen.nickname.placeholder')}
                                value={nickname}
                                onChangeText={setNickname}
                                maxLength={20}
                            />
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <PrimaryButton
                            label={loading ? t('common.loading') : t('screen.nickname.confirm')}
                            onPress={handleConfirm}
                            disabled={loading}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    content: {
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.text,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.muted,
        lineHeight: 24,
        marginBottom: 40,
    },
    inputContainer: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 18,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    footer: {
        width: '100%',
    },
});
