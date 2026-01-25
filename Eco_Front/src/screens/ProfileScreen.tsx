import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as API from '../services/api';
import { styles } from './ProfileScreen.styles';

interface ProfileScreenProps {
  onNavigatePersonalInfo: () => void;
  onNavigatePaymentMethods: () => void;
  onNavigateSellerProducts: () => void;
  onNavigateSellerOrders: () => void;
  onNavigateAddProduct: () => void;
  onNavigateOrders: () => void;
  onNavigateSettings: () => void;
  onNavigateMyReviews: () => void;
  onNavigateShopReviews: () => void;
  onNavigateBack: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigatePersonalInfo,
  onNavigatePaymentMethods,
  onNavigateSellerProducts,
  onNavigateSellerOrders,
  onNavigateAddProduct,
  onNavigateOrders,
  onNavigateSettings,
  onNavigateMyReviews,
  onNavigateShopReviews,
  onNavigateBack,
  onLogout,
}) => {
  const [user, setUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('[ProfileScreen] Loading user data...');
      const userData = await SecureStore.getItemAsync('user_data');
      const savedImage = await SecureStore.getItemAsync('profileImage');

      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('[ProfileScreen] User loaded:', parsedUser.user_type, parsedUser.email);
        setUser(parsedUser);
      }
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error('[ProfileScreen] Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      // Demander la permission d'accéder à la galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Nous avons besoin de votre permission pour accéder à vos photos.'
        );
        return;
      }

      // Ouvrir la galerie
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('[ProfileScreen] Image selected:', imageUri);

        // Convertir l'image en base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64',
        });

        // Créer le format data URL pour Cloudinary
        const imageBase64 = `data:image/jpeg;base64,${base64}`;
        console.log('[ProfileScreen] Uploading to Cloudinary...');

        // Uploader vers Cloudinary via le backend
        const uploadResponse = await API.uploadProfileImage(imageBase64);

        if (uploadResponse.success && uploadResponse.imageUrl) {
          console.log('[ProfileScreen] Image uploaded:', uploadResponse.imageUrl);
          setProfileImage(uploadResponse.imageUrl);

          // Sauvegarder l'URL Cloudinary dans SecureStore
          await SecureStore.setItemAsync('profileImage', uploadResponse.imageUrl);

          Alert.alert('Succès', 'Photo de profil mise à jour !');
        } else {
          throw new Error(uploadResponse.message || 'Upload failed');
        }
      }
    } catch (error: any) {
      console.error('[ProfileScreen] Error uploading image:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'uploader l\'image');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', onPress: onLogout, style: 'destructive' },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo de profil */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={handlePickImage} style={styles.imageWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <View style={styles.placeholderIconShape}>
                  <View style={styles.placeholderHead} />
                  <View style={styles.placeholderBody} />
                </View>
              </View>
            )}
            <View style={styles.editBadge}>
              <View style={styles.editIcon}>
                <View style={styles.pencilBody} />
                <View style={styles.pencilTip} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Nom utilisateur */}
        <Text style={styles.userName}>
          {user?.prenom} {user?.nom}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        {/* Menu options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onNavigatePersonalInfo}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#DBEAFE' }]}>
                <Text style={styles.menuIconText}>👤</Text>
              </View>
              <Text style={styles.menuItemText}>Informations personnelles</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* Menu vendeur uniquement */}
          {user?.user_type === 'vendeur' && (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  console.log('[ProfileScreen] Add product button pressed');
                  console.log('[ProfileScreen] onNavigateAddProduct function:', typeof onNavigateAddProduct);
                  if (onNavigateAddProduct) {
                    onNavigateAddProduct();
                  } else {
                    console.error('[ProfileScreen] onNavigateAddProduct is not defined');
                  }
                }}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={styles.menuIconText}>➕</Text>
                  </View>
                  <Text style={styles.menuItemText}>Ajouter un produit</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={onNavigateSellerProducts}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={styles.menuIconText}>📦</Text>
                  </View>
                  <Text style={styles.menuItemText}>Mes produits</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={onNavigateSellerOrders}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#E0E7FF' }]}>
                    <Text style={styles.menuIconText}>💰</Text>
                  </View>
                  <Text style={styles.menuItemText}>Mes ventes</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={onNavigateShopReviews}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#FEF9C3' }]}>
                    <Text style={styles.menuIconText}>⭐</Text>
                  </View>
                  <Text style={styles.menuItemText}>Avis boutique</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Mes achats - accessible à tout le monde */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onNavigateOrders}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.menuIconText}>🛒</Text>
              </View>
              <Text style={styles.menuItemText}>Mes achats</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={onNavigateMyReviews}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FEF9C3' }]}>
                <Text style={styles.menuIconText}>⭐</Text>
              </View>
              <Text style={styles.menuItemText}>Mes avis</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={onNavigatePaymentMethods}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#D1FAE5' }]}>
                <Text style={styles.menuIconText}>💳</Text>
              </View>
              <Text style={styles.menuItemText}>Méthodes de paiement</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={onNavigateSettings}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E0E7FF' }]}>
                <Text style={styles.menuIconText}>⚙️</Text>
              </View>
              <Text style={styles.menuItemText}>Paramètres</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton déconnexion */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
