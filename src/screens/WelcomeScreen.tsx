import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
    const { t } = useTranslation();

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.container}>
                <View style={styles.content}>
                    <Image
                        source={require('../../assets/images/onboarding-welcome.png')}
                        style={styles.icon}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>{t('screen.welcome.title')}</Text>
                    <Text style={styles.subtitle}>{t('screen.welcome.subtitle')}</Text>
                </View>
                <View style={styles.footer}>
                    <PrimaryButton
                        label={t('screen.welcome.next')}
                        onPress={() => navigation.navigate('NicknameSetup')}
                    />
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
        width: 120,
        height: 120,
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
});
