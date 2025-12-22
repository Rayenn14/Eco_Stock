import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as API from '../services/api';

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
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🛒</Text>
          </View>
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
              <ActivityIndicator color="#FFFFFF" />
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
              <View style={[styles.socialIcon, { backgroundColor: '#1877F2' }]} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Google')}
              disabled={loading}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#DB4437' }]} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Apple')}
              disabled={loading}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#000000' }]} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: '#166534',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 30,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: 1,
  },
  slogan: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 12,
  },
  eyeIcon: {
    fontSize: 18,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#166534',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    fontSize: 13,
    color: '#6B7280',
    marginHorizontal: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  socialIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 13,
    color: '#6B7280',
  },
  signupLink: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
  },
});
