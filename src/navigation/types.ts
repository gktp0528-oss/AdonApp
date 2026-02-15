export type MainTabParamList = {
  HomeTab: undefined;
  CategoryTab: undefined;
  ChatTab: undefined;
  ProfileTab: { sellerId: string } | undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Welcome: undefined;
  NicknameSetup: undefined;
  OnboardingFinish: undefined;
  MainTabs: undefined; // The persistent tab bar navigator

  // Detail Screens
  Home: undefined; // Keeping for direct navigation if needed, or we can alias
  Category: undefined;
  QuerySearch: undefined;
  Search: undefined;
  CategoryList: { categoryId: string; categoryName: string };
  ChatList: undefined;
  Product:
  | {
    productId?: string;
    product?: {
      id: string;
      name: string;
      price: string;
      image: string;
      meta?: string;
      oldPrice?: string;
      description?: string;
      isPremium?: boolean;
      sellerId?: string;
    };
    listingId?: string;
  }
  | undefined;
  Seller: { sellerId: string } | undefined;
  EditProfile: undefined;
  Settings: undefined;
  Chat: { conversationId: string };
  AiListing: { selectedCategory?: string; selectedPrice?: string; appliedReport?: any } | undefined;
  AiAnalysisResult: { report: any; imageUri: string };
  CategorySelect: { parentId?: string; currentPath?: string } | undefined;
  AiIntro: undefined;
  AiPriceAssistant: { imageUris?: string[]; initialPrice?: string } | undefined;
  Payment: { listingId: string; sellerId: string };
  TransactionDetail: { transactionId: string };
  Review: { transactionId: string; sellerId: string; listingId: string };
  SearchResult: { query?: string; categoryId?: string; categoryName?: string };
};
