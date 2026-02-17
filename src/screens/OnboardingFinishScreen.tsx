import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';
import { notificationService } from '../services/notificationService';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingFinish'>;

export function OnboardingFinishScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, [scaleAnim]);

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.container}>
                <View style={styles.content}>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <Image
                            source={require('../../assets/images/onboarding-check.png')}
                            style={styles.icon}
                            contentFit="contain"
                        />
                    </Animated.View>
                    <Text style={styles.title}>{t('screen.onboardingFinish.title')}</Text>
                    <Text style={styles.subtitle}>{t('screen.onboardingFinish.subtitle')}</Text>
                </View>
                <View style={styles.footer}>
                    <View style={styles.notificationBox}>
                        <Text style={styles.notificationTitle}>{t('screen.onboardingFinish.notificationsTitle')}</Text>
                        <Text style={styles.notificationSubtitle}>{t('screen.onboardingFinish.notificationsSubtitle')}</Text>
                        <PrimaryButton
                            label={t('screen.onboardingFinish.enableNotifications')}
                            onPress={async () => {
                                await notificationService.registerForPushNotificationsAsync();
                                navigation.replace('MainTabs');
                            }}
                        />
                        <TouchableOpacity onPress={() => navigation.replace('MainTabs')} style={styles.maybeLaterBtn}>
                            <Text style={styles.maybeLaterText}>{t('screen.onboardingFinish.maybeLater')}</Text>
                        </TouchableOpacity>
                    </View>
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
    },
    icon: {
        width: 160,
        height: 160,
        marginBottom: 24,
    },

    title: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.muted,
        textAlign: 'center',
    },
    footer: {
        width: '100%',
    },
    notificationBox: {
        width: '100%',
        gap: 8,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 4,
    },
    notificationSubtitle: {
        fontSize: 13,
        color: theme.colors.muted,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 8,
    },
    maybeLaterBtn: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    maybeLaterText: {
        fontSize: 14,
        color: theme.colors.muted,
    },
});
