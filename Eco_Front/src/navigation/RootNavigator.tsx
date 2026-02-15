import React, { useState, useEffect, createContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { setTokenExpiredHandler, getToken, getUser, clearSecureData } from '../services/api';

// Contexte d'authentification
interface AuthContextType {
  signIn: () => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  signIn: () => {},
  signOut: () => {},
});

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    console.log('[RootNavigator] Initializing...');
    setTokenExpiredHandler(handleTokenExpired);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[RootNavigator] Checking authentication...');
      const token = await getToken();
      const userData = await getUser();

      if (token && userData) {
        console.log('[RootNavigator] User authenticated:', userData.email);
        setIsAuthenticated(true);
      } else {
        console.log('[RootNavigator] No authentication found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[RootNavigator] Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenExpired = async () => {
    console.log('[RootNavigator] Token expired - logging out');
    await clearSecureData();
    setIsAuthenticated(false);
  };

  const handleSplashFinish = () => {
    console.log('[RootNavigator] Splash screen finished');
    setShowSplash(false);
  };

  const authContext: AuthContextType = {
    signIn: () => {
      console.log('[RootNavigator] Sign in');
      setIsAuthenticated(true);
    },
    signOut: () => {
      console.log('[RootNavigator] Sign out');
      void (async () => {
        await clearSecureData();
        setIsAuthenticated(false);
      })();
    },
  };

  if (isLoading) {
    console.log('[RootNavigator] Loading...');
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {showSplash ? (
            <Stack.Screen name="Splash">
              {(props) => <SplashScreen {...props} onFinish={handleSplashFinish} />}
            </Stack.Screen>
          ) : isAuthenticated ? (
            <Stack.Screen name="Main" component={MainTabNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
});
