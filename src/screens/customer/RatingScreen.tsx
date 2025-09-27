import React, { useState, useEffect, useCallback } from 'react';
import { View,
  Text,
  StyleSheet, TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  TextInput, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { usePlatformSafeAreaInsets, getFixedBottomStyle, getImprovedFixedBottomStyle } from '../../utils/safeAreaUtils';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { CustomerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { orderService } from '../../services/orderService';
import { StarIcon } from '../../components/common';
import { Applicant } from '../../types';

type RatingRouteProp = RouteProp<CustomerStackParamList, 'Rating'>;
type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, size = 40 }) => {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRatingChange(star)}
          style={styles.starButton}
        >
          <StarIcon
            filled={star <= rating}
            size={size}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

interface WorkerRatingState {
  [workerId: string]: number;
}

interface WorkerCommentsState {
  [workerId: string]: string;
}

const getInitials = (fullName?: string): string => {
  if (!fullName) return 'У';
  const names = fullName.trim().split(' ');
  const first = names[0]?.charAt(0)?.toUpperCase() || '';
  const last = names[1]?.charAt(0)?.toUpperCase() || '';
  return first + last || 'У';
};

interface WorkerRatingCardProps {
  worker: Applicant;
  rating: number;
  comment: string;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
}

const WorkerRatingCard: React.FC<WorkerRatingCardProps> = ({ worker, rating, comment, onRatingChange, onCommentChange }) => {
  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1:
        return 'Очень плохо';
      case 2:
        return 'Плохо';
      case 3:
        return 'Удовлетворительно';
      case 4:
        return 'Хорошо';
      case 5:
        return 'Отлично';
      default:
        return 'Не оценено';
    }
  };

  return (
    <View style={styles.workerCard}>
      <View style={styles.workerHeader}>
        {/* Аватар исполнителя */}
        <View style={styles.avatarContainer}>
          {worker.avatar ? (
            <Image source={{ uri: worker.avatar }} style={styles.workerAvatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {getInitials(worker.workerName)}
              </Text>
            </View>
          )}
        </View>

        {/* Информация об исполнителе */}
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{worker.workerName}</Text>
          <Text style={styles.workerPhone}>{worker.workerPhone}</Text>
          {worker.proposedPrice && (
            <Text style={styles.proposedPrice}>Предложенная цена: {worker.proposedPrice} сум</Text>
          )}
        </View>
      </View>

      <View style={styles.ratingSection}>
        <Text style={styles.ratingLabel}>Оцените качество работы</Text>
        <StarRating
          rating={rating}
          onRatingChange={onRatingChange}
          size={40}
        />
        <Text style={[
          styles.ratingText,
          rating === 0 && styles.ratingTextUnrated
        ]}>
          {getRatingText(rating)}
        </Text>
      </View>

      {/* Поле для комментария */}
      <View style={styles.commentSection}>
        <Text style={styles.commentLabel}>Комментарий</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Расскажите о качестве работы исполнителя..."
          placeholderTextColor="#9CA3AF"
          value={comment}
          onChangeText={onCommentChange}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        <Text style={styles.commentCounter}>
          {comment.length}/500
        </Text>
      </View>
    </View>
  );
};

export const RatingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RatingRouteProp>();
  const { orderId, acceptedWorkers } = route.params;
  const insets = usePlatformSafeAreaInsets();

  const [ratings, setRatings] = useState<WorkerRatingState>({});
  const [comments, setComments] = useState<WorkerCommentsState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleRatingChange = (workerId: string, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [workerId]: rating
    }));
  };

  const handleCommentChange = (workerId: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [workerId]: comment
    }));
  };

  // Проверяем, есть ли хотя бы одна оценка
  const hasAnyRating = Object.values(ratings).some(rating => rating > 0);

  // Предотвращаем возврат назад только если оценка не завершена
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Если оценка завершена, разрешаем навигацию
      if (isCompleted) {
        return;
      }

      // Предотвращаем возврат назад
      e.preventDefault();

      // Показываем предупреждение пользователю
      Alert.alert(
        'Завершите оценку',
        'Пожалуйста, завершите оценку работы исполнителей, чтобы продолжить.',
        [{ text: 'Понятно' }]
      );
    });

    return unsubscribe;
  }, [navigation, isCompleted]);

  const handleSubmitReviews = async () => {
    // Получаем только те отзывы, где есть рейтинг > 0
    const reviewsToSubmit = Object.entries(ratings)
      .filter(([_, rating]) => rating > 0)
      .map(([workerId, rating]) => ({
        workerId,
        rating,
        comment: comments[workerId] || undefined
      }));

    console.log('[RatingScreen] Отправляем отзывы:', {
      orderId,
      reviewsToSubmit
    });

    if (reviewsToSubmit.length === 0) {
      // Показываем сообщение о необходимости оценки
      Alert.alert('Оценка обязательна', 'Пожалуйста, оцените работу хотя бы одного исполнителя');
      return;
    }

    setIsSubmitting(true);
    try {
      let successCount = 0;
      let failCount = 0;

      // Отправляем отзывы по одному
      for (const { workerId, rating, comment } of reviewsToSubmit) {
        try {
          console.log(`[RatingScreen] 📝 Отправляем отзыв для исполнителя ${workerId}:`, {
            orderId,
            workerId,
            rating,
            comment: comment ? `"${comment}"` : 'без комментария'
          });

          const success = await orderService.createReview({
            orderId,
            workerId,
            rating,
            comment,
          });

          if (success) {
            successCount++;
            console.log(`[RatingScreen] ✅ Отзыв для исполнителя ${workerId} отправлен`);
          } else {
            failCount++;
            console.error(`[RatingScreen] ❌ Не удалось отправить отзыв для исполнителя ${workerId}`);
          }
        } catch (error) {
          failCount++;
          console.error(`[RatingScreen] Ошибка при отправке отзыва для исполнителя ${workerId}:`, error);
        }
      }

      // Показываем результат
      if (successCount > 0 && failCount === 0) {
        // Отмечаем оценку как завершенную перед показом Alert'а
        setIsCompleted(true);

        Alert.alert(
          'Спасибо!',
          `Отзывы успешно отправлены (${successCount})`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Сбрасываем стек навигации, чтобы нельзя было вернуться назад
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' as any }],
                });
              },
            },
          ]
        );
      } else if (successCount > 0 && failCount > 0) {
        // Отмечаем оценку как завершенную перед показом Alert'а
        setIsCompleted(true);

        Alert.alert(
          'Частично отправлено',
          `Отправлено: ${successCount}, не удалось отправить: ${failCount}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Сбрасываем стек навигации, чтобы нельзя было вернуться назад
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' as any }],
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить ни одного отзыва. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('[RatingScreen] Общая ошибка при отправке отзывов:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при отправке отзывов');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Простой заголовок без кнопки назад */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Оценить работу</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Заголовок */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Как прошла работа?</Text>
            <Text style={styles.subtitle}>
              Оцените работу каждого исполнителя
            </Text>
          </View>

          {/* Карточки исполнителей */}
          {acceptedWorkers.map((worker) => (
            <WorkerRatingCard
              key={worker.workerId}
              worker={worker}
              rating={ratings[worker.workerId] || 0}
              comment={comments[worker.workerId] || ''}
              onRatingChange={(rating) => handleRatingChange(worker.workerId, rating)}
              onCommentChange={(comment) => handleCommentChange(worker.workerId, comment)}
            />
          ))}

        </View>
      </ScrollView>

      {/* Фиксированная кнопка внизу */}
      <View style={[styles.fixedButtonContainer, getImprovedFixedBottomStyle(insets)]}>
        <TouchableOpacity
          style={[
            styles.fixedButton,
            (isSubmitting || !hasAnyRating) && styles.fixedButtonDisabled,
          ]}
          onPress={handleSubmitReviews}
          disabled={isSubmitting || !hasAnyRating}
        >
          <Text style={[
            styles.fixedButtonText,
            (isSubmitting || !hasAnyRating) && styles.fixedButtonTextDisabled,
          ]}>
            {isSubmitting ? 'Отправляем...' : 'Готово'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg + 100, // Увеличенный отступ для фиксированной кнопки
  },
  headerSection: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  workerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 0, borderColor: theme.colors.border,
  },
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
  },
  workerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.surface,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  workerPhone: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  proposedPrice: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  ratingLabel: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  starButton: {
    paddingHorizontal: theme.spacing.xs,
  },
  ratingText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
  ratingTextUnrated: {
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    // paddingTop и paddingBottom устанавливаются через getImprovedFixedBottomStyle
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  fixedButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  fixedButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
    opacity: 0.5,
  },
  fixedButtonText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.surface,
  },
  fixedButtonTextDisabled: {
    color: theme.colors.background,
  },
  commentSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  commentLabel: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  commentInput: {
    borderWidth: 0, borderColor: 'transparent', borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    textAlignVertical: 'top',
    backgroundColor: '#FAFBFC',
    minHeight: 80,
  },
  commentCounter: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
});