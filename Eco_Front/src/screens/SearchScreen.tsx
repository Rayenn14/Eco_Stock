import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { styles } from './SearchScreen.styles';
import { ProductCard } from '../components/ProductCard';
import * as API from '../services/api';
import { SearchStackParamList } from '../navigation/SearchNavigator';

interface Product {
  id: string;
  nom: string;
  description: string;
  prix: string;
  prix_original: string;
  stock: number;
  image_url: string | null;
  dlc: string;
  is_lot: boolean;
  is_disponible: boolean;
  nom_commerce: string;
  adresse: string;
  latitude: string | null;
  longitude: string | null;
  distance: string | null;
  walking_time: number | null;
  cycling_time: number | null;
  category_name: string;
}

type SearchScreenNavigationProp = StackNavigationProp<SearchStackParamList, 'SearchList'>;

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Erreur récupération localisation:', error);
    }
  };

  const searchProducts = async (query: string) => {
    if (query.trim().length < 2) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const response = await API.searchProducts(
        query,
        userLocation?.latitude,
        userLocation?.longitude
      );

      if (response.success) {
        setProducts(response.products || []);
      }
    } catch (error: any) {
      console.error('Erreur recherche produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(text);
    }, 300);
  };

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <View style={styles.cartIcon}>
              <View style={styles.cartBody} />
              <View style={styles.cartWheels}>
                <View style={styles.cartWheel} />
                <View style={styles.cartWheel} />
              </View>
            </View>
          </View>
          <View>
            <Text style={styles.logoText}>ECO STOCK</Text>
            <Text style={styles.slogan}>Recherchez vos produits</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit ou ingrédient..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setProducts([]);
            }}>
              <Text style={styles.clearIcon}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#166534" />
          <Text style={styles.loadingText}>Recherche en cours...</Text>
        </View>
      ) : searchQuery.length < 2 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Tapez au moins 2 caractères pour rechercher</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>😕</Text>
          <Text style={styles.emptyText}>Aucun produit trouvé</Text>
          <Text style={styles.emptySubtext}>
            Essayez avec un autre terme de recherche
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={(productId) => navigation.navigate('ProductDetail', { productId })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};
