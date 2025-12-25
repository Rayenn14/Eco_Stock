import React from 'react';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { SearchScreen } from '../screens/SearchScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';

export type SearchStackParamList = {
  SearchList: undefined;
  ProductDetail: { productId: string };
};

const Stack = createStackNavigator<SearchStackParamList>();

// Wrapper pour ProductDetailScreen
const ProductDetailScreenWrapper = ({ navigation, route }: StackScreenProps<SearchStackParamList, 'ProductDetail'>) => {
  console.log('[SearchNavigator.ProductDetailScreenWrapper] Rendering with productId:', route.params.productId);

  return (
    <ProductDetailScreen
      productId={route.params.productId}
      onNavigateBack={() => {
        console.log('[SearchNavigator.ProductDetailScreenWrapper] Navigate back');
        navigation.goBack();
      }}
    />
  );
};

export const SearchNavigator = () => {
  console.log('[SearchNavigator] Rendering Search stack');

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SearchList" component={SearchScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreenWrapper} />
    </Stack.Navigator>
  );
};
