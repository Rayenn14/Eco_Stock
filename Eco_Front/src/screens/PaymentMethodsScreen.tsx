import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { styles, paymentIconStyles } from './PaymentMethodsScreen.styles';
import { AppleIcon } from '../components/SocialIcons';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'apple_pay' | 'google_pay';
  last4?: string;
  expiryDate?: string;
  cardholderName?: string;
}

interface PaymentMethodsScreenProps {
  onNavigateBack: () => void;
}

export const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({
  onNavigateBack,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'visa' | 'mastercard' | 'apple_pay' | 'google_pay'>('visa');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const savedMethods = await SecureStore.getItemAsync('paymentMethods');
      if (savedMethods) {
        setPaymentMethods(JSON.parse(savedMethods));
      }
    } catch (error) {
      console.error('Erreur chargement méthodes:', error);
    }
  };

  const validateCardNumber = (number: string): boolean => {
    // Enlever les espaces
    const cleaned = number.replace(/\s/g, '');
    // Vérifier que c'est uniquement des chiffres et entre 13-19 caractères
    return /^\d{13,19}$/.test(cleaned);
  };

  const validateExpiryDate = (date: string): boolean => {
    // Format MM/YY
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(date)) return false;

    const [month, year] = date.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Dernier 2 chiffres
    const currentMonth = currentDate.getMonth() + 1;

    const expYear = Number.parseInt(year);
    const expMonth = Number.parseInt(month);

    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
  };

  const validateCVV = (cvv: string): boolean => {
    return /^\d{3,4}$/.test(cvv);
  };

  const formatCardNumber = (text: string): string => {
    const cleaned = text.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const formatExpiryDate = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleAddMethod = async () => {
    // Validation selon le type
    if (selectedType === 'visa' || selectedType === 'mastercard') {
      if (!cardNumber.trim() || !expiryDate.trim() || !cvv.trim() || !cardholderName.trim()) {
        Alert.alert('Erreur', 'Tous les champs sont obligatoires');
        return;
      }

      if (!validateCardNumber(cardNumber)) {
        Alert.alert('Erreur', 'Numéro de carte invalide');
        return;
      }

      if (!validateExpiryDate(expiryDate)) {
        Alert.alert('Erreur', 'Date d\'expiration invalide (format MM/YY)');
        return;
      }

      if (!validateCVV(cvv)) {
        Alert.alert('Erreur', 'CVV invalide (3 ou 4 chiffres)');
        return;
      }
    }

    setLoading(true);

    try {
      const newMethod: PaymentMethod = {
        id: Date.now().toString(),
        type: selectedType,
        ...(selectedType === 'visa' || selectedType === 'mastercard'
          ? {
              last4: cardNumber.replace(/\s/g, '').slice(-4),
              expiryDate,
              cardholderName,
            }
          : {}),
      };

      const updatedMethods = [...paymentMethods, newMethod];
      setPaymentMethods(updatedMethods);

      // Sauvegarder de manière sécurisée
      await SecureStore.setItemAsync('paymentMethods', JSON.stringify(updatedMethods));

      // Réinitialiser le formulaire
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setCardholderName('');
      setShowAddModal(false);

      Alert.alert('Succès', 'Méthode de paiement ajoutée');
    } catch (error) {
      console.error('Erreur ajout méthode:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter la méthode de paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMethod = (id: string) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer cette méthode de paiement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const updatedMethods = paymentMethods.filter((m) => m.id !== id);
            setPaymentMethods(updatedMethods);
            await SecureStore.setItemAsync('paymentMethods', JSON.stringify(updatedMethods));
          },
        },
      ]
    );
  };

  const PaymentIcon: React.FC<{ type: string }> = ({ type }) => {
    switch (type) {
      case 'visa':
        return (
          <View style={paymentIconStyles.card}>
            <Text style={paymentIconStyles.visaText}>VISA</Text>
          </View>
        );
      case 'mastercard':
        return (
          <View style={paymentIconStyles.card}>
            <View style={paymentIconStyles.mastercardCircles}>
              <View style={[paymentIconStyles.circle, paymentIconStyles.circleRed]} />
              <View style={[paymentIconStyles.circle, paymentIconStyles.circleOrange]} />
            </View>
          </View>
        );
      case 'apple_pay':
        return (
          <View style={paymentIconStyles.applePay}>
            <AppleIcon size={20} color="#000000" />
            <Text style={paymentIconStyles.appleText}>Pay</Text>
          </View>
        );
      case 'google_pay':
        return (
          <View style={paymentIconStyles.googlePay}>
            <View style={paymentIconStyles.gIcon}>
              <Text style={paymentIconStyles.gText}>G</Text>
            </View>
            <Text style={paymentIconStyles.googleText}>Pay</Text>
          </View>
        );
      default:
        return (
          <View style={paymentIconStyles.card}>
            <Text style={paymentIconStyles.defaultText}>💳</Text>
          </View>
        );
    }
  };

  const getPaymentLabel = (type: string): string => {
    switch (type) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      default:
        return type;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Méthodes de paiement</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Liste des méthodes */}
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyText}>Aucune méthode de paiement</Text>
            <Text style={styles.emptySubtext}>
              Ajoutez une méthode pour faciliter vos achats
            </Text>
          </View>
        ) : (
          <View style={styles.methodsContainer}>
            {paymentMethods.map((method) => (
              <View key={method.id} style={styles.methodCard}>
                <View style={styles.methodLeft}>
                  <View style={styles.methodIcon}>
                    <PaymentIcon type={method.type} />
                  </View>
                  <View>
                    <Text style={styles.methodTitle}>{getPaymentLabel(method.type)}</Text>
                    {method.last4 && (
                      <Text style={styles.methodSubtitle}>•••• {method.last4}</Text>
                    )}
                    {method.expiryDate && (
                      <Text style={styles.methodExpiry}>Expire: {method.expiryDate}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDeleteMethod(method.id)}>
                  <View style={styles.deleteIconContainer}>
                    <View style={styles.trashCan}>
                      <View style={styles.trashLid} />
                      <View style={styles.trashBody} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Bouton ajouter */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Ajouter une méthode</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal ajout */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter une méthode</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sélection du type */}
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    selectedType === 'visa' && styles.typeButtonActive,
                  ]}
                  onPress={() => setSelectedType('visa')}
                >
                  <View style={styles.typeIconSmall}>
                    <Text style={styles.visaSmallText}>VISA</Text>
                  </View>
                  <Text
                    style={[
                      styles.typeText,
                      selectedType === 'visa' && styles.typeTextActive,
                    ]}
                  >
                    Visa
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    selectedType === 'mastercard' && styles.typeButtonActive,
                  ]}
                  onPress={() => setSelectedType('mastercard')}
                >
                  <View style={styles.typeIconSmall}>
                    <View style={styles.mcCircles}>
                      <View style={[styles.mcCircle, styles.mcRed]} />
                      <View style={[styles.mcCircle, styles.mcOrange]} />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.typeText,
                      selectedType === 'mastercard' && styles.typeTextActive,
                    ]}
                  >
                    Mastercard
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    selectedType === 'apple_pay' && styles.typeButtonActive,
                  ]}
                  onPress={() => setSelectedType('apple_pay')}
                >
                  <View style={styles.typeIconSmall}>
                    <View style={styles.appleSmall}>
                      <View style={styles.appleSmallBite} />
                      <View style={styles.appleSmallLeaf} />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.typeText,
                      selectedType === 'apple_pay' && styles.typeTextActive,
                    ]}
                  >
                    Apple Pay
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    selectedType === 'google_pay' && styles.typeButtonActive,
                  ]}
                  onPress={() => setSelectedType('google_pay')}
                >
                  <View style={styles.typeIconSmall}>
                    <Text style={styles.gSmallText}>G</Text>
                  </View>
                  <Text
                    style={[
                      styles.typeText,
                      selectedType === 'google_pay' && styles.typeTextActive,
                    ]}
                  >
                    Google Pay
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Formulaire pour cartes */}
              {(selectedType === 'visa' || selectedType === 'mastercard') && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nom du titulaire *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Jean Dupont"
                      value={cardholderName}
                      onChangeText={setCardholderName}
                      placeholderTextColor="#9CA3AF"
                      editable={!loading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Numéro de carte *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                      keyboardType="number-pad"
                      maxLength={19}
                      placeholderTextColor="#9CA3AF"
                      editable={!loading}
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.label}>Date d'expiration *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                        keyboardType="number-pad"
                        maxLength={5}
                        placeholderTextColor="#9CA3AF"
                        editable={!loading}
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>CVV *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="123"
                        value={cvv}
                        onChangeText={setCvv}
                        keyboardType="number-pad"
                        maxLength={4}
                        secureTextEntry
                        placeholderTextColor="#9CA3AF"
                        editable={!loading}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Message pour Apple Pay / Google Pay */}
              {(selectedType === 'apple_pay' || selectedType === 'google_pay') && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    {selectedType === 'apple_pay'
                      ? 'Apple Pay sera configuré automatiquement lors de votre premier paiement.'
                      : 'Google Pay sera configuré automatiquement lors de votre premier paiement.'}
                  </Text>
                </View>
              )}

              {/* Bouton ajouter */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleAddMethod}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Ajouter</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
