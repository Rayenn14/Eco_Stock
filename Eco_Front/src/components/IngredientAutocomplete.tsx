import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as API from '../services/api';

interface Ingredient {
  id: number;
  name: string;
  score?: number;
}

interface IngredientAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectIngredient: (ingredient: Ingredient | null) => void;
  placeholder?: string;
  editable?: boolean;
  label?: string;
}

export const IngredientAutocomplete: React.FC<IngredientAutocompleteProps> = ({
  value,
  onChangeText,
  onSelectIngredient,
  placeholder = "Rechercher un ingrédient (ex: tomate)",
  editable = true,
  label = "Ingrédient (optionnel)"
}) => {
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  useEffect(() => {
    if (value.length >= 2) {
      searchIngredients(value);
    } else if (value.length === 0) {
      // Charger les suggestions par défaut
      searchIngredients('');
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const searchIngredients = async (query: string) => {
    console.log('[IngredientAutocomplete] Searching ingredients with query:', query);
    setLoading(true);
    try {
      const response = await API.searchIngredients(query);
      console.log('[IngredientAutocomplete] Search response:', response);
      if (response.success) {
        setSuggestions(response.ingredients);
        setShowSuggestions(true);
        console.log('[IngredientAutocomplete] Found', response.ingredients.length, 'ingredients');
      }
    } catch (error) {
      console.error('[IngredientAutocomplete] Error searching ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIngredient = (ingredient: Ingredient) => {
    console.log('[IngredientAutocomplete] Ingredient selected:', ingredient);
    setSelectedIngredient(ingredient);
    onChangeText(ingredient.name);
    onSelectIngredient(ingredient);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    console.log('[IngredientAutocomplete] Clearing selection');
    setSelectedIngredient(null);
    onChangeText('');
    onSelectIngredient(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            selectedIngredient && styles.inputSelected
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            if (value.length >= 0) {
              searchIngredients(value);
            }
          }}
          placeholderTextColor="#9CA3AF"
          editable={editable}
        />

        {selectedIngredient && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedIngredient && (
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeText}>
            ✓ Ingrédient sélectionné: {selectedIngredient.name}
          </Text>
        </View>
      )}

      {!selectedIngredient && value.length > 0 && !showSuggestions && (
        <View style={styles.noMatchContainer}>
          <Text style={styles.noMatchText}>
            Aucun ingrédient trouvé. Le produit sera créé sans ingrédient associé.
          </Text>
        </View>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#166534" />
            </View>
          )}
          <ScrollView
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id.toString()}
                style={styles.suggestionItem}
                onPress={() => handleSelectIngredient(item)}
              >
                <Text style={styles.suggestionText}>{item.name}</Text>
                {item.score !== undefined && item.score < 1 && (
                  <Text style={styles.scoreText}>
                    {Math.round(item.score * 100)}% correspondance
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputSelected: {
    borderColor: '#166534',
    borderWidth: 2,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedBadge: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#166534',
  },
  selectedBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  noMatchContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
  },
  noMatchText: {
    fontSize: 12,
    color: '#92400E',
  },
  suggestionsContainer: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 14,
    color: '#111827',
  },
  scoreText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
