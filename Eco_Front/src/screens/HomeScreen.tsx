import React from 'react';
import {
  View,
  Text,
} from 'react-native';
import { styles } from './HomeScreen.styles';

export const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <View style={styles.cartIcon}>
              <View style={styles.cartBody} />
              <View style={styles.cartWheels}>
                <View style={styles.cartWheel} />
                <View style={styles.cartWheel} />
              </View>
            </View>
          </View>
          <View>
            <Text style={styles.logoText}>ECO STOCK</Text>
            <Text style={styles.slogan}>Achetez tout, payez moins à l'excellence</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Accueil</Text>
        <Text style={styles.subtitle}>Bienvenue sur EcoStock</Text>
        <Text style={styles.description}>
          Votre marketplace anti-gaspillage
        </Text>
      </View>
    </View>
  );
};
