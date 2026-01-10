import React, { useContext } from 'react';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { ProfileStackParamList } from './types';
import { AuthContext } from './RootNavigator';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PersonalInfoScreen } from '../screens/PersonalInfoScreen';
import { PaymentMethodsScreen } from '../screens/PaymentMethodsScreen';
import { AddProductScreen } from '../screens/AddProductScreen';
import { SellerProductsScreen } from '../screens/SellerProductsScreen';
import { SellerOrdersScreen } from '../screens/SellerOrdersScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Alert } from 'react-native';

const Stack = createStackNavigator<ProfileStackParamList>();

// Wrapper pour ProfileScreen
const ProfileScreenWrapper = ({ navigation }: StackScreenProps<ProfileStackParamList, 'ProfileHome'>) => {
  const { signOut } = useContext(AuthContext);
  console.log('[ProfileScreenWrapper] Rendering');

  return (
    <ProfileScreen
      onNavigatePersonalInfo={() => {
        console.log('[ProfileScreenWrapper] Navigate to PersonalInfo');
        navigation.navigate('PersonalInfo');
      }}
      onNavigatePaymentMethods={() => {
        console.log('[ProfileScreenWrapper] Navigate to PaymentMethods');
        navigation.navigate('PaymentMethods');
      }}
      onNavigateAddProduct={() => {
        console.log('[ProfileScreenWrapper] Navigate to AddProduct');
        navigation.navigate('AddProduct');
      }}
      onNavigateSellerProducts={() => {
        console.log('[ProfileScreenWrapper] Navigate to SellerProducts');
        navigation.navigate('SellerProducts');
      }}
      onNavigateSellerOrders={() => {
        console.log('[ProfileScreenWrapper] Navigate to SellerOrders');
        navigation.navigate('SellerOrders');
      }}
      onNavigateOrders={() => {
        console.log('[ProfileScreenWrapper] Navigate to Orders');
        navigation.navigate('Orders');
      }}
      onNavigateSettings={() => {
        console.log('[ProfileScreenWrapper] Navigate to Settings');
        navigation.navigate('Settings');
      }}
      onNavigateBack={() => {
        console.log('[ProfileScreenWrapper] Navigate back');
        navigation.goBack();
      }}
      onLogout={() => {
        console.log('[ProfileScreenWrapper] Logout');
        Alert.alert(
          'Déconnexion',
          'Voulez-vous vraiment vous déconnecter ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnexion', onPress: () => signOut(), style: 'destructive' },
          ]
        );
      }}
    />
  );
};

// Wrapper pour PersonalInfoScreen
const PersonalInfoScreenWrapper = ({ navigation }: StackScreenProps<ProfileStackParamList, 'PersonalInfo'>) => {
  console.log('[PersonalInfoScreenWrapper] Rendering');

  return (
    <PersonalInfoScreen
      onNavigateBack={() => {
        console.log('[PersonalInfoScreenWrapper] Navigate back');
        navigation.goBack();
      }}
    />
  );
};

// Wrapper pour PaymentMethodsScreen
const PaymentMethodsScreenWrapper = ({ navigation }: StackScreenProps<ProfileStackParamList, 'PaymentMethods'>) => {
  console.log('[PaymentMethodsScreenWrapper] Rendering');

  return (
    <PaymentMethodsScreen
      onNavigateBack={() => {
        console.log('[PaymentMethodsScreenWrapper] Navigate back');
        navigation.goBack();
      }}
    />
  );
};

// Wrapper pour AddProductScreen
const AddProductScreenWrapper = ({ navigation }: StackScreenProps<ProfileStackParamList, 'AddProduct'>) => {
  console.log('[AddProductScreenWrapper] Rendering');

  return (
    <AddProductScreen
      onNavigateBack={() => {
        console.log('[AddProductScreenWrapper] Navigate back');
        navigation.goBack();
      }}
      onProductAdded={() => {
        console.log('[AddProductScreenWrapper] Product added, navigating to SellerProducts');
        navigation.navigate('SellerProducts');
      }}
    />
  );
};

// Wrapper pour SellerProductsScreen
const SellerProductsScreenWrapper = ({ navigation }: StackScreenProps<ProfileStackParamList, 'SellerProducts'>) => {
  console.log('[SellerProductsScreenWrapper] Rendering');

  return (
    <SellerProductsScreen
      onNavigateBack={() => {
        console.log('[SellerProductsScreenWrapper] Navigate back');
        navigation.goBack();
      }}
      onNavigateAddProduct={() => {
        console.log('[SellerProductsScreenWrapper] Navigate to AddProduct');
        navigation.navigate('AddProduct');
      }}
    />
  );
};

// Wrapper pour SellerOrdersScreen
const SellerOrdersScreenWrapper = ({ navigation }: StackScreenProps<ProfileStackParamList, 'SellerOrders'>) => {
  console.log('[SellerOrdersScreenWrapper] Rendering');

  return (
    <SellerOrdersScreen
      onNavigateBack={() => {
        console.log('[SellerOrdersScreenWrapper] Navigate back');
        navigation.goBack();
      }}
    />
  );
};

// Wrapper pour OrdersScreen
const OrdersScreenWrapper = ({ navigation }: StackScreenProps<ProfileStackParamList, 'Orders'>) => {
  console.log('[OrdersScreenWrapper] Rendering');

  return (
    <OrdersScreen
      onNavigateBack={() => {
        console.log('[OrdersScreenWrapper] Navigate back');
        navigation.goBack();
      }}
    />
  );
};

// Wrapper pour SettingsScreen
const SettingsScreenWrapper = ({ navigation }: StackScreenProps<ProfileStackParamList, 'Settings'>) => {
  console.log('[SettingsScreenWrapper] Rendering');

  return (
    <SettingsScreen
      onNavigateBack={() => {
        console.log('[SettingsScreenWrapper] Navigate back');
        navigation.goBack();
      }}
    />
  );
};

export const ProfileNavigator = () => {
  console.log('[ProfileNavigator] Rendering Profile stack');

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreenWrapper} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreenWrapper} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreenWrapper} />
      <Stack.Screen name="AddProduct" component={AddProductScreenWrapper} />
      <Stack.Screen name="SellerProducts" component={SellerProductsScreenWrapper} />
      <Stack.Screen
        name="SellerOrders"
        component={SellerOrdersScreenWrapper}
        options={{
          headerShown: true,
          title: 'Mes Ventes',
          headerBackTitle: 'Retour',
        }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreenWrapper}
        options={{
          headerShown: true,
          title: 'Mes Achats',
          headerBackTitle: 'Retour',
        }}
      />
      <Stack.Screen name="Settings" component={SettingsScreenWrapper} />
    </Stack.Navigator>
  );
};
