import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TemporaryHomeScreenProps {
  user: any;
  onLogout: () => void;
}

export const TemporaryHomeScreen: React.FC<TemporaryHomeScreenProps> = ({ user, onLogout }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>✅ Connecté avec succès !</Text>
        <Text style={styles.subtitle}>Bienvenue {user?.prenom} {user?.nom}</Text>
        <Text style={styles.role}>Rôle : {user?.user_type}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        
        {user?.user_type === 'vendeur' && user?.nom_commerce && (
          <Text style={styles.commerce}>🏪 {user.nom_commerce}</Text>
        )}
        
        {user?.user_type === 'association' && user?.nom_association && (
          <Text style={styles.commerce}>🤝 {user.nom_association}</Text>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  role: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  email: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  commerce: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
