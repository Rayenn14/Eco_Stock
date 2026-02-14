import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import * as API from '../services/api';
import { styles } from './SellerProductsScreen.styles';

interface Product {
  id: string;
  nom: string;
  description: string;
  prix: string;
  prix_original: string;
  stock: number;
  image_url: string | null;
  dlc: string;
  date_peremption: string | null;
  is_disponible: boolean;
  reserved_for_associations: boolean;
  category_name: string | null;
  status: 'active' | 'expiring_soon' | 'expired' | 'unavailable';
  created_at: string;
}

interface SellerProductsScreenProps {
  onNavigateBack: () => void;
  onNavigateAddProduct: () => void;
}

export const SellerProductsScreen: React.FC<SellerProductsScreenProps> = ({
  onNavigateBack,
  onNavigateAddProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [showExpired]);

  const loadProducts = async () => {
    try {
      const response = await API.getSellerProducts(showExpired);
      if (response.success) {
        setProducts(response.products);
      }
    } catch (error: any) {
      if (error.message !== 'Session expirée') {
        Alert.alert('Erreur', 'Impossible de charger vos produits');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      'Supprimer le produit',
      `Voulez-vous vraiment supprimer "${productName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => void (async () => {
            try {
              const response = await API.deleteProduct(productId);
              if (response.success) {
                Alert.alert('Succès', 'Produit supprimé');
                loadProducts();
              } else {
                Alert.alert('Erreur', response.message);
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          })(),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'expired':
        return { text: 'Expire', color: '#DC2626', bgColor: '#FEE2E2' };
      case 'unavailable':
        return { text: 'Indisponible', color: '#6B7280', bgColor: '#F3F4F6' };
      case 'expiring_soon':
        return { text: 'Expire bientot', color: '#D97706', bgColor: '#FEF3C7' };
      default:
        return { text: 'Actif', color: '#059669', bgColor: '#D1FAE5' };
    }
  };

  const renderProduct = (product: Product) => {
    const statusBadge = getStatusBadge(product.status);
    const discountPercent =
      product.prix_original && Number.parseFloat(product.prix_original) > 0
        ? Math.round(
            (1 - Number.parseFloat(product.prix) / Number.parseFloat(product.prix_original)) * 100
          )
        : 0;

    return (
      <View key={product.id} style={styles.productCard}>
        <View style={styles.productRow}>
          {/* Image */}
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImagePlaceholderText}>📦</Text>
            </View>
          )}

          {/* Informations */}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.nom}</Text>
            {!!product.category_name && (
              <Text style={styles.productCategory}>{product.category_name}</Text>
            )}

            <View style={styles.productPriceRow}>
              <Text style={styles.productPrice}>{Number.parseFloat(product.prix).toFixed(2)} EUR</Text>
              {discountPercent > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{discountPercent}%</Text>
                </View>
              )}
            </View>

            <View style={styles.productDetails}>
              <Text style={styles.productDetailText}>Stock: {product.stock}</Text>
              <Text style={styles.productDetailText}>DLC: {formatDate(product.dlc)}</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusBadge.bgColor },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                {statusBadge.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteProduct(product.id, product.nom)}
          >
            <Text style={styles.deleteButtonText}>🗑️ Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes produits</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#166534" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes produits</Text>
        <TouchableOpacity onPress={onNavigateAddProduct} style={styles.addButton}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            showExpired && styles.filterButtonActive,
          ]}
          onPress={() => setShowExpired(!showExpired)}
        >
          <Text
            style={[
              styles.filterButtonText,
              showExpired && styles.filterButtonTextActive,
            ]}
          >
            {showExpired ? 'Masquer expires' : 'Voir expires'}
          </Text>
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#166534']} />
          }
        >
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>Aucun produit</Text>
          <Text style={styles.emptySubtext}>Commencez par ajouter votre premier produit</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={onNavigateAddProduct}>
            <Text style={styles.emptyButtonText}>Ajouter un produit</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#166534']} />
          }
        >
          <Text style={styles.productCount}>
            {products.length} produit{products.length > 1 ? 's' : ''}
          </Text>
          {products.map(renderProduct)}
        </ScrollView>
      )}
    </View>
  );
};
