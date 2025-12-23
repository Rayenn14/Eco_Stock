import React, { useContext } from 'react';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { ProfileStackParamList } from './types';
import { AuthContext } from './RootNavigator';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PersonalInfoScreen } from '../screens/PersonalInfoScreen';
import { PaymentMethodsScreen } from '../screens/PaymentMethodsScreen';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

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

// Écrans temporaires pour les fonctionnalités vendeur
const ComingSoonScreen = ({ navigation, title }: { navigation: any; title: string }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Écran en cours de développement</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Retour au profil</Text>
      </TouchableOpacity>
    </View>
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
      <Stack.Screen name="AddProduct">
        {(props) => <ComingSoonScreen {...props} title="Ajouter un produit" />}
      </Stack.Screen>
      <Stack.Screen name="SellerProducts">
        {(props) => <ComingSoonScreen {...props} title="Mes produits" />}
      </Stack.Screen>
      <Stack.Screen name="SellerOrders">
        {(props) => <ComingSoonScreen {...props} title="Mes commandes" />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0FDF4',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#166534',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
