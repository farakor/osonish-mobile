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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants';
import { lightElevationStyles } from '../../utils/noShadowStyles';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { WorkerTabParamList } from '../../types';
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
import { FloatingCreateButton, SortModal, SortOption } from '../../components/common';
import { useWorkerTranslation, useCategoriesTranslation } from '../../hooks/useTranslation';
import { useTranslation } from 'react-i18next';
import { Order } from '../../types';
import { getSpecializationIconComponent } from '../../constants/specializations';
import { getCityName } from '../../utils/cityUtils';
import { OrderCardSkeleton } from '../../components/skeletons';
import { useWorkerHomeData } from '../../hooks/queries';

// Функция для получения высоты статусбара только на Android
const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

export const WorkerJobsScreen: React.FC = () => {
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>('all');
  const [selectedCity, setSelectedCity] = useState<string | null>('all');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const navigation = useNavigation<BottomTabNavigationProp<WorkerTabParamList> & NativeStackNavigationProp<any>>();
  const t = useWorkerTranslation();
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
  } = useWorkerHomeData(userId);

  const [refreshing, setRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Инициализация filteredOrders один раз при загрузке данных
  useEffect(() => {
    if (availableOrders.length > 0 && !isInitialized) {
      setFilteredOrders(availableOrders.slice(0, 10));
      setIsInitialized(true);
    }
  }, [availableOrders, isInitialized]);

  // Функция для обновления списка (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  }, [refetchAll]);

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

  // Фильтрация по специализации, городу и поиску с мемоизацией
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

  // Загружаем данные только при первом монтировании (React Query сам управляет обновлениями)
  // useFocusEffect убран - React Query автоматически обновит данные когда staleTime истечет

  const handleNotificationsPress = () => {
    navigation.navigate('NotificationsList');
  };

  const handleOrderPress = (order: any) => {
    // Переходим к экрану деталей заказа или вакансии в зависимости от типа
    if (order.type === 'vacancy') {
      navigation.navigate('VacancyDetails', { vacancyId: order.id });
    } else {
      navigation.navigate('JobDetails', { orderId: order.id });
    }
  };

  const handleViewAllOrders = () => {
    // Можно добавить отдельный экран со всеми доступными заказами
    console.log('View all orders');
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
                      showApplicantsCount={false}
                      showCreateTime={false}
                      workerView={true}
                    />
                  )
                ))}
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

      {/* Floating Action Button удален для исполнителей */}

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
    color: theme.colors.primary,
  },
  availableOrdersSection: {
    marginBottom: theme.spacing.lg,
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
