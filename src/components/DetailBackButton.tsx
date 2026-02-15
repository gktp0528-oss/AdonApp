import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

type Props = {
  onPress: () => void;
  plain?: boolean;
};

export function DetailBackButton({ onPress, plain }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable
      style={[styles.button, plain && styles.plainButton]}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('common.accessibility.back')}
    >
      <MaterialIcons name="arrow-back-ios-new" size={16} color="#0f172a" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  plainButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    width: 40,
    marginLeft: -8,
  },
});
