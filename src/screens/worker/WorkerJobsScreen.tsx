import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { notificationService } from '../../services/notificationService';
import { locationService, LocationCoords } from '../../services/locationService';
import { supabase } from '../../services/supabaseClient';
import { Order } from '../../types';
import { PriceConfirmationModal, ProposePriceModal, ModernActionButton, OrderStatsWidget } from '../../components/common';
import { ModernOrderCard } from '../../components/cards';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WorkerStackParamList } from '../../types/navigation';
import NotificationIcon from '../../../assets/notification-message.svg';
import { useWorkerTranslation, useCustomerTranslation, useCategoriesTranslation } from '../../hooks/useTranslation';
import { getCategoryEmoji, getCategoryLabel } from '../../utils/categoryUtils';

type WorkerNavigationProp = NativeStackNavigationProp<WorkerStackParamList>;

// Функция для получения высоты статусбара только на Android
const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

// Отдельный компонент для карточки заказа
const JobCard: React.FC<{
  item: Order;
  onApply: (orderId: string) => void;
  hasApplied?: boolean;
  navigation: WorkerNavigationProp;
  userLocation?: LocationCoords;
}> = ({ item, onApply, hasApplied = false, navigation, userLocation }) => {
  const actionButton = (
    <ModernActionButton
      title={hasApplied ? 'Отклик отправлен' : 'Откликнуться'}
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
};

const WorkerJobsScreen: React.FC = () => {
  const navigation = useNavigation<WorkerNavigationProp>();
  const t = useWorkerTranslation();
  const tCustomer = useCustomerTranslation();
  const tCategories = useCategoriesTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Мемоизируем переведенную категорию "Все"
  const allCategoriesLabel = useMemo(() => t('all_categories'), [t]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Инициализируем selectedCategory с ключом "all"
  useEffect(() => {
    if (!selectedCategory) {
      setSelectedCategory('all');
    }
  }, [selectedCategory]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [priceConfirmationVisible, setPriceConfirmationVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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
      Alert.alert('Ошибка', 'Не удалось загрузить заказы');
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
      // Теперь selectedCategory содержит originalKey, поэтому сравниваем с order.category напрямую
      const matchesCategory = !selectedCategory || selectedCategory === 'all' || order.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    setFilteredOrders(filtered);
  }, [orders, searchQuery, selectedCategory]);

  // Мемоизируем категории
  const categories = useMemo(() => {
    // Получаем уникальные категории и фильтруем пустые/undefined значения
    const rawCategories = orders.map(order => order.category);
    const allCategories = [...new Set(rawCategories)]
      .filter(category => category && category.trim() !== '');

    // Отладочная информация
    if (__DEV__) {
      console.log('Raw categories from orders:', rawCategories);
      console.log('Unique categories after filtering:', allCategories);
    }

    const categoriesWithCounts = [
      {
        id: 'all',
        originalKey: 'all',
        label: allCategoriesLabel,
        emoji: '📋',
        count: orders.length
      },
      ...allCategories.map(category => ({
        id: category,
        originalKey: category, // Сохраняем оригинальный ключ для фильтрации
        label: getCategoryLabel(category, tCategories), // Используем переведенное название
        emoji: getCategoryEmoji(category),
        count: orders.filter(order => order.category === category).length
      }))
    ];

    // Дополнительная проверка на уникальность по originalKey (не по label!)
    const uniqueCategories = categoriesWithCounts.filter((category, index, self) =>
      index === self.findIndex(c => c.originalKey === category.originalKey)
    );

    if (__DEV__) {
      console.log('Final unique categories:', uniqueCategories.map(c => ({ original: c.originalKey, translated: c.label })));
    }

    return uniqueCategories;
  }, [orders, allCategoriesLabel, tCategories]);



  const handleApplyToJob = async (orderId: string) => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        Alert.alert('Ошибка', 'Необходимо войти в систему');
        return;
      }

      // Находим заказ для показа в модалке
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        Alert.alert('Ошибка', 'Заказ не найден');
        return;
      }

      // Показываем модалку подтверждения цены
      setSelectedOrder(order);
      setPriceConfirmationVisible(true);
    } catch (error) {
      console.error('Ошибка при открытии формы отклика:', error);
      Alert.alert('Ошибка', 'Произошла ошибка');
    }
  };

  const handleAcceptPrice = async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user || !selectedOrder) {
        Alert.alert('Ошибка', 'Необходимо войти в систему');
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
          'Успешно!',
          'Отклик отправлен! Заказ перемещен в раздел "История".',
          [
            {
              text: 'ОК',
              onPress: () => {
                setSelectedOrder(null);
              }
            }
          ]
        );
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить отклик');
      }
    } catch (error) {
      console.error('Ошибка отклика на заказ:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при отправке отклика');
    }
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
        Alert.alert('Ошибка', 'Необходимо войти в систему');
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
          'Успешно!',
          'Отклик отправлен! Заказ перемещен в раздел "История".',
          [
            {
              text: 'ОК',
              onPress: () => {
                setSelectedOrder(null);
              }
            }
          ]
        );
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить отклик');
      }
    } catch (error) {
      console.error('Ошибка отклика на заказ:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при отправке отклика');
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

  const renderJobCard = ({ item }: { item: Order }) => {
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
  };



  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.content}>
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
      <SafeAreaView style={styles.content}>
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

        {/* Улучшенная карусель категорий */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.originalKey && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category.originalKey)}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.originalKey && styles.categoryChipTextActive
                ]}>
                  {category.label}
                </Text>
                <Text style={[
                  styles.categoryChipCount,
                  selectedCategory === category.originalKey && styles.categoryChipCountActive
                ]}>
                  ({category.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredOrders}
          renderItem={renderJobCard}
          keyExtractor={(item) => item.id}
          style={styles.jobsList}
          contentContainerStyle={styles.jobsListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadOrders(true)}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {(() => {
                const hasSearchOrFilter = searchQuery || (selectedCategory && selectedCategory !== 'all');

                if (hasSearchOrFilter) {
                  // Показываем обычное пустое состояние для поиска/фильтров
                  return (
                    <>
                      <Text style={styles.emptyStateIcon}>📋</Text>
                      <Text style={styles.emptyStateTitle}>{t('no_orders')}</Text>
                      <Text style={styles.emptyStateText}>
                        {t('no_orders_by_search')}
                      </Text>
                    </>
                  );
                } else {
                  // Показываем виджет статистики когда нет новых заказов
                  return (
                    <>
                      <Text style={styles.emptyStateIcon}>📋</Text>
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
                  );
                }
              })()}
            </View>
          }
        />
      </SafeAreaView>

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
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoriesSection: {
    backgroundColor: theme.colors.primary,
    paddingBottom: theme.spacing.lg,
  },
  categoriesContainer: {
    paddingLeft: theme.spacing.lg,
  },
  categoriesContent: {
    paddingRight: theme.spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5A8A00',
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#5A8A00',
  },
  categoryChipActive: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.white,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  categoryChipText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.white,
    marginRight: theme.spacing.xs,
  },
  categoryChipTextActive: {
    color: theme.colors.white,
  },
  categoryChipCount: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.white,
  },
  categoryChipCountActive: {
    color: theme.colors.white,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    fontSize: 48,
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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