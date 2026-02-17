import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, AppState, AppStateStatus, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';
import { authService } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'EmailVerification'>;

export default function EmailVerificationScreen({ navigation, route }: Props) {
    const { t } = useTranslation();
    const { email } = route.params;
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Check verification status whenever app comes to foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                checkStatus();
            }
        });

        // Initial check 
        checkStatus();

        return () => {
            subscription.remove();
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const startTimer = () => {
        setTimer(60);
        intervalRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const checkStatus = async () => {
        const verified = await authService.isEmailVerified();
        if (verified) {
            navigation.replace('NicknameSetup');
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setLoading(true);
        try {
            await authService.sendVerificationEmail();
            startTimer();
            Alert.alert(t('common.success'), t('screen.verification.resendSuccess', 'Verification email sent again!'));
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const openMailApp = () => {
        Linking.openURL('mailto:');
    };

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="mail-open-outline" size={60} color={theme.colors.primary} />
                    </View>

                    <Text style={styles.title}>{t('screen.verification.title', 'Check your email')}</Text>
                    <Text style={styles.subtitle}>
                        {t('screen.verification.subtitle', 'We sent a verification link to')}
                        {"\n"}
                        <Text style={styles.emailHighlighted}>{email}</Text>
                    </Text>

                    <TouchableOpacity style={styles.mailButton} onPress={openMailApp}>
                        <Ionicons name="apps-outline" size={20} color={theme.colors.text} style={styles.btnIcon} />
                        <Text style={styles.mailButtonText}>{t('screen.verification.openMail', 'Open Mail App')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <PrimaryButton
                        label={t('screen.verification.checkConfirm', 'I\'ve verified my email')}
                        onPress={checkStatus}
                    />

                    <TouchableOpacity
                        style={[styles.resendButton, timer > 0 && styles.resendDisabled]}
                        onPress={handleResend}
                        disabled={timer > 0 || loading}
                    >
                        <Text style={styles.resendText}>
                            {timer > 0
                                ? `${t('screen.verification.resendCooldown', 'Resend in')} ${timer}s`
                                : t('screen.verification.resend', 'Resend verification email')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.muted,
        lineHeight: 26,
        textAlign: 'center',
        marginBottom: 32,
    },
    emailHighlighted: {
        color: theme.colors.text,
        fontWeight: '700',
    },
    mailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    btnIcon: {
        marginRight: 8,
    },
    mailButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    footer: {
        width: '100%',
    },
    resendButton: {
        marginTop: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    resendDisabled: {
        opacity: 0.5,
    },
    resendText: {
        fontSize: 14,
        color: theme.colors.muted,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});
