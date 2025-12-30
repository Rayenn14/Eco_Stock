import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import * as API from '../services/api';
import { styles } from './SellerOrdersScreen.styles';

interface Product {
  id: string;
  nom: string;
  image_url: string;
  dlc: string;
  quantite: number;
  prix_unitaire: number;
  line_total: number;
}

interface Order {
  id: string;
  numero_commande: string;
  total: number;
  paid_at: string;
  created_at: string;
  client: {
    nom: string;
    prenom: string;
    email: string;
  };
  products: Product[];
}

interface SellerOrdersScreenProps {
  onNavigateBack: () => void;
}

export const SellerOrdersScreen: React.FC<SellerOrdersScreenProps> = ({
  onNavigateBack,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await API.getSellerOrders();
      if (response.success) {
        setOrders(response.orders || []);
      }
    } catch (error: any) {
      if (error.message !== 'Session expirée') {
        Alert.alert('Erreur', 'Impossible de charger les ventes');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View key={item.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>{item.numero_commande}</Text>
          <Text style={styles.orderDate}>{formatDate(item.paid_at || item.created_at)}</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalAmount}>{item.total.toFixed(2)} €</Text>
        </View>
      </View>

      <View style={styles.clientSection}>
        <Text style={styles.sectionTitle}>Client</Text>
        <Text style={styles.clientName}>
          {item.client.prenom} {item.client.nom}
        </Text>
        <Text style={styles.clientEmail}>{item.client.email}</Text>
      </View>

      {item.products && item.products.length > 0 && (
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>
            Produits ({item.products.length})
          </Text>
          {item.products.map((product) => (
            <View key={product.id} style={styles.productItem}>
              {product.image_url ? (
                <Image source={{ uri: product.image_url }} style={styles.productImage} />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Text style={styles.productImagePlaceholderText}>📦</Text>
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.nom}</Text>
                <Text style={styles.productPrice}>
                  {product.quantite}x {product.prix_unitaire.toFixed(2)} € = {product.line_total.toFixed(2)} €
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#166534" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyText}>Aucune vente pour le moment</Text>
          <Text style={styles.emptySubtext}>
            Vos ventes apparaîtront ici une fois qu'un client achète vos produits
          </Text>
        </View>
      </ScrollView>
    );
  }

  const totalVentes = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>Total des ventes</Text>
        <Text style={styles.statsAmount}>{totalVentes.toFixed(2)} €</Text>
        <Text style={styles.statsSubtext}>{orders.length} commande{orders.length > 1 ? 's' : ''}</Text>
      </View>

      {orders.map((order) => renderOrderItem({ item: order }))}
    </ScrollView>
  );
};
