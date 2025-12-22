import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export const AuthHeader = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.iconPlaceholder} />
        <View>
          <Text style={styles.title}>ECO</Text>
          <Text style={styles.title}>STOCK</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Achetez tout, payez moins à l'excellence</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray600,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});