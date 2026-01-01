import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as API from '../services/api';
import { useCart } from '../contexts/CartContext';
import { styles } from './PaymentScreen.styles';
import { getRandomEcoTip } from '../utils/ecoTips';

type RootStackParamList = {
  Payment: {
    items: Array<{ productId: string; quantity: number }>;
    total: number;
  };
  Tabs: undefined;
};

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const route = useRoute<PaymentScreenRouteProp>();
  const { confirmPayment } = useStripe();
  const { clearCart } = useCart();

  const { items, total } = route.params;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [numeroCommande, setNumeroCommande] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cardFocused, setCardFocused] = useState(false);
  const [ecoTip, setEcoTip] = useState('');

  useEffect(() => {
    setEcoTip(getRandomEcoTip());
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setLoading(true);
      console.log('[PaymentScreen] Initializing payment for items:', items);

      const response = await API.createPaymentIntent(items, total);

      if (response.success) {
        setClientSecret(response.clientSecret);
        setPaymentIntentId(response.payment_intent_id);
        setNumeroCommande(response.numero_commande);
        console.log('[PaymentScreen] PaymentIntent created:', response.payment_intent_id);
      } else {
        throw new Error(response.message || 'Erreur lors de la création du paiement');
      }
    } catch (error: any) {
      console.error('[PaymentScreen] Error initializing payment:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible de créer le paiement',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!clientSecret || !paymentIntentId) {
      Alert.alert('Erreur', 'Paiement non initialisé');
      return;
    }

    try {
      setPaying(true);
      console.log('[PaymentScreen] Confirming payment with Stripe...');

      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        console.error('[PaymentScreen] Stripe payment error:', error);
        Alert.alert('Paiement échoué', error.message);
        return;
      }

      if (!paymentIntent) {
        Alert.alert('Erreur', 'Aucune réponse de Stripe');
        return;
      }

      console.log('[PaymentScreen] Stripe payment succeeded, confirming with backend...');

      const confirmResponse = await API.confirmPayment(paymentIntent.id);

      if (confirmResponse.success) {
        console.log('[PaymentScreen] Backend confirmation successful');
        clearCart();

        Alert.alert(
          'Paiement réussi !',
          `Votre commande ${numeroCommande} a été confirmée.\n\nVous pouvez consulter vos achats dans votre profil.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Revenir à l'écran Home en retirant toutes les pages de paiement/panier
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Tabs' }],
                });
              },
            },
          ]
        );
      } else {
        throw new Error(confirmResponse.message || 'Erreur lors de la confirmation');
      }
    } catch (error: any) {
      console.error('[PaymentScreen] Error during payment:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors du paiement'
      );
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Préparation du paiement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={paying}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tip écologique */}
        {ecoTip && (
          <View style={styles.ecoTipContainer}>
            <Text style={styles.ecoTipText}>{ecoTip}</Text>
          </View>
        )}

        {/* Carte de résumé de commande */}
        <View style={styles.orderSummaryCard}>
          <View style={styles.orderSummaryHeader}>
            <Text style={styles.orderLabel}>Commande</Text>
            <Text style={styles.orderNumber}>#{numeroCommande}</Text>
          </View>

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{total.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Champ de carte Stripe */}
        <View style={styles.cardInputSection}>
          <Text style={styles.sectionTitle}>Informations de paiement</Text>

          <View style={styles.cardLogosRow}>
            <View style={styles.cardLogo}>
              <Text style={styles.cardLogoText}>VISA</Text>
            </View>
            <View style={styles.cardLogo}>
              <Text style={styles.cardLogoText}>Mastercard</Text>
            </View>
            <View style={styles.cardLogo}>
              <Text style={styles.cardLogoText}>Amex</Text>
            </View>
          </View>

          <View style={[styles.cardFieldContainer, cardFocused && styles.cardFieldFocused]}>
            <CardField
              postalCodeEnabled={false}
              placeholders={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={{
                backgroundColor: '#FFFFFF',
                textColor: '#000000',
                fontSize: 17,
                placeholderColor: '#9CA3AF',
                borderWidth: 0,
                borderColor: 'transparent',
              }}
              style={styles.cardField}
              onCardChange={(cardDetails) => {
                setCardComplete(cardDetails.complete);
              }}
              onFocus={() => setCardFocused(true)}
              onBlur={() => setCardFocused(false)}
            />
          </View>

          {/* Info mode test */}
          <View style={styles.testBanner}>
            <View style={styles.testBannerIcon}>
              <Text style={styles.testBannerIconText}>⚠️</Text>
            </View>
            <View style={styles.testBannerContent}>
              <Text style={styles.testBannerTitle}>IMPORTANT - Mode Test</Text>
              <Text style={styles.testBannerText}>
                Numéro de carte : 4242 4242 4242 4242{'\n'}
                Date d'expiration : 12/34 (ou toute date future){'\n'}
                Code CVC : 123 (ou tout code 3 chiffres){'\n\n'}
                ⛔ N'utilisez PAS d'autres numéros, ils seront rejetés !
              </Text>
            </View>
          </View>
        </View>

        {/* Sécurité */}
        <View style={styles.securityRow}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Paiement sécurisé SSL/TLS • Propulsé par Stripe
          </Text>
        </View>
      </ScrollView>

      {/* Bouton de paiement fixe en bas */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!cardComplete || paying) && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={!cardComplete || paying}
          activeOpacity={0.9}
        >
          {paying ? (
            <View style={styles.payButtonContent}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.payButtonText}>Traitement en cours...</Text>
            </View>
          ) : (
            <View style={styles.payButtonContent}>
              <Text style={styles.payButtonText}>Payer {total.toFixed(2)} €</Text>
              <Text style={styles.payButtonArrow}>→</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
