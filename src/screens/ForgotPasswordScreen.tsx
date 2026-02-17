import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TextInput, View, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { authService } from '../services/authService';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email.trim()) {
            Alert.alert(t('screen.login.alert.inputNeeded'), t('screen.login.alert.emailMissing'));
            return;
        }

        setLoading(true);
        try {
            await authService.sendPasswordResetEmail(email);
            Alert.alert(
                t('screen.forgotPassword.successTitle'),
                t('screen.forgotPassword.successMessage'),
                [{ text: t('common.confirm'), onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            // Firebase specific error codes handling could be added here
            Alert.alert(t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('screen.forgotPassword.title')}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="lock-open-outline" size={64} color={theme.colors.primary} />
                        </View>

                        <Text style={styles.description}>
                            {t('screen.forgotPassword.description')}
                        </Text>

                        <View style={styles.formContainer}>
                            <Text style={styles.label}>{t('screen.login.label.email')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('screen.login.placeholder.email')}
                                placeholderTextColor={theme.colors.muted}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />

                            <View style={styles.spacer} />

                            <PrimaryButton
                                label={loading ? t('common.loading') : t('screen.forgotPassword.submit')}
                                onPress={handleResetPassword}
                                disabled={loading}
                            />
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    description: {
        fontSize: 14,
        color: theme.colors.muted,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    formContainer: {
        flex: 1,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.muted,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: theme.colors.text,
        marginBottom: 20,
    },
    spacer: {
        height: 20,
    },
});
