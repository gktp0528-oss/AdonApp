import React, { useState } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';
import { userService } from '../services/userService';

type Props = NativeStackScreenProps<RootStackParamList, 'SocialConsent'>;

export function SocialConsentScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [ageConfirmed, setAgeConfirmed] = useState(false);
    const [marketingOptIn, setMarketingOptIn] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        setLoading(true);
        try {
            const userId = userService.getCurrentUserId();
            if (userId) {
                await userService.updateUser(userId, {
                    consentedAt: new Date().toISOString(),
                    marketingOptIn,
                });
            }
            navigation.replace('Welcome');
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.iconWrap}>
                    <Ionicons name="shield-checkmark" size={56} color={theme.colors.primary} />
                </View>

                <Text style={styles.title}>{t('screen.socialConsent.title')}</Text>
                <Text style={styles.subtitle}>{t('screen.socialConsent.subtitle')}</Text>

                <View style={styles.consentSection}>
                    {/* Terms & Privacy — required */}
                    <View style={styles.checkboxRow}>
                        <TouchableOpacity onPress={() => setAgreedToTerms(!agreedToTerms)} style={styles.checkboxTouch}>
                            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                                {agreedToTerms && <Ionicons name="checkmark" size={12} color="#fff" />}
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.checkboxLabel} onPress={() => setAgreedToTerms(!agreedToTerms)}>
                            {t('screen.signup.termsPrefix')}{' '}
                            <Text style={styles.termsLink} onPress={() => navigation.navigate('Legal', { type: 'terms' })}>
                                {t('screen.signup.termsLink')}
                            </Text>
                            {' '}{t('screen.signup.termsAnd')}{' '}
                            <Text style={styles.termsLink} onPress={() => navigation.navigate('Legal', { type: 'privacy' })}>
                                {t('screen.signup.privacyLink')}
                            </Text>
                            {' *'}
                        </Text>
                    </View>

                    {/* Age confirmation — required */}
                    <View style={styles.checkboxRow}>
                        <TouchableOpacity onPress={() => setAgeConfirmed(!ageConfirmed)} style={styles.checkboxTouch}>
                            <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
                                {ageConfirmed && <Ionicons name="checkmark" size={12} color="#fff" />}
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.checkboxLabel} onPress={() => setAgeConfirmed(!ageConfirmed)}>
                            {t('screen.signup.consentAge')}{' *'}
                        </Text>
                    </View>

                    {/* Marketing opt-in — optional */}
                    <View style={styles.checkboxRow}>
                        <TouchableOpacity onPress={() => setMarketingOptIn(!marketingOptIn)} style={styles.checkboxTouch}>
                            <View style={[styles.checkbox, marketingOptIn && styles.checkboxChecked]}>
                                {marketingOptIn && <Ionicons name="checkmark" size={12} color="#fff" />}
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.checkboxLabel} onPress={() => setMarketingOptIn(!marketingOptIn)}>
                            {t('screen.signup.consentMarketing')}
                        </Text>
                    </View>

                    <Text style={styles.requiredNote}>* {t('screen.signup.required')}</Text>
                </View>

                <View style={{ height: 24 }} />

                <PrimaryButton
                    label={loading ? t('common.loading') : t('screen.socialConsent.continue')}
                    onPress={handleContinue}
                    disabled={loading || !agreedToTerms || !ageConfirmed}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 40,
    },
    iconWrap: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.muted,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    consentSection: {
        gap: 12,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    checkboxTouch: {
        paddingTop: 1,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.muted,
        lineHeight: 20,
    },
    termsLink: {
        color: theme.colors.primary,
        textDecorationLine: 'underline',
    },
    requiredNote: {
        fontSize: 11,
        color: theme.colors.muted,
        marginTop: 4,
    },
});
