import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as API from '../services/api';
import { styles } from './LoginScreen.styles';
import { getRandomEcoTip } from '../utils/ecoTips';
import { AppleIcon, GoogleIcon, FacebookIcon } from '../components/SocialIcons';

interface LoginScreenProps {
  onNavigateSignup: () => void;
  onNavigateForgot: () => void;
  onLoginSuccess: (token: string, user: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateSignup,
  onNavigateForgot,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ecoTip, setEcoTip] = useState('');

  useEffect(() => {
    setEcoTip(getRandomEcoTip());
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const data = await API.login(email, password);

      if (data.success) {
        // Sauvegarder le token et l'utilisateur
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        Alert.alert('✅ Connexion réussie', 'Bienvenue !');
        
        // Rediriger vers ValidationScreen
        onLoginSuccess(data.token, data.user);
      } else {
        Alert.alert('Erreur', data.message || 'Identifiants incorrects');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de se connecter au serveur');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert('Connexion sociale', `Connexion via ${provider} (à venir)`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec logo */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/EcoStockLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>ECO</Text>
          <Text style={styles.logoText}>STOCK</Text>
          <Text style={styles.slogan}>Achetez tout, payez moins à l'excellence</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Se connecter</Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse mail</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple@mail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
              editable={!loading}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot password */}
          <TouchableOpacity 
            onPress={onNavigateForgot} 
            style={styles.forgotButton}
            disabled={loading}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View>
                <ActivityIndicator color="#FFFFFF" />
                <View style={styles.ecoTipContainer}>
                  <Text style={styles.ecoTipText}>{ecoTip}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Ou continuer avec</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Facebook')}
              disabled={loading}
            >
              <FacebookIcon size={24} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Google')}
              disabled={loading}
            >
              <GoogleIcon size={24} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Apple')}
              disabled={loading}
            >
              <AppleIcon size={24} />
            </TouchableOpacity>
          </View>

          {/* Sign up link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Vous n'avez pas encore de compte ? </Text>
            <TouchableOpacity onPress={onNavigateSignup} disabled={loading}>
              <Text style={styles.signupLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
