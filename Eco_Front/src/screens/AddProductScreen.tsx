import React, { useState, useEffect, useRef } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as API from '../services/api';
import { styles } from './AddProductScreen.styles';

interface Category {
  id: number;
  nom: string;
  description: string;
}

interface Ingredient {
  id: string;
  name: string;
  score?: number;
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
  const [dlc, setDlc] = useState<Date>(new Date(Date.now() + 86400000)); // Tomorrow by default
  const [showDlcPicker, setShowDlcPicker] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [reservedForAssociations, setReservedForAssociations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientResults, setIngredientResults] = useState<Ingredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [showIngredientResults, setShowIngredientResults] = useState(false);
  const [isLot, setIsLot] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
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

  const searchIngredients = async (query: string) => {
    if (query.length < 2) {
      setIngredientResults([]);
      setShowIngredientResults(false);
      return;
    }

    try {
      const response = await API.searchIngredients(query);
      if (response.success && response.ingredients) {
        setIngredientResults(response.ingredients);
        setShowIngredientResults(true);
      }
    } catch (error: any) {
      console.error('Erreur recherche ingrédients:', error);
    }
  };

  const handleIngredientSearchChange = (text: string) => {
    setIngredientSearch(text);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchIngredients(text);
    }, 300); // 300ms delay
  };

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIngredientSearch('');
    setShowIngredientResults(false);
    setIngredientResults([]);
  };

  const handleRemoveIngredient = () => {
    setSelectedIngredient(null);
  };

  const handleAddIngredient = (ingredient: Ingredient) => {
    if (!selectedIngredients.find(i => i.id === ingredient.id)) {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
    setIngredientSearch('');
    setShowIngredientResults(false);
    setIngredientResults([]);
  };

  const handleRemoveIngredientFromList = (ingredientId: string) => {
    setSelectedIngredients(selectedIngredients.filter(i => i.id !== ingredientId));
  };

  const handlePickImage = async () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une option',
      [
        {
          text: 'Prendre une photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choisir de la galerie',
          onPress: handleChooseFromGallery,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Nous avons besoin de votre permission pour accéder à la caméra.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
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
      console.error('Erreur capture photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre une photo');
    }
  };

  const handleChooseFromGallery = async () => {
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

  const formatDateForDisplay = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const validateForm = () => {
    if (!nom.trim()) {
      Alert.alert('Erreur', 'Le nom du produit est obligatoire');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Erreur', 'La description est obligatoire.\n\nVeuillez indiquer les quantités et détails du produit (ex: "1kg de tomates bio", "Lot de 3 pommes", "500g de pain complet")');
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

    // Vérifier que la DLC n'est pas dans le passé (ou aujourd'hui)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dlcDate = new Date(dlc);
    dlcDate.setHours(0, 0, 0, 0);

    if (dlcDate <= today) {
      Alert.alert('Erreur', 'La date limite de consommation doit être au moins demain');
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
        is_lot: isLot,
        reserved_for_associations: reservedForAssociations,
        ingredient_ids: isLot ? selectedIngredients.map(i => i.id) : (selectedIngredient ? [selectedIngredient.id] : undefined),
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
          <Text style={styles.label}>Description *</Text>
          <Text style={styles.helperText}>
            Indiquez les quantités et détails (ex: "1kg de tomates", "Lot de 3 pommes", "500g de pain complet")
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ex: 1kg de tomates cerises bio bien mûres"
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

        {/* Stock */}
        <View style={styles.inputGroup}>
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

        {/* DLC */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Date Limite de Consommation (DLC) <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDlcPicker(true)}
            disabled={loading}
          >
            <Text style={{ color: '#111827' }}>{formatDateForDisplay(dlc)}</Text>
          </TouchableOpacity>
          {showDlcPicker && (
            <DateTimePicker
              value={dlc}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date(Date.now() + 86400000)} // Tomorrow
              onChange={(event, selectedDate) => {
                setShowDlcPicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDlc(selectedDate);
                }
              }}
            />
          )}
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

        {/* Section is_lot */}
        <View style={styles.inputGroup}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => {
              setIsLot(!isLot);
              if (!isLot) {
                // Passer en mode lot: vider l'ingrédient unique
                setSelectedIngredient(null);
              } else {
                // Passer en mode normal: vider les ingrédients multiples
                setSelectedIngredients([]);
              }
            }}
            disabled={loading}
          >
            <View style={[styles.checkbox, isLot && styles.checkboxChecked]}>
              {isLot && <Text style={styles.checkboxIcon}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Panier surprise / Lot (plusieurs ingrédients)</Text>
          </TouchableOpacity>
        </View>

        {/* Ingrédient(s) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {isLot ? 'Ingrédients du lot (optionnel)' : 'Ingrédient (optionnel)'}
          </Text>

          {isLot ? (
            // MODE LOT: Plusieurs ingrédients
            <>
              {selectedIngredients.length > 0 && (
                <View style={styles.ingredientsList}>
                  {selectedIngredients.map((ingredient) => (
                    <View key={ingredient.id} style={styles.selectedIngredient}>
                      <Text style={styles.selectedIngredientText}>
                        {ingredient.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveIngredientFromList(ingredient.id)}
                        style={styles.removeIngredientButton}
                        disabled={loading}
                      >
                        <Text style={styles.removeIngredientText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.ingredientSearchContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Rechercher un ingrédient à ajouter..."
                  value={ingredientSearch}
                  onChangeText={handleIngredientSearchChange}
                  editable={!loading}
                />
                {showIngredientResults && ingredientResults.length > 0 && (
                  <ScrollView
                    style={styles.ingredientResultsContainer}
                    keyboardShouldPersistTaps="handled"
                  >
                    {ingredientResults.map((ingredient) => (
                      <TouchableOpacity
                        key={ingredient.id}
                        style={styles.ingredientResultItem}
                        onPress={() => handleAddIngredient(ingredient)}
                      >
                        <Text style={styles.ingredientResultText}>
                          {ingredient.name}
                        </Text>
                        {ingredient.score !== undefined && (
                          <Text style={styles.ingredientResultScore}>
                            Correspondance: {Math.round(ingredient.score * 100)}%
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </>
          ) : (
            // MODE NORMAL: Un seul ingrédient (code existant)
            selectedIngredient ? (
            <View style={styles.selectedIngredient}>
              <Text style={styles.selectedIngredientText}>
                {selectedIngredient.name}
              </Text>
              <TouchableOpacity
                onPress={handleRemoveIngredient}
                style={styles.removeIngredientButton}
                disabled={loading}
              >
                <Text style={styles.removeIngredientText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.ingredientSearchContainer}>
              <TextInput
                style={styles.input}
                placeholder="Rechercher un ingrédient..."
                value={ingredientSearch}
                onChangeText={handleIngredientSearchChange}
                editable={!loading}
              />
              {showIngredientResults && ingredientResults.length > 0 && (
                <ScrollView
                  style={styles.ingredientResultsContainer}
                  keyboardShouldPersistTaps="handled"
                >
                  {ingredientResults.map((ingredient) => (
                    <TouchableOpacity
                      key={ingredient.id}
                      style={styles.ingredientResultItem}
                      onPress={() => handleSelectIngredient(ingredient)}
                    >
                      <Text style={styles.ingredientResultText}>
                        {ingredient.name}
                      </Text>
                      {ingredient.score !== undefined && (
                        <Text style={styles.ingredientResultScore}>
                          Correspondance: {Math.round(ingredient.score * 100)}%
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
            )
          )}
        </View>

        {/* Options */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Options</Text>

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
