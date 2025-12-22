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

interface SignupScreenProps {
  onNavigateLogin: () => void;
  onSignupSuccess: (token: string, user: any) => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ 
  onNavigateLogin,
  onSignupSuccess
}) => {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'client' | 'vendeur' | 'association'>('client');
  const [nomCommerce, setNomCommerce] = useState('');
  const [nomAssociation, setNomAssociation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // Validation
    if (!prenom || !nom || !email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (userType === 'vendeur' && !nomCommerce) {
      Alert.alert('Erreur', 'Le nom du commerce est requis pour les vendeurs');
      return;
    }

    if (userType === 'association' && !nomAssociation) {
      Alert.alert('Erreur', 'Le nom de l\'association est requis');
      return;
    }

    setLoading(true);

    try {
      const data = await API.register({
        prenom,
        nom,
        email,
        password,
        user_type: userType,
        nom_commerce: userType === 'vendeur' ? nomCommerce : undefined,
        nom_association: userType === 'association' ? nomAssociation : undefined,
      });

      if (data.success) {
        // Sauvegarder le token et l'utilisateur
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        Alert.alert('✅ Inscription réussie', `Bienvenue ${prenom} !`);
        
        // Rediriger vers ValidationScreen
        onSignupSuccess(data.token, data.user);
      } else {
        Alert.alert('Erreur', data.message || 'Inscription échouée');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de se connecter au serveur');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    Alert.alert('Inscription sociale', `Inscription via ${provider} (à venir)`);
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
          <Text style={styles.title}>Créer un compte</Text>

          {/* CHOIX DU RÔLE */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Je suis :</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity 
                style={[styles.roleButton, userType === 'client' && styles.roleButtonActive]}
                onPress={() => setUserType('client')}
                disabled={loading}
              >
                <Text style={[styles.roleButtonText, userType === 'client' && styles.roleButtonTextActive]}>
                  🛍️ Client
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.roleButton, userType === 'vendeur' && styles.roleButtonActive]}
                onPress={() => setUserType('vendeur')}
                disabled={loading}
              >
                <Text style={[styles.roleButtonText, userType === 'vendeur' && styles.roleButtonTextActive]}>
                  🏪 Vendeur
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.roleButton, userType === 'association' && styles.roleButtonActive]}
                onPress={() => setUserType('association')}
                disabled={loading}
              >
                <Text style={[styles.roleButtonText, userType === 'association' && styles.roleButtonTextActive]}>
                  🤝 Association
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Prénom */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom *</Text>
            <TextInput
              style={styles.input}
              placeholder="Prénom"
              value={prenom}
              onChangeText={setPrenom}
              placeholderTextColor="#9CA3AF"
              editable={!loading}
            />
          </View>

          {/* Nom */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom"
              value={nom}
              onChangeText={setNom}
              placeholderTextColor="#9CA3AF"
              editable={!loading}
            />
          </View>

          {/* Nom du commerce (si vendeur) */}
          {userType === 'vendeur' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du commerce *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ma boutique"
                value={nomCommerce}
                onChangeText={setNomCommerce}
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
            </View>
          )}

          {/* Nom de l'association (si association) */}
          {userType === 'association' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom de l'association *</Text>
              <TextInput
                style={styles.input}
                placeholder="Mon association"
                value={nomAssociation}
                onChangeText={setNomAssociation}
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
            </View>
          )}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse mail *</Text>
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
            <Text style={styles.label}>Mot de passe *</Text>
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

          {/* Signup button */}
          <TouchableOpacity 
            style={[styles.signupButton, loading && styles.buttonDisabled]} 
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signupButtonText}>Créer mon compte</Text>
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
              onPress={() => handleSocialSignup('Facebook')}
              disabled={loading}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#1877F2' }]} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialSignup('Google')}
              disabled={loading}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#DB4437' }]} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialSignup('Apple')}
              disabled={loading}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#000000' }]} />
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
            <TouchableOpacity onPress={onNavigateLogin} disabled={loading}>
              <Text style={styles.loginLink}>Se connecter</Text>
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
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  roleButtonActive: {
    borderColor: '#166534',
    backgroundColor: '#F0FDF4',
  },
  roleButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: '#166534',
    fontWeight: '600',
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
  signupButton: {
    backgroundColor: '#166534',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 13,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
  },
});
