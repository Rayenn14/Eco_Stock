import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useCart } from '../contexts/CartContext';
import { styles } from './CartScreen.styles';
import * as API from '../services/api';

type RootStackParamList = {
  Payment: {
    items: Array<{ productId: string; quantity: number }>;
    total: number;
  };
  Recipes: {
    initialSearchIngredients?: string[];
  };
};

type CartScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { cartItems, removeFromCart, getCartTotal, clearCart, updateQuantity, getProductQuantity } = useCart();

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
    const items = cartItems.map(item => ({
      productId: item.id,
      quantity: item.quantity || 1
    }));
    const total = getCartTotal();

    if (items.length === 0) {
      Alert.alert('Panier vide', 'Ajoutez des produits avant de payer');
      return;
    }

    console.log('[CartScreen] Navigate to Payment with items:', items, 'Total:', total);
    navigation.navigate('Payment', {
      items: items,
      total: total
    });
  };

  const handleSuggestRecipes = async () => {
    try {
      console.log('[CartScreen] Recherche des ingrédients du panier...');
      console.log('[CartScreen] Nombre de produits dans le panier:', cartItems.length);
      const ingredientNames: string[] = [];

      // Pour chaque produit du panier, récupérer ses ingrédients
      for (const item of cartItems) {
        try {
          console.log(`[CartScreen] Récupération du produit ID: ${item.id}, nom: ${item.nom}`);
          const response = await API.getProductById(item.id);
          console.log(`[CartScreen] Réponse API complète:`, JSON.stringify(response, null, 2));
          console.log(`[CartScreen] Produit ${item.nom}, ingredient_nom:`, response.product?.ingredient_nom);
          console.log(`[CartScreen] ingredient_ids:`, response.product?.ingredient_ids);

          if (response.product?.ingredient_nom) {
            // Les ingrédients sont stockés comme string séparés par des virgules
            const ingredients = response.product.ingredient_nom
              .split(',')
              .map((ing: string) => ing.trim().toLowerCase());

            console.log(`[CartScreen] Ingrédients parsés pour ${item.nom}:`, ingredients);

            // Ajouter uniquement les nouveaux ingrédients
            ingredients.forEach((ing: string) => {
              if (ing && !ingredientNames.includes(ing)) {
                ingredientNames.push(ing);
                console.log(`[CartScreen] Ajout ingrédient: ${ing}`);
              }
            });
          } else {
            console.log(`[CartScreen] AUCUN ingrédient trouvé pour ${item.nom}`);
          }
        } catch (error) {
          console.error(`[CartScreen] Erreur récupération ingrédients pour ${item.nom}:`, error);
        }
      }

      console.log('[CartScreen] TOUS les ingrédients trouvés:', ingredientNames);

      if (ingredientNames.length === 0) {
        Alert.alert(
          'Aucun ingrédient',
          'Les produits de votre panier n\'ont pas d\'ingrédients associés. Ajoutez des produits avec des ingrédients pour trouver des recettes.'
        );
        return;
      }

      console.log('[CartScreen] Navigation vers Recipes avec:', ingredientNames);
      // Naviguer vers RecipesScreen avec les ingrédients
      // Recipes est un tab qui contient RecipesNavigator > RecipesList
      (navigation as any).navigate('Recipes', {
        screen: 'RecipesList',
        params: {
          initialSearchIngredients: ingredientNames
        }
      });
    } catch (error) {
      console.error('[CartScreen] Erreur proposition recettes:', error);
      Alert.alert('Erreur', 'Impossible de proposer des recettes');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderCartItem = ({ item }: { item: any }) => {
    const quantity = item.quantity || 1;
    const itemTotal = parseFloat(item.prix) * quantity;

    return (
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

            {/* Quantity Selector */}
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantité:</Text>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={[styles.quantityButton, quantity === 1 && styles.quantityButtonDisabled]}
                  onPress={() => updateQuantity(item.id, quantity - 1)}
                  disabled={quantity === 1}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={[styles.quantityButton, quantity >= item.stock && styles.quantityButtonDisabled]}
                  onPress={() => updateQuantity(item.id, quantity + 1)}
                  disabled={quantity >= item.stock}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.stockInfo}>({item.stock} dispo.)</Text>
            </View>
          </View>

          <View style={styles.itemRight}>
            <Text style={styles.itemPrice}>{itemTotal.toFixed(2)} €</Text>
            <Text style={styles.unitPrice}>{parseFloat(item.prix).toFixed(2)} € × {quantity}</Text>
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
  };

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
