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
  prenom: string;
  nom: string;
  photo_profil: string | null;
}

interface ShopReviewsScreenProps {
  onNavigateBack: () => void;
}

export const ShopReviewsScreen: React.FC<ShopReviewsScreenProps> = ({ onNavigateBack }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total_reviews: 0, average_rating: 0 });
  const [commerceName, setCommerceName] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await API.getShopReviews();
      if (response.success) {
        setReviews(response.reviews);
        setStats(response.stats);
        if (response.commerce) {
          setCommerceName(response.commerce.nom_commerce);
        }
      }
    } catch (error: any) {
      if (error.message !== 'Session expiree') {
        Alert.alert('Erreur', 'Impossible de charger les avis');
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Avis boutique</Text>
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
        <Text style={styles.headerTitle}>Avis boutique</Text>
        <View style={styles.backButton} />
      </View>

      {commerceName ? (
        <View style={styles.statsContainer}>
          <Text style={styles.commerceName}>{commerceName}</Text>
          <View style={styles.statsRow}>
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
        </View>
      ) : null}

      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>★</Text>
          <Text style={styles.emptyText}>Aucun avis</Text>
          <Text style={styles.emptySubtext}>
            Votre boutique n'a pas encore recu d'avis
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
  statsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  commerceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avgRating: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  avgStars: {
    fontSize: 20,
    color: '#F59E0B',
  },
  totalReviews: {
    fontSize: 14,
    color: '#6B7280',
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
