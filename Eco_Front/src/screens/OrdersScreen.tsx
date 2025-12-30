import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as API from '../services/api';
import { styles } from './OrdersScreen.styles';

interface Product {
  id: string;
  nom: string;
  image_url: string;
  dlc: string;
  quantite: number;
  line_total: number;
  pickup_start_time: string;
  pickup_end_time: string;
  pickup_instructions: string;
}

interface Order {
  id: string;
  numero_commande: string;
  total: number;
  statut: string;
  stripe_payment_status: string;
  paid_at: string;
  created_at: string;
  picked_up: boolean;
  vendeur: {
    nom: string;
    email: string;
  };
  commerce: {
    nom: string;
    adresse: string;
    latitude: number;
    longitude: number;
  };
  products: Product[];
}

interface OrdersScreenProps {
  onNavigateBack: () => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({ onNavigateBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'not_picked' | 'picked'>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      console.log('[OrdersScreen] Loading orders...');

      // Nettoyer les commandes pending de plus de 1h
      await API.cleanupPendingOrders();

      const response = await API.getMyOrders();

      if (response.success) {
        setOrders(response.orders || []);
        console.log('[OrdersScreen] Orders loaded:', response.orders?.length || 0);
      }
    } catch (error: any) {
      console.error('[OrdersScreen] Error loading orders:', error);
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
    return `${day}/${month}/${year}`;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    // timeString is in HH:MM:SS format from database
    return timeString.slice(0, 5); // Extract HH:MM
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const handleTogglePickup = async (order: Order) => {
    try {
      const newStatus = !order.picked_up;
      const response = await API.updateOrderPickupStatus(order.id, newStatus);

      if (response.success) {
        // Update local state
        setOrders(prevOrders =>
          prevOrders.map(o =>
            o.id === order.id ? { ...o, picked_up: newStatus } : o
          )
        );
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  const getFilteredOrders = () => {
    let filtered = [...orders];

    // Apply filter
    if (filterStatus === 'not_picked') {
      filtered = filtered.filter(order => !order.picked_up);
    } else if (filterStatus === 'picked') {
      filtered = filtered.filter(order => order.picked_up);
    }

    // Sort: non-recovered orders first
    filtered.sort((a, b) => {
      if (a.picked_up === b.picked_up) return 0;
      return a.picked_up ? 1 : -1;
    });

    return filtered;
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard} key={item.id}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>{item.numero_commande}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.statut) + '20' },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.statut) }]}
          >
            {getStatusText(item.statut)}
          </Text>
        </View>
      </View>

      <View style={styles.commerceSection}>
        <Text style={styles.sectionTitle}>Commerce</Text>
        <Text style={styles.commerceName}>{item.commerce.nom}</Text>
        <Text style={styles.commerceAddress}>{item.commerce.adresse}</Text>
      </View>

      {item.products && item.products.length > 0 && (
        <>
          {(item.products[0].pickup_start_time || item.products[0].pickup_end_time) && (
            <View style={styles.pickupSection}>
              <Text style={styles.sectionTitle}>Horaires de retrait</Text>
              <View style={styles.pickupTimeContainer}>
                <Text style={styles.pickupIcon}>🕐</Text>
                <Text style={styles.pickupTime}>
                  {formatTime(item.products[0].pickup_start_time)} -{' '}
                  {formatTime(item.products[0].pickup_end_time)}
                </Text>
              </View>
              {item.products[0].pickup_instructions && (
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsIcon}>ℹ️</Text>
                  <Text style={styles.instructionsText}>
                    {item.products[0].pickup_instructions}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>
              Produits ({item.products.length})
            </Text>
            {item.products.map((product) => (
              <View key={product.id} style={styles.productItem}>
                {product.image_url ? (
                  <Image
                    source={{ uri: product.image_url }}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={styles.noImage}>
                    <Text style={styles.noImageText}>📦</Text>
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.nom}
                  </Text>
                  <Text style={styles.productDlc}>
                    DLC: {formatDate(product.dlc)}
                  </Text>
                </View>
                <Text style={styles.productPrice}>
                  {product.line_total.toFixed(2)} €
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>{item.total.toFixed(2)} €</Text>
      </View>

      {item.statut === 'paid' && (
        <TouchableOpacity
          style={[
            styles.pickupButton,
            item.picked_up ? styles.pickupButtonPicked : styles.pickupButtonNotPicked
          ]}
          onPress={() => handleTogglePickup(item)}
        >
          <Text style={styles.pickupButtonIcon}>
            {item.picked_up ? '✓' : '○'}
          </Text>
          <Text style={styles.pickupButtonText}>
            {item.picked_up ? 'Récupéré' : 'Marquer comme récupéré'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#166534" />
        <Text style={styles.loadingText}>Chargement de vos commandes...</Text>
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
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>Aucune commande</Text>
          <Text style={styles.emptyText}>
            Vous n'avez pas encore passé de commande
          </Text>
        </View>
      </ScrollView>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === 'all' && styles.filterButtonActive
          ]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[
            styles.filterButtonText,
            filterStatus === 'all' && styles.filterButtonTextActive
          ]}>
            Toutes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === 'not_picked' && styles.filterButtonActive
          ]}
          onPress={() => setFilterStatus('not_picked')}
        >
          <Text style={[
            styles.filterButtonText,
            filterStatus === 'not_picked' && styles.filterButtonTextActive
          ]}>
            Non récupérées
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === 'picked' && styles.filterButtonActive
          ]}
          onPress={() => setFilterStatus('picked')}
        >
          <Text style={[
            styles.filterButtonText,
            filterStatus === 'picked' && styles.filterButtonTextActive
          ]}>
            Récupérées
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredOrders.map((order) => renderOrderItem({ item: order }))}
      </ScrollView>
    </View>
  );
};
