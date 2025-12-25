import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCart } from '../contexts/CartContext';
import { styles } from './CartScreen.styles';

export const CartScreen: React.FC = () => {
  const { cartItems, removeFromCart, getCartTotal, clearCart } = useCart();

  const handleRemoveItem = (productId: string, productName: string) => {
    Alert.alert(
      'Retirer du panier',
      `Voulez-vous retirer "${productName}" de votre panier ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => removeFromCart(productId),
        },
      ]
    );
  };

  const handlePay = () => {
    Alert.alert(
      'Paiement',
      'Cette fonctionnalité sera bientôt disponible',
      [{ text: 'OK' }]
    );
  };

  const handleSuggestRecipes = () => {
    Alert.alert(
      'Proposer des recettes',
      'Cette fonctionnalité sera bientôt disponible',
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemContent}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.itemImage} />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>📦</Text>
          </View>
        )}

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.nom}
          </Text>
          {item.category_name && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category_name}</Text>
            </View>
          )}
          <Text style={styles.itemShop} numberOfLines={1}>
            {item.nom_commerce}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.itemDlc}>DLC: {formatDate(item.dlc)}</Text>
        </View>

        <View style={styles.itemRight}>
          <Text style={styles.itemPrice}>{parseFloat(item.prix).toFixed(2)} €</Text>
          {item.prix_original && (
            <Text style={styles.itemOriginalPrice}>
              {parseFloat(item.prix_original).toFixed(2)} €
            </Text>
          )}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id, item.nom)}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Panier</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptyText}>
            Ajoutez des produits à votre panier pour les retrouver ici
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Panier</Text>
        <Text style={styles.itemCount}>
          {cartItems.length} {cartItems.length > 1 ? 'articles' : 'article'}
        </Text>
      </View>

      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total à payer</Text>
          <Text style={styles.totalAmount}>{getCartTotal().toFixed(2)} €</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.recipesButton} onPress={handleSuggestRecipes}>
            <Text style={styles.recipesButtonText}>📖 Proposer des recettes avec votre panier</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.payButton} onPress={handlePay}>
            <Text style={styles.payButtonText}>💳 Payer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
