import { RootStackParamList } from './types';

export type TabKey = 'home' | 'search' | 'post' | 'chat' | 'profile';
export type MainTabKey = Exclude<TabKey, 'post'>;

type TabResetNavigation = {
  reset: (state: { index: number; routes: Array<{ name: keyof RootStackParamList }> }) => void;
};

let lastMainTabBeforePost: MainTabKey = 'home';

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
  // Track the latest non-post tab so Post can close back to where the user came from.
  if (tab === 'post' && activeTab !== 'post') {
    lastMainTabBeforePost = activeTab as MainTabKey;
  }

  if (tab === activeTab) {
    return;
  }

  navigation.reset({
    index: 0,
    routes: [{ name: TAB_ROUTE_MAP[tab] }],
  });
}

export function getPostExitTab(): MainTabKey {
  return lastMainTabBeforePost;
}
