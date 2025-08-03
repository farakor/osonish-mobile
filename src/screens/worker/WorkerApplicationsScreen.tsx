import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants/theme';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { locationService, LocationCoords } from '../../services/locationService';
import { supabase } from '../../services/supabaseClient';
import { WorkerApplication, Order } from '../../types';
import { WorkerStackParamList } from '../../types/navigation';
import { ModernOrderCard } from '../../components/cards';
import { ModernActionButton } from '../../components/common';


type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'completed';
type WorkerNavigationProp = NativeStackNavigationProp<WorkerStackParamList>;

// Функция для преобразования статуса заявки в статус заказа для отображения
const mapApplicationStatusToOrderStatus = (applicationStatus: ApplicationStatus): Order['status'] => {
  switch (applicationStatus) {
    case 'pending': return 'new';
    case 'accepted': return 'in_progress';
    case 'completed': return 'completed';
    case 'rejected': return 'cancelled';
    default: return 'new';
  }
};

// Функция для преобразования WorkerApplication в Order формат
const convertApplicationToOrder = (application: WorkerApplication): Order => {
  return {
    id: application.orderId,
    title: application.orderTitle,
    description: application.orderDescription,
    category: application.orderCategory,
    location: application.orderLocation,
    latitude: application.orderLatitude,
    longitude: application.orderLongitude,
    budget: application.orderBudget,
    workersNeeded: 1, // По умолчанию, так как эта информация не доступна в WorkerApplication
    serviceDate: application.orderServiceDate,
    photos: undefined,
    // Используем статус заявки вместо статуса заказа
    status: mapApplicationStatusToOrderStatus(application.status),
    customerId: '', // Не доступно в WorkerApplication
    applicantsCount: 0, // Для истории не важно
    createdAt: application.appliedAt,
    updatedAt: application.appliedAt,
  };
};

// Отдельный компонент для карточки заявки
const ApplicationCard: React.FC<{
  application: WorkerApplication;
  onAction: (applicationId: string, action: string, customerPhone?: string) => void;
  userLocation?: LocationCoords;
  navigation: WorkerNavigationProp;
}> = ({ application, onAction, userLocation, navigation }) => {
  const order = convertApplicationToOrder(application);

  const getActionButton = () => {
    switch (application.status) {
      case 'pending':
        return (
          <ModernActionButton
            title="Отменить заявку"
            onPress={() => onAction(application.id, 'cancel')}
            variant="secondary"
            size="small"
          />
        );
      case 'accepted':
      case 'completed':
        return (
          <ModernActionButton
            title="Связаться"
            onPress={() => onAction(application.id, 'contact', application.customerPhone)}
            variant="primary"
            size="small"
          />
        );
      case 'rejected':
        return (
          <ModernActionButton
            title="Отклонено"
            onPress={undefined}
            variant="disabled"
            size="small"
          />
        );
      default:
        return null;
    }
  };

  return (
    <ModernOrderCard
      order={order}
      onPress={() => navigation.navigate('JobDetails', { orderId: application.orderId })}
      showApplicantsCount={false}
      showCreateTime={false}
      actionButton={getActionButton()}
      workerView={true}
      userLocation={userLocation}
    />
  );
};

export const WorkerApplicationsScreen: React.FC = () => {
  const navigation = useNavigation<WorkerNavigationProp>();
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | 'all'>('all');
  const [applications, setApplications] = useState<WorkerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationCoords | undefined>(undefined);

  // Функция загрузки заявок
  const loadApplications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const workerApplications = await orderService.getWorkerApplications();
      setApplications(workerApplications);
      console.log(`[WorkerApplicationsScreen] Загружено ${workerApplications.length} заявок`);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить заявки');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Загружаем заявки при первом открытии экрана
  useEffect(() => {
    loadApplications();

    // Получаем местоположение пользователя
    const getUserLocation = async () => {
      try {
        const coords = await locationService.getCurrentLocation();
        if (coords) {
          setUserLocation(coords);
          console.log('[WorkerApplicationsScreen] Местоположение пользователя получено:', coords);
        }
      } catch (error) {
        console.log('[WorkerApplicationsScreen] Не удалось получить местоположение:', error);
      }
    };

    getUserLocation();
  }, []);

  // Обновляем данные когда экран получает фокус
  useFocusEffect(
    React.useCallback(() => {
      loadApplications();
    }, [])
  );

  // Real-time обновления заявок
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    console.log('[WorkerApplicationsScreen] Подключаем real-time обновления заявок');

    const subscription = supabase
      .channel('worker_applications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applicants',
          filter: `worker_id=eq.${authState.user.id}`
        },
        (payload: any) => {
          console.log('[WorkerApplicationsScreen] Real-time изменение заявки:', payload);
          // Перезагружаем данные при любых изменениях
          loadApplications();
        }
      )
      .subscribe();

    return () => {
      console.log('[WorkerApplicationsScreen] Отключаем real-time обновления заявок');
      subscription.unsubscribe();
    };
  }, []);

  const statusFilters = [
    { key: 'all', label: 'Все', emoji: '📋', count: applications.length },
    { key: 'pending', label: 'Ожидание', emoji: '⏳', count: applications.filter(a => a.status === 'pending').length },
    { key: 'accepted', label: 'Принято', emoji: '✅', count: applications.filter(a => a.status === 'accepted').length },
    { key: 'completed', label: 'Выполнено', emoji: '🎉', count: applications.filter(a => a.status === 'completed').length },
    { key: 'rejected', label: 'Отклонено', emoji: '❌', count: applications.filter(a => a.status === 'rejected').length },
  ];

  const filteredApplications = applications.filter(app =>
    selectedStatus === 'all' || app.status === selectedStatus
  );



  const handleApplicationAction = async (applicationId: string, action: string, customerPhone?: string) => {
    console.log(`Action: ${action} for application: ${applicationId}`);

    if (action === 'cancel') {
      Alert.alert(
        'Отменить заявку',
        'Вы действительно хотите отменить эту заявку?',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Отменить заявку',
            style: 'destructive',
            onPress: async () => {
              try {
                const success = await orderService.cancelWorkerApplication(applicationId);
                if (success) {
                  Alert.alert('Успешно', 'Заявка отменена');
                  loadApplications(); // Перезагружаем данные
                } else {
                  Alert.alert('Ошибка', 'Не удалось отменить заявку');
                }
              } catch (error) {
                console.error('Ошибка отмены заявки:', error);
                Alert.alert('Ошибка', 'Произошла ошибка при отмене заявки');
              }
            }
          }
        ]
      );
    } else if (action === 'contact' && customerPhone) {
      Alert.alert(
        'Связаться с заказчиком',
        `Позвонить по номеру ${customerPhone}?`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Позвонить',
            onPress: () => {
              Linking.openURL(`tel:${customerPhone}`);
            }
          }
        ]
      );
    }
  };

  const renderStatusFilter = (filter: any) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterChip,
        selectedStatus === filter.key && styles.filterChipActive
      ]}
      onPress={() => setSelectedStatus(filter.key)}
    >
      <Text style={styles.filterEmoji}>{filter.emoji}</Text>
      <Text style={[
        styles.filterChipText,
        selectedStatus === filter.key && styles.filterChipTextActive
      ]}>
        {filter.label}
      </Text>
      <Text style={[
        styles.filterChipCount,
        selectedStatus === filter.key && styles.filterChipCountActive
      ]}>
        ({filter.count})
      </Text>
    </TouchableOpacity>
  );

  const renderApplicationCard = ({ item }: { item: WorkerApplication }) => (
    <ApplicationCard
      application={item}
      onAction={handleApplicationAction}
      userLocation={userLocation}
      navigation={navigation}
    />
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.title}>Мои заявки</Text>
          <Text style={styles.subtitle}>
            Отслеживайте статус ваших заявок на заказы
          </Text>
        </View>

        {/* Улучшенная карусель статусов */}
        <View style={styles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {statusFilters.map(renderStatusFilter)}
          </ScrollView>
        </View>

        <FlatList
          data={filteredApplications}
          renderItem={renderApplicationCard}
          keyExtractor={(item) => item.id}
          style={styles.applicationsList}
          contentContainerStyle={styles.applicationsListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadApplications(true)}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={styles.emptyStateTitle}>
                {isLoading ? 'Загрузка...' : 'Нет заявок'}
              </Text>
              <Text style={styles.emptyStateText}>
                {isLoading
                  ? 'Загружаем ваши заявки...'
                  : selectedStatus === 'all'
                    ? 'Вы еще не подавали заявки на заказы'
                    : `Нет заявок со статусом "${statusFilters.find(f => f.key === selectedStatus)?.label}"`
                }
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  filtersSection: {
    marginBottom: theme.spacing.lg,
  },
  filtersContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  filtersContent: {
    paddingRight: theme.spacing.lg,
  },
  filterChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    minHeight: 90,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.2,
  },
  filterEmoji: {
    fontSize: 28,
    marginBottom: theme.spacing.xs,
  },
  filterChipText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  filterChipTextActive: {
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.semiBold,
  },
  filterChipCount: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.fonts.weights.medium,
    textAlign: 'center',
  },
  filterChipCountActive: {
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.semiBold,
  },
  applicationsList: {
    flex: 1,
  },
  applicationsListContent: {
    paddingBottom: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 