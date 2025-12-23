import React, { useContext } from 'react';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import { AuthContext } from './RootNavigator';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { saveToken, saveUser } from '../services/api';

const Stack = createStackNavigator<AuthStackParamList>();

// Wrapper pour LoginScreen
const LoginScreenWrapper = ({ navigation }: StackScreenProps<AuthStackParamList, 'Login'>) => {
  const { signIn } = useContext(AuthContext);
  console.log('[LoginScreenWrapper] Rendering');

  return (
    <LoginScreen
      onNavigateSignup={() => {
        console.log('[LoginScreenWrapper] Navigate to Signup');
        navigation.navigate('Signup');
      }}
      onNavigateForgot={() => {
        console.log('[LoginScreenWrapper] Navigate to ForgotPassword');
        navigation.navigate('ForgotPassword');
      }}
      onLoginSuccess={async (token: string, userData: any) => {
        console.log('[LoginScreenWrapper] Login success');
        await saveToken(token);
        await saveUser(userData);
        signIn();
      }}
    />
  );
};

// Wrapper pour SignupScreen
const SignupScreenWrapper = ({ navigation }: StackScreenProps<AuthStackParamList, 'Signup'>) => {
  const { signIn } = useContext(AuthContext);
  console.log('[SignupScreenWrapper] Rendering');

  return (
    <SignupScreen
      onNavigateLogin={() => {
        console.log('[SignupScreenWrapper] Navigate to Login');
        navigation.navigate('Login');
      }}
      onSignupSuccess={async (token: string, userData: any) => {
        console.log('[SignupScreenWrapper] Signup success');
        await saveToken(token);
        await saveUser(userData);
        signIn();
      }}
    />
  );
};

// Wrapper pour ForgotPasswordScreen
const ForgotPasswordScreenWrapper = ({ navigation }: StackScreenProps<AuthStackParamList, 'ForgotPassword'>) => {
  console.log('[ForgotPasswordScreenWrapper] Rendering');

  return (
    <ForgotPasswordScreen
      onNavigateLogin={() => {
        console.log('[ForgotPasswordScreenWrapper] Navigate to Login');
        navigation.navigate('Login');
      }}
    />
  );
};

export const AuthNavigator = () => {
  console.log('[AuthNavigator] Rendering Auth stack');

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreenWrapper} />
      <Stack.Screen name="Signup" component={SignupScreenWrapper} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreenWrapper} />
    </Stack.Navigator>
  );
};
