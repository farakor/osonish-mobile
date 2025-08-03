import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants';
import { authService } from '../../services/authService';
import { orderService } from '../../services/orderService';
import { supabase } from '../../services/supabaseClient';
import { HeaderWithBack } from '../../components/common';
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
    const isAccepted = acceptedApplicants.has(item.id);
    const isRejected = item.status === 'rejected';

    return (
      <View style={styles.applicantCard}>
        {/* Header с именем и статусом */}
        <View style={styles.applicantHeader}>
          <View style={styles.applicantInfo}>
            <Text style={styles.applicantName}>{item.workerName}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {item.rating ? item.rating.toFixed(1) : 'Нет рейтинга'}</Text>
              <Text style={styles.jobsText}>• {item.completedJobs} работ</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {/* Предложенная цена */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Предложенная цена:</Text>
          <Text style={styles.priceValue}>{formatBudget(item.proposedPrice)}</Text>
        </View>

        {/* Сообщение от исполнителя */}
        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Сообщение:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        {/* Время подачи заявки */}
        <Text style={styles.appliedTime}>Подал заявку: {formatDate(item.appliedAt)}</Text>

        {/* Кнопка выбора исполнителя */}
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => handleSelectApplicant(item)}
          >
            <Text style={styles.selectButtonText}>Выбрать исполнителя</Text>
          </TouchableOpacity>
        )}

        {isAccepted && (
          <View style={styles.acceptedContainer}>
            <Text style={styles.acceptedText}>✅ Выбран для выполнения заказа</Text>
          </View>
        )}
      </View>
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
});