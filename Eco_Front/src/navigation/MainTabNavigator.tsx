import React from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Alert, View } from 'react-native';
import { MainTabParamList } from './types';
import { HomeNavigator } from './HomeNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { SearchNavigator } from './SearchNavigator';
import { BottomNavBar } from '../components/BottomNavBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Composant placeholder pour les fonctionnalités à venir
const ComingSoonScreen = () => {
  React.useEffect(() => {
    Alert.alert('À venir', 'Cette fonctionnalité sera bientôt disponible');
  }, []);
  return <View style={{ flex: 1, backgroundColor: '#F0FDF4' }} />;
};

// Custom TabBar pour adapter BottomNavBar à React Navigation
const CustomTabBar = (props: BottomTabBarProps) => {
  const { state, navigation } = props;

  // Mapper les noms de routes vers les noms attendus par BottomNavBar
  const routeNameToScreen: Record<string, 'home' | 'search' | 'cart' | 'recipes' | 'profile'> = {
    Home: 'home',
    Search: 'search',
    Cart: 'cart',
    Recipes: 'recipes',
    Profile: 'profile',
  };

  const activeScreen = routeNameToScreen[state.routes[state.index].name] || 'home';

  const handleNavigate = (screen: 'home' | 'search' | 'cart' | 'recipes' | 'profile') => {
    console.log('[CustomTabBar] Navigate to:', screen);

    // Mapper vers les noms de routes React Navigation
    const screenToRouteName: Record<typeof screen, keyof MainTabParamList> = {
      home: 'Home',
      search: 'Search',
      cart: 'Cart',
      recipes: 'Recipes',
      profile: 'Profile',
    };

    navigation.navigate(screenToRouteName[screen]);
  };

  return <BottomNavBar activeScreen={activeScreen} onNavigate={handleNavigate} />;
};

export const MainTabNavigator = () => {
  console.log('[MainTabNavigator] Rendering Main tabs');

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchNavigator}
        options={{ title: 'Recherche' }}
      />
      <Tab.Screen
        name="Cart"
        component={ComingSoonScreen}
        options={{ title: 'Panier' }}
      />
      <Tab.Screen
        name="Recipes"
        component={ComingSoonScreen}
        options={{ title: 'Recettes' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
};
