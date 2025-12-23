// Types pour la navigation
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Cart: undefined;
  Recipes: undefined;
  Profile: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  PersonalInfo: undefined;
  PaymentMethods: undefined;
  AddProduct: undefined;
  SellerProducts: undefined;
  SellerOrders: undefined;
};

export type HomeStackParamList = {
  HomeList: undefined;
  ProductDetail: { productId: string };
};
