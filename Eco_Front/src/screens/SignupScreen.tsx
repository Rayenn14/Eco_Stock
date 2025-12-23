import React, { useState } from 'react';
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
import { styles } from './SignupScreen.styles';
import { AppleIcon, GoogleIcon, FacebookIcon } from '../components/SocialIcons';
import { AddressAutocomplete } from '../components/AddressAutocomplete';

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
  const [adresseCommerce, setAdresseCommerce] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [nomAssociation, setNomAssociation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!prenom || !nom || !email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (userType === 'vendeur' && (!nomCommerce || !adresseCommerce)) {
      Alert.alert('Erreur', 'Le nom du commerce et l\'adresse sont obligatoires pour les vendeurs');
      return;
    }

    if (userType === 'vendeur' && !isAddressValid) {
      Alert.alert('Erreur', 'Vous devez sélectionner une adresse valide dans les suggestions');
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
        adresse_commerce: userType === 'vendeur' ? adresseCommerce : undefined,
        latitude: userType === 'vendeur' && latitude ? latitude : undefined,
        longitude: userType === 'vendeur' && longitude ? longitude : undefined,
        nom_association: userType === 'association' ? nomAssociation : undefined,
      });

      if (data.success) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        Alert.alert('Inscription réussie', `Bienvenue ${prenom} !`);

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

        <View style={styles.card}>
          <Text style={styles.title}>Créer un compte</Text>

          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Je suis :</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[styles.roleButton, userType === 'client' && styles.roleButtonActive]}
                onPress={() => setUserType('client')}
                disabled={loading}
              >
                <Text style={[styles.roleButtonText, userType === 'client' && styles.roleButtonTextActive]}>
                  Client
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleButton, userType === 'vendeur' && styles.roleButtonActive]}
                onPress={() => setUserType('vendeur')}
                disabled={loading}
              >
                <Text style={[styles.roleButtonText, userType === 'vendeur' && styles.roleButtonTextActive]}>
                  Vendeur
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleButton, userType === 'association' && styles.roleButtonActive]}
                onPress={() => setUserType('association')}
                disabled={loading}
              >
                <Text style={[styles.roleButtonText, userType === 'association' && styles.roleButtonTextActive]}>
                  Association
                </Text>
              </TouchableOpacity>
            </View>
          </View>

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
            <>
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
              <AddressAutocomplete
                value={adresseCommerce}
                onChangeText={setAdresseCommerce}
                onSelectAddress={(address, lat, lon) => {
                  setAdresseCommerce(address);
                  setLatitude(lat);
                  setLongitude(lon);
                }}
                onValidationChange={setIsAddressValid}
                placeholder="Recherchez l'adresse du commerce"
                editable={!loading}
                label="Adresse du commerce *"
              />
            </>
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
              <FacebookIcon size={24} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialSignup('Google')}
              disabled={loading}
            >
              <GoogleIcon size={24} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialSignup('Apple')}
              disabled={loading}
            >
              <AppleIcon size={24} />
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


