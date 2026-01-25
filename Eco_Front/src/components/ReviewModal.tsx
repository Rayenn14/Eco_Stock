import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import * as API from '../services/api';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  commerceId: string;
  commerceName: string;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  commerceId,
  commerceName,
  onReviewSubmitted,
}) => {
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && commerceId) {
      checkExistingReview();
    }
  }, [visible, commerceId]);

  const checkExistingReview = async () => {
    try {
      setCheckingExisting(true);
      const response = await API.checkUserReview(commerceId);
      if (response.success && response.hasReview && response.review) {
        setNote(response.review.note);
        setCommentaire(response.review.commentaire || '');
        setExistingReviewId(response.review.id);
      } else {
        setNote(0);
        setCommentaire('');
        setExistingReviewId(null);
      }
    } catch (error) {
      console.error('Erreur verification avis:', error);
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleSubmit = async () => {
    if (note === 0) {
      Alert.alert('Erreur', 'Veuillez selectionner une note');
      return;
    }

    try {
      setLoading(true);
      const response = await API.addOrUpdateReview(commerceId, note, commentaire.trim() || undefined);

      if (response.success) {
        Alert.alert('Succes', existingReviewId ? 'Avis mis a jour' : 'Avis enregistre');
        onReviewSubmitted();
        onClose();
      } else {
        Alert.alert('Erreur', response.message || 'Impossible d\'enregistrer l\'avis');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setNote(i)}
          style={styles.starButton}
        >
          <Text style={[styles.star, i <= note && styles.starFilled]}>
            {i <= note ? '\u2605' : '\u2606'}
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.overlay}>
            <View style={styles.container}>
              <Text style={styles.title}>
                {existingReviewId ? 'Modifier votre avis' : 'Donner votre avis'}
              </Text>
              <Text style={styles.commerceName}>{commerceName}</Text>

              {checkingExisting ? (
                <ActivityIndicator size="small" color="#166534" style={styles.loader} />
              ) : (
                <>
                  <Text style={styles.label}>Note</Text>
                  <View style={styles.starsContainer}>
                    {renderStars()}
                  </View>

                  <Text style={styles.label}>Commentaire (optionnel)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Partagez votre experience..."
                    value={commentaire}
                    onChangeText={setCommentaire}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  <View style={styles.buttons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={onClose}
                      disabled={loading}
                    >
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.submitButton, loading && styles.buttonDisabled]}
                      onPress={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.submitButtonText}>
                          {existingReviewId ? 'Modifier' : 'Envoyer'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  commerceName: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 8,
  },
  star: {
    fontSize: 36,
    color: '#D1D5DB',
  },
  starFilled: {
    color: '#F59E0B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#166534',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loader: {
    marginVertical: 40,
  },
});
