import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setTokenExpiredHandler } from './src/services/api';

import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { PersonalInfoScreen } from './src/screens/PersonalInfoScreen';
import { PaymentMethodsScreen } from './src/screens/PaymentMethodsScreen';
import { BottomNavBar } from './src/components/BottomNavBar';

type Screen = 'splash' | 'login' | 'signup' | 'forgot' | 'home' | 'profile' | 'personalInfo' | 'paymentMethods';
type NavScreen = 'home' | 'search' | 'cart' | 'recipes' | 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Configurer le handler pour la déconnexion automatique lors de l'expiration du token
    setTokenExpiredHandler(handleLogout);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        setCurrentScreen('home');
      }
    } catch (error) {
      console.error('Erreur auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async (token: string, userData: any) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setCurrentScreen('home');
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setUser(null);
    setCurrentScreen('login');
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onFinish={() => setCurrentScreen('login')} />;
      
      case 'login':
        return (
          <LoginScreen
            onNavigateSignup={() => setCurrentScreen('signup')}
            onNavigateForgot={() => setCurrentScreen('forgot')}
            onLoginSuccess={handleAuthSuccess}
          />
        );
      
      case 'signup':
        return (
          <SignupScreen 
            onNavigateLogin={() => setCurrentScreen('login')}
            onSignupSuccess={handleAuthSuccess}
          />
        );
      
      case 'forgot':
        return <ForgotPasswordScreen onNavigateLogin={() => setCurrentScreen('login')} />;

      case 'home':
      case 'profile':
        return (
          <View style={{ flex: 1 }}>
            {currentScreen === 'home' ? (
              <HomeScreen />
            ) : (
              <ProfileScreen
                onNavigatePersonalInfo={() => setCurrentScreen('personalInfo')}
                onNavigatePaymentMethods={() => setCurrentScreen('paymentMethods')}
                onNavigateBack={() => setCurrentScreen('home')}
                onLogout={handleLogout}
              />
            )}
            <BottomNavBar
              activeScreen={currentScreen as NavScreen}
              onNavigate={(screen: NavScreen) => {
                if (screen === 'home' || screen === 'profile') {
                  setCurrentScreen(screen);
                } else {
                  Alert.alert('À venir', `La section ${screen} sera bientôt disponible`);
                }
              }}
            />
          </View>
        );

      case 'personalInfo':
        return (
          <PersonalInfoScreen
            onNavigateBack={() => setCurrentScreen('profile')}
          />
        );

      case 'paymentMethods':
        return (
          <PaymentMethodsScreen
            onNavigateBack={() => setCurrentScreen('profile')}
          />
        );
    }
  };

  return (
    <>
      <StatusBar style="auto" />
      {renderScreen()}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
});
