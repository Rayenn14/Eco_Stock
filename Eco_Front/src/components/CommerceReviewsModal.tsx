import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as API from '../services/api';

interface Review {
  id: string;
  note: number;
  commentaire: string | null;
  created_at: string;
  prenom: string;
  nom: string;
}

interface CommerceReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  commerceId: string;
  commerceName: string;
}

export const CommerceReviewsModal: React.FC<CommerceReviewsModalProps> = ({
  visible,
  onClose,
  commerceId,
  commerceName,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_reviews: 0, average_rating: 0 });

  useEffect(() => {
    if (visible && commerceId) {
      loadReviews();
    }
  }, [visible, commerceId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await API.getCommerceReviews(commerceId);
      if (response.success) {
        setReviews(response.reviews);
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Erreur chargement avis:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderStars = (note: number) => {
    return '\u2605'.repeat(note) + '\u2606'.repeat(5 - note);
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.prenom?.charAt(0) || '?'}{item.nom?.charAt(0) || ''}
            </Text>
          </View>
          <Text style={styles.userName}>{item.prenom} {item.nom?.charAt(0)}.</Text>
        </View>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>

      <Text style={styles.stars}>{renderStars(item.note)}</Text>

      {!!item.commentaire && (
        <Text style={styles.comment}>{item.commentaire}</Text>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Avis sur {commerceName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
          </View>

          {stats.total_reviews > 0 && (
            <View style={styles.statsContainer}>
              <Text style={styles.avgRating}>
                {stats.average_rating > 0 ? stats.average_rating.toFixed(1) : '-'}
              </Text>
              <Text style={styles.avgStars}>
                {stats.average_rating > 0
                  ? renderStars(Math.round(stats.average_rating))
                  : '\u2606\u2606\u2606\u2606\u2606'}
              </Text>
              <Text style={styles.totalReviews}>
                {stats.total_reviews} avis
              </Text>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#166534" />
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>*</Text>
              <Text style={styles.emptyText}>Aucun avis</Text>
              <Text style={styles.emptySubtext}>
                Ce commerce n'a pas encore recu d'avis
              </Text>
            </View>
          ) : (
            <FlatList
              data={reviews}
              renderItem={renderReview}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avgRating: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  avgStars: {
    fontSize: 18,
    color: '#F59E0B',
  },
  totalReviews: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#166534',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  stars: {
    fontSize: 18,
    color: '#F59E0B',
    marginBottom: 8,
  },
  comment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    color: '#D1D5DB',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
