import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { styles } from './HomeScreen.styles';
import { ProductCard } from '../components/ProductCard';
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
  is_bio: boolean;
  is_local: boolean;
  is_disponible: boolean;
  is_lot: boolean;
  nom_commerce: string;
  adresse: string;
  latitude: string | null;
  longitude: string | null;
  distance: string | null;
  walking_time: number | null;
  category_name: string;
}

interface HomeScreenProps {
  onNavigateToProductDetail: (productId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToProductDetail }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await API.getProducts();

      if (response.success) {
        setProducts(response.products);
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

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  if (loading) {
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
              <Text style={styles.slogan}>Achetez tout, payez moins a l'excellence</Text>
            </View>
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
            <Text style={styles.slogan}>Achetez tout, payez moins a l'excellence</Text>
          </View>
        </View>
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
    </View>
  );
};
