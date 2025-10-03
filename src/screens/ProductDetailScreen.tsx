import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';

type ProductDetailScreenRouteProp = RouteProp<{ ProductDetail: { product: any } }, 'ProductDetail'>;

interface Props {
  route: ProductDetailScreenRouteProp;
}

const ProductDetailScreen: React.FC<Props> = ({ route }) => {
  const { product } = route.params;

  return (
    <View style={styles.container}>
      <Image source={product.image} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{product.price} €</Text>
        {/* Ajoute description, bouton ajouter au panier, etc. */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  image: { width: '100%', height: 300, resizeMode: 'cover' },
  details: { padding: 16 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  price: { fontSize: 20, color: '#4CAF50', fontWeight: '600' },
});

export default ProductDetailScreen;