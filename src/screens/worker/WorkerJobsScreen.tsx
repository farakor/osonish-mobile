import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  RefreshControl,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { SvgXml } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { notificationService } from '../../services/notificationService';
import { locationService, LocationCoords } from '../../services/locationService';
import { supabase } from '../../services/supabaseClient';
import { Order } from '../../types';
import { PriceConfirmationModal, ProposePriceModal, CustomerPhoneModal, ModernActionButton, OrderStatsWidget } from '../../components/common';
import { ModernOrderCard } from '../../components/cards';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WorkerStackParamList } from '../../types/navigation';
import NotificationIcon from '../../../assets/notification-message.svg';
import { useWorkerTranslation, useCustomerTranslation, useCategoriesTranslation } from '../../hooks/useTranslation';
import { SPECIALIZATIONS, getTranslatedSpecializationName, getSpecializationIconComponent } from '../../constants/specializations';

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

type WorkerNavigationProp = NativeStackNavigationProp<WorkerStackParamList>;

// Функция для получения высоты статусбара только на Android
const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

// Отдельный компонент для карточки заказа с мемоизацией
const JobCard: React.FC<{
  item: Order;
  onApply: (orderId: string) => void;
  hasApplied?: boolean;
  navigation: WorkerNavigationProp;
  userLocation?: LocationCoords;
}> = React.memo(({ item, onApply, hasApplied = false, navigation, userLocation }) => {
  const tWorker = useWorkerTranslation();

  const actionButton = (
    <ModernActionButton
      title={hasApplied ? tWorker('response_sent') : tWorker('apply_to_job')}
      onPress={hasApplied ? undefined : () => onApply(item.id)}
      disabled={hasApplied}
      variant={hasApplied ? 'disabled' : 'primary'}
      size="small"
    />
  );

  return (
    <ModernOrderCard
      order={item}
      onPress={() => navigation.navigate('JobDetails', { orderId: item.id })}
      showApplicantsCount={false}
      showCreateTime={false}
      actionButton={actionButton}
      userLocation={userLocation}
      workerView={true}
    />
  );
}, (prevProps, nextProps) => {
  // Оптимизация: ре-рендер только если изменились ключевые поля
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.budget === nextProps.item.budget &&
    prevProps.item.status === nextProps.item.status &&
    prevProps.hasApplied === nextProps.hasApplied &&
    prevProps.userLocation?.latitude === nextProps.userLocation?.latitude &&
    prevProps.userLocation?.longitude === nextProps.userLocation?.longitude
  );
});

const WorkerJobsScreen: React.FC = () => {
  const navigation = useNavigation<WorkerNavigationProp>();
  const t = useWorkerTranslation();
  const tCustomer = useCustomerTranslation();
  const tCategories = useCategoriesTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Состояние для фильтра по специализации
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>('all');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customerPhoneModalVisible, setCustomerPhoneModalVisible] = useState(false);
  const [priceConfirmationVisible, setPriceConfirmationVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [userApplications, setUserApplications] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState<LocationCoords | undefined>(undefined);
  const [unreadCount, setUnreadCount] = useState(0);
  const [applicationStats, setApplicationStats] = useState({ pending: 0, inProgress: 0 });

  // Функция загрузки заказов
  const loadOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Загружаем все доступные заказы, отклики пользователя и статистику заявок
      const [availableOrders, applications, workerApplications] = await Promise.all([
        orderService.getAvailableOrdersForWorker(),
        orderService.getUserApplications(),
        orderService.getWorkerApplications()
      ]);

      // Фильтруем заказы, исключая те на которые уже есть отклик (только для главного экрана)
      const ordersWithoutApplications = availableOrders.filter(order =>
        !applications.has(order.id)
      );

      console.log(`[WorkerJobsScreen] Загружено ${availableOrders.length} доступных заказов`);
      console.log(`[WorkerJobsScreen] Найдено ${applications.size} откликов пользователя`);
      console.log(`[WorkerJobsScreen] Показываем ${ordersWithoutApplications.length} заказов (исключено ${applications.size} с откликами)`);

      setOrders(ordersWithoutApplications);
      setUserApplications(applications);

      // Подсчитываем статистику заявок
      const pendingCount = workerApplications.filter(app => app.status === 'pending').length;
      const inProgressCount = workerApplications.filter(app => app.status === 'accepted').length;

      setApplicationStats({ pending: pendingCount, inProgress: inProgressCount });

      // Загружаем количество непрочитанных уведомлений
      const authState = authService.getAuthState();
      if (authState.isAuthenticated && authState.user) {
        const count = await notificationService.getUnreadNotificationsCount(authState.user.id);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      Alert.alert(t('general_error'), t('load_job_error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Загружаем заказы и местоположение при первом открытии экрана
  useEffect(() => {
    loadOrders();
    console.log('[WorkerJobsScreen] Используем только Supabase');

    // Получаем местоположение пользователя
    const getUserLocation = async () => {
      try {
        const coords = await locationService.getCurrentLocation();
        if (coords) {
          setUserLocation(coords);
          console.log('[WorkerJobsScreen] Местоположение пользователя получено:', coords);
        }
      } catch (error) {
        console.log('[WorkerJobsScreen] Не удалось получить местоположение:', error);
      }
    };

    getUserLocation();
  }, []);

  // Real-time обновления для отслеживания изменений статусов заказов
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    console.log('[WorkerJobsScreen] Подключаем real-time обновления заказов');

    // Подписка на изменения заказов (например, когда статус меняется обратно на 'new')
    const ordersSubscription = supabase
      .channel('worker_available_orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `status=in.(new,response_received)`
        },
        (payload: any) => {
          console.log('[WorkerJobsScreen] Real-time изменение заказов:', payload);
          // Перезагружаем заказы при изменениях
          loadOrders();
        }
      )
      .subscribe();

    // Подписка на изменения откликов текущего исполнителя
    const applicantsSubscription = supabase
      .channel('worker_own_applications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applicants',
          filter: `worker_id=eq.${authState.user.id}`
        },
        (payload: any) => {
          console.log('[WorkerJobsScreen] Real-time изменение откликов исполнителя:', payload);
          // Перезагружаем заказы при изменениях откликов (например, когда отклик отклонен)
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      console.log('[WorkerJobsScreen] Отключаем real-time обновления');
      ordersSubscription.unsubscribe();
      applicantsSubscription.unsubscribe();
    };
  }, []);

  // Обновляем заказы при возвращении на экран
  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

  // Фильтрация заказов
  useEffect(() => {
    let filtered = orders.filter(order => {
      const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.description.toLowerCase().includes(searchQuery.toLowerCase());
      // Фильтрация по специализации
      const matchesSpecialization = !selectedSpecialization || 
        selectedSpecialization === 'all' || 
        order.specializationId === selectedSpecialization;
      return matchesSearch && matchesSpecialization;
    });

    setFilteredOrders(filtered);
  }, [orders, searchQuery, selectedSpecialization]);

  // Мемоизируем специализации из существующих заказов
  const availableSpecializations = useMemo(() => {
    // Получаем уникальные specializationId из заказов
    const specializationIds = [...new Set(
      orders
        .map(order => order.specializationId)
        .filter(id => id !== undefined && id !== null)
    )] as string[];

    console.log('[WorkerJobsScreen] Найденные specializationId:', specializationIds);

    const specializationsWithCounts = [
      {
        id: 'all',
        name: t('all_categories'),
        count: orders.length,
        IconComponent: undefined // Для "Все" нет иконки
      },
      ...specializationIds.map(specId => ({
        id: specId,
        name: tCategories(specId), // Используем tCategories напрямую с ключом специализации
        count: orders.filter(order => order.specializationId === specId).length,
        IconComponent: getSpecializationIconComponent(specId) // Получаем SVG компонент иконки
      }))
    ];

    return specializationsWithCounts;
  }, [orders, t, tCategories]);



  const handleApplyToJob = React.useCallback(async (orderId: string) => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        Alert.alert(t('general_error'), t('login_required'));
        return;
      }

      // Находим заказ для показа в модалке
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        Alert.alert(t('general_error'), t('order_not_found'));
        return;
      }

      // Загружаем информацию о заказчике
      const customerData = await authService.findUserById(order.customerId);
      if (customerData) {
        setCustomerPhone(customerData.phone || '');
        setCustomerName(`${customerData.lastName} ${customerData.firstName}`);
      }

      // Показываем модалку с номером телефона заказчика
      setSelectedOrder(order);
      setCustomerPhoneModalVisible(true);
    } catch (error) {
      console.error('Ошибка при открытии формы отклика:', error);
      Alert.alert(t('general_error'), t('general_error'));
    }
  }, [orders, t]);

  const handleAcceptPrice = async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user || !selectedOrder) {
        Alert.alert(t('general_error'), t('login_required'));
        return;
      }

      // Закрываем модалку подтверждения
      setPriceConfirmationVisible(false);

      // Создаем отклик с исходной ценой заказа
      const applicantCreated = await orderService.createApplicant({
        orderId: selectedOrder.id,
        workerId: authState.user.id,
        message: '',
        proposedPrice: selectedOrder.budget
      });

      if (applicantCreated) {
        // Добавляем заказ в список откликов пользователя
        setUserApplications(prev => new Set([...prev, selectedOrder.id]));

        // Мгновенно убираем заказ из списка доступных
        setOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
        setFilteredOrders(prev => prev.filter(order => order.id !== selectedOrder.id));

        Alert.alert(
          t('success'),
          t('response_sent_moved_to_history'),
          [
            {
              text: t('ok'),
              onPress: () => {
                setSelectedOrder(null);
              }
            }
          ]
        );
      } else {
        Alert.alert(t('general_error'), t('send_response_error'));
      }
    } catch (error) {
      console.error('Ошибка отклика на заказ:', error);
      Alert.alert(t('general_error'), t('send_response_general_error'));
    }
  };

  // Функция для логирования звонка заказчику (используется в модальном окне)
  const logCallToCustomer = async () => {
    try {
      console.log('[WorkerJobsScreen] 📞 Логируем звонок заказчику из модального окна');
      const authState = authService.getAuthState();
      if (selectedOrder && customerPhone && authState.user) {
        await orderService.logCallAttempt({
          orderId: selectedOrder.id,
          callerId: authState.user.id,
          receiverId: selectedOrder.customerId,
          callerType: 'worker',
          receiverType: 'customer',
          phoneNumber: customerPhone,
          callSource: 'job_details'
        });
        console.log('[WorkerJobsScreen] ✅ Звонок успешно залогирован');
      } else {
        console.warn('[WorkerJobsScreen] ⚠️ Не удалось залогировать звонок - отсутствуют данные:', {
          hasSelectedOrder: !!selectedOrder,
          hasCustomerPhone: !!customerPhone,
          hasUser: !!authState.user
        });
      }
    } catch (error) {
      console.error('[WorkerJobsScreen] ❌ Ошибка логирования звонка:', error);
      // Не прерываем процесс звонка, даже если логирование не удалось
    }
  };

  const handleContinueResponse = () => {
    // Закрываем модалку с номером телефона и показываем модалку подтверждения цены
    setCustomerPhoneModalVisible(false);
    setPriceConfirmationVisible(true);
  };

  const handleProposePrice = () => {
    // Закрываем модалку подтверждения и показываем модалку предложения цены
    setPriceConfirmationVisible(false);
    setModalVisible(true);
  };

  const handleSubmitProposal = async (proposedPrice: number, message: string) => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user || !selectedOrder) {
        Alert.alert(t('general_error'), t('login_required'));
        return;
      }

      // Создаем отклик с предложенной ценой
      const applicantCreated = await orderService.createApplicant({
        orderId: selectedOrder.id,
        workerId: authState.user.id,
        message: message,
        proposedPrice: proposedPrice
      });

      if (applicantCreated) {
        // Добавляем заказ в список откликов пользователя
        setUserApplications(prev => new Set([...prev, selectedOrder.id]));

        // Мгновенно убираем заказ из списка доступных
        setOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
        setFilteredOrders(prev => prev.filter(order => order.id !== selectedOrder.id));

        Alert.alert(
          t('success'),
          t('response_sent_moved_to_history'),
          [
            {
              text: t('ok'),
              onPress: () => {
                setSelectedOrder(null);
              }
            }
          ]
        );
      } else {
        Alert.alert(t('general_error'), t('send_response_error'));
      }
    } catch (error) {
      console.error('Ошибка отклика на заказ:', error);
      Alert.alert(t('general_error'), t('send_response_general_error'));
    }
  };

  const handleNotificationsPress = () => {
    navigation.navigate('NotificationsList');
  };

  // Навигация к разделам "Мои заказы"
  const handlePendingOrdersPress = () => {
    // Переходим на таб "Мои заказы" с фильтром "Ожидание"
    navigation.navigate('MainTabs', {
      screen: 'Applications',
      params: { initialStatus: 'pending' }
    });
  };

  const handleInProgressOrdersPress = () => {
    // Переходим на таб "Мои заказы" с фильтром "В работе"
    navigation.navigate('MainTabs', {
      screen: 'Applications',
      params: { initialStatus: 'accepted' }
    });
  };

  const renderJobCard = React.useCallback(({ item }: { item: Order }) => {
    // На главном экране показываем только заказы без откликов, поэтому hasApplied всегда false
    return (
      <JobCard
        item={item}
        onApply={handleApplyToJob}
        hasApplied={false}
        navigation={navigation}
        userLocation={userLocation}
      />
    );
  }, [handleApplyToJob, navigation, userLocation]);

  const renderEmptyComponent = React.useCallback(() => {
    const hasSearchOrFilter = searchQuery || (selectedSpecialization && selectedSpecialization !== 'all');

    return (
      <View style={styles.emptyState}>
        {hasSearchOrFilter ? (
          <>
            <SvgXml xml={emptyStateNoAppliedJobsSvg} style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateTitle}>{t('no_orders')}</Text>
            <Text style={styles.emptyStateText}>
              {t('no_orders_by_search')}
            </Text>
          </>
        ) : (
          <>
            <SvgXml xml={emptyStateNoAppliedJobsSvg} style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateTitle}>{t('no_new_orders_yet')}</Text>
            <Text style={styles.emptyStateText}>
              {t('pull_to_refresh')}
            </Text>
            <OrderStatsWidget
              pendingCount={applicationStats.pending}
              inProgressCount={applicationStats.inProgress}
              onPendingPress={handlePendingOrdersPress}
              onInProgressPress={handleInProgressOrdersPress}
            />
          </>
        )}
      </View>
    );
  }, [searchQuery, selectedSpecialization, applicationStats, t]);

  const handleRefresh = React.useCallback(() => {
    loadOrders(true);
  }, []);



  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('loading_orders')}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.primary} />
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
        {/* Header with notifications */}
        <View style={[styles.header, { paddingTop: theme.spacing.lg + getAndroidStatusBarHeight() }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{t('available_orders')}</Text>
            <Text style={styles.subtitle}>
              {orders.length > 0 ? t('orders_found', { count: orders.length }) : t('no_new_orders')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationsPress}
            activeOpacity={0.8}
          >
            <NotificationIcon width={24} height={24} style={styles.notificationIcon} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_orders')}
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Дропдаун для фильтра по специализации */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setIsDropdownVisible(true)}
            activeOpacity={0.8}
          >
            {(() => {
              const selectedSpec = availableSpecializations.find(s => s.id === selectedSpecialization);
              const IconComponent = selectedSpec?.IconComponent;
              return (
                <>
                  {IconComponent && (
                    <IconComponent width={20} height={20} style={styles.dropdownButtonIcon} />
                  )}
                  <Text style={styles.dropdownButtonText}>
                    {selectedSpec?.name || t('all_categories')}
                  </Text>
                  <Text style={styles.dropdownButtonCount}>
                    ({selectedSpec?.count || orders.length})
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </>
              );
            })()}
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredOrders}
          renderItem={renderJobCard}
          keyExtractor={(item) => item.id}
          style={styles.jobsList}
          contentContainerStyle={styles.jobsListContent}
          showsVerticalScrollIndicator={false}
          // Оптимизации производительности
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          // Оптимизация скроллинга
          getItemLayout={(data, index) => ({
            length: 280,
            offset: 280 * index,
            index,
          })}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
        />
      </SafeAreaView>

      {/* Модалка с номером телефона заказчика */}
      <CustomerPhoneModal
        visible={customerPhoneModalVisible}
        onClose={() => {
          setCustomerPhoneModalVisible(false);
          setSelectedOrder(null);
        }}
        onContinue={handleContinueResponse}
        onCall={logCallToCustomer}
        customerPhone={customerPhone}
        customerName={customerName}
      />

      {/* Модалка подтверждения цены */}
      <PriceConfirmationModal
        visible={priceConfirmationVisible}
        onClose={() => {
          setPriceConfirmationVisible(false);
          setSelectedOrder(null);
        }}
        onAcceptPrice={handleAcceptPrice}
        onProposePrice={handleProposePrice}
        orderPrice={selectedOrder?.budget || 0}
        orderTitle={selectedOrder?.title || ''}
      />

      {/* Модалка предложения цены */}
      <ProposePriceModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleSubmitProposal}
        originalPrice={selectedOrder?.budget || 0}
        orderTitle={selectedOrder?.title || ''}
      />

      {/* Модальное окно выбора специализации */}
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>{t('filter')}</Text>
              <TouchableOpacity
                onPress={() => setIsDropdownVisible(false)}
                style={styles.dropdownCloseButton}
              >
                <Text style={styles.dropdownCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableSpecializations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const IconComponent = item.IconComponent;
                return (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      selectedSpecialization === item.id && styles.dropdownItemActive
                    ]}
                    onPress={() => {
                      setSelectedSpecialization(item.id);
                      setIsDropdownVisible(false);
                    }}
                  >
                    {IconComponent && (
                      <IconComponent 
                        width={24} 
                        height={24} 
                        style={[
                          styles.dropdownItemIcon,
                          selectedSpecialization === item.id && styles.dropdownItemIconActive
                        ]} 
                      />
                    )}
                    <Text style={[
                      styles.dropdownItemText,
                      selectedSpecialization === item.id && styles.dropdownItemTextActive
                    ]}>
                      {item.name}
                    </Text>
                    <Text style={[
                      styles.dropdownItemCount,
                      selectedSpecialization === item.id && styles.dropdownItemCountActive
                    ]}>
                      ({item.count})
                    </Text>
                    {selectedSpecialization === item.id && (
                      <Text style={styles.dropdownItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
  },
  contentHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.white,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  searchInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    borderWidth: 0, borderColor: theme.colors.border,
  },
  filterSection: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5A8A00',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dropdownButtonIcon: {
    marginRight: theme.spacing.sm,
    tintColor: theme.colors.white,
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.white,
  },
  dropdownButtonCount: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.white,
    marginRight: theme.spacing.sm,
  },
  dropdownArrow: {
    fontSize: 12,
    color: theme.colors.white,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  dropdownModal: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  dropdownCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownCloseText: {
    fontSize: 20,
    color: theme.colors.text.secondary,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemActive: {
    backgroundColor: theme.colors.background,
  },
  dropdownItemIcon: {
    marginRight: theme.spacing.md,
    tintColor: theme.colors.text.secondary,
  },
  dropdownItemIconActive: {
    tintColor: theme.colors.primary,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
  },
  dropdownItemTextActive: {
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.primary,
  },
  dropdownItemCount: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  dropdownItemCountActive: {
    color: theme.colors.primary,
  },
  dropdownItemCheck: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.bold,
  },
  jobsList: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  jobsListContent: {
    paddingTop: theme.spacing.lg,
  },
  jobCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  jobTitle: {
    flex: 1,
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  jobBudget: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  categoryContainer: {
    marginBottom: theme.spacing.sm,
  },
  jobCategory: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
  jobDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  jobDetailsLayout: {
    marginBottom: theme.spacing.md,
  },
  locationCard: {
    marginBottom: theme.spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCard: {
    flex: 1,
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicantsText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  appliedButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 0, borderColor: theme.colors.border,
  },
  applyButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.background,
  },
  appliedButtonText: {
    color: theme.colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    marginBottom: theme.spacing.md,
  },
  emptyStateTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  notificationIcon: {
    opacity: 0.7,
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: theme.fonts.weights.bold,
    lineHeight: 16,
  },
});

export { WorkerJobsScreen }; 