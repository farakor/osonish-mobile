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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import { HeaderWithBack, StarIcon } from '../../components/common';
import { WorkerProfile, Review } from '../../types';
import { CustomerStackParamList } from '../../types/navigation';
import { orderService } from '../../services/orderService';
import UserIcon from '../../../assets/user-01.svg';
import { useCustomerTranslation, useTranslation } from '../../hooks/useTranslation';

type WorkerProfileNavigationProp = NativeStackNavigationProp<CustomerStackParamList, 'WorkerProfile'>;
type WorkerProfileRouteProp = RouteProp<CustomerStackParamList, 'WorkerProfile'>;

export const WorkerProfileScreen: React.FC = () => {
  const navigation = useNavigation<WorkerProfileNavigationProp>();
  const route = useRoute<WorkerProfileRouteProp>();
  const { workerId, workerName } = route.params;
  const t = useCustomerTranslation();
  const { t: tCommon } = useTranslation();

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
        Alert.alert(t('error'), t('profile_not_found_error'));
      }
    } catch (error) {
      console.error('[WorkerProfileScreen] ❌ Ошибка загрузки профиля исполнителя:', error);
      Alert.alert(t('error'), t('profile_load_error'));
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



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Определяем локаль на основе текущего языка
    const locale = tCommon('common.locale') === 'uz' ? 'uz-UZ' : 'ru-RU';
    return date.toLocaleDateString(locale, {
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
        <Text style={styles.reviewOrderTitle}>
          {t('order_title_prefix', { title: review.orderTitle })}
        </Text>
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
          <HeaderWithBack title={t('worker_profile_title')} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('loading_profile')}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!workerProfile) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.content}>
          <HeaderWithBack title={t('worker_profile_title')} />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t('profile_not_found')}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <HeaderWithBack title={t('worker_profile_title')} />

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
          <LinearGradient
            colors={['#679B00', '#5A8A00', '#4A7A00']}
            style={styles.profileCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Background Pattern */}
            <View style={styles.patternBackground}>
              <Ionicons name="hammer-outline" size={48} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon1} />
              <Ionicons name="build-outline" size={44} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon2} />
              <Ionicons name="construct-outline" size={40} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon3} />
              <Ionicons name="hardware-chip-outline" size={38} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon4} />
              <Ionicons name="flash-outline" size={46} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon5} />
              <Ionicons name="settings-outline" size={42} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon6} />
              <Ionicons name="hammer-outline" size={40} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon7} />
              <Ionicons name="build-outline" size={38} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon8} />
            </View>

            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {workerProfile.profileImage ? (
                  <Image source={{ uri: workerProfile.profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <UserIcon width={40} height={40} stroke="rgba(255, 255, 255, 0.8)" />
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
                  {t('on_platform_since', { date: formatDate(workerProfile.joinedAt) })}
                </Text>
              </View>
            </View>

            {/* Статистика */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workerProfile.completedJobs}</Text>
                <Text style={styles.statLabel}>{t('orders_stat')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workerProfile.totalReviews}</Text>
                <Text style={styles.statLabel}>{t('reviews_stat')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {workerProfile.averageRating > 0 ? workerProfile.averageRating.toFixed(1) : '—'}
                </Text>
                <Text style={styles.statLabel}>{t('rating_stat')}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Отзывы */}
          <View style={styles.reviewsSection}>
            <Text style={styles.reviewsTitle}>
              {t('reviews_title', { count: workerProfile.reviews.length })}
            </Text>

            {workerProfile.reviews.length > 0 ? (
              workerProfile.reviews.map(renderReview)
            ) : (
              <View style={styles.noReviewsContainer}>
                <Text style={styles.noReviewsText}>{t('no_reviews')}</Text>
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden',
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
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  joinedDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
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

  // Background Pattern
  patternBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Icon Positions - Random Distribution
  patternIcon1: {
    position: 'absolute',
    top: 25,
    left: 15,
    transform: [{ rotate: '67deg' }],
  },
  patternIcon2: {
    position: 'absolute',
    top: 12,
    right: 45,
    transform: [{ rotate: '-142deg' }],
  },
  patternIcon3: {
    position: 'absolute',
    top: 95,
    left: 35,
    transform: [{ rotate: '203deg' }],
  },
  patternIcon4: {
    position: 'absolute',
    top: 65,
    right: 15,
    transform: [{ rotate: '-78deg' }],
  },
  patternIcon5: {
    position: 'absolute',
    bottom: 85,
    left: 55,
    transform: [{ rotate: '156deg' }],
  },
  patternIcon6: {
    position: 'absolute',
    bottom: 35,
    right: 65,
    transform: [{ rotate: '-234deg' }],
  },
  patternIcon7: {
    position: 'absolute',
    bottom: 60,
    left: '25%',
    transform: [{ rotate: '89deg' }],
  },
  patternIcon8: {
    position: 'absolute',
    top: 55,
    left: '65%',
    transform: [{ rotate: '-167deg' }],
  },
});
