import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as API from '../services/api';
import { styles } from './AddProductScreen.styles';

interface Category {
  id: number;
  nom: string;
  description: string;
}

interface AddProductScreenProps {
  onNavigateBack: () => void;
  onProductAdded: () => void;
}

export const AddProductScreen: React.FC<AddProductScreenProps> = ({
  onNavigateBack,
  onProductAdded,
}) => {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [prixOriginal, setPrixOriginal] = useState('');
  const [stock, setStock] = useState('');
  const [dlc, setDlc] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isBio, setIsBio] = useState(false);
  const [isLocal, setIsLocal] = useState(false);
  const [reservedForAssociations, setReservedForAssociations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await API.getCategories();
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (error: any) {
      console.error('Erreur chargement catégories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Nous avons besoin de votre permission pour accéder à vos photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setImageUrl(base64Image);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  const formatDateForInput = (dateString: string) => {
    // Convertir format DD/MM/YYYY en YYYY-MM-DD pour l'affichage
    const parts = dateString.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  const formatDateForAPI = (dateString: string) => {
    // Convertir format DD/MM/YYYY en YYYY-MM-DD pour l'API
    const parts = dateString.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  const validateForm = () => {
    if (!nom.trim()) {
      Alert.alert('Erreur', 'Le nom du produit est obligatoire');
      return false;
    }

    if (!prix || isNaN(parseFloat(prix)) || parseFloat(prix) <= 0) {
      Alert.alert('Erreur', 'Le prix doit être un nombre supérieur à 0');
      return false;
    }

    if (!stock || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      Alert.alert('Erreur', 'Le stock doit être un nombre positif');
      return false;
    }

    if (!dlc.trim()) {
      Alert.alert('Erreur', 'La date limite de consommation est obligatoire');
      return false;
    }

    // Valider le format de la date (DD/MM/YYYY)
    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!datePattern.test(dlc)) {
      Alert.alert('Erreur', 'Format de date invalide. Utilisez JJ/MM/AAAA');
      return false;
    }

    // Vérifier que la date n'est pas dans le passé
    const parts = dlc.split('/');
    const dlcDate = new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0])
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dlcDate < today) {
      Alert.alert('Erreur', 'La date limite ne peut pas être dans le passé');
      return false;
    }

    if (prixOriginal && (isNaN(parseFloat(prixOriginal)) || parseFloat(prixOriginal) <= 0)) {
      Alert.alert('Erreur', 'Le prix original doit être un nombre supérieur à 0');
      return false;
    }

    if (prixOriginal && parseFloat(prixOriginal) < parseFloat(prix)) {
      Alert.alert('Erreur', 'Le prix original doit être supérieur au prix de vente');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const productData = {
        nom: nom.trim(),
        description: description.trim() || undefined,
        prix: parseFloat(prix),
        prix_original: prixOriginal ? parseFloat(prixOriginal) : undefined,
        stock: parseInt(stock),
        image_url: imageUrl || undefined,
        dlc: formatDateForAPI(dlc),
        category_id: categoryId || undefined,
        is_bio: isBio,
        is_local: isLocal,
        reserved_for_associations: reservedForAssociations,
      };

      const response = await API.addProduct(productData);

      if (response.success) {
        Alert.alert('Succès', 'Produit ajouté avec succès', [
          {
            text: 'OK',
            onPress: () => {
              onProductAdded();
              onNavigateBack();
            },
          },
        ]);
      } else {
        Alert.alert('Erreur', response.message || 'Impossible d\'ajouter le produit');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'ajouter le produit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un produit</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        <TouchableOpacity onPress={handlePickImage} style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>📷</Text>
              <Text style={styles.imagePlaceholderLabel}>Ajouter une photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Nom */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Nom du produit <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Tomates bio"
            value={nom}
            onChangeText={setNom}
            editable={!loading}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description du produit"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        {/* Prix */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.label}>
              Prix de vente (EUR) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="2.50"
              value={prix}
              onChangeText={setPrix}
              keyboardType="decimal-pad"
              editable={!loading}
            />
          </View>

          <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
            <Text style={styles.label}>Prix original (EUR)</Text>
            <TextInput
              style={styles.input}
              placeholder="4.00"
              value={prixOriginal}
              onChangeText={setPrixOriginal}
              keyboardType="decimal-pad"
              editable={!loading}
            />
          </View>
        </View>

        {/* Stock et DLC */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.label}>
              Stock <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              value={stock}
              onChangeText={setStock}
              keyboardType="number-pad"
              editable={!loading}
            />
          </View>

          <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
            <Text style={styles.label}>
              DLC <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="31/12/2025"
              value={dlc}
              onChangeText={setDlc}
              editable={!loading}
            />
          </View>
        </View>

        {/* Catégorie */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Catégorie</Text>
          {loadingCategories ? (
            <ActivityIndicator size="small" color="#166534" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryList}>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    categoryId === null && styles.categoryChipSelected,
                  ]}
                  onPress={() => setCategoryId(null)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      categoryId === null && styles.categoryChipTextSelected,
                    ]}
                  >
                    Aucune
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      categoryId === cat.id && styles.categoryChipSelected,
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        categoryId === cat.id && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.nom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Options */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Options</Text>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsBio(!isBio)}
            disabled={loading}
          >
            <View style={[styles.checkbox, isBio && styles.checkboxChecked]}>
              {isBio && <Text style={styles.checkboxIcon}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Produit bio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsLocal(!isLocal)}
            disabled={loading}
          >
            <View style={[styles.checkbox, isLocal && styles.checkboxChecked]}>
              {isLocal && <Text style={styles.checkboxIcon}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Produit local</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setReservedForAssociations(!reservedForAssociations)}
            disabled={loading}
          >
            <View
              style={[
                styles.checkbox,
                reservedForAssociations && styles.checkboxChecked,
              ]}
            >
              {reservedForAssociations && <Text style={styles.checkboxIcon}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Réservé aux associations</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton Ajouter */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Ajouter le produit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
