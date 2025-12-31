import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectAddress: (address: string, lat: string, lon: string) => void;
  placeholder?: string;
  editable?: boolean;
  label?: string;
  isAddressValid?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChangeText,
  onSelectAddress,
  placeholder = 'Entrez l\'adresse du commerce',
  editable = true,
  label = 'Adresse du commerce *',
  isAddressValid = false,
  onValidationChange,
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressValidated, setAddressValidated] = useState(false);

  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      searchAddress(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  const searchAddress = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `countrycodes=fr`,
        {
          headers: {
            'User-Agent': 'EcoStock-App',
          },
        }
      );

      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    const formattedAddress = suggestion.display_name;
    onChangeText(formattedAddress);
    onSelectAddress(formattedAddress, suggestion.lat, suggestion.lon);
    setShowSuggestions(false);
    setSuggestions([]);
    setAddressValidated(true);
    if (onValidationChange) {
      onValidationChange(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            !addressValidated && value.length > 0 && { borderColor: '#F59E0B', borderWidth: 2 }
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            setShowSuggestions(true);
            setAddressValidated(false);
            if (onValidationChange) {
              onValidationChange(false);
            }
          }}
          placeholderTextColor="#9CA3AF"
          editable={editable}
          multiline={false}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color="#16A34A"
            style={styles.loader}
          />
        )}
        {addressValidated && value.length > 0 && (
          <Text style={styles.validatedBadge}>✓</Text>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => selectSuggestion(item)}
              >
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          />
        </View>
      )}

      {value.length >= 3 && !loading && suggestions.length === 0 && showSuggestions && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>
            Aucune adresse trouvée. Vérifiez votre saisie.
          </Text>
        </View>
      )}

      {!addressValidated && value.length > 0 && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Vous devez sélectionner une adresse dans la liste des suggestions
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
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
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  loader: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#374151',
  },
  noResults: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  noResultsText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
  validatedBadge: {
    position: 'absolute',
    right: 16,
    top: 16,
    fontSize: 20,
    color: '#16A34A',
  },
  warningContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
});
