import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { theme } from '../../constants';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CustomerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CalendarDateIcon from '../../../assets/calendar-date.svg';
import { VideoView, useVideoPlayer } from 'expo-video';
import { HeaderWithBack } from '../../components/common';
import { orderService } from '../../services/orderService';
import { Order, Applicant } from '../../types';

type OrderDetailsRouteProp = RouteProp<CustomerStackParamList, 'OrderDetails'>;
type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

interface MediaFile {
  uri: string;
  type: 'image' | 'video';
  name: string;
  size: number;
}

// Используем Order из типов вместо OrderData



// Компонент для превью видео
const VideoPreview: React.FC<{ uri: string }> = ({ uri }) => {
  const player = useVideoPlayer(uri);
  return (
    <VideoView
      player={player}
      style={styles.mediaImage}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

// Удаляем mockOrder - теперь загружаем реальные данные



export const OrderDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OrderDetailsRouteProp>();
  const { orderId } = route.params;

  const [showApplicants, setShowApplicants] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);

  // Загружаем заказ по ID
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Ошибка загрузки заказа:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить данные заказа');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  // Загружаем отклики для заказа
  useEffect(() => {
    const loadApplicants = async () => {
      if (!orderId) return;

      try {
        setApplicantsLoading(true);
        const orderApplicants = await orderService.getApplicantsForOrder(orderId);
        setApplicants(orderApplicants);
        console.log(`[OrderDetailsScreen] Загружено ${orderApplicants.length} откликов для заказа ${orderId}`);
      } catch (error) {
        console.error('Ошибка загрузки откликов:', error);
      } finally {
        setApplicantsLoading(false);
      }
    };

    loadApplicants();
  }, [orderId]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'active':
        return theme.colors.primary;
      case 'completed':
        return '#6B7280';
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'active':
        return 'Активный';
      case 'completed':
        return 'Завершен';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDeleteOrder = () => {
    Alert.alert(
      'Удалить заказ',
      'Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: API запрос для удаления заказа
              await new Promise(resolve => setTimeout(resolve, 1000));
              Alert.alert('Успешно', 'Заказ удален');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить заказ');
            }
          }
        }
      ]
    );
  };

  const handleAcceptApplicant = async (applicantId: string) => {
    try {
      const success = await orderService.updateApplicantStatus(applicantId, 'accepted');
      if (success) {
        Alert.alert('Успешно', 'Отклик принят');
        // Обновляем список откликов
        const updatedApplicants = await orderService.getApplicantsForOrder(orderId);
        setApplicants(updatedApplicants);
      } else {
        Alert.alert('Ошибка', 'Не удалось принять отклик');
      }
    } catch (error) {
      console.error('Ошибка принятия отклика:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при принятии отклика');
    }
  };

  const handleRejectApplicant = async (applicantId: string) => {
    try {
      const success = await orderService.updateApplicantStatus(applicantId, 'rejected');
      if (success) {
        Alert.alert('Успешно', 'Отклик отклонен');
        // Обновляем список откликов
        const updatedApplicants = await orderService.getApplicantsForOrder(orderId);
        setApplicants(updatedApplicants);
      } else {
        Alert.alert('Ошибка', 'Не удалось отклонить отклик');
      }
    } catch (error) {
      console.error('Ошибка отклонения отклика:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при отклонении отклика');
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

    return (
      <View style={styles.applicantCard}>
        <View style={styles.applicantHeader}>
          <View style={styles.applicantInfo}>
            <Text style={styles.applicantName}>{item.workerName}</Text>
            <View style={styles.applicantStats}>
              <Text style={styles.applicantRating}>⭐ {item.rating?.toFixed(1) || '4.5'}</Text>
              <Text style={styles.applicantJobs}>• {item.completedJobs || 0} заказов</Text>
            </View>
          </View>
          <Text style={styles.applicantTime}>{formatAppliedAt(item.appliedAt)}</Text>
        </View>
        <View style={styles.applicantActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptApplicant(item.id)}
          >
            <Text style={styles.acceptButtonText}>Принять</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectApplicant(item.id)}
          >
            <Text style={styles.rejectButtonText}>Отклонить</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Утилитарные функции для форматирования
  const formatBudget = (budget: number) => {
    return budget.toLocaleString('ru-RU');
  };

  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} мин назад`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ч назад`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} дн назад`;
    }
  };

  // Состояния загрузки и ошибок
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загружаем данные заказа...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Заказ не найден</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <HeaderWithBack
          rightAction={{
            text: 'Удалить',
            color: theme.colors.error,
            onPress: handleDeleteOrder,
          }}
        />

        {/* Order Title and Status */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{order.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация о заказе</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Категория:</Text>
            <Text style={styles.infoValue}>{order.category}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Бюджет:</Text>
            <Text style={styles.infoValue}>{formatBudget(order.budget)} сум</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Работников:</Text>
            <Text style={styles.infoValue}>{order.workersNeeded}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Дата:</Text>
            <View style={styles.dateValue}>
              <CalendarDateIcon width={16} height={16} stroke={theme.colors.text.primary} />
              <Text style={styles.infoValue}>{formatDate(order.serviceDate)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Местоположение:</Text>
            <Text style={styles.infoValue}>{order.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Создан:</Text>
            <Text style={styles.infoValue}>{formatCreatedAt(order.createdAt)}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.description}>{order.description}</Text>
        </View>

        {/* Photos */}
        {order.photos && order.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Фотографии</Text>
            <View style={styles.mediaGrid}>
              {order.photos.map((photoUri: string, index: number) => (
                <View key={index} style={styles.mediaItem}>
                  <Image source={{ uri: photoUri }} style={styles.mediaImage} resizeMode="cover" />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Applicants Section */}
        <View style={styles.section}>
          <View style={styles.applicantsHeader}>
            <Text style={styles.sectionTitle}>Отклики ({order.applicantsCount})</Text>
            <TouchableOpacity
              style={styles.viewApplicantsButton}
              onPress={() => setShowApplicants(true)}
            >
              <Text style={styles.viewApplicantsText}>Посмотреть все</Text>
            </TouchableOpacity>
          </View>

          {applicants.slice(0, 2).map((applicant) => {
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

            return (
              <View key={applicant.id} style={styles.applicantPreview}>
                <View style={styles.applicantHeader}>
                  <View style={styles.applicantInfo}>
                    <Text style={styles.applicantName}>{applicant.workerName}</Text>
                    <View style={styles.applicantStats}>
                      <Text style={styles.applicantRating}>⭐ {applicant.rating?.toFixed(1) || '4.5'}</Text>
                      <Text style={styles.applicantJobs}>• {applicant.completedJobs || 0} заказов</Text>
                    </View>
                  </View>
                  <Text style={styles.applicantTime}>{formatAppliedAt(applicant.appliedAt)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Applicants Modal */}
      <Modal
        visible={showApplicants}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Отклики ({applicants.length})</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowApplicants(false)}
            >
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={applicants}
            renderItem={renderApplicant}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.applicantsList}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm, // Добавляем небольшой отступ сверху
  },
  title: {
    flex: 1,
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.md,
  },
  statusBadge: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
    flex: 1,
    textAlign: 'right',
  },
  dateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: theme.spacing.xs,
  },
  description: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  applicantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewApplicantsButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  viewApplicantsText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  applicantPreview: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  applicantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  applicantStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantRating: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  applicantJobs: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  applicantTime: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  applicantMessage: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  closeButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  applicantsList: {
    padding: theme.spacing.lg,
  },
  applicantCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  applicantActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rejectButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  errorButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  errorButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
  },
}); 