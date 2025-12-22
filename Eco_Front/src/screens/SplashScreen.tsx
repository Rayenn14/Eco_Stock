import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        {/* Logo placeholder - remplace par ton image */}
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🛒</Text>
        </View>
        <Text style={styles.logoText}>ECO</Text>
        <Text style={styles.logoText}>STOCK</Text>
        <Text style={styles.slogan}>Achetez tout, payez moins à l'excellence</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: '#166534',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 40,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: 2,
  },
  slogan: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
});
