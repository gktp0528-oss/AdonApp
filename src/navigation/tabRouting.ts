import { RootStackParamList } from './types';

export type TabKey = 'home' | 'search' | 'post' | 'chat' | 'profile';

type TabResetNavigation = {
  reset: (state: { index: number; routes: Array<{ name: keyof RootStackParamList }> }) => void;
};

const TAB_ROUTE_MAP: Record<TabKey, keyof RootStackParamList> = {
  home: 'Home',
  search: 'Search',
  post: 'AiListing',
  chat: 'ChatList',
  profile: 'Seller',
};

export function resetToTab(
  navigation: TabResetNavigation,
  tab: TabKey,
  activeTab: TabKey
) {
  if (tab === activeTab) {
    return;
  }

  navigation.reset({
    index: 0,
    routes: [{ name: TAB_ROUTE_MAP[tab] }],
  });
}
