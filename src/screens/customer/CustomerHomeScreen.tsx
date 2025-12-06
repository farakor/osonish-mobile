import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { theme, SPECIALIZATIONS } from '../../constants';
import { lightElevationStyles } from '../../utils/noShadowStyles';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CustomerTabParamList, CustomerStackParamList } from '../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import NotificationIcon from '../../../assets/notification-message.svg';
import ArrowNarrowRight from '../../../assets/arrow-narrow-right.svg';
import FilterIcon from '../../../assets/filter-lines.svg';
import ChevronDownIcon from '../../../assets/chevron-down.svg';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { notificationService } from '../../services/notificationService';
import { ModernOrderCard } from '../../components/cards';
import { VacancyCard } from '../../components/vacancy';
import { FloatingCreateButton, SortModal, SortOption, JobTypeBottomSheet, FilterBottomSheet } from '../../components/common';
import { AuthRequiredModal } from '../../components/auth/AuthRequiredModal';
import { useCustomerTranslation, useCategoriesTranslation } from '../../hooks/useTranslation';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order } from '../../types';
import { getSpecializationIconComponent } from '../../constants/specializations';
import { getCityName, getAllCities } from '../../utils/cityUtils';
import { OrderCardSkeleton } from '../../components/skeletons';
import { useCustomerHomeData } from '../../hooks/queries';

// Функция для получения высоты статусбара только на Android
const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

const RESPONSE_NOTIFICATION_KEY = '@response_notification_dismissed';

export const CustomerHomeScreen: React.FC = () => {
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>('all');
  const [selectedCity, setSelectedCity] = useState<string | null>('all');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [showResponseNotification, setShowResponseNotification] = useState(false);
  const [hasOrdersWithResponses, setHasOrdersWithResponses] = useState(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [isJobTypeModalVisible, setIsJobTypeModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const navigation = useNavigation<BottomTabNavigationProp<CustomerTabParamList> & NativeStackNavigationProp<CustomerStackParamList>>();
  const t = useCustomerTranslation();
  const tCategories = useCategoriesTranslation();
  const { t: tCommon } = useTranslation();

  // ✨ Parallel fetching - загружает заказы и счетчик уведомлений ОДНОВРЕМЕННО
  const authState = authService.getAuthState();
  const userId = authState.user?.id || '';
  
  const {
    orders: availableOrders,
    unreadCount,
    isLoading,
    refetchAll,
  } = useCustomerHomeData(userId);

  const [refreshing, setRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Инициализация filteredOrders один раз при загрузке данных
  useEffect(() => {
    if (availableOrders.length > 0 && !isInitialized) {
      setFilteredOrders(availableOrders.slice(0, 10));
      setIsInitialized(true);
    }
  }, [availableOrders, isInitialized]);

  // Функция для проверки заказов с откликами
  const checkOrdersWithResponses = useCallback(async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return;
      }

      // Получаем заказы заказчика
      const orders = await orderService.getCustomerOrders();
      
      // Проверяем, есть ли заказы со статусом 'response_received'
      const ordersWithResponses = orders.filter(order => order.status === 'response_received');
      const hasResponses = ordersWithResponses.length > 0;
      setHasOrdersWithResponses(hasResponses);

      if (hasResponses) {
        // Проверяем, была ли модалка закрыта ранее
        const dismissed = await AsyncStorage.getItem(RESPONSE_NOTIFICATION_KEY);
        if (!dismissed) {
          setShowResponseNotification(true);
        }
      }
    } catch (error) {
      console.error('[CustomerHomeScreen] Ошибка проверки заказов с откликами:', error);
    }
  }, []);

  // Функция для обновления списка (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchAll(), checkOrdersWithResponses()]);
    setRefreshing(false);
  }, [refetchAll, checkOrdersWithResponses]);

  // Мемоизируем специализации из существующих заказов
  const availableSpecializations = useMemo(() => {
    // Получаем уникальные specializationId из заказов
    const specializationIds = [...new Set(
      availableOrders
        .map(order => order.specializationId)
        .filter(id => id !== undefined && id !== null)
    )] as string[];

    const specializationsWithCounts = [
      {
        id: 'all',
        name: t('all_categories'),
        count: availableOrders.length,
        IconComponent: undefined
      },
      ...specializationIds.map(specId => ({
        id: specId,
        name: tCategories(specId),
        count: availableOrders.filter(order => order.specializationId === specId).length,
        IconComponent: getSpecializationIconComponent(specId)
      }))
    ];

    return specializationsWithCounts;
  }, [availableOrders.length, t, tCategories]);

  // Мемоизируем города из существующих заказов
  const availableCities = useMemo(() => {
    // Получаем уникальные customerCity из заказов
    const cityIds = [...new Set(
      availableOrders
        .map(order => order.customerCity)
        .filter(cityId => cityId !== undefined && cityId !== null)
    )] as string[];

    const citiesWithCounts = [
      {
        id: 'all',
        name: t('all_cities') || 'Все города',
        count: availableOrders.length
      },
      ...cityIds.map(cityId => ({
        id: cityId,
        name: getCityName(cityId),
        count: availableOrders.filter(order => order.customerCity === cityId).length
      }))
    ];

    return citiesWithCounts;
  }, [availableOrders.length, t]);

  // Фильтрация по специализации и поиску с мемоизацией
  const filteredOrdersMemo = useMemo(() => {
    // Пропускаем если данные еще не загружены
    if (availableOrders.length === 0) return [];

    let filtered = [...availableOrders]; // Создаем копию один раз

    // Фильтр по специализации
    if (selectedSpecialization && selectedSpecialization !== 'all') {
      filtered = filtered.filter(order => order.specializationId === selectedSpecialization);
    }

    // Фильтр по городу
    if (selectedCity && selectedCity !== 'all') {
      filtered = filtered.filter(order => order.customerCity === selectedCity);
    }

    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const matchesTitle = order.title?.toLowerCase().includes(query);
        const matchesDescription = order.description?.toLowerCase().includes(query);
        const matchesLocation = order.location?.toLowerCase().includes(query);
        return matchesTitle || matchesDescription || matchesLocation;
      });
    }

    // Сортировка
    if (sortBy === 'date') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // От новых к старым
      });
    } else if (sortBy === 'views') {
      filtered.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0)); // От большего к меньшему
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => (b.budget || 0) - (a.budget || 0)); // От большего к меньшему
    }

    return filtered.slice(0, 10);
  }, [availableOrders.length, searchQuery, selectedSpecialization, selectedCity, sortBy]);

  // Синхронизируем мемоизированные данные с локальным состоянием
  useEffect(() => {
    setFilteredOrders(filteredOrdersMemo);
  }, [filteredOrdersMemo]);

  // Проверяем заказы, требующие оценки
  const checkPendingRatings = useCallback(async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return;
      }

      const pendingRatings = await orderService.getPendingRatingsForCustomer(authState.user.id);

      if (pendingRatings.length > 0) {
        console.log(`[CustomerHomeScreen] Найдено ${pendingRatings.length} заказов для оценки`);

        // Показываем модалку оценки для первого заказа
        const firstPendingRating = pendingRatings[0];
        const orderId = firstPendingRating.order_id;

        // Получаем принятых исполнителей для этого заказа
        const acceptedWorkers = await orderService.getAcceptedWorkersForOrder(orderId);

        if (acceptedWorkers && acceptedWorkers.length > 0) {
          // Переходим на экран оценки
          navigation.navigate('Rating', {
            orderId: orderId,
            acceptedWorkers: acceptedWorkers
          });
        } else {
          // Если нет принятых исполнителей, удаляем запись о необходимости оценки
          await orderService.removePendingRating(authState.user.id, orderId);
        }
      }
    } catch (error) {
      console.error('[CustomerHomeScreen] Ошибка проверки заказов для оценки:', error);
    }
  }, [navigation]);

  // Проверяем заказы, требующие оценки и проверяем отклики при фокусе
  useFocusEffect(
    useCallback(() => {
      // Не перезагружаем данные при каждом фокусе, только проверяем статусы
      checkPendingRatings();
      checkOrdersWithResponses();
    }, [checkPendingRatings, checkOrdersWithResponses])
  );

  // Функция закрытия модалки
  const handleCloseNotification = async () => {
    setShowResponseNotification(false);
    await AsyncStorage.setItem(RESPONSE_NOTIFICATION_KEY, 'true');
  };

  // Функция перехода к заказам
  const handleGoToOrders = async () => {
    setShowResponseNotification(false);
    await AsyncStorage.setItem(RESPONSE_NOTIFICATION_KEY, 'true');
    navigation.navigate('MyOrders');
  };

  // Сброс состояния модалки при изменении статуса заказов
  useEffect(() => {
    if (!hasOrdersWithResponses) {
      AsyncStorage.removeItem(RESPONSE_NOTIFICATION_KEY);
      setShowResponseNotification(false);
    }
  }, [hasOrdersWithResponses]);


  const handleNotificationsPress = () => {
    navigation.navigate('NotificationsList');
  };

  const handleOrderPress = (order: any) => {
    // Переходим к экрану деталей заказа или вакансии в зависимости от типа
    if (order.type === 'vacancy') {
      // Для вакансий используем экран исполнителя (VacancyDetails), чтобы можно было откликнуться
      navigation.navigate('VacancyDetails', { vacancyId: order.id });
    } else {
      // Для заказов используем экран исполнителя (JobDetails), чтобы можно было откликнуться
      navigation.navigate('JobDetails', { orderId: order.id });
    }
  };

  const handleViewAllOrders = () => {
    // Можно добавить отдельный экран со всеми доступными заказами
    // Или перейти в раздел заказов
    navigation.navigate('MyOrders');
  };

  // Устанавливаем фон статус бара на Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#F4F5FC', true);
      StatusBar.setBarStyle('dark-content', true);
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5FC" />
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
        {/* Header with search and notifications */}
        <View style={[styles.header, { paddingTop: theme.spacing.lg + getAndroidStatusBarHeight() }]}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_orders')}
              placeholderTextColor={theme.colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              {...(Platform.OS === 'android' && {
                includeFontPadding: false,
                textAlignVertical: 'center' as const,
              })}
            />
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setIsFilterModalVisible(true)}
              activeOpacity={0.7}
            >
              <FilterIcon width={20} height={20} style={styles.filterIcon} />
              {((selectedSpecialization && selectedSpecialization !== 'all') || (selectedCity && selectedCity !== 'all')) && (
                <View style={styles.filterBadge} />
              )}
            </TouchableOpacity>
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

        {/* Main Content */}
        {isLoading ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.availableOrdersSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>{t('available_orders_section')}</Text>
              </View>
              {[1, 2, 3, 4, 5].map((item) => (
                <OrderCardSkeleton key={`skeleton-${item}`} />
              ))}
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          >
            {/* Available Orders Section */}
            {filteredOrders.length > 0 && (
              <View style={styles.availableOrdersSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderTitle}>{t('available_orders_section')}</Text>
                  <TouchableOpacity 
                    onPress={() => setIsSortModalVisible(true)} 
                    style={styles.sortButton}
                  >
                    <Text style={styles.sortButtonText}>{t('sort_by')}</Text>
                    <ChevronDownIcon 
                      width={16} 
                      height={16} 
                      style={styles.sortChevron} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Response Notification Modal */}
                {showResponseNotification && (
                  <View style={styles.responseNotificationContainer}>
                    <View style={styles.responseNotification}>
                      <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={handleCloseNotification}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.closeIcon}>✕</Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.notificationTitle}>
                        {t('response_notification_title')}
                      </Text>
                      <Text style={styles.notificationMessage}>
                        {t('response_notification_message')}
                      </Text>
                      
                      <TouchableOpacity 
                        style={styles.goToOrdersButton}
                        onPress={handleGoToOrders}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.goToOrdersButtonText}>
                          {t('go_to_orders')}
                        </Text>
                        <ArrowNarrowRight width={18} height={18} style={styles.buttonIcon} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
                {filteredOrders.map((order) => (
                  order.type === 'vacancy' ? (
                    <VacancyCard
                      key={order.id}
                      vacancy={order}
                      onPress={() => handleOrderPress(order)}
                      currentUserId={userId}
                    />
                  ) : (
                    <ModernOrderCard
                      key={order.id}
                      order={order}
                      onPress={() => handleOrderPress(order)}
                      showApplicantsCount={true}
                      showCreateTime={false}
                      currentUserId={userId}
                    />
                  )
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        title={t('filters')}
        availableSpecializations={availableSpecializations}
        availableCities={availableCities}
        selectedSpecialization={selectedSpecialization}
        selectedCity={selectedCity}
        onSpecializationChange={setSelectedSpecialization}
        onCityChange={setSelectedCity}
        onReset={() => {
          setSelectedSpecialization('all');
          setSelectedCity('all');
        }}
        translations={{
          filterByCategory: t('filter_by_category'),
          allCategories: t('all_categories'),
          filterByCity: t('filter_by_city'),
          allCities: t('all_cities'),
          resetFilters: t('reset_filters'),
          apply: t('apply'),
        }}
      />

      {/* Floating Action Button */}
      <FloatingCreateButton 
        onPress={() => {
          const authState = authService.getAuthState();
          if (authState.isAuthenticated && authState.user) {
            // Пользователь авторизован - показываем выбор типа работы
            setIsJobTypeModalVisible(true);
          } else {
            // Пользователь не авторизован - показываем Bottom Sheet
            console.log('[CustomerHomeScreen] 🔒 Попытка создать заказ без авторизации');
            setIsAuthModalVisible(true);
          }
        }}
      />

      {/* Job Type Selection Bottom Sheet */}
      <JobTypeBottomSheet
        visible={isJobTypeModalVisible}
        onClose={() => setIsJobTypeModalVisible(false)}
        onSelectDailyJob={() => {
          setIsJobTypeModalVisible(false);
          navigation.navigate('CreateOrder');
        }}
        onSelectVacancy={() => {
          setIsJobTypeModalVisible(false);
          navigation.navigate('CreateVacancy');
        }}
      />

      {/* Auth Required Modal */}
      <AuthRequiredModal
        visible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
        message={t('create_order_auth_message')}
      />

      {/* Sort Modal */}
      <SortModal
        visible={isSortModalVisible}
        onClose={() => setIsSortModalVisible(false)}
        currentSort={sortBy}
        onSelectSort={setSortBy}
        translations={{
          title: t('sort_by'),
          sortByDate: t('sort_by_date'),
          sortByViews: t('sort_by_views'),
          sortByPrice: t('sort_by_price'),
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    gap: theme.spacing.sm,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.OS === 'android' ? 0 : theme.spacing.md,
    paddingRight: 48,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: '#DAE3EC',
    height: 48,
  },
  filterButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    tintColor: theme.colors.white,
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.secondary,
  },
  ordersList: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  sortButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  sortChevron: {
    tintColor: theme.colors.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  viewAllIcon: {
    tintColor: '#679B00',
  },
  availableOrdersSection: {
    marginBottom: theme.spacing.lg,
  },
  ordersSection: {
    marginTop: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#DAE3EC',
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
  responseNotificationContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  responseNotification: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeIcon: {
    fontSize: 20,
    color: theme.colors.text.secondary,
    fontWeight: '400',
  },
  notificationTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    paddingRight: theme.spacing.xl,
  },
  notificationMessage: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  goToOrdersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  goToOrdersButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.white,
  },
  buttonIcon: {
    color: theme.colors.white,
  },
});
 