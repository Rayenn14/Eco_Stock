import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as API from '../services/api';
import { styles } from './SellerOrdersScreen.styles';

interface Order {
  id: string;
  numero_lot: string;
  total: string;
  statut: string;
  mode_recuperation: string | null;
  adresse_livraison: string | null;
  date_recuperation: string | null;
  message_client: string | null;
  created_at: string;
  client_prenom: string;
  client_nom: string;
  client_email: string;
  client_telephone: string | null;
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
        setOrders(response.orders);
      }
    } catch (error: any) {
      if (error.message !== 'Session expirée') {
        Alert.alert('Erreur', 'Impossible de charger les commandes');
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

  const handleUpdateStatus = (orderId: string, currentStatus: string) => {
    const statusOptions = [
      { label: 'En attente', value: 'en_attente' },
      { label: 'Confirmée', value: 'confirmee' },
      { label: 'En préparation', value: 'en_preparation' },
      { label: 'Prête', value: 'prete' },
      { label: 'Livrée', value: 'livree' },
      { label: 'Annulée', value: 'annulee' },
    ];

    const buttons = statusOptions.map((option) => ({
      text: option.label + (option.value === currentStatus ? ' ✓' : ''),
      onPress: async () => {
        if (option.value === currentStatus) return;

        try {
          const response = await API.updateOrderStatus(orderId, option.value);
          if (response.success) {
            Alert.alert('Succès', 'Statut mis à jour');
            loadOrders();
          } else {
            Alert.alert('Erreur', response.message);
          }
        } catch (error: any) {
          Alert.alert('Erreur', error.message);
        }
      },
    }));

    buttons.push({ text: 'Annuler', onPress: () => {} });

    Alert.alert('Changer le statut', 'Sélectionnez le nouveau statut', buttons);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  };

  const getStatusInfo = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return { text: 'En attente', color: '#D97706', bgColor: '#FEF3C7' };
      case 'confirmee':
        return { text: 'Confirmée', color: '#2563EB', bgColor: '#DBEAFE' };
      case 'en_preparation':
        return { text: 'En préparation', color: '#7C3AED', bgColor: '#EDE9FE' };
      case 'prete':
        return { text: 'Prête', color: '#059669', bgColor: '#D1FAE5' };
      case 'livree':
        return { text: 'Livrée', color: '#10B981', bgColor: '#D1FAE5' };
      case 'annulee':
        return { text: 'Annulée', color: '#DC2626', bgColor: '#FEE2E2' };
      default:
        return { text: statut, color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const renderOrder = (order: Order) => {
    const statusInfo = getStatusInfo(order.statut);

    return (
      <View key={order.id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{order.numero_lot}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Client:</Text>
            <Text style={styles.orderValue}>
              {order.client_prenom} {order.client_nom}
            </Text>
          </View>

          {order.client_telephone && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Tél:</Text>
              <Text style={styles.orderValue}>{order.client_telephone}</Text>
            </View>
          )}

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Email:</Text>
            <Text style={styles.orderValue}>{order.client_email}</Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Total:</Text>
            <Text style={styles.orderTotal}>{parseFloat(order.total).toFixed(2)} EUR</Text>
          </View>

          {order.mode_recuperation && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Mode:</Text>
              <Text style={styles.orderValue}>
                {order.mode_recuperation === 'sur_place' ? 'Sur place' : 'Livraison'}
              </Text>
            </View>
          )}

          {order.adresse_livraison && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Adresse:</Text>
              <Text style={styles.orderValue}>{order.adresse_livraison}</Text>
            </View>
          )}

          {order.date_recuperation && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Date récup:</Text>
              <Text style={styles.orderValue}>
                {formatDate(order.date_recuperation)}
              </Text>
            </View>
          )}

          {order.message_client && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageLabel}>Message client:</Text>
              <Text style={styles.messageText}>{order.message_client}</Text>
            </View>
          )}

          <Text style={styles.orderDate}>Commande du {formatDate(order.created_at)}</Text>
        </View>

        <TouchableOpacity
          style={styles.changeStatusButton}
          onPress={() => handleUpdateStatus(order.id, order.statut)}
        >
          <Text style={styles.changeStatusButtonText}>Changer le statut</Text>
        </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Mes commandes</Text>
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
        <Text style={styles.headerTitle}>Mes commandes</Text>
        <View style={styles.backButton} />
      </View>

      {orders.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#166534']} />
          }
        >
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>Aucune commande</Text>
          <Text style={styles.emptySubtext}>
            Les commandes de vos clients apparaîtront ici
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#166534']} />
          }
        >
          <Text style={styles.orderCount}>
            {orders.length} commande{orders.length > 1 ? 's' : ''}
          </Text>
          {orders.map(renderOrder)}
        </ScrollView>
      )}
    </View>
  );
};
