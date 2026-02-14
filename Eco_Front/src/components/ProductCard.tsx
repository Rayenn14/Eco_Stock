import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface Product {
  id: string;
  nom: string;
  description: string;
  prix: string;
  prix_original: string;
  stock: number;
  image_url: string | null;
  dlc: string;
  is_disponible: boolean;
  nom_commerce: string;
  adresse: string;
  latitude: string | null;
  longitude: string | null;
  distance: string | null;
  walking_time: number | null;
  category_name: string;
}

interface ProductCardProps {
  product: Product;
  onPress: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const discountPercent = product.prix_original
    ? Math.round((1 - Number.parseFloat(product.prix) / Number.parseFloat(product.prix_original)) * 100)
    : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(product.id)}
      activeOpacity={0.7}
    >
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} />
      ) : (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>Pas d'image</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.nom}
          </Text>
          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          )}
        </View>

        <View style={styles.badges}>
          {!!product.category_name && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category_name}</Text>
            </View>
          )}
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>
              {product.stock} {product.stock > 1 ? 'disponibles' : 'disponible'}
            </Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{Number.parseFloat(product.prix).toFixed(2)} EUR</Text>
          {!!product.prix_original && (
            <Text style={styles.originalPrice}>{Number.parseFloat(product.prix_original).toFixed(2)} EUR</Text>
          )}
        </View>

        <View style={styles.shopInfo}>
          <Text style={styles.shopName} numberOfLines={1}>
            {product.nom_commerce}
          </Text>
          {!!product.walking_time && (
            <Text style={styles.distance}>
              {product.walking_time} min a pied
            </Text>
          )}
        </View>

        {!!product.dlc && (
          <Text style={styles.dlc}>
            DLC: {formatDate(product.dlc)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  noImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '600',
  },
  stockBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  shopInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopName: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  distance: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  dlc: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
