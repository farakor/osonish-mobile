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
import { SvgXml } from 'react-native-svg';
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


// SVG иконка empty-state-no-applied-jobs
const emptyStateNoAppliedJobsSvg = `<svg width="161" height="160" viewBox="0 0 161 160" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M80.6025 142.836C113.403 142.836 140.003 116.436 140.003 83.8364C140.003 51.2364 113.403 24.8364 80.6025 24.8364C47.8025 24.8364 21.2025 51.2364 21.2025 83.8364C21.2025 116.436 47.8025 142.836 80.6025 142.836Z" fill="#F1F3FA"/>
<path d="M126.102 76.1364V112.236C126.102 119.736 120.002 125.836 112.402 125.836H49.0025C41.5025 125.836 35.4025 119.836 35.3025 112.336C35.3025 112.236 35.3025 112.236 35.3025 112.136V76.1364C35.3025 76.0364 35.3025 76.0364 35.3025 75.9364C35.3025 75.7364 35.3025 75.5364 35.4025 75.3364C35.5025 75.0364 35.6025 74.8364 35.7025 74.5364L52.7025 42.0364C53.3025 40.7364 54.6025 40.0364 56.0025 40.0364H105.302C106.702 40.0364 107.902 40.7364 108.602 42.0364L125.602 74.5364C125.702 74.7364 125.802 75.0364 125.902 75.3364C126.102 75.5364 126.102 75.8364 126.102 76.1364Z" fill="#D5DAE5"/>
<g filter="url(#filter0_d_6007_1806)">
<path d="M126.102 76.1364V115.936C126.102 121.436 121.702 125.836 116.102 125.836H45.3025C39.8025 125.836 35.3025 121.436 35.3025 115.936V75.9364C35.3025 75.7364 35.3025 75.5364 35.4025 75.3364H58.2025C61.6025 75.3364 64.4025 78.0364 64.4025 81.5364C64.4025 83.2364 65.1025 84.8364 66.2025 85.9364C67.4025 87.1364 68.8025 87.7364 70.6025 87.7364H90.9025C94.3025 87.7364 97.1025 85.0364 97.1025 81.5364C97.1025 79.8364 97.8025 78.2364 98.9025 77.1364C100.102 75.9364 101.502 75.3364 103.202 75.3364H125.902C126.102 75.5364 126.102 75.8364 126.102 76.1364Z" fill="url(#paint0_linear_6007_1806)"/>
</g>
<path d="M105.723 28.0056C107.028 42.2528 107.68 45.5155 104.725 58.4182C103.764 61.2868 102.804 64.4285 100.744 66.6141C97.8617 70.029 92.6453 71.5316 88.3898 70.4388C83.9971 69.346 80.4279 65.5213 79.6043 60.877C78.9179 58.0084 79.8788 54.5935 82.3498 52.8177C84.958 51.1786 88.6643 51.5884 90.8607 53.6373C93.3316 55.6863 94.2926 58.828 94.1553 61.8332C94.018 64.8383 92.9198 67.8435 91.4098 70.4388C87.9963 76.8204 86.5911 76.797 79.6043 87.278" stroke="#AAB2C5" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="4 4"/>
<path d="M113.376 22.6994C112.854 24.6032 110.767 25.2955 108.68 24.084C106.419 23.0455 104.854 22.1802 105.201 20.4495C105.723 18.7187 107.81 18.5457 110.245 18.3726C113.202 18.0264 113.724 20.7956 113.376 22.6994Z" fill="#D5DAE5"/>
<path d="M96.505 24.43C97.3747 25.9876 99.8096 27.0261 101.549 25.4684C103.462 23.7377 105.028 22.5262 104.158 20.7955C103.288 19.2378 101.897 19.757 98.94 20.1032C96.505 20.6224 95.4614 22.6993 96.505 24.43Z" fill="#D5DAE5"/>
<path d="M104.158 18.0265C105.375 17.8534 106.593 18.5457 106.941 19.5842C107.115 19.9303 107.289 20.4495 107.289 20.7957C107.636 23.2187 106.767 25.2956 105.375 25.4686C103.81 25.8148 102.245 24.084 102.071 21.8341C102.071 21.1418 102.071 20.7957 102.071 20.2764C102.245 19.0649 102.94 18.1996 104.158 18.0265C104.332 18.0265 104.158 18.0265 104.158 18.0265Z" fill="#AAB2C5"/>
<defs>
<filter id="filter0_d_6007_1806" x="13.3025" y="64.3364" width="134.8" height="94.5" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="11"/>
<feGaussianBlur stdDeviation="11"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.397708 0 0 0 0 0.47749 0 0 0 0 0.575 0 0 0 0.27 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_6007_1806"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_6007_1806" result="shape"/>
</filter>
<linearGradient id="paint0_linear_6007_1806" x1="80.6729" y1="74.1683" x2="80.6729" y2="126.381" gradientUnits="userSpaceOnUse">
<stop stop-color="#FDFEFF"/>
<stop offset="0.9964" stop-color="#ECF0F5"/>
</linearGradient>
</defs>
</svg>`;

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
              <SvgXml xml={emptyStateNoAppliedJobsSvg} style={styles.emptyStateIcon} />
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
    width: 80,
    height: 80,
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