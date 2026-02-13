import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type TabKey = 'home' | 'category' | 'post' | 'chat' | 'profile';

type Props = {
  active: TabKey;
  onTabPress?: (tab: TabKey) => void;
};

const tabs: Array<{ key: TabKey; labelKey: string; fallback: string; icon: string }> = [
  { key: 'home', labelKey: 'common.tab.home', fallback: 'Home', icon: 'home-filled' },
  { key: 'category', labelKey: 'common.tab.category', fallback: 'Category', icon: 'dashboard' },
  { key: 'post', labelKey: 'common.tab.post', fallback: 'Post', icon: 'add-circle' },
  { key: 'chat', labelKey: 'common.tab.chat', fallback: 'Chat', icon: 'chat-bubble' },
  { key: 'profile', labelKey: 'common.tab.profile', fallback: 'Profile', icon: 'person' },
];

export function BottomTabMock({ active, onTabPress }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    // Only subscribe if we are logged in (simple check)
    // We could check auth state properly, but for mock tab this is fine.
    // Ideally this should be in a Context or Redux, but implementing locally for now as requested.
    import('../services/userService').then(({ userService }) => {
      import('../services/chatService').then(({ chatService }) => {
        const userId = userService.getCurrentUserId();
        if (userId) {
          const unsub = chatService.watchTotalUnreadCount(userId, (count) => {
            setUnreadCount(count);
          });
          return () => unsub();
        }
      });
    });
  }, []);

  return (
    <View style={[styles.wrap, { paddingBottom: 12 + insets.bottom }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        const label = t(tab.labelKey, tab.fallback);
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress?.(tab.key)}
            accessibilityRole="button"
            accessibilityLabel={t('common.accessibility.tab', { label, defaultValue: `${label} tab` })}
            accessibilityState={{ selected: isActive }}
            hitSlop={6}
          >
            <View>
              <MaterialIcons size={21} name={tab.icon as any} color={isActive ? '#19e61b' : '#9ca3af'} />
              {tab.key === 'chat' && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
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
    minHeight: 44,
    minWidth: 56,
    justifyContent: 'center',
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
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});
