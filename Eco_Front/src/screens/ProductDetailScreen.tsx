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
import * as Location from 'expo-location';
import { styles } from './ProductDetailScreen.styles';
import * as API from '../services/api';

interface LotItem {
  id: string;
  nom: string;
  description: string;
  prix: string;
  prix_original: string;
  image_url: string | null;
  dlc: string;
  is_bio: boolean;
  is_local: boolean;
}

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
  transit_time: number | null;
  category_name: string;
  ingredient_nom: string | null;
  ingredient_id: string | null;
  lot_items?: LotItem[];
}

interface ProductDetailScreenProps {
  productId: string;
  onNavigateBack: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  productId,
  onNavigateBack,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    requestLocationAndLoadProduct();
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
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details du produit</Text>
          <View style={styles.backButton} />
        </View>
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
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details du produit</Text>
          <View style={styles.backButton} />
        </View>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details du produit</Text>
        <View style={styles.backButton} />
      </View>

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

          <View style={styles.badges}>
            {product.is_bio && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Bio</Text>
              </View>
            )}
            {product.is_local && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Local</Text>
              </View>
            )}
            {product.is_lot && (
              <View style={styles.badgeLot}>
                <Text style={styles.badgeLotText}>Lot</Text>
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
              <Text style={styles.description}>Ce produit correspond a l'ingredient: {product.ingredient_nom}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commerce</Text>
            <Text style={styles.shopName}>{product.nom_commerce}</Text>
            <Text style={styles.shopAddress}>{product.adresse}</Text>

            {product.walking_time && (
              <View style={styles.distanceContainer}>
                <View style={styles.distanceItem}>
                  <Text style={styles.distanceIcon}>🚶</Text>
                  <Text style={styles.distanceText}>
                    {product.walking_time} min a pied
                  </Text>
                </View>
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
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Stock disponible</Text>
              <Text style={styles.infoValue}>{product.stock}</Text>
            </View>
            {product.dlc && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Date limite</Text>
                <Text style={styles.infoValue}>{formatDate(product.dlc)}</Text>
              </View>
            )}
          </View>

          {product.is_lot && product.lot_items && product.lot_items.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Contenu du lot ({product.lot_items.length} produits)
              </Text>
              {product.lot_items.map((item, index) => (
                <View key={item.id} style={styles.lotItem}>
                  <View style={styles.lotItemHeader}>
                    <Text style={styles.lotItemName}>{item.nom}</Text>
                    <View style={styles.lotItemBadges}>
                      {item.is_bio && (
                        <View style={styles.smallBadge}>
                          <Text style={styles.smallBadgeText}>Bio</Text>
                        </View>
                      )}
                      {item.is_local && (
                        <View style={styles.smallBadge}>
                          <Text style={styles.smallBadgeText}>Local</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {item.description && (
                    <Text style={styles.lotItemDescription}>{item.description}</Text>
                  )}
                  <View style={styles.lotItemFooter}>
                    <Text style={styles.lotItemPrice}>
                      {parseFloat(item.prix).toFixed(2)} EUR
                    </Text>
                    {item.dlc && (
                      <Text style={styles.lotItemDlc}>DLC: {formatDate(item.dlc)}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.addToCartButton}>
            <Text style={styles.addToCartText}>Ajouter au panier</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
