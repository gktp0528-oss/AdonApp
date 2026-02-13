import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import i18n from 'i18next';

import { RootStackParamList } from '../navigation/types';
import { AppLanguage, changeAppLanguage } from '../i18n';
import { userService } from '../services/userService';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

type SettingItemProps = {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    isSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
};

function SettingItem({ icon, label, value, onPress, showChevron = true, isSwitch = false, switchValue = false, onSwitchChange }: SettingItemProps) {
    return (
        <Pressable
            style={({ pressed }) => [styles.settingItem, pressed && styles.settingItemPressed]}
            onPress={onPress}
            disabled={isSwitch}
        >
            <View style={styles.settingItemLeft}>
                <View style={styles.iconContainer}>
                    <MaterialIcons name={icon} size={20} color="#16a34a" />
                </View>
                <Text style={styles.settingLabel}>{label}</Text>
            </View>
            <View style={styles.settingItemRight}>
                {isSwitch ? (
                    <Switch
                        value={switchValue}
                        onValueChange={onSwitchChange}
                        trackColor={{ false: '#d1d5db', true: '#86efac' }}
                        thumbColor={switchValue ? '#16a34a' : '#f3f4f6'}
                    />
                ) : (
                    <>
                        {value && <Text style={styles.settingValue}>{value}</Text>}
                        {showChevron && <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />}
                    </>
                )}
            </View>
        </Pressable>
    );
}

type SectionHeaderProps = {
    title: string;
};

function SectionHeader({ title }: SectionHeaderProps) {
    return <Text style={styles.sectionHeader}>{title}</Text>;
}

export function SettingsScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(
        (i18n.language?.slice(0, 2) as AppLanguage) || 'en'
    );
    const [languageChanging, setLanguageChanging] = useState(false);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [profilePublic, setProfilePublic] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    const handleLanguagePress = () => {
        Alert.alert(
            t('screen.settings.language.selectTitle'),
            '',
            [
                { text: '한국어', onPress: () => handleLanguageChange('ko') },
                { text: 'English', onPress: () => handleLanguageChange('en') },
                { text: 'Magyar', onPress: () => handleLanguageChange('hu') },
                { text: t('common.cancel'), style: 'cancel' },
            ]
        );
    };

    const handleLanguageChange = async (nextLanguage: AppLanguage) => {
        if (nextLanguage === selectedLanguage || languageChanging) {
            return;
        }

        try {
            setLanguageChanging(true);
            await changeAppLanguage(nextLanguage);
            setSelectedLanguage(nextLanguage);
        } catch (error) {
            console.error('Failed to change language', error);
            Alert.alert(
                t('screen.settings.language.errorTitle'),
                t('screen.settings.language.errorMessage')
            );
        } finally {
            setLanguageChanging(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            t('screen.settings.account.logoutConfirmTitle'),
            t('screen.settings.account.logoutConfirmMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('screen.settings.account.logout'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await userService.logout();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            console.error('Logout failed', error);
                            Alert.alert(t('common.error'), t('screen.settings.account.logoutError'));
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            t('screen.settings.account.deleteConfirmTitle'),
            t('screen.settings.account.deleteConfirmMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('screen.settings.account.delete'),
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            t('screen.settings.account.deleteWarningTitle'),
                            t('screen.settings.account.deleteWarningMessage')
                        );
                    },
                },
            ]
        );
    };

    const getLanguageLabel = (code: AppLanguage) => {
        switch (code) {
            case 'ko': return '한국어';
            case 'en': return 'English';
            case 'hu': return 'Magyar';
            default: return 'English';
        }
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.accessibility.back')}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
                </Pressable>
                <Text style={styles.headerTitle}>{t('screen.settings.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Account Section */}
                <SectionHeader title={t('screen.settings.sections.account')} />
                <View style={styles.section}>
                    <SettingItem
                        icon="person"
                        label={t('screen.settings.account.editProfile')}
                        onPress={() => navigation.navigate('EditProfile')}
                    />
                </View>

                {/* Preferences Section */}
                <SectionHeader title={t('screen.settings.sections.preferences')} />
                <View style={styles.section}>
                    <SettingItem
                        icon="language"
                        label={t('screen.settings.language.title')}
                        value={getLanguageLabel(selectedLanguage)}
                        onPress={handleLanguagePress}
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="dark-mode"
                        label={t('screen.settings.appearance.darkMode')}
                        isSwitch
                        switchValue={darkMode}
                        onSwitchChange={(value) => {
                            setDarkMode(value);
                            Alert.alert(
                                t('screen.settings.appearance.comingSoon'),
                                t('screen.settings.appearance.comingSoonMessage')
                            );
                        }}
                    />
                </View>

                {/* Notifications Section */}
                <SectionHeader title={t('screen.settings.sections.notifications')} />
                <View style={styles.section}>
                    <SettingItem
                        icon="notifications"
                        label={t('screen.settings.notifications.push')}
                        isSwitch
                        switchValue={pushNotifications}
                        onSwitchChange={setPushNotifications}
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="email"
                        label={t('screen.settings.notifications.email')}
                        isSwitch
                        switchValue={emailNotifications}
                        onSwitchChange={setEmailNotifications}
                    />
                </View>

                {/* Privacy Section */}
                <SectionHeader title={t('screen.settings.sections.privacy')} />
                <View style={styles.section}>
                    <SettingItem
                        icon="visibility"
                        label={t('screen.settings.privacy.publicProfile')}
                        isSwitch
                        switchValue={profilePublic}
                        onSwitchChange={setProfilePublic}
                    />
                </View>

                {/* Support Section */}
                <SectionHeader title={t('screen.settings.sections.support')} />
                <View style={styles.section}>
                    <SettingItem
                        icon="help"
                        label={t('screen.settings.support.help')}
                        onPress={() => Alert.alert(t('screen.settings.support.help'), t('screen.settings.support.helpMessage'))}
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="info"
                        label={t('screen.settings.support.about')}
                        onPress={() => Alert.alert(t('screen.settings.support.about'), t('screen.settings.support.aboutMessage'))}
                    />
                </View>

                {/* Account Actions */}
                <SectionHeader title={t('screen.settings.sections.accountActions')} />
                <View style={styles.section}>
                    <SettingItem
                        icon="logout"
                        label={t('screen.settings.account.logout')}
                        onPress={handleLogout}
                        showChevron={false}
                    />
                    <View style={styles.divider} />
                    <Pressable
                        style={({ pressed }) => [styles.settingItem, pressed && styles.settingItemPressed]}
                        onPress={handleDeleteAccount}
                    >
                        <View style={styles.settingItemLeft}>
                            <View style={[styles.iconContainer, styles.iconContainerDanger]}>
                                <MaterialIcons name="delete-forever" size={20} color="#dc2626" />
                            </View>
                            <Text style={[styles.settingLabel, styles.settingLabelDanger]}>
                                {t('screen.settings.account.delete')}
                            </Text>
                        </View>
                    </Pressable>
                </View>

                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>ADON v1.0.0</Text>
                </View>
            </ScrollView>
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
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        backgroundColor: '#fff',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    backBtn: { padding: 4 },
    content: { paddingBottom: 40 },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 24,
        marginBottom: 8,
        marginHorizontal: 16,
    },
    section: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
    },
    settingItemPressed: {
        backgroundColor: '#f9fafb',
    },
    settingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#f0fdf4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconContainerDanger: {
        backgroundColor: '#fef2f2',
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    settingLabelDanger: {
        color: '#dc2626',
    },
    settingValue: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginLeft: 64,
    },
    versionContainer: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 16,
    },
    versionText: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '500',
    },
});
