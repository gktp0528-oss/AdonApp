import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabKey = 'home' | 'search' | 'post' | 'chat' | 'profile';

type Props = {
  active: TabKey;
  onTabPress?: (tab: TabKey) => void;
};

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'home', label: 'Home', icon: 'home-filled' },
  { key: 'search', label: 'Search', icon: 'search' },
  { key: 'post', label: 'Post', icon: 'add-circle' },
  { key: 'chat', label: 'Chat', icon: 'chat-bubble' },
  { key: 'profile', label: 'Profile', icon: 'person' },
];

export function BottomTabMock({ active, onTabPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: 12 + insets.bottom }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onTabPress?.(tab.key)}>
            <MaterialIcons size={21} name={tab.icon as any} color={isActive ? '#19e61b' : '#9ca3af'} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    zIndex: 1000,
  },
  tab: {
    alignItems: 'center',
    gap: 3,
    minWidth: 56,
  },
  label: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  labelActive: {
    color: '#19e61b',
    fontWeight: '800',
  },
});
