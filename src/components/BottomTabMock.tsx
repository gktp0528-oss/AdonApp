import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type TabKey = 'home' | 'category' | 'post' | 'chat' | 'profile';

const tabs: Array<{ key: TabKey; labelKey: string; fallback: string; icon: string; routeName: string }> = [
  { key: 'home', labelKey: 'common.tab.home', fallback: 'Home', icon: 'home-filled', routeName: 'HomeTab' },
  { key: 'category', labelKey: 'common.tab.category', fallback: 'Category', icon: 'dashboard', routeName: 'CategoryTab' },
  { key: 'post', labelKey: 'common.tab.post', fallback: 'Post', icon: 'add-circle', routeName: 'PostTab' },
  { key: 'chat', labelKey: 'common.tab.chat', fallback: 'Chat', icon: 'chat-bubble', routeName: 'ChatTab' },
  { key: 'profile', labelKey: 'common.tab.profile', fallback: 'Profile', icon: 'person', routeName: 'ProfileTab' },
];

export function BottomTabMock({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Map state.index to our TabKey
  const activeRouteName = state.routes[state.index].name;
  const activeTab = tabs.find(t => t.routeName === activeRouteName)?.key || 'home';

  React.useEffect(() => {
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

  const handleTabPress = (routeName: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeName,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      // The `merge: true` option makes sure that the params inside the tab screen are preserved
      navigation.navigate({ name: routeName, merge: true } as any);
    }
  };

  return (
    <View style={[styles.wrap, { paddingBottom: 12 + insets.bottom }]}>
      {tabs.map((tab) => {
        const isFocused = activeTab === tab.key;
        const label = t(tab.labelKey, tab.fallback);
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => handleTabPress(tab.routeName, isFocused)}
            accessibilityRole="button"
            accessibilityLabel={t('common.accessibility.tab', { label, defaultValue: `${label} tab` })}
            accessibilityState={{ selected: isFocused }}
            hitSlop={6}
          >
            <View>
              <MaterialIcons size={21} name={tab.icon as any} color={isFocused ? '#19e61b' : '#9ca3af'} />
              {tab.key === 'chat' && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
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
