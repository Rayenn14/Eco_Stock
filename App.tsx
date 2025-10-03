import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Imports des écrans
import SplashScreen from './src/screens/SplashScreen';
import AccueilConnexion from './src/screens/AccueilConnexion';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import Accueil from './src/screens/Accueil';

export type RootStackParamList = {
  Splash: undefined;
  AccueilConnexion: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Accueil: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Stack Auth (Login/Register/Forgot)
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AccueilConnexion" component={AccueilConnexion} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// Stack App (après authentification)
const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Accueil" component={Accueil} />
  </Stack.Navigator>
);

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      // Affiche le splash 2s
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Vérifie si un token est stocké
      const token = await AsyncStorage.getItem('userToken');
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };
    initApp();
  }, []);

  if (isLoading) {
    return <SplashScreen />; // Splash avant navigation
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default App;
