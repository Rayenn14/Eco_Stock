import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { styles } from './RecipeDetailScreen.styles';
import * as API from '../services/api';

interface Recipe {
  id: number;
  title: string;
  instructions: string;
  image_name: string | null;
  category: string;
  ingredients: string[];
  created_at: string;
}

interface Product {
  id: string;
  nom: string;
  prix: string;
  distance?: number;
}

export const RecipeDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { recipeId } = route.params;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [ingredientAvailability, setIngredientAvailability] = useState<Record<string, boolean>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const response = await API.getRecipeById(recipeId.toString());

      if (response.success && response.recipe) {
        setRecipe(response.recipe);
        checkIngredientAvailability(response.recipe.ingredients);
      }
    } catch (error: any) {
      console.error('Erreur chargement recette:', error);
      Alert.alert('Erreur', 'Impossible de charger la recette');
    } finally {
      setLoading(false);
    }
  };

  const checkIngredientAvailability = async (ingredients: string[]) => {
    if (!ingredients || ingredients.length === 0) return;

    setLoadingAvailability(true);
    const availability: Record<string, boolean> = {};

    for (const ingredient of ingredients) {
      try {
        const response = await API.getProductsByIngredient(ingredient);
        availability[ingredient] = response.success && response.count > 0;
      } catch (error) {
        availability[ingredient] = false;
      }
    }

    setIngredientAvailability(availability);
    setLoadingAvailability(false);
  };

  const handleIngredientPress = async (ingredientName: string) => {
    try {
      console.log(`[RecipeDetail] Recherche produits pour: ${ingredientName}`);
      const response = await API.getProductsByIngredient(ingredientName);

      if (response.success && response.products && response.products.length > 0) {
        // Prendre le produit le plus proche/moins cher (premier dans la liste triée)
        const closestProduct = response.products[0];
        console.log(`[RecipeDetail] Produit trouvé:`, closestProduct);
        console.log(`[RecipeDetail] Product ID:`, closestProduct.id);

        if (!closestProduct.id) {
          Alert.alert('Erreur', 'ID du produit manquant');
          return;
        }

        // Naviguer vers le détail du produit (push pour garder la recette dans l'historique)
        navigation.push('ProductDetail', { productId: closestProduct.id });
      } else {
        Alert.alert(
          'Produit non disponible',
          `Aucun produit contenant "${ingredientName}" n'est actuellement en vente.`
        );
      }
    } catch (error) {
      console.error('[RecipeDetail] Erreur:', error);
      Alert.alert('Erreur', 'Impossible de trouver les produits');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'vegetarien':
        return '#10B981';
      case 'vegan':
        return '#059669';
      case 'sans_gluten':
        return '#F59E0B';
      case 'bio':
        return '#84CC16';
      case 'traditionnel':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'vegetarien':
        return 'Végétarien';
      case 'vegan':
        return 'Vegan';
      case 'sans_gluten':
        return 'Sans gluten';
      case 'bio':
        return 'Bio';
      case 'traditionnel':
        return 'Traditionnel';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#166534" />
          <Text style={styles.loadingText}>Chargement de la recette...</Text>
        </View>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Recette introuvable</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.title}</Text>
        {recipe.category && (
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(recipe.category) }]}>
            <Text style={styles.categoryText}>{getCategoryLabel(recipe.category)}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingrédients</Text>
        <Text style={styles.sectionSubtitle}>
          Cliquez sur un ingrédient pour trouver des produits
        </Text>
        <View style={styles.ingredientsContainer}>
          {recipe.ingredients && recipe.ingredients.map((ingredient, index) => {
            const isAvailable = ingredientAvailability[ingredient];
            return (
              <TouchableOpacity
                key={`ingredient-${index}`}
                style={[
                  styles.ingredientChip,
                  isAvailable ? styles.ingredientAvailable : styles.ingredientUnavailable
                ]}
                onPress={() => handleIngredientPress(ingredient)}
              >
                <Text style={[
                  styles.ingredientText,
                  isAvailable ? styles.ingredientTextAvailable : styles.ingredientTextUnavailable
                ]}>
                  {ingredient}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {loadingAvailability && (
          <Text style={styles.availabilityNote}>Vérification de la disponibilité...</Text>
        )}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.ingredientAvailable]} />
            <Text style={styles.legendText}>Disponible en vente</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.ingredientUnavailable]} />
            <Text style={styles.legendText}>Non disponible</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préparation</Text>
        <Text style={styles.instructionsText}>{recipe.instructions}</Text>
      </View>
    </ScrollView>
  );
};
