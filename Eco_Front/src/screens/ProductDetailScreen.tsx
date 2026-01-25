import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { styles } from './ProductDetailScreen.styles';
import * as API from '../services/api';
import { useCart } from '../contexts/CartContext';
import { ReviewModal } from '../components/ReviewModal';
import { CommerceReviewsModal } from '../components/CommerceReviewsModal';

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
  commerce_id: string | null;
  nom_commerce: string;
  adresse: string;
  latitude: string | null;
  longitude: string | null;
  distance: string | null;
  walking_time: number | null;
  cycling_time: number | null;
  transit_time: number | null;
  category_name: string;
  ingredient_nom: string | null;
  ingredient_id: string | null;
  pickup_start_time: string | null;
  pickup_end_time: string | null;
  pickup_instructions: string | null;
  commerce_rating: number | null;
  commerce_reviews_count: number | null;
}

interface ProductDetailScreenProps {
  productId?: string;
  onNavigateBack?: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = (props) => {
  const route = useRoute<any>();
  const productId = props.productId || route.params?.productId;
  const onNavigateBack = props.onNavigateBack;

  // Si on vient de route.params ET qu'on n'a pas de onNavigateBack, on utilise le header de React Navigation
  // onNavigateBack existe seulement quand on vient de HomeNavigator
  const useNativeHeader = !!route.params?.productId && !onNavigateBack;

  const [product, setProduct] = useState<Product | null>(null);
  const { addToCart, isInCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewsListModal, setShowReviewsListModal] = useState(false);

  useEffect(() => {
    if (productId) {
      requestLocationAndLoadProduct();
    }
  }, [productId]);

  const requestLocationAndLoadProduct = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        const userLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        setLocation(userLocation);
        loadProduct(userLocation.latitude, userLocation.longitude);
      } else {
        loadProduct();
      }
    } catch (error) {
      console.error('Error getting location:', error);
      loadProduct();
    }
  };

  const loadProduct = async (lat?: number, lon?: number) => {
    try {
      const response = lat && lon
        ? await API.getProductById(productId, lat, lon)
        : await API.getProductById(productId);

      if (response.success) {
        setProduct(response.product);
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de charger le produit');
      }
    } catch (error: any) {
      if (error.message !== 'Session expirée') {
        Alert.alert('Erreur', 'Impossible de charger le produit');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
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

  // Cette fonction n'est plus utilisée car le backend calcule maintenant le temps de transport optimal
  // Le backend prend en compte que pour les courtes distances (<2km), marcher est plus rapide

  const openInMaps = (lat: number, lon: number, address: string) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lon}`;
    const label = address;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url as string);
  };

  const discountPercent = product && product.prix_original
    ? Math.round((1 - parseFloat(product.prix) / parseFloat(product.prix_original)) * 100)
    : 0;

  if (loading) {
    return (
      <View style={styles.container}>
        {!useNativeHeader && (
          <View style={styles.header}>
            <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Details du produit</Text>
            <View style={styles.backButton} />
          </View>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#166534" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        {!useNativeHeader && (
          <View style={styles.header}>
            <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Details du produit</Text>
            <View style={styles.backButton} />
          </View>
        )}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Produit introuvable</Text>
        </View>
      </View>
    );
  }

  const shopLat = product.latitude ? parseFloat(product.latitude) : null;
  const shopLon = product.longitude ? parseFloat(product.longitude) : null;

  const getOpenStreetMapUrl = (lat: number, lon: number) => {
    // Utiliser l'API OSM standard (tiles.openstreetmap.org)
    const zoom = 15;
    // Calculer les coordonnées de tuile
    const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

    // Retourner l'URL de la tuile OpenStreetMap
    return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
  };

  return (
    <View style={styles.container}>
      {!useNativeHeader && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details du produit</Text>
          <View style={styles.backButton} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <View style={styles.lotImageContainer}>
            <Text style={styles.lotTitle}>LOT</Text>
            <Text style={styles.lotSubtitle}>{product.nom_commerce}</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.productName}>{product.nom}</Text>
            {discountPercent > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discountPercent}%</Text>
              </View>
            )}
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>{parseFloat(product.prix).toFixed(2)} EUR</Text>
            {product.prix_original && (
              <Text style={styles.originalPrice}>
                {parseFloat(product.prix_original).toFixed(2)} EUR
              </Text>
            )}
          </View>

          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {product.ingredient_nom && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredient</Text>
              <Text style={styles.description}>{product.ingredient_nom}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commerce</Text>
            <Text style={styles.shopName}>{product.nom_commerce}</Text>
            {product.commerce_rating && parseFloat(String(product.commerce_rating)) > 0 ? (
              <TouchableOpacity
                style={styles.ratingContainer}
                onPress={() => setShowReviewsListModal(true)}
              >
                <Text style={styles.ratingStars}>
                  {'\u2605'.repeat(Math.round(parseFloat(String(product.commerce_rating))))}
                  {'\u2606'.repeat(5 - Math.round(parseFloat(String(product.commerce_rating))))}
                </Text>
                <Text style={styles.ratingText}>
                  {parseFloat(String(product.commerce_rating)).toFixed(1)} ({product.commerce_reviews_count || 0} avis)
                </Text>
                <Text style={styles.viewReviewsLink}>Voir les avis</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noRating}>Pas encore d'avis</Text>
            )}
            <Text style={styles.shopAddress}>{product.adresse}</Text>

            {product.walking_time && (
              <View style={styles.distanceContainer}>
                <View style={styles.distanceItem}>
                  <Text style={styles.distanceIcon}>🚶</Text>
                  <Text style={styles.distanceText}>
                    {product.walking_time} min a pied
                  </Text>
                </View>
                {product.cycling_time && (
                  <View style={styles.distanceItem}>
                    <Text style={styles.distanceIcon}>🚴</Text>
                    <Text style={styles.distanceText}>
                      {product.cycling_time} min a velo
                    </Text>
                  </View>
                )}
                {product.transit_time && (
                  <View style={styles.distanceItem}>
                    <Text style={styles.distanceIcon}>🚌</Text>
                    <Text style={styles.distanceText}>
                      {product.transit_time} min en transport
                    </Text>
                  </View>
                )}
                <Text style={styles.distanceKm}>({product.distance} km)</Text>
              </View>
            )}

            {shopLat && shopLon && (
              <TouchableOpacity
                style={styles.mapContainer}
                onPress={() => openInMaps(shopLat, shopLon, product.adresse)}
              >
                <Image
                  source={{ uri: getOpenStreetMapUrl(shopLat, shopLon) }}
                  style={styles.map}
                  resizeMode="cover"
                />
                <View style={styles.mapOverlay}>
                  <Text style={styles.mapText}>Appuyer pour ouvrir dans Maps</Text>
                </View>
              </TouchableOpacity>
            )}

            {(product.pickup_start_time || product.pickup_end_time) && (
              <View style={styles.pickupSection}>
                <Text style={styles.sectionTitle}>Horaires de retrait</Text>
                <View style={styles.pickupTimeContainer}>
                  <Text style={styles.pickupIcon}>🕐</Text>
                  <Text style={styles.pickupTime}>
                    {formatTime(product.pickup_start_time)} -{' '}
                    {formatTime(product.pickup_end_time)}
                  </Text>
                </View>
                {product.pickup_instructions && (
                  <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsIcon}>ℹ️</Text>
                    <Text style={styles.instructionsText}>
                      {product.pickup_instructions}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {product.commerce_id && (
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => setShowReviewModal(true)}
              >
                <Text style={styles.reviewButtonText}>Donner mon avis</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Stock disponible</Text>
              <Text style={styles.infoValue}>{product.stock}</Text>
            </View>
            {product.dlc && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>DLC</Text>
                <Text style={styles.infoValue}>{formatDate(product.dlc)}</Text>
              </View>
            )}
          </View>

          {product.date_peremption && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Date de péremption</Text>
                <Text style={styles.infoValue}>{formatDate(product.date_peremption)}</Text>
              </View>
            </View>
          )}

          {/* Quantity Selector */}
          {!isInCart(product.id) && (
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantité</Text>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={[styles.quantityButton, quantity === 1 && styles.quantityButtonDisabled]}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity === 1}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={[styles.quantityButton, quantity >= product.stock && styles.quantityButtonDisabled]}
                  onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.quantityHelp}>
                Maximum: {product.stock} disponible{product.stock > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.addToCartButton,
              isInCart(product.id) && styles.addToCartButtonDisabled
            ]}
            onPress={() => {
              if (isInCart(product.id)) {
                Alert.alert('Déjà dans le panier', 'Ce produit est déjà dans votre panier');
              } else {
                addToCart({
                  id: product.id,
                  nom: product.nom,
                  description: product.description,
                  prix: product.prix,
                  prix_original: product.prix_original,
                  image_url: product.image_url,
                  dlc: product.dlc,
                  nom_commerce: product.nom_commerce,
                  category_name: product.category_name,
                  stock: product.stock,
                  ingredient_nom: product.ingredient_nom,
                  ingredient_ids: product.ingredient_ids,
                  quantity: quantity,
                });
                Alert.alert(
                  'Ajouté au panier',
                  `${quantity} x ${product.nom} ${quantity > 1 ? 'ont été ajoutés' : 'a été ajouté'} à votre panier`
                );
                setQuantity(1); // Reset quantity after adding
              }
            }}
            disabled={isInCart(product.id)}
          >
            <Text style={styles.addToCartText}>
              {isInCart(product.id) ? '✓ Déjà dans le panier' : `🛒 Ajouter au panier (${(parseFloat(product.prix) * quantity).toFixed(2)} EUR)`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {product.commerce_id && (
        <>
          <ReviewModal
            visible={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            commerceId={product.commerce_id}
            commerceName={product.nom_commerce}
            onReviewSubmitted={() => loadProduct(location?.latitude, location?.longitude)}
          />
          <CommerceReviewsModal
            visible={showReviewsListModal}
            onClose={() => setShowReviewsListModal(false)}
            commerceId={product.commerce_id}
            commerceName={product.nom_commerce}
          />
        </>
      )}
    </View>
  );
};
