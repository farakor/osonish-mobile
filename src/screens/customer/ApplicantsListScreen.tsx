import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Modal,
  Linking,
  Image,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants';
import { authService } from '../../services/authService';
import { orderService } from '../../services/orderService';
import { supabase } from '../../services/supabaseClient';
import { HeaderWithBack, StarIcon } from '../../components/common';
import UserIcon from '../../../assets/user-01.svg';
import type { CustomerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { Applicant, Order } from '../../types';
import { useCustomerTranslation } from '../../hooks/useTranslation';

const { height: screenHeight } = Dimensions.get('window');

// Определяем маленький экран для Android (высота меньше 1080px)
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

type ApplicantsListNavigationProp = NativeStackNavigationProp<CustomerStackParamList, 'ApplicantsList'>;
type ApplicantsListRouteProp = RouteProp<CustomerStackParamList, 'ApplicantsList'>;

export const ApplicantsListScreen: React.FC = () => {
  const navigation = useNavigation<ApplicantsListNavigationProp>();
  const route = useRoute<ApplicantsListRouteProp>();
  const { orderId } = route.params;
  const t = useCustomerTranslation();

  const [order, setOrder] = useState<Order | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Состояния для модального окна подтверждения
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [acceptedApplicants, setAcceptedApplicants] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Анимация для карточек откликов
  const animatedCards = useRef<{ [key: string]: Animated.Value }>({}).current;

  useEffect(() => {
    loadData();
  }, [orderId]);

  // Создаем функцию для переиспользования
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Загружаем данные заказа и отфильтрованные отклики параллельно
      const [orderData, filteredApplicants] = await Promise.all([
        orderService.getOrderById(orderId),
        orderService.getFilteredApplicantsForOrder(orderId)
      ]);

      setOrder(orderData);
      setApplicants(filteredApplicants);

      // Инициализируем список принятых исполнителей
      const accepted = new Set(
        filteredApplicants
          .filter(applicant => applicant.status === 'accepted')
          .map(applicant => applicant.id)
      );
      setAcceptedApplicants(accepted);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      Alert.alert(t('error'), t('load_order_error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId]);

  // Обновляем данные при возврате на экран
  useFocusEffect(
    useCallback(() => {
      console.log('[ApplicantsListScreen] 🔄 useFocusEffect: перезагружаем данные');
      loadData(true);
    }, [loadData])
  );

  // Real-time обновления для заказа
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user || !orderId) {
      return;
    }

    console.log('[ApplicantsListScreen] Подключаем real-time обновления заказа');

    const orderSubscription = supabase
      .channel('applicants_order_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload: any) => {
          console.log('[ApplicantsListScreen] Real-time изменение заказа:', payload);
          loadData(true);
        }
      )
      .subscribe();

    return () => {
      console.log('[ApplicantsListScreen] Отключаем real-time обновления заказа');
      orderSubscription.unsubscribe();
    };
  }, [orderId, loadData]);

  // Real-time обновления для откликов
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user || !orderId) {
      return;
    }

    console.log('[ApplicantsListScreen] Подключаем real-time обновления откликов');

    const applicantsSubscription = supabase
      .channel('applicants_list_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applicants',
          filter: `order_id=eq.${orderId}`
        },
        (payload: any) => {
          console.log('[ApplicantsListScreen] Real-time изменение откликов:', payload);
          loadData(true);
        }
      )
      .subscribe();

    return () => {
      console.log('[ApplicantsListScreen] Отключаем real-time обновления откликов');
      applicantsSubscription.unsubscribe();
    };
  }, [orderId, loadData]);

  const formatBudget = (budget: number): string => {
    return `${budget.toLocaleString()} сум`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'accepted': return '#28A745';
      case 'rejected': return '#DC3545';
      default: return '#6C757D';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return t('status_pending');
      case 'accepted': return t('status_accepted');
      case 'rejected': return t('status_rejected');
      default: return t('status_unknown');
    }
  };

  const handleSelectApplicant = (applicant: Applicant) => {
    if (acceptedApplicants.has(applicant.id)) {
      Alert.alert(t('info'), t('applicant_info'));
      return;
    }

    if (applicant.status === 'rejected') {
      Alert.alert(t('info'), t('applicant_rejected_info'));
      return;
    }

    // Убираем предварительную проверку isAvailable
    // Проверка будет происходить на сервере при попытке выбора

    setSelectedApplicant(applicant);
    setShowConfirmModal(true);
  };

  // Удалена функция handleRejectApplicant - теперь используется автоматическое отклонение

  const handleCallWorker = (workerPhone: string, workerName: string) => {
    Alert.alert(
      t('call_worker_title'),
      t('call_worker_message', { name: workerName, phone: workerPhone }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('call_button'),
          onPress: () => {
            Linking.openURL(`tel:${workerPhone}`);
          }
        }
      ]
    );
  };

  const confirmSelectApplicant = async () => {
    if (!selectedApplicant || isProcessing || !order) return;

    try {
      setIsProcessing(true);
      const success = await orderService.updateApplicantStatus(selectedApplicant.id, 'accepted');

      if (success) {
        const newAcceptedApplicants = new Set([...acceptedApplicants, selectedApplicant.id]);
        setAcceptedApplicants(newAcceptedApplicants);

        // Проверяем, достигнуто ли необходимое количество исполнителей
        const workersNeeded = order.workersNeeded || 1;
        const selectedCount = newAcceptedApplicants.size;

        if (selectedCount >= workersNeeded) {
          // Автоматически отклоняем все остальные отклики
          const pendingApplicants = applicants.filter(
            app => app.status === 'pending' && !newAcceptedApplicants.has(app.id)
          );

          if (pendingApplicants.length > 0) {
            // Отклоняем остальных исполнителей
            const rejectPromises = pendingApplicants.map(app =>
              orderService.updateApplicantStatus(app.id, 'rejected')
            );

            await Promise.all(rejectPromises);

            // Проверяем и обновляем статус заказа при достижении нужного количества исполнителей
            await orderService.checkAndUpdateOrderStatus(order.id);

            const ending = selectedCount === 1 ? t('worker_ending_ya') : t('worker_ending_ey');
            Alert.alert(
              t('workers_selected_title'),
              t('workers_selected_message', { count: selectedCount, ending })
            );
          } else {
            // Проверяем и обновляем статус заказа при достижении нужного количества исполнителей
            await orderService.checkAndUpdateOrderStatus(order.id);

            Alert.alert(t('success'), t('worker_selected_success', { name: selectedApplicant.workerName }));
          }
        } else {
          const remaining = workersNeeded - selectedCount;
          const ending = remaining === 1 ? t('worker_ending_ya') : t('worker_ending_ey');
          Alert.alert(
            t('worker_selected_title'),
            t('worker_selected_remaining', { name: selectedApplicant.workerName, remaining, ending })
          );
        }

        await loadData(true);
      } else {
        Alert.alert(
          t('worker_unavailable_title'),
          t('worker_unavailable_message')
        );
      }
    } catch (error) {
      console.error('Ошибка выбора исполнителя:', error);
      Alert.alert(t('error'), t('select_worker_error'));
    } finally {
      setIsProcessing(false);
      setShowConfirmModal(false);
      setSelectedApplicant(null);
    }
  };

  const renderApplicant = ({ item }: { item: Applicant }) => {
    const formatAppliedAt = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return t('time_ago_minutes', { count: diffMins });
      } else if (diffHours < 24) {
        return t('time_ago_hours', { count: diffHours });
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return t('time_ago_days', { count: diffDays });
      }
    };

    const formatPrice = (price: number) => {
      return price.toLocaleString('ru-RU');
    };

    const isAccepted = item.status === 'accepted';
    const isRejected = item.status === 'rejected';
    const isPending = item.status === 'pending';

    // Инициализируем анимацию для карточки если её еще нет
    if (!animatedCards[item.id]) {
      animatedCards[item.id] = new Animated.Value(0);
      // Запускаем анимацию появления
      Animated.timing(animatedCards[item.id], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }

    const animatedStyle = {
      opacity: animatedCards[item.id],
      transform: [
        {
          translateY: animatedCards[item.id].interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
        {
          scale: animatedCards[item.id].interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[
        styles.modernApplicantCard,
        isAccepted && styles.modernAcceptedCard,
        isRejected && styles.modernRejectedCard,
        animatedStyle
      ]}>
        {/* Градиентная полоса статуса - только для отклоненных */}
        {isRejected && <View style={styles.modernStatusBarRejected} />}

        {/* Основное содержимое */}
        <View style={styles.modernCardContent}>
          {/* Заголовок с аватаром */}
          <View style={styles.modernApplicantHeader}>
            {/* Аватар исполнителя */}
            <View style={styles.modernAvatarContainer}>
              {item.avatar ? (
                <Image
                  source={{ uri: item.avatar }}
                  style={styles.modernAvatar}
                  resizeMode="cover"
                  onError={() => {
                    console.log('[ApplicantsListScreen] Ошибка загрузки аватара:', item.avatar);
                  }}
                />
              ) : (
                <View style={styles.modernAvatarPlaceholder}>
                  <UserIcon width={20} height={20} stroke={theme.colors.text.secondary} />
                </View>
              )}
              {/* Рейтинг бейдж на аватаре */}
              <View style={styles.modernRatingBadge}>
                <Text style={styles.modernRatingText}>
                  {item.rating ? item.rating.toFixed(1) : '—'}
                </Text>
              </View>
            </View>

            {/* Информация исполнителя */}
            <View style={styles.modernApplicantInfo}>
              <View style={styles.modernNameRow}>
                <View style={styles.nameWithBadge}>
                  <Text style={[styles.modernApplicantName, isRejected && styles.rejectedText]}>
                    {item.workerName}
                  </Text>
                  {isAccepted && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedIcon}>✓</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modernNameActions}>
                  <TouchableOpacity
                    style={styles.reviewsButton}
                    onPress={() => navigation.navigate('WorkerProfile', {
                      workerId: item.workerId,
                      workerName: item.workerName
                    })}
                  >
                    <View style={styles.reviewsButtonContent}>
                      <StarIcon filled={true} size={14} color="#FDB022" />
                      <Text style={styles.reviewsButtonText}>{t('reviews_button')}</Text>
                    </View>
                  </TouchableOpacity>
                </View>

              </View>

              {/* Время отклика */}
              <View style={styles.modernTimeRow}>
                <Text style={styles.modernStatIcon}>🕒</Text>
                <Text style={[styles.modernStatText, isRejected && styles.rejectedText]}>
                  {formatAppliedAt(item.appliedAt)}
                </Text>
              </View>
            </View>


          </View>

          {/* Предложенная цена */}
          {item.proposedPrice && (
            <View style={[
              styles.modernPriceContainer,
              isAccepted && styles.modernPriceContainerAccepted
            ]}>
              <View style={styles.modernPriceHeader}>
                <Text style={[styles.modernPriceLabel, isRejected && styles.rejectedText]}>
                  {t('proposed_price_label')}
                </Text>
                {order && item.proposedPrice !== order.budget && (
                  <View style={[
                    styles.modernPriceDiffBadge,
                    { backgroundColor: item.proposedPrice > order.budget ? '#FFE6E6' : '#E6F7F6' }
                  ]}>
                    <Text style={[
                      styles.modernPriceDiffText,
                      { color: item.proposedPrice > order.budget ? '#FF4444' : '#4ECDC4' }
                    ]}>
                      {item.proposedPrice > order.budget ? '+' : ''}{formatPrice(item.proposedPrice - order.budget)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[
                styles.modernPriceValue,
                isAccepted && styles.modernPriceValueAccepted,
                isRejected && styles.rejectedText
              ]}>
                {formatPrice(item.proposedPrice)} сум
              </Text>
            </View>
          )}

          {/* Комментарий исполнителя */}
          {item.message && item.message.trim() && (
            <View style={styles.modernMessageContainer}>
              <Text style={[styles.modernMessageLabel, isRejected && styles.rejectedText]}>
                {t('comment_label')}
              </Text>
              <Text style={[styles.modernMessageText, isRejected && styles.rejectedText]}>
                {item.message}
              </Text>
            </View>
          )}

          {/* Контактная информация для принятого исполнителя */}
          {isAccepted && item.workerPhone && (
            <View style={styles.modernContactInfo}>
              <View style={styles.modernContactHeader}>
                <Text style={styles.modernContactLabel}>{t('contacts_label')}</Text>
              </View>
              <View style={styles.modernContactRow}>
                <Text style={styles.modernPhoneNumber}>{item.workerPhone}</Text>
                <TouchableOpacity
                  style={styles.modernCallButton}
                  onPress={() => handleCallWorker(item.workerPhone, item.workerName)}
                >
                  <Text style={styles.modernCallButtonText}>{t('call_worker_button')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}



          {/* Кнопки действий - показываем только для pending заявок */}
          {isPending && (
            <View style={styles.modernApplicantActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modernAcceptButton,
                  {
                    opacity: pressed ? 0.8 : 1,
                    transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                  }
                ]}
                onPress={() => handleSelectApplicant(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
              >
                <Text style={styles.modernAcceptButtonText}>{t('accept_worker_button')}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.content}>
          <HeaderWithBack title={t('applicants_list_title')} />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('loading_applicants')}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <SafeAreaView style={styles.content}>
        <HeaderWithBack title={t('applicants_count_title', { count: applicants.length })} />

        {/* Прогресс выбора исполнителей */}
        {order && order.workersNeeded && (
          <View style={styles.progressOnlyContainer}>
            <Text style={styles.workersNeededLarge}>
              {t('workers_selected_progress', {
                selected: acceptedApplicants.size,
                needed: order.workersNeeded,
                ending: order.workersNeeded === 1 ? t('worker_ending_ya') : t('worker_ending_ey')
              })}
            </Text>
            <View style={styles.progressBarLarge}>
              <View
                style={[
                  styles.progressFillLarge,
                  { width: `${Math.min((acceptedApplicants.size / order.workersNeeded) * 100, 100)}%` }
                ]}
              />
            </View>
          </View>
        )}

        <FlatList
          data={applicants}
          renderItem={renderApplicant}
          keyExtractor={(item) => item.id}
          style={styles.applicantsList}
          contentContainerStyle={styles.applicantsListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadData(true)}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {t('no_applicants')}
              </Text>
            </View>
          }
        />

        {/* Модальное окно подтверждения выбора исполнителя */}
        <Modal
          visible={showConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('select_applicant_title')}</Text>
              <Text style={styles.modalText}>
                {t('select_applicant_message', { name: selectedApplicant?.workerName })}
              </Text>
              {selectedApplicant && (
                <Text style={styles.modalPrice}>
                  {t('price_label', { price: formatBudget(selectedApplicant.proposedPrice) })}
                </Text>
              )}
              {order && order.workersNeeded && acceptedApplicants.size + 1 >= order.workersNeeded && (
                <Text style={styles.modalWarning}>
                  {t('auto_reject_warning')}
                </Text>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowConfirmModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, isProcessing && styles.disabledButton]}
                  onPress={confirmSelectApplicant}
                  disabled={isProcessing}
                >
                  <Text style={styles.modalConfirmButtonText}>
                    {isProcessing ? t('selecting_worker') : t('select_worker')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
  },
  progressOnlyContainer: {
    padding: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  workersNeededLarge: {
    fontSize: isSmallScreen ? theme.fonts.sizes.md : theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    textAlign: 'center',
  },
  progressBarLarge: {
    height: isSmallScreen ? 12 : 16,
    backgroundColor: '#F3F4F6',
    borderRadius: isSmallScreen ? 6 : 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: isSmallScreen ? 6 : 8,
  },
  applicantsList: {
    flex: 1,
  },
  applicantsListContent: {
    padding: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
  },
  applicantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  applicantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  applicantInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  applicantName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  jobsText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
  },
  priceLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  priceValue: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  messageContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
  },
  messageLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  appliedTime: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  selectButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: '#fff',
  },
  acceptedContainer: {
    backgroundColor: '#E8F5E8',
    padding: theme.spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptedText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: '#2E7D32',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyStateText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  modalText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalPrice: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  modalWarning: {
    fontSize: theme.fonts.sizes.sm,
    color: '#FF6B35',
    textAlign: 'center',
    backgroundColor: '#FFF5F5',
    padding: theme.spacing.sm,
    borderRadius: 8,
    marginBottom: theme.spacing.lg,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.secondary,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: `${theme.colors.success}10`,
    borderRadius: theme.borderRadius.sm,
  },
  phoneNumber: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  callButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  callButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.surface,
  },

  // Современные стили для откликов
  modernApplicantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  modernAcceptedCard: {
    borderColor: '#679B00',
    borderWidth: 2,
    backgroundColor: '#FAFFFE',
  },
  modernRejectedCard: {
    opacity: 0.7,
    backgroundColor: '#F8F9FA',
  },

  modernStatusBarRejected: {
    height: 4,
    backgroundColor: '#FF6B6B',
  },
  modernCardContent: {
    padding: isSmallScreen ? 12 : 16,
    minHeight: isSmallScreen ? 120 : 140,
  },
  modernApplicantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: isSmallScreen ? 8 : 12,
  },
  modernAvatarContainer: {
    position: 'relative',
    marginRight: isSmallScreen ? 8 : 12,
  },
  modernAvatar: {
    width: isSmallScreen ? 40 : 48,
    height: isSmallScreen ? 40 : 48,
    borderRadius: isSmallScreen ? 20 : 24,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  modernAvatarPlaceholder: {
    width: isSmallScreen ? 40 : 48,
    height: isSmallScreen ? 40 : 48,
    borderRadius: isSmallScreen ? 20 : 24,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modernRatingBadge: {
    position: 'absolute',
    bottom: isSmallScreen ? -4 : -6,
    right: isSmallScreen ? -4 : -6,
    backgroundColor: '#679B00',
    borderRadius: isSmallScreen ? 10 : 12,
    paddingHorizontal: isSmallScreen ? 6 : 8,
    paddingVertical: isSmallScreen ? 2 : 3,
    minWidth: isSmallScreen ? 20 : 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modernRatingText: {
    fontSize: isSmallScreen ? 10 : 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modernApplicantInfo: {
    flex: 1,
    marginRight: isSmallScreen ? 4 : 8,
  },
  modernNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 1 : 2,
  },
  modernNameActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  reviewsButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: isSmallScreen ? 10 : 14,
    paddingVertical: isSmallScreen ? 6 : 8,
    borderRadius: isSmallScreen ? 6 : 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: isSmallScreen ? 28 : 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewsButtonText: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '600',
    color: '#FDB022',
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  modernApplicantName: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: isSmallScreen ? 20 : 22,
  },
  verifiedBadge: {
    width: isSmallScreen ? 16 : 18,
    height: isSmallScreen ? 16 : 18,
    borderRadius: isSmallScreen ? 8 : 9,
    backgroundColor: '#679B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: isSmallScreen ? 4 : 6,
  },
  verifiedIcon: {
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },


  modernStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: isSmallScreen ? 1 : 2,
  },
  modernStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: isSmallScreen ? 8 : 12,
  },
  modernStatIcon: {
    fontSize: isSmallScreen ? 11 : 12,
    marginRight: isSmallScreen ? 3 : 4,
  },
  modernStatText: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  modernTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: isSmallScreen ? 1 : 2,
  },

  modernPriceContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: isSmallScreen ? 8 : 10,
    padding: isSmallScreen ? 10 : 12,
    marginBottom: isSmallScreen ? 8 : 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modernPriceContainerAccepted: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  modernPriceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 6 : 8,
  },
  modernPriceLabel: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernPriceDiffBadge: {
    paddingHorizontal: isSmallScreen ? 6 : 8,
    paddingVertical: isSmallScreen ? 2 : 3,
    borderRadius: isSmallScreen ? 6 : 8,
  },
  modernPriceDiffText: {
    fontSize: isSmallScreen ? 10 : 11,
    fontWeight: '700',
  },
  modernPriceValue: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  modernPriceValueAccepted: {
    color: '#679B00',
  },
  modernMessageContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: isSmallScreen ? 8 : 10,
    padding: isSmallScreen ? 10 : 12,
    marginBottom: isSmallScreen ? 8 : 10,
    borderLeftWidth: 3,
    borderLeftColor: '#679B00',
  },
  modernMessageLabel: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: isSmallScreen ? 6 : 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernMessageText: {
    fontSize: isSmallScreen ? 14 : 15,
    color: '#374151',
    lineHeight: isSmallScreen ? 20 : 22,
    fontWeight: '400',
  },
  modernContactInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: isSmallScreen ? 8 : 10,
    padding: isSmallScreen ? 10 : 12,
    marginBottom: isSmallScreen ? 8 : 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modernContactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 6 : 8,
  },
  modernContactLabel: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernContactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernPhoneNumber: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modernCallButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    paddingVertical: isSmallScreen ? theme.spacing.xs : theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isSmallScreen ? 36 : 40,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modernCallButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.white,
  },
  modernApplicantActions: {
    marginTop: isSmallScreen ? 2 : 4,
  },
  modernAcceptButton: {
    backgroundColor: '#679B00',
    paddingVertical: isSmallScreen ? 12 : 14,
    borderRadius: isSmallScreen ? 10 : 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#679B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modernAcceptButtonText: {
    fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  rejectedText: {
    color: '#9ca3af',
  },
});