import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';

interface ValidationScreenProps {
  user: {
    prenom: string;
    nom: string;
    email: string;
    user_type: string;
    nom_commerce?: string;
    nom_association?: string;
  };
  onValidationComplete: () => void;
}

export const ValidationScreen: React.FC<ValidationScreenProps> = ({ 
  user, 
  onValidationComplete 
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Rediriger après 2.5 secondes
    const timer = setTimeout(() => {
      onValidationComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const getRoleEmoji = () => {
    switch (user.user_type) {
      case 'vendeur':
        return '🏪';
      case 'client':
        return '🛍️';
      case 'association':
        return '🤝';
      default:
        return '👤';
    }
  };

  const getRoleLabel = () => {
    switch (user.user_type) {
      case 'vendeur':
        return 'Vendeur';
      case 'client':
        return 'Client';
      case 'association':
        return 'Association';
      default:
        return 'Utilisateur';
    }
  };

  const getDisplayName = () => {
    if (user.user_type === 'vendeur' && user.nom_commerce) {
      return user.nom_commerce;
    }
    if (user.user_type === 'association' && user.nom_association) {
      return user.nom_association;
    }
    return `${user.prenom} ${user.nom}`;
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Icône de succès */}
        <View style={styles.successIcon}>
          <Text style={styles.successEmoji}>✅</Text>
        </View>

        {/* Message de bienvenue */}
        <Text style={styles.title}>Connexion réussie !</Text>
        <Text style={styles.subtitle}>Bienvenue {getDisplayName()}</Text>

        {/* Badge du rôle */}
        <View style={styles.roleBadge}>
          <Text style={styles.roleEmoji}>{getRoleEmoji()}</Text>
          <Text style={styles.roleText}>{getRoleLabel()}</Text>
        </View>

        {/* Email */}
        <Text style={styles.email}>{user.email}</Text>

        {/* Loading */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#166534" />
          <Text style={styles.loadingText}>Chargement de votre espace...</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    width: '100%',
    maxWidth: 400,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#166534',
    marginBottom: 16,
  },
  roleEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  email: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
