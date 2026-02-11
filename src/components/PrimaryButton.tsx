import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'ghost';
};

export function PrimaryButton({ label, onPress, tone = 'primary' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone === 'primary' ? styles.primary : styles.ghost,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, tone === 'ghost' && styles.ghostLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    color: '#05250f',
    fontWeight: '700',
    fontSize: 15,
  },
  ghostLabel: {
    color: theme.colors.text,
  },
  pressed: {
    opacity: 0.9,
  },
});
