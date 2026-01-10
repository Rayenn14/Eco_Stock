import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as API from '../services/api';
import { styles } from './SettingsScreen.styles';

interface SettingsScreenProps {
  onNavigateBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateBack,
}) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setLoading(true);

      const response = await API.changePassword(currentPassword, newPassword);

      if (response.success) {
        Alert.alert('Succès', 'Mot de passe modifié avec succès');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de modifier le mot de passe');
      }
    } catch (error: any) {
      console.error('[SettingsScreen] Error changing password:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette fonctionnalité sera bientôt disponible. Contactez le support pour supprimer votre compte.',
      [{ text: 'OK' }]
    );
  };

  const showRGPDInfo = () => {
    Alert.alert(
      'Protection de vos données (RGPD)',
      'Chez EcoStock, nous prenons votre vie privée au sérieux.\n\n' +
      'VOS DROITS:\n' +
      '• Accéder à vos données personnelles\n' +
      '• Rectifier vos informations\n' +
      '• Supprimer votre compte\n' +
      '• Exporter vos données\n' +
      '• Vous opposer au traitement\n\n' +
      'VOS DONNÉES:\n' +
      'Nous collectons uniquement les informations nécessaires au fonctionnement de l\'application (nom, email, adresse de livraison). ' +
      'Vos données sont stockées de manière sécurisée et ne sont jamais vendues à des tiers.\n\n' +
      'CONSERVATION:\n' +
      'Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, ' +
      'vos données personnelles sont effacées sous 30 jours (sauf obligations légales).\n\n' +
      'Pour toute question: support@ecostock.fr',
      [{ text: 'Compris' }],
      { cancelable: true }
    );
  };

  const showCGU = () => {
    Alert.alert(
      'Conditions Générales d\'Utilisation',
      'En utilisant EcoStock, vous acceptez:\n\n' +
      '• De fournir des informations exactes lors de votre inscription\n' +
      '• De ne pas utiliser l\'application à des fins illégales\n' +
      '• De respecter les autres utilisateurs et commerçants\n\n' +
      'POUR LES ACHETEURS:\n' +
      '• Les prix affichés sont TTC\n' +
      '• La disponibilité des produits est mise à jour en temps réel\n' +
      '• Les produits proches de leur DLC sont clairement indiqués\n\n' +
      'POUR LES VENDEURS:\n' +
      '• Vous êtes responsable de l\'exactitude des informations produits\n' +
      '• Vous vous engagez à respecter les dates de péremption\n' +
      '• Vous devez honorer les commandes validées\n\n' +
      'Version complète sur: www.ecostock.fr/cgu',
      [{ text: 'OK' }],
      { cancelable: true }
    );
  };

  const showPrivacyPolicy = () => {
    Alert.alert(
      'Politique de confidentialité',
      'SÉCURITÉ DE VOS DONNÉES:\n\n' +
      'Vos informations sensibles (mot de passe, moyens de paiement) sont chiffrées et stockées de manière sécurisée.\n\n' +
      'UTILISATION DES DONNÉES:\n' +
      '• Traitement des commandes\n' +
      '• Communication importante (statut commande)\n' +
      '• Amélioration de nos services\n' +
      '• Respect de nos obligations légales\n\n' +
      'NOUS NE FAISONS JAMAIS:\n' +
      '• Vente de vos données à des tiers\n' +
      '• Spam publicitaire sans consentement\n' +
      '• Partage d\'informations non nécessaires\n\n' +
      'COOKIES:\n' +
      'Nous utilisons uniquement des cookies essentiels au fonctionnement de l\'application.\n\n' +
      'Pour en savoir plus: www.ecostock.fr/confidentialite',
      [{ text: 'OK' }],
      { cancelable: true }
    );
  };

  const showContactSupport = () => {
    Alert.alert(
      'Contactez-nous',
      'Notre équipe est là pour vous aider !\n\n' +
      'Email: support@ecostock.fr\n' +
      'Délai de réponse: 24-48h\n\n' +
      'Pour une question sur:\n' +
      '• Une commande: Précisez le numéro\n' +
      '• Un produit: Joignez une capture d\'écran\n' +
      '• Vos données: Indiquez votre email de compte\n\n' +
      'Nous faisons de notre mieux pour répondre rapidement à toutes vos demandes.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section Sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité et confidentialité</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemText}>Changer le mot de passe</Text>
              <Text style={styles.menuItemSubtext}>Modifiez votre mot de passe actuel</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDeleteAccount}
          >
            <View style={styles.menuItemLeft}>
              <Text style={[styles.menuItemText, styles.dangerText]}>Supprimer mon compte</Text>
              <Text style={styles.menuItemSubtext}>Suppression définitive de vos données</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Section À propos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos et aide</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={showRGPDInfo}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemText}>Protection des données (RGPD)</Text>
              <Text style={styles.menuItemSubtext}>Vos droits et notre engagement</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={showCGU}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemText}>Conditions d'utilisation</Text>
              <Text style={styles.menuItemSubtext}>CGU et règles d'usage</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={showPrivacyPolicy}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemText}>Politique de confidentialité</Text>
              <Text style={styles.menuItemSubtext}>Comment nous protégeons vos données</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={showContactSupport}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemText}>Contacter le support</Text>
              <Text style={styles.menuItemSubtext}>Une question ? Nous sommes là</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <Text style={styles.versionSubtext}>EcoStock - Lutte contre le gaspillage alimentaire</Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal Changement de mot de passe */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mot de passe actuel</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez votre mot de passe actuel"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 caractères"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Retapez le nouveau mot de passe"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, loading && styles.disabledButton]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Modification...' : 'Confirmer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
