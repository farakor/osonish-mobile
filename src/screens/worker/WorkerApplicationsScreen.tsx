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
  StatusBar,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
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
import { useWorkerTranslation } from '../../hooks/useTranslation';


type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
type WorkerNavigationProp = NativeStackNavigationProp<WorkerStackParamList>;

// Функция для получения высоты статусбара только на Android
const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

// Функция для преобразования статуса заявки в статус заказа для отображения
const mapApplicationStatusToOrderStatus = (applicationStatus: ApplicationStatus): Order['status'] => {
  switch (applicationStatus) {
    case 'pending': return 'new';
    case 'accepted': return 'in_progress';
    case 'completed': return 'completed';
    case 'rejected': return 'rejected';
    case 'cancelled': return 'cancelled';
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
  onAction: (applicationId: string, action: string) => void;
  userLocation?: LocationCoords;
  navigation: WorkerNavigationProp;
}> = ({ application, onAction, userLocation, navigation }) => {
  const order = convertApplicationToOrder(application);
  const tWorker = useWorkerTranslation();

  const getActionButton = () => {
    switch (application.status) {
      case 'pending':
        return (
          <ModernActionButton
            title={tWorker('cancel_application')}
            onPress={() => onAction(application.id, 'cancel')}
            variant="secondary"
            size="small"
          />
        );
      case 'accepted':
      case 'completed':
      case 'rejected':
      case 'cancelled':
        // Для этих статусов не показываем кнопку, так как статус уже отображается в верхнем бэдже
        return null;
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
  const route = useRoute();
  const params = route.params as { initialStatus?: ApplicationStatus } | undefined;
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(params?.initialStatus || 'accepted');
  const [applications, setApplications] = useState<WorkerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationCoords | undefined>(undefined);
  const tWorker = useWorkerTranslation();



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
      Alert.alert(tWorker('general_error'), tWorker('load_applications_error'));
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
      // Обновляем статус если передан новый параметр
      if (params?.initialStatus && params.initialStatus !== selectedStatus) {
        setSelectedStatus(params.initialStatus);
      }
    }, [params?.initialStatus])
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
    { key: 'pending', label: tWorker('waiting_status'), count: applications.filter(a => a.status === 'pending').length },
    { key: 'accepted', label: tWorker('in_progress_status'), count: applications.filter(a => a.status === 'accepted').length },
    { key: 'completed', label: tWorker('completed_status'), count: applications.filter(a => a.status === 'completed').length },
    { key: 'rejected', label: tWorker('rejected_status'), count: applications.filter(a => a.status === 'rejected').length },
    { key: 'cancelled', label: tWorker('cancelled_status'), count: applications.filter(a => a.status === 'cancelled').length },
  ];

  const filteredApplications = applications.filter(app =>
    app.status === selectedStatus
  );



  const handleApplicationAction = async (applicationId: string, action: string) => {
    console.log(`Action: ${action} for application: ${applicationId}`);

    if (action === 'cancel') {
      Alert.alert(
        tWorker('cancel_application_title'),
        tWorker('cancel_application_message'),
        [
          { text: tWorker('cancel'), style: 'cancel' },
          {
            text: tWorker('cancel_application_button'),
            style: 'destructive',
            onPress: async () => {
              try {
                console.log(`[WorkerApplicationsScreen] 🔄 Отменяем заявку ${applicationId}`);
                const success = await orderService.cancelWorkerApplication(applicationId);
                console.log(`[WorkerApplicationsScreen] Результат отмены: ${success}`);

                if (success) {
                  Alert.alert(tWorker('success'), tWorker('application_cancelled_success'));
                  console.log(`[WorkerApplicationsScreen] ✅ Заявка отменена, перезагружаем данные...`);
                  loadApplications(); // Перезагружаем данные
                } else {
                  console.log(`[WorkerApplicationsScreen] ❌ Не удалось отменить заявку`);
                  Alert.alert(tWorker('general_error'), tWorker('cancel_application_error'));
                }
              } catch (error) {
                console.error('[WorkerApplicationsScreen] ❌ Ошибка отмены заявки:', error);
                Alert.alert(tWorker('general_error'), tWorker('cancel_application_general_error'));
              }
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
        styles.tab,
        selectedStatus === filter.key && styles.activeTab
      ]}
      onPress={() => setSelectedStatus(filter.key)}
    >
      <Text style={[
        styles.tabText,
        selectedStatus === filter.key && styles.activeTabText
      ]}>
        {filter.label} ({filter.count})
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
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.content}>
        <View style={[styles.contentHeader, { paddingTop: theme.spacing.lg + getAndroidStatusBarHeight() }]}>
          <Text style={styles.title}>{tWorker('my_orders')}</Text>
          <Text style={styles.subtitle}>
            {tWorker('track_applications_status')}
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabs}
            contentContainerStyle={styles.tabsContent}
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
                {isLoading ? tWorker('loading') : tWorker('no_applications')}
              </Text>
              <Text style={styles.emptyStateText}>
                {isLoading
                  ? tWorker('loading_applications')
                  : `${tWorker('no_applications_with_status')} "${statusFilters.find(f => f.key === selectedStatus)?.label}"`
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
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  tabsContainer: {
    marginBottom: theme.spacing.lg,
  },
  tabs: {
    paddingHorizontal: theme.spacing.lg,
  },
  tabsContent: {
    paddingRight: theme.spacing.lg,
  },
  tab: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 120,
    marginRight: theme.spacing.sm,
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
  activeTabText: {
    color: theme.colors.primary,
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