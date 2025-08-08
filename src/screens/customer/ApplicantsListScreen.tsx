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
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants';
import { authService } from '../../services/authService';
import { orderService } from '../../services/orderService';
import { supabase } from '../../services/supabaseClient';
import { HeaderWithBack } from '../../components/common';
import UserIcon from '../../../assets/user-01.svg';
import type { CustomerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { Applicant, Order } from '../../types';

type ApplicantsListNavigationProp = NativeStackNavigationProp<CustomerStackParamList, 'ApplicantsList'>;
type ApplicantsListRouteProp = RouteProp<CustomerStackParamList, 'ApplicantsList'>;

export const ApplicantsListScreen: React.FC = () => {
  const navigation = useNavigation<ApplicantsListNavigationProp>();
  const route = useRoute<ApplicantsListRouteProp>();
  const { orderId } = route.params;

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

      // Загружаем данные заказа и отклики параллельно
      const [orderData, applicantsData] = await Promise.all([
        orderService.getOrderById(orderId),
        orderService.getApplicantsForOrder(orderId)
      ]);

      setOrder(orderData);
      setApplicants(applicantsData);

      // Инициализируем список принятых исполнителей
      const accepted = new Set(
        applicantsData
          .filter(applicant => applicant.status === 'accepted')
          .map(applicant => applicant.id)
      );
      setAcceptedApplicants(accepted);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
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
      case 'pending': return 'Ожидает';
      case 'accepted': return 'Принят';
      case 'rejected': return 'Отклонен';
      default: return 'Неизвестно';
    }
  };

  const handleSelectApplicant = (applicant: Applicant) => {
    if (acceptedApplicants.has(applicant.id)) {
      Alert.alert('Информация', 'Этот исполнитель уже выбран для выполнения заказа');
      return;
    }

    if (applicant.status === 'rejected') {
      Alert.alert('Информация', 'Вы уже отклонили этого исполнителя');
      return;
    }

    setSelectedApplicant(applicant);
    setShowConfirmModal(true);
  };

  // Удалена функция handleRejectApplicant - теперь используется автоматическое отклонение

  const handleCallWorker = (workerPhone: string, workerName: string) => {
    Alert.alert(
      'Позвонить исполнителю',
      `Позвонить ${workerName} по номеру ${workerPhone}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Позвонить',
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

            Alert.alert(
              'Исполнители выбраны',
              `Выбрано ${selectedCount} исполнител${selectedCount === 1 ? 'ь' : 'ей'}. Остальные отклики автоматически отклонены.`
            );
          } else {
            // Проверяем и обновляем статус заказа при достижении нужного количества исполнителей
            await orderService.checkAndUpdateOrderStatus(order.id);

            Alert.alert('Успешно', `Исполнитель ${selectedApplicant.workerName} выбран для выполнения заказа`);
          }
        } else {
          const remaining = workersNeeded - selectedCount;
          Alert.alert(
            'Исполнитель выбран',
            `${selectedApplicant.workerName} выбран. Осталось выбрать еще ${remaining} исполнител${remaining === 1 ? 'я' : 'ей'}.`
          );
        }

        await loadData(true);
      } else {
        Alert.alert('Ошибка', 'Не удалось выбрать исполнителя');
      }
    } catch (error) {
      console.error('Ошибка выбора исполнителя:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при выборе исполнителя');
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
        return `${diffMins} мин назад`;
      } else if (diffHours < 24) {
        return `${diffHours} ч назад`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} дн назад`;
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
        {/* Градиентная полоса статуса - только для принятых и отклоненных */}
        {isAccepted && <View style={styles.modernStatusBarAccepted} />}
        {isRejected && <View style={styles.modernStatusBarRejected} />}

        {/* Основное содержимое */}
        <View style={styles.modernCardContent}>
          {/* Заголовок с аватаром */}
          <View style={styles.modernApplicantHeader}>
            {/* Аватар исполнителя */}
            <View style={styles.modernAvatarContainer}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.modernAvatar} />
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
                <Text style={[styles.modernApplicantName, isRejected && styles.rejectedText]}>
                  {item.workerName}
                </Text>

                <View style={styles.modernNameActions}>
                  <TouchableOpacity
                    style={styles.reviewsButton}
                    onPress={() => navigation.navigate('WorkerProfile', {
                      workerId: item.workerId,
                      workerName: item.workerName
                    })}
                  >
                    <Text style={styles.reviewsButtonText}>Отзывы</Text>
                  </TouchableOpacity>

                  {isAccepted && (
                    <View style={styles.modernSelectedBadge}>
                      <Text style={styles.modernSelectedBadgeText}>✓ ВЫБРАН</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.modernStatsRow}>
                <View style={styles.modernStatItem}>
                  <Text style={styles.modernStatIcon}>💼</Text>
                  <Text style={[styles.modernStatText, isRejected && styles.rejectedText]}>
                    {item.completedJobs || 0} заказов
                  </Text>
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

            {/* Статус точка */}
            <View style={styles.modernStatusContainer}>
              {!isAccepted && !isRejected && (
                <View style={styles.modernPendingDot} />
              )}
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
                  Предложенная цена
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
                💬 Комментарий
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
                <Text style={styles.modernContactLabel}>📞 Контакты</Text>
              </View>
              <View style={styles.modernContactRow}>
                <Text style={styles.modernPhoneNumber}>{item.workerPhone}</Text>
                <TouchableOpacity
                  style={styles.modernCallButton}
                  onPress={() => handleCallWorker(item.workerPhone, item.workerName)}
                >
                  <Text style={styles.modernCallButtonText}>Позвонить</Text>
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
                <Text style={styles.modernAcceptButtonText}>✓ Принять исполнителя</Text>
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
          <HeaderWithBack title="Отклики на заказ" />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Загружаем отклики...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <SafeAreaView style={styles.content}>
        <HeaderWithBack title={`Отклики (${applicants.length})`} />

        {/* Информация о заказе */}
        {order && (
          <View style={styles.orderInfoContainer}>
            <Text style={styles.orderTitle}>{order.title}</Text>
            <Text style={styles.orderBudget}>{formatBudget(order.budget)}</Text>
            {order.workersNeeded && (
              <View style={styles.progressContainer}>
                <Text style={styles.workersNeeded}>
                  Выбрано {acceptedApplicants.size} из {order.workersNeeded} исполнител{order.workersNeeded === 1 ? 'я' : 'ей'}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min((acceptedApplicants.size / order.workersNeeded) * 100, 100)}%` }
                    ]}
                  />
                </View>
              </View>
            )}
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
                На этот заказ пока нет откликов
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
              <Text style={styles.modalTitle}>Выбрать исполнителя</Text>
              <Text style={styles.modalText}>
                Вы уверены, что хотите выбрать {selectedApplicant?.workerName} для выполнения заказа?
              </Text>
              {selectedApplicant && (
                <Text style={styles.modalPrice}>
                  Цена: {formatBudget(selectedApplicant.proposedPrice)}
                </Text>
              )}
              {order && order.workersNeeded && acceptedApplicants.size + 1 >= order.workersNeeded && (
                <Text style={styles.modalWarning}>
                  ⚠️ После выбора этого исполнителя остальные отклики будут автоматически отклонены
                </Text>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowConfirmModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, isProcessing && styles.disabledButton]}
                  onPress={confirmSelectApplicant}
                  disabled={isProcessing}
                >
                  <Text style={styles.modalConfirmButtonText}>
                    {isProcessing ? 'Выбираю...' : 'Выбрать'}
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
  orderInfoContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  orderTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  orderBudget: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  workersNeeded: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  progressContainer: {
    marginTop: theme.spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  applicantsList: {
    flex: 1,
  },
  applicantsListContent: {
    padding: theme.spacing.md,
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
    borderRadius: 16,
    marginBottom: theme.spacing.lg,
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
  modernStatusBarAccepted: {
    height: 4,
    backgroundColor: '#679B00',
  },
  modernStatusBarRejected: {
    height: 4,
    backgroundColor: '#FF6B6B',
  },
  modernCardContent: {
    padding: 16,
    minHeight: 140,
  },
  modernApplicantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modernAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  modernAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
  },
  modernAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modernRatingBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#679B00',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modernRatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modernApplicantInfo: {
    flex: 1,
    marginRight: 8,
  },
  modernNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modernNameActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewsButton: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  modernApplicantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 22,
    flex: 1,
    marginRight: 8,
  },
  modernSelectedBadge: {
    backgroundColor: '#679B00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  modernSelectedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modernStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  modernStatIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  modernStatText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  modernTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  modernStatusContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  modernPendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFA726',
  },
  modernPriceContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modernPriceContainerAccepted: {
    backgroundColor: '#F0FDFA',
    borderColor: '#679B00',
  },
  modernPriceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernPriceLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernPriceDiffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modernPriceDiffText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modernPriceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  modernPriceValueAccepted: {
    color: '#679B00',
  },
  modernMessageContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#679B00',
  },
  modernMessageLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernMessageText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontWeight: '400',
  },
  modernContactInfo: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  modernContactHeader: {
    marginBottom: 12,
  },
  modernContactLabel: {
    fontSize: 13,
    color: '#059669',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modernCallButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modernCallButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modernApplicantActions: {
    marginTop: 4,
  },
  modernAcceptButton: {
    backgroundColor: '#679B00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#679B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modernAcceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  rejectedText: {
    color: '#9ca3af',
  },
});