import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface ForgotPasswordScreenProps {
  onNavigateLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ 
  onNavigateLogin 
}) => {
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse email');
      return;
    }
    console.log('Reset password for:', email);
    Alert.alert('Email envoyé', `Vérifiez votre boîte mail : ${email}`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec logo */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🛒</Text>
          </View>
          <Text style={styles.logoText}>ECO</Text>
          <Text style={styles.logoText}>STOCK</Text>
          <Text style={styles.slogan}>Achetez tout, payez moins à l'excellence</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Mot de passe oublié ?</Text>
          <Text style={styles.description}>
            Pas de souci, entrez votre adresse e-mail et nous vous enverrons un lien de réinitialisation.
          </Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse e-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple@mail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Reset button */}
          <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword}>
            <Text style={styles.resetButtonText}>Réinitialiser le mot de passe</Text>
          </TouchableOpacity>

          {/* Back to login */}
          <TouchableOpacity onPress={onNavigateLogin} style={styles.backButton}>
            <Text style={styles.backText}>← Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: '#166534',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 30,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: 1,
  },
  slogan: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  resetButton: {
    backgroundColor: '#166534',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 20,
  },
  backText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
