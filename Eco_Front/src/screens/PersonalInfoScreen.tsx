import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as API from '../services/api';
import { styles } from './PersonalInfoScreen.styles';
import { AddressAutocomplete } from '../components/AddressAutocomplete';

interface PersonalInfoScreenProps {
  onNavigateBack: () => void;
}

export const PersonalInfoScreen: React.FC<PersonalInfoScreenProps> = ({
  onNavigateBack,
}) => {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nomCommerce, setNomCommerce] = useState('');
  const [adresseCommerce, setAdresseCommerce] = useState('');
  const [nomAssociation, setNomAssociation] = useState('');
  const [adresseLigne1, setAdresseLigne1] = useState('');
  const [adresseLigne2, setAdresseLigne2] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('France');
  const [userType, setUserType] = useState<'client' | 'vendeur' | 'association'>('client');
  const [isCommerceAddressValid, setIsCommerceAddressValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        setPrenom(user.prenom || '');
        setNom(user.nom || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setUserType(user.user_type || 'client');
        setNomCommerce(user.nom_commerce || '');
        const existingCommerceAddress = user.adresse_commerce || '';
        setAdresseCommerce(existingCommerceAddress);
        setIsCommerceAddressValid(existingCommerceAddress.length > 0);
        setNomAssociation(user.nom_association || '');
        setAdresseLigne1(user.adresse_ligne1 || '');
        setAdresseLigne2(user.adresse_ligne2 || '');
        setCodePostal(user.code_postal || '');
        setVille(user.ville || '');
        setPays(user.pays || 'France');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(\+33|0)[1-9](\d{8})$/;
    return phone === '' || phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateCodePostal = (code: string): boolean => {
    const codeRegex = /^\d{5}$/;
    return code === '' || codeRegex.test(code);
  };

  const handleSave = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'L\'email est obligatoire');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Erreur', 'Adresse email invalide');
      return;
    }

    if (phone && !validatePhone(phone)) {
      Alert.alert('Erreur', 'Numéro de téléphone invalide (format: 0612345678 ou +33612345678)');
      return;
    }

    if (codePostal && !validateCodePostal(codePostal)) {
      Alert.alert('Erreur', 'Code postal invalide (5 chiffres attendus)');
      return;
    }

    if (userType === 'vendeur' && (!nomCommerce.trim() || !adresseCommerce.trim())) {
      Alert.alert('Erreur', 'Le nom et l\'adresse du commerce sont requis pour les vendeurs');
      return;
    }

    if (userType === 'vendeur' && !isCommerceAddressValid) {
      Alert.alert('Erreur', 'Vous devez sélectionner une adresse valide dans les suggestions pour le commerce');
      return;
    }

    if (userType === 'association' && !nomAssociation.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'association est requis');
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        prenom: prenom.trim() || undefined,
        nom: nom.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        nom_commerce: userType === 'vendeur' ? nomCommerce.trim() : undefined,
        adresse_commerce: userType === 'vendeur' ? adresseCommerce.trim() : undefined,
        nom_association: userType === 'association' ? nomAssociation.trim() : undefined,
        adresse: adresseLigne1.trim() || undefined,
        ville: ville.trim() || undefined,
        code_postal: codePostal.trim() || undefined,
      };

      // Appeler l'API pour mettre à jour le profil
      const response = await API.updateProfile(profileData);

      if (response.success) {
        // Mettre à jour SecureStore avec les nouvelles données
        await API.saveUser(response.user);

        Alert.alert(
          'Succès',
          'Vos informations ont été mises à jour',
          [{ text: 'OK', onPress: onNavigateBack }]
        );
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de mettre à jour vos informations');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour vos informations');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Informations personnelles</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Type d'utilisateur (read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type de compte</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>
                {userType === 'client' ? 'Client' : userType === 'vendeur' ? 'Vendeur' : 'Association'}
              </Text>
            </View>
          </View>

          {/* Prénom */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom (optionnel)</Text>
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
            <Text style={styles.label}>Nom (optionnel)</Text>
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
                }}
                onValidationChange={setIsCommerceAddressValid}
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
            <Text style={styles.label}>Adresse email *</Text>
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

          {/* Téléphone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="0612345678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
              editable={!loading}
            />
          </View>

          <AddressAutocomplete
            value={adresseLigne1}
            onChangeText={setAdresseLigne1}
            onSelectAddress={(address, lat, lon) => {
              setAdresseLigne1(address);
            }}
            placeholder="12 Rue de la Paix, 75001 Paris"
            editable={!loading}
            label="Adresse"
          />

          {/* Adresse - Ligne 2 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Complément d'adresse (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Bâtiment A, Appartement 12"
              value={adresseLigne2}
              onChangeText={setAdresseLigne2}
              placeholderTextColor="#9CA3AF"
              editable={!loading}
            />
          </View>

          {/* Code postal et Ville sur la même ligne */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Code postal</Text>
              <TextInput
                style={styles.input}
                placeholder="75001"
                value={codePostal}
                onChangeText={setCodePostal}
                keyboardType="number-pad"
                maxLength={5}
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.label}>Ville</Text>
              <TextInput
                style={styles.input}
                placeholder="Paris"
                value={ville}
                onChangeText={setVille}
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
            </View>
          </View>

          {/* Pays */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pays</Text>
            <TextInput
              style={styles.input}
              placeholder="France"
              value={pays}
              onChangeText={setPays}
              placeholderTextColor="#9CA3AF"
              editable={!loading}
            />
          </View>

          {/* Bouton sauvegarder */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Sauvegarder les modifications</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
