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
  Modal,
  FlatList,
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
import { useCustomerTranslation, useCategoriesTranslation } from '../../hooks/useTranslation';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order } from '../../types';
import { getSpecializationIconComponent } from '../../constants/specializations';
import { getCityName, getAllCities } from '../../utils/cityUtils';

// Функция для получения высоты статусбара только на Android
const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

const RESPONSE_NOTIFICATION_KEY = '@response_notification_dismissed';

export const CustomerHomeScreen: React.FC = () => {
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>('all');
  const [selectedCity, setSelectedCity] = useState<string | null>('all');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showResponseNotification, setShowResponseNotification] = useState(false);
  const [hasOrdersWithResponses, setHasOrdersWithResponses] = useState(false);
  const navigation = useNavigation<BottomTabNavigationProp<CustomerTabParamList> & NativeStackNavigationProp<CustomerStackParamList>>();
  const t = useCustomerTranslation();
  const tCategories = useCategoriesTranslation();
  const { t: tCommon } = useTranslation();

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

  // Функция для загрузки уведомлений и доступных заказов
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Загружаем количество непрочитанных уведомлений
      const authState = authService.getAuthState();
      if (authState.isAuthenticated && authState.user) {
        const count = await notificationService.getUnreadNotificationsCount(authState.user.id);
        setUnreadCount(count);

        // Загружаем доступные заказы (включая собственные)
        const orders = await orderService.getAvailableOrdersForWorker();
        console.log('[CustomerHomeScreen] Загружено доступных заказов:', orders.length);
        setAvailableOrders(orders);
        setFilteredOrders(orders.slice(0, 10)); // Показываем первые 10 заказов

        // Проверяем заказы с откликами
        await checkOrdersWithResponses();
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setIsLoading(false);
    }
  }, [checkOrdersWithResponses]);

  // Функция для обновления списка (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

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
  }, [availableOrders, t, tCategories]);

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
  }, [availableOrders, t]);

  // Фильтрация по специализации и поиску
  useEffect(() => {
    let filtered = availableOrders;

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
        const matchesTitle = order.title.toLowerCase().includes(query);
        const matchesDescription = order.description.toLowerCase().includes(query);
        const matchesLocation = order.location?.toLowerCase().includes(query);
        return matchesTitle || matchesDescription || matchesLocation;
      });
    }

    setFilteredOrders(filtered.slice(0, 10));
  }, [availableOrders, searchQuery, selectedSpecialization, selectedCity]);

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

  // Загружаем данные при первом открытии и при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      loadData();
      checkPendingRatings();
    }, [loadData, checkPendingRatings])
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

  const handleOrderPress = (orderId: string) => {
    // Переходим к экрану деталей заказа
    navigation.navigate('OrderDetails', { orderId });
  };

  const handleViewAllOrders = () => {
    // Можно добавить отдельный экран со всеми доступными заказами
    // Или перейти в раздел заказов
    navigation.navigate('MyOrders');
  };

  return (
    <View style={styles.container}>
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
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('loading_data')}</Text>
          </View>
        ) : (
          <ScrollView
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
                  <TouchableOpacity onPress={handleViewAllOrders} style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>{t('view_all_orders')}</Text>
                    <ArrowNarrowRight width={18} height={18} style={styles.viewAllIcon} />
                  </TouchableOpacity>
                </View>
                {filteredOrders.map((order) => (
                  <ModernOrderCard
                    key={order.id}
                    order={order}
                    onPress={() => handleOrderPress(order.id)}
                    showApplicantsCount={true}
                    showCreateTime={false}
                  />
                ))}
              </View>
            )}

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
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFilterModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('filters')}</Text>
              <TouchableOpacity
                onPress={() => setIsFilterModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.dropdownContainer}>
              {/* Дропдаун для категорий */}
              <View style={styles.dropdownSection}>
                <Text style={styles.dropdownLabel}>{t('filter_by_category')}</Text>
                <TouchableOpacity
                  style={styles.dropdownHeader}
                  onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownHeaderText}>
                    {availableSpecializations.find(s => s.id === selectedSpecialization)?.name || t('all_categories')}
                  </Text>
                  <ChevronDownIcon 
                    width={20} 
                    height={20} 
                    style={[
                      styles.dropdownChevron,
                      isCategoryDropdownOpen && styles.dropdownChevronOpen
                    ]} 
                  />
                </TouchableOpacity>
                {isCategoryDropdownOpen && (
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {availableSpecializations.map((item) => {
                      const IconComponent = item.IconComponent;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.dropdownItem,
                            selectedSpecialization === item.id && styles.dropdownItemActive
                          ]}
                          onPress={() => {
                            setSelectedSpecialization(item.id);
                            setIsCategoryDropdownOpen(false);
                          }}
                        >
                          {IconComponent && (
                            <IconComponent 
                              width={20} 
                              height={20} 
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
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Дропдаун для городов */}
              <View style={styles.dropdownSection}>
                <Text style={styles.dropdownLabel}>{t('filter_by_city')}</Text>
                <TouchableOpacity
                  style={styles.dropdownHeader}
                  onPress={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownHeaderText}>
                    {availableCities.find(c => c.id === selectedCity)?.name || t('all_cities')}
                  </Text>
                  <ChevronDownIcon 
                    width={20} 
                    height={20} 
                    style={[
                      styles.dropdownChevron,
                      isCityDropdownOpen && styles.dropdownChevronOpen
                    ]} 
                  />
                </TouchableOpacity>
                {isCityDropdownOpen && (
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {availableCities.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.dropdownItem,
                          selectedCity === item.id && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setSelectedCity(item.id);
                          setIsCityDropdownOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          selectedCity === item.id && styles.dropdownItemTextActive
                        ]}>
                          {item.name}
                        </Text>
                        <Text style={[
                          styles.dropdownItemCount,
                          selectedCity === item.id && styles.dropdownItemCountActive
                        ]}>
                          ({item.count})
                        </Text>
                        {selectedCity === item.id && (
                          <Text style={styles.dropdownItemCheck}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>

            {/* Кнопки применить и сбросить */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSelectedSpecialization('all');
                  setSelectedCity('all');
                  setIsCategoryDropdownOpen(false);
                  setIsCityDropdownOpen(false);
                }}
              >
                <Text style={styles.resetButtonText}>{t('reset_filters')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setIsFilterModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>{t('apply')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
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
    paddingVertical: theme.spacing.md,
    paddingRight: 48,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
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
    color: theme.colors.primary,
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
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...lightElevationStyles,
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
    marginTop: theme.spacing.lg,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  dropdownContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  dropdownSection: {
    marginBottom: theme.spacing.lg,
  },
  dropdownLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  dropdownHeaderText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
    flex: 1,
  },
  dropdownChevron: {
    tintColor: theme.colors.text.secondary,
    transition: 'transform 0.2s',
  },
  dropdownChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownScrollView: {
    maxHeight: 180,
    marginTop: theme.spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemActive: {
    backgroundColor: '#F0F9FF',
  },
  dropdownItemIcon: {
    marginRight: theme.spacing.sm,
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
    fontWeight: theme.fonts.weights.semiBold,
  },
  dropdownItemCheck: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.bold,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  resetButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.white,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: theme.colors.text.secondary,
  },
}); 