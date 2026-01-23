import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';
import { styles } from './RecipesScreen.styles';
import * as API from '../services/api';

interface Recipe {
  id: number;
  title: string;
  instructions: string;
  image_name: string | null;
  category: string;
  ingredients: string[];
  matching_ingredients?: number;
  total_ingredients?: number;
}

interface Ingredient {
  id: string;
  name: string;
  score?: number;
}

export const RecipesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialSearchIngredients = route.params?.initialSearchIngredients;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const [ingredientResults, setIngredientResults] = useState<Ingredient[]>([]);
  const [showIngredientResults, setShowIngredientResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ingredientSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { cartItems } = useCart();

  const LIMIT = 6;

  useEffect(() => {
    console.log('[RecipesScreen] ========== useEffect CALLED ==========');
    console.log('[RecipesScreen] route.params:', route.params);
    console.log('[RecipesScreen] initialSearchIngredients:', initialSearchIngredients);
    console.log('[RecipesScreen] Type:', typeof initialSearchIngredients);
    console.log('[RecipesScreen] Is Array?', Array.isArray(initialSearchIngredients));
    console.log('[RecipesScreen] Length:', initialSearchIngredients?.length);

    if (initialSearchIngredients && initialSearchIngredients.length > 0) {
      console.log('[RecipesScreen] ✅ Démarrage recherche avec ingrédients du panier');
      searchByCartIngredients();
    } else {
      console.log('[RecipesScreen] ❌ Chargement recettes normales (pas d\'ingrédients)');
      loadRecipes();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (ingredientSearchTimeoutRef.current) {
        clearTimeout(ingredientSearchTimeoutRef.current);
      }
    };
  }, [initialSearchIngredients]);

  const loadRecipes = async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setOffset(0);
      }

      const currentOffset = append ? offset : 0;
      const response = await API.getRecipes(LIMIT, currentOffset);

      if (response.success) {
        if (append) {
          setRecipes(prev => [...prev, ...response.recipes]);
        } else {
          setRecipes(response.recipes);
        }
        setHasMore(response.hasMore);
        setOffset(currentOffset + LIMIT);
        setIsSearchMode(false);
      }
    } catch (error: any) {
      console.error('Erreur chargement recettes:', error);
      Alert.alert('Erreur', 'Impossible de charger les recettes');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const searchRecipes = async (query: string) => {
    if (query.trim().length < 2) {
      loadRecipes();
      return;
    }

    try {
      setLoading(true);
      setIsSearchMode(true);
      const response = await API.searchRecipes(query, selectedCategory);

      if (response.success) {
        setRecipes(response.recipes);
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Erreur recherche recettes:', error);
      Alert.alert('Erreur', 'Impossible de rechercher les recettes');
    } finally {
      setLoading(false);
    }
  };

  const searchByCartIngredients = async () => {
    try {
      setLoading(true);
      setIsSearchMode(true);

      // Extraire les noms d'ingrédients depuis les produits du panier
      const ingredientNames = initialSearchIngredients || [];

      console.log('[RecipesScreen] searchByCartIngredients - ingrédients:', ingredientNames);

      if (ingredientNames.length === 0) {
        Alert.alert('Panier vide', 'Ajoutez des produits à votre panier pour trouver des recettes');
        loadRecipes();
        return;
      }

      // Mettre à jour selectedIngredients pour afficher les chips
      setSelectedIngredients(ingredientNames);

      const response = await API.getRecipesByIngredients(ingredientNames);
      console.log('[RecipesScreen] Réponse API:', response);

      if (response.success) {
        setRecipes(response.recipes);
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Erreur recherche recettes par ingrédients:', error);
      Alert.alert('Erreur', 'Impossible de trouver les recettes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchRecipes(text);
    }, 300);
  };

  const handleIngredientSearchChange = (text: string) => {
    setIngredientSearchQuery(text);

    if (ingredientSearchTimeoutRef.current) {
      clearTimeout(ingredientSearchTimeoutRef.current);
    }

    if (text.trim().length < 2) {
      setIngredientResults([]);
      setShowIngredientResults(false);
      return;
    }

    ingredientSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await API.searchRecipeIngredients(text);
        if (response.success && response.ingredients) {
          setIngredientResults(response.ingredients);
          setShowIngredientResults(true);
        }
      } catch (error: any) {
        console.error('Erreur recherche ingrédients:', error);
      }
    }, 300);
  };

  const handleAddIngredient = (ingredientName: string) => {
    if (!selectedIngredients.includes(ingredientName)) {
      const newIngredients = [...selectedIngredients, ingredientName];
      setSelectedIngredients(newIngredients);
      setIngredientSearchQuery('');
      setIngredientResults([]);
      setShowIngredientResults(false);

      // Rechercher automatiquement avec les nouveaux ingrédients
      searchBySelectedIngredients(newIngredients);
    }
  };

  const handleRemoveIngredient = (ingredientName: string) => {
    const newIngredients = selectedIngredients.filter(i => i !== ingredientName);
    setSelectedIngredients(newIngredients);

    // Rechercher avec les ingrédients restants ou recharger tout
    if (newIngredients.length > 0) {
      searchBySelectedIngredients(newIngredients);
    } else {
      loadRecipes();
    }
  };

  const searchBySelectedIngredients = async (ingredients: string[]) => {
    try {
      setLoading(true);
      setIsSearchMode(true);
      const response = await API.getRecipesByIngredients(ingredients);

      if (response.success) {
        setRecipes(response.recipes);
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Erreur recherche par ingrédients:', error);
      Alert.alert('Erreur', 'Impossible de trouver les recettes');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(undefined);
      // Recharger sans filtre de catégorie
      if (searchQuery.trim().length >= 2) {
        searchRecipes(searchQuery);
      } else {
        loadRecipes();
      }
    } else {
      setSelectedCategory(category);
      // Appliquer le filtre de catégorie
      if (searchQuery.trim().length >= 2) {
        searchRecipes(searchQuery);
      } else {
        searchRecipesByCategory(category);
      }
    }
  };

  const searchRecipesByCategory = async (category: string) => {
    try {
      setLoading(true);
      setIsSearchMode(true);
      const response = await API.searchRecipes('', category);

      if (response.success) {
        setRecipes(response.recipes);
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Erreur recherche par catégorie:', error);
      Alert.alert('Erreur', 'Impossible de filtrer par catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore && !isSearchMode) {
      loadRecipes(true);
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

  const handleRecipePress = (recipeId: number) => {
    navigation.navigate('RecipeDetail', { recipeId });
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => handleRecipePress(item.id)}
      activeOpacity={0.7}
    >
      {item.image_name && item.image_name.startsWith('http') ? (
        <Image
          source={{ uri: item.image_name }}
          style={styles.recipeImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholderWhite}>
          <Text style={styles.imagePlaceholderIcon}>🍽️</Text>
        </View>
      )}

      <View style={styles.recipeContent}>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.category && (
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
              <Text style={styles.categoryText}>{getCategoryLabel(item.category)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.recipeInstructions} numberOfLines={3}>
          {item.instructions}
        </Text>

        {item.ingredients && item.ingredients.length > 0 && (
          <View style={styles.ingredientsContainer}>
            <Text style={styles.ingredientsLabel}>Ingrédients:</Text>
            <Text style={styles.ingredientsText} numberOfLines={2}>
              {item.ingredients.join(', ')}
            </Text>
          </View>
        )}

        {item.matching_ingredients !== undefined && (
          <View style={styles.matchingBadge}>
            <Text style={styles.matchingText}>
              ✓ {item.matching_ingredients}/{item.total_ingredients} ingrédients dans votre panier
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#166534" />
        <Text style={styles.loadingMoreText}>Chargement...</Text>
      </View>
    );
  };

  if (loading && recipes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recettes</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#166534" />
          <Text style={styles.loadingText}>Chargement des recettes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recettes</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une recette ou un ingrédient..."
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
      </View>

      <View style={styles.ingredientSearchContainer}>
        {selectedIngredients.length > 0 && (
          <View style={styles.selectedIngredientsContainer}>
            {selectedIngredients.map((ingredient, index) => (
              <View key={`ingredient-${index}`} style={styles.selectedIngredientChip}>
                <Text style={styles.selectedIngredientText}>{ingredient}</Text>
                <TouchableOpacity onPress={() => handleRemoveIngredient(ingredient)}>
                  <Text style={styles.removeIngredientButton}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.ingredientInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par ingrédients (ex: tomate, pain)..."
            value={ingredientSearchQuery}
            onChangeText={handleIngredientSearchChange}
          />
          {showIngredientResults && ingredientResults.length > 0 && (
            <ScrollView style={styles.ingredientResultsDropdown} keyboardShouldPersistTaps="handled">
              {ingredientResults.map((ingredient, index) => (
                <TouchableOpacity
                  key={`result-${index}`}
                  style={styles.ingredientResultItem}
                  onPress={() => handleAddIngredient(ingredient.name)}
                >
                  <Text style={styles.ingredientResultText}>{ingredient.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <Text style={styles.categoriesTitle}>Catégories:</Text>
        <View style={styles.categoriesChips}>
          {['vegetarien', 'vegan', 'sans_gluten', 'bio', 'traditionnel'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipSelected,
              ]}
              onPress={() => handleCategoryFilter(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextSelected,
                ]}
              >
                {getCategoryLabel(cat)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item, index) => `recipe-${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍲</Text>
            <Text style={styles.emptyTitle}>Aucune recette trouvée</Text>
            <Text style={styles.emptyText}>
              Essayez une autre recherche ou parcourez nos recettes
            </Text>
          </View>
        }
      />

      {!isSearchMode && hasMore && (
        <TouchableOpacity style={styles.loadMoreButton} onPress={() => loadRecipes(true)}>
          <Text style={styles.loadMoreText}>Voir plus de recettes</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
