import React from 'react';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';

const Stack = createStackNavigator<HomeStackParamList>();

// Wrapper pour HomeScreen
const HomeScreenWrapper = ({ navigation }: StackScreenProps<HomeStackParamList, 'HomeList'>) => {
  console.log('[HomeScreenWrapper] Rendering');

  return (
    <HomeScreen
      onNavigateToProductDetail={(productId: string) => {
        console.log('[HomeScreenWrapper] Navigate to ProductDetail:', productId);
        navigation.navigate('ProductDetail', { productId });
      }}
    />
  );
};

// Wrapper pour ProductDetailScreen
const ProductDetailScreenWrapper = ({ navigation, route }: StackScreenProps<HomeStackParamList, 'ProductDetail'>) => {
  console.log('[ProductDetailScreenWrapper] Rendering with productId:', route.params.productId);

  return (
    <ProductDetailScreen
      productId={route.params.productId}
      onNavigateBack={() => {
        console.log('[ProductDetailScreenWrapper] Navigate back');
        navigation.goBack();
      }}
    />
  );
};

export const HomeNavigator = () => {
  console.log('[HomeNavigator] Rendering Home stack');

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeList" component={HomeScreenWrapper} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreenWrapper} />
    </Stack.Navigator>
  );
};
