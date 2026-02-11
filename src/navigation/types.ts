export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
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
  }
  | undefined;
  Seller: undefined;
  Chat: undefined;
  AiListing: { selectedCategory?: string } | undefined;
  CategorySelect: { parentId?: string; currentPath?: string } | undefined;
  AiIntro: undefined;
};
