import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { LoginScreen } from '../LoginScreen';
import { saveToken, saveUser } from '../../services/api';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreenWrapper: React.FC<Props> = ({ navigation }) => {
  console.log('[LoginScreenWrapper] Rendering');

  const handleNavigateSignup = () => {
    console.log('[LoginScreenWrapper] Navigating to Signup');
    navigation.navigate('Signup');
  };

  const handleNavigateForgot = () => {
    console.log('[LoginScreenWrapper] Navigating to ForgotPassword');
    navigation.navigate('ForgotPassword');
  };

  const handleLoginSuccess = async (token: string, userData: any) => {
    console.log('[LoginScreenWrapper] Login successful:', userData.email);
    await saveToken(token);
    await saveUser(userData);
    // React Navigation gérera automatiquement le changement d'écran via RootNavigator
  };

  return (
    <LoginScreen
      onNavigateSignup={handleNavigateSignup}
      onNavigateForgot={handleNavigateForgot}
      onLoginSuccess={handleLoginSuccess}
    />
  );
};
