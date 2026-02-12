export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Category: undefined;
  QuerySearch: undefined;
  Search: undefined; // Keeping for safety during refactor, can remove later if unused
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
  Chat: { conversationId: string };
  AiListing: { selectedCategory?: string; selectedPrice?: string } | undefined;
  CategorySelect: { parentId?: string; currentPath?: string } | undefined;
  AiIntro: undefined;
  AiPriceAssistant: { imageUris?: string[]; initialPrice?: string } | undefined;
};
