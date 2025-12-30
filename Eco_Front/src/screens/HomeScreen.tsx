import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { styles } from './HomeScreen.styles';
import { ProductCard } from '../components/ProductCard';
import { FilterModal } from '../components/FilterModal';
import * as API from '../services/api';

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

interface HomeScreenProps {
  onNavigateToProductDetail: (productId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToProductDetail }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [filters, setFilters] = useState({
    category: undefined as string | undefined,
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    maxDlcDate: undefined as string | undefined,
    maxDistance: undefined as number | undefined,
    sortBy: undefined as 'price_asc' | 'price_desc' | 'distance_asc' | 'distance_desc' | undefined,
  });

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  // Recharger les produits à chaque fois que l'écran obtient le focus
  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] Screen focused - reloading products');
      loadProducts();
    }, [])
  );

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

  const loadProducts = async () => {
    try {
      const response = await API.getProducts(
        filters.category,
        filters.minPrice,
        filters.maxPrice,
        filters.maxDlcDate,
        filters.maxDistance,
        userLocation?.latitude,
        userLocation?.longitude
      );

      if (response.success) {
        let sortedProducts = response.products;

        // Appliquer le tri côté client
        if (filters.sortBy) {
          sortedProducts = [...sortedProducts].sort((a, b) => {
            switch (filters.sortBy) {
              case 'price_asc':
                return parseFloat(a.prix) - parseFloat(b.prix);
              case 'price_desc':
                return parseFloat(b.prix) - parseFloat(a.prix);
              case 'distance_asc':
                if (!a.distance || !b.distance) return 0;
                return parseFloat(a.distance) - parseFloat(b.distance);
              case 'distance_desc':
                if (!a.distance || !b.distance) return 0;
                return parseFloat(b.distance) - parseFloat(a.distance);
              default:
                return 0;
            }
          });
        }

        setProducts(sortedProducts);
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de charger les produits');
      }
    } catch (error: any) {
      if (error.message !== 'Session expirée') {
        Alert.alert('Erreur', 'Impossible de charger les produits');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApplyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setShowFilterModal(false);
    setLoading(true);
  };

  const handleResetFilters = () => {
    setFilters({
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      maxDlcDate: undefined,
      maxDistance: undefined,
      sortBy: undefined,
    });
    setShowFilterModal(false);
    setLoading(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/EcoStockLogo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#166534" />
          <Text style={styles.loadingText}>Chargement des produits...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/EcoStockLogo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={onNavigateToProductDetail} />
        )}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#166534']}
            tintColor="#166534"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun produit disponible pour le moment</Text>
          </View>
        }
      />

      <FilterModal
        visible={showFilterModal}
        filters={filters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onClose={() => setShowFilterModal(false)}
      />
    </View>
  );
};
