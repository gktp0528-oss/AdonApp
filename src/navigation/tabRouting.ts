import { RootStackParamList } from './types';

export type TabKey = 'home' | 'category' | 'post' | 'chat' | 'profile' | 'search';
export type MainTabKey = Exclude<TabKey, 'post'>;

type TabResetNavigation = {
  reset: (state: { index: number; routes: Array<{ name: keyof RootStackParamList }> }) => void;
  navigate: (name: keyof RootStackParamList) => void;
};

let lastMainTabBeforePost: MainTabKey = 'home';

const TAB_ROUTE_MAP: Record<TabKey, string> = {
  home: 'HomeTab',
  category: 'CategoryTab',
  post: 'PostTab',
  chat: 'ChatTab',
  profile: 'ProfileTab',
  search: 'CategoryList', // This is still a stack screen
};

export function resetToTab(
  navigation: any,
  tab: TabKey,
  activeTab: TabKey
) {
  // Track the latest non-post tab
  if (tab === 'post' && activeTab !== 'post') {
    lastMainTabBeforePost = activeTab as MainTabKey;
  }

  if (tab === activeTab) {
    return;
  }

  const routeName = TAB_ROUTE_MAP[tab];

  // If it's a tab, we navigate via MainTabs
  if (['home', 'category', 'post', 'chat', 'profile'].includes(tab)) {
    navigation.navigate('MainTabs', { screen: routeName });
  } else {
    navigation.navigate(routeName);
  }
}

export function getPostExitTab(): MainTabKey {
  return lastMainTabBeforePost;
}
