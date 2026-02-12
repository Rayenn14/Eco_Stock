import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Scan, Camera, ImageIcon, ArrowLeft } from 'lucide-react-native';
import * as API from '../services/api';

interface DetectedIngredient {
  name: string;
  confidence: number;
  selected: boolean;
}

export const IngredientScannerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<DetectedIngredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'acces a la camera pour scanner vos ingredients.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setHasScanned(false);
      setIngredients([]);
      if (result.assets[0].base64) {
        await analyzeImage(result.assets[0].base64);
      }
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'acces a la galerie.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setHasScanned(false);
      setIngredients([]);
      if (result.assets[0].base64) {
        await analyzeImage(result.assets[0].base64);
      }
    }
  };

  const analyzeImage = async (base64: string) => {
    try {
      setLoading(true);

      const response = await API.detectIngredients(base64);

      if (response.success && response.ingredients && response.ingredients.length > 0) {
        const detected: DetectedIngredient[] = response.ingredients.map(
          (ing: { name: string; confidence: number }) => ({
            name: ing.name,
            confidence: ing.confidence,
            selected: true,
          })
        );
        setIngredients(detected);
        setHasScanned(true);
      } else {
        Alert.alert('Aucun ingredient', 'Aucun ingredient detecte. Essayez avec une autre photo.');
        setHasScanned(true);
      }
    } catch (error: any) {
      console.error('[Scanner] Erreur analyse:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'analyser l\'image. Verifiez que le serveur IA est lance (python ai_server.py).'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleIngredient = (index: number) => {
    setIngredients(prev =>
      prev.map((ing, i) =>
        i === index ? { ...ing, selected: !ing.selected } : ing
      )
    );
  };

  const selectedCount = ingredients.filter(i => i.selected).length;

  const handleFindRecipes = () => {
    const selectedIngredients = ingredients
      .filter(i => i.selected)
      .map(i => i.name);

    if (selectedIngredients.length === 0) {
      Alert.alert('Selection vide', 'Selectionnez au moins un ingredient.');
      return;
    }

    navigation.navigate('RecipesList', {
      initialSearchIngredients: selectedIngredients,
    });
  };

  const handleNewScan = () => {
    setImageUri(null);
    setIngredients([]);
    setHasScanned(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={22} color="#166534" />
        </TouchableOpacity>
        <Scan size={22} color="#111827" style={{ marginRight: 8 }} />
        <Text style={styles.headerTitle}>Scanner Ingredients</Text>
      </View>

      {/* Image zone */}
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <View style={styles.scanIconContainer}>
            <Scan size={64} color="#166534" />
          </View>
          <Text style={styles.placeholderTitle}>Scannez vos ingredients</Text>
          <Text style={styles.placeholderText}>
            Prenez une photo de vos ingredients et l'IA les detectera automatiquement
          </Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
              <Camera size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.cameraButtonText}>Prendre une photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
              <ImageIcon size={20} color="#166534" style={{ marginRight: 8 }} />
              <Text style={styles.galleryButtonText}>Choisir depuis la galerie</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#166534" />
          <Text style={styles.loadingText}>Analyse en cours...</Text>
          <Text style={styles.loadingSubtext}>Detection des ingredients par IA</Text>
        </View>
      )}

      {/* Resultats */}
      {hasScanned && !loading && ingredients.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            Ingredients detectes ({ingredients.length})
          </Text>
          <Text style={styles.resultsSubtitle}>
            Selectionnez les ingredients pour la recherche
          </Text>

          <View style={styles.ingredientChips}>
            {ingredients.map((ing, index) => (
              <TouchableOpacity
                key={`${ing.name}-${index}`}
                style={[
                  styles.ingredientChip,
                  ing.selected && styles.ingredientChipSelected,
                ]}
                onPress={() => toggleIngredient(index)}
              >
                <Text
                  style={[
                    styles.ingredientChipName,
                    ing.selected && styles.ingredientChipNameSelected,
                  ]}
                >
                  {ing.name}
                </Text>
                <Text
                  style={[
                    styles.ingredientChipConfidence,
                    ing.selected && styles.ingredientChipConfidenceSelected,
                  ]}
                >
                  {ing.confidence}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.findRecipesButton, selectedCount === 0 && styles.findRecipesButtonDisabled]}
            onPress={handleFindRecipes}
            disabled={selectedCount === 0}
          >
            <Text style={styles.findRecipesButtonText}>
              Trouver des recettes ({selectedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.newScanButton} onPress={handleNewScan}>
            <Text style={styles.newScanButtonText}>Nouveau scan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Aucun resultat */}
      {hasScanned && !loading && ingredients.length === 0 && (
        <View style={styles.noResultsContainer}>
          <Scan size={48} color="#9CA3AF" />
          <Text style={styles.noResultsText}>Aucun ingredient detecte</Text>
          <TouchableOpacity style={styles.newScanButton} onPress={handleNewScan}>
            <Text style={styles.newScanButtonText}>Reessayer</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  imageContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  scanIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  cameraButton: {
    backgroundColor: '#166534',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  galleryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#166534',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  ingredientChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  ingredientChipSelected: {
    borderColor: '#166534',
    backgroundColor: '#F0FDF4',
  },
  ingredientChipName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  ingredientChipNameSelected: {
    color: '#166534',
  },
  ingredientChipConfidence: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  ingredientChipConfidenceSelected: {
    color: '#16A34A',
  },
  findRecipesButton: {
    backgroundColor: '#166534',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  findRecipesButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  findRecipesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  newScanButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  newScanButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    gap: 12,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
});
