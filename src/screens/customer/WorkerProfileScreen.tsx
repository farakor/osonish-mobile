import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import { HeaderWithBack, StarIcon } from '../../components/common';
import { WorkerProfile, Review } from '../../types';
import { CustomerStackParamList } from '../../types/navigation';
import { orderService } from '../../services/orderService';
import UserIcon from '../../../assets/user-01.svg';

type WorkerProfileNavigationProp = NativeStackNavigationProp<CustomerStackParamList, 'WorkerProfile'>;
type WorkerProfileRouteProp = RouteProp<CustomerStackParamList, 'WorkerProfile'>;

export const WorkerProfileScreen: React.FC = () => {
  const navigation = useNavigation<WorkerProfileNavigationProp>();
  const route = useRoute<WorkerProfileRouteProp>();
  const { workerId, workerName } = route.params;

  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadWorkerProfile = async () => {
    try {
      console.log(`[WorkerProfileScreen] 📋 Загружаем профиль исполнителя ${workerId}...`);

      // Загружаем реальные данные профиля исполнителя
      const profile = await orderService.getWorkerProfile(workerId);

      if (profile) {
        console.log(`[WorkerProfileScreen] ✅ Профиль загружен: ${profile.firstName} ${profile.lastName}`);
        console.log(`[WorkerProfileScreen] 📊 Статистика: ${profile.completedJobs} работ, ${profile.totalReviews} отзывов, рейтинг ${profile.averageRating}`);
        setWorkerProfile(profile);
      } else {
        console.warn(`[WorkerProfileScreen] ⚠️ Профиль исполнителя ${workerId} не найден`);
        Alert.alert('Ошибка', 'Профиль исполнителя не найден');
      }
    } catch (error) {
      console.error('[WorkerProfileScreen] ❌ Ошибка загрузки профиля исполнителя:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить профиль исполнителя');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWorkerProfile();
  }, [workerId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWorkerProfile();
  };

  const handleCallWorker = () => {
    if (workerProfile?.phone) {
      Linking.openURL(`tel:${workerProfile.phone}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <View key={i} style={styles.starContainer}>
          <StarIcon
            filled={i <= rating}
            size={16}
          />
        </View>
      );
    }
    return stars;
  };

  const renderReview = (review: Review) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewCustomerInfo}>
          <Text style={styles.reviewCustomerName}>{review.customerName}</Text>
          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
        </View>
        <View style={styles.reviewRating}>
          {renderStars(review.rating)}
        </View>
      </View>

      {review.orderTitle && (
        <Text style={styles.reviewOrderTitle}>📋 {review.orderTitle}</Text>
      )}

      {review.comment && (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.content}>
          <HeaderWithBack title="Профиль исполнителя" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Загружаем профиль...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!workerProfile) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.content}>
          <HeaderWithBack title="Профиль исполнителя" />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Профиль не найден</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <HeaderWithBack title="Профиль исполнителя" />

        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Основная информация */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {workerProfile.profileImage ? (
                  <Image source={{ uri: workerProfile.profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <UserIcon width={40} height={40} stroke={theme.colors.text.secondary} />
                  </View>
                )}
                {workerProfile.averageRating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>
                      {workerProfile.averageRating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.workerName}>
                  {workerProfile.firstName} {workerProfile.lastName}
                </Text>
                <Text style={styles.joinedDate}>
                  На платформе с {formatDate(workerProfile.joinedAt)}
                </Text>
              </View>
            </View>

            {/* Статистика */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workerProfile.completedJobs}</Text>
                <Text style={styles.statLabel}>Заказов</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workerProfile.totalReviews}</Text>
                <Text style={styles.statLabel}>Отзывов</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {workerProfile.averageRating > 0 ? workerProfile.averageRating.toFixed(1) : '—'}
                </Text>
                <Text style={styles.statLabel}>Рейтинг</Text>
              </View>
            </View>

            {/* Кнопка звонка */}
            <TouchableOpacity style={styles.callButton} onPress={handleCallWorker}>
              <Text style={styles.callButtonText}>📞 Позвонить</Text>
            </TouchableOpacity>
          </View>

          {/* Отзывы */}
          <View style={styles.reviewsSection}>
            <Text style={styles.reviewsTitle}>
              Отзывы ({workerProfile.reviews.length})
            </Text>

            {workerProfile.reviews.length > 0 ? (
              workerProfile.reviews.map(renderReview)
            ) : (
              <View style={styles.noReviewsContainer}>
                <Text style={styles.noReviewsText}>Пока нет отзывов</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.error,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  joinedDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  callButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewsSection: {
    marginBottom: 20,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewCustomerInfo: {
    flex: 1,
  },
  reviewCustomerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  starContainer: {
    marginRight: 2,
  },
  reviewOrderTitle: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  noReviewsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noReviewsText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
