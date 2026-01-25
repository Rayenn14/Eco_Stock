import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import * as API from '../services/api';

interface Review {
  id: string;
  note: number;
  commentaire: string | null;
  created_at: string;
  updated_at: string;
  commerce_id: string;
  nom_commerce: string;
  adresse: string;
}

interface MyReviewsScreenProps {
  onNavigateBack: () => void;
}

export const MyReviewsScreen: React.FC<MyReviewsScreenProps> = ({ onNavigateBack }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await API.getMyReviews();
      if (response.success) {
        setReviews(response.reviews);
      }
    } catch (error: any) {
      if (error.message !== 'Session expiree') {
        Alert.alert('Erreur', 'Impossible de charger vos avis');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews();
  };

  const handleDelete = (reviewId: string, commerceName: string) => {
    Alert.alert(
      'Supprimer l\'avis',
      `Voulez-vous supprimer votre avis sur "${commerceName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await API.deleteReview(reviewId);
              if (response.success) {
                setReviews(reviews.filter(r => r.id !== reviewId));
                Alert.alert('Succes', 'Avis supprime');
              } else {
                Alert.alert('Erreur', response.message);
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
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
        <Text style={styles.commerceName}>{item.nom_commerce}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.nom_commerce)}
        >
          <Text style={styles.deleteButtonText}>Supprimer</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.commerceAddress}>{item.adresse}</Text>

      <View style={styles.ratingRow}>
        <Text style={styles.stars}>{renderStars(item.note)}</Text>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>

      {item.commentaire && (
        <Text style={styles.comment}>{item.commentaire}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes avis</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#166534" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes avis</Text>
        <View style={styles.backButton} />
      </View>

      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>★</Text>
          <Text style={styles.emptyText}>Aucun avis</Text>
          <Text style={styles.emptySubtext}>
            Vous n'avez pas encore laisse d'avis sur les commerces
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#166534']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#166534',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  commerceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  commerceAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    fontSize: 18,
    color: '#F59E0B',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  comment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    color: '#D1D5DB',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
