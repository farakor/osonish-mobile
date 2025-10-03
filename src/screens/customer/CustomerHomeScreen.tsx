import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { LinearGradient } from 'expo-linear-gradient';
import { theme, SPECIALIZATIONS } from '../../constants';
import { lightElevationStyles } from '../../utils/noShadowStyles';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CustomerTabParamList, CustomerStackParamList } from '../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import NotificationIcon from '../../../assets/notification-message.svg';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { notificationService } from '../../services/notificationService';
import { professionalMasterService, ProfessionalMaster } from '../../services/professionalMasterService';
import { supabase } from '../../services/supabaseClient';
import { Order } from '../../types';
import { ModernOrderCard, ProfessionalMasterCard } from '../../components/cards';
import { CategoryIcon } from '../../components/common';
import { useCustomerTranslation } from '../../hooks/useTranslation';

const { width: screenWidth } = Dimensions.get('window');
const categoryCardWidth = (screenWidth - theme.spacing.lg * 2 - theme.spacing.sm * 3) / 4;
const categoryCardHeight = categoryCardWidth * 1.2;
const categoriesPerRow = 4;
const initialRows = 2; // Показываем 8 категорий (2 ряда по 4)
const totalRows = Math.ceil(SPECIALIZATIONS.length / categoriesPerRow);
const initialHeight = (categoryCardHeight + theme.spacing.sm) * initialRows;
const fullHeight = (categoryCardHeight + theme.spacing.sm) * totalRows;

// Функция для получения высоты статусбара только на Android
const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

export const CustomerHomeScreen: React.FC = () => {
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [professionalMasters, setProfessionalMasters] = useState<ProfessionalMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const categoriesHeight = useRef(new Animated.Value(initialHeight)).current;
  const fadeOpacity = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation<BottomTabNavigationProp<CustomerTabParamList> & NativeStackNavigationProp<CustomerStackParamList>>();
  const t = useCustomerTranslation();

  // Функция для загрузки новых заказов и уведомлений
  const loadNewOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const orders = await orderService.getUserNewOrders();
      setNewOrders(orders);

      // Загружаем количество непрочитанных уведомлений
      const authState = authService.getAuthState();
      if (authState.isAuthenticated && authState.user) {
        const count = await notificationService.getUnreadNotificationsCount(authState.user.id);
        setUnreadCount(count);

        // Загружаем профессиональных мастеров
        const masters = await professionalMasterService.getRandomMasters(authState.user.city, 6);
        console.log('[CustomerHomeScreen] Загружено мастеров:', masters.length);
        console.log('[CustomerHomeScreen] Город пользователя:', authState.user.city);
        if (masters.length > 0) {
          console.log('[CustomerHomeScreen] Пример мастера:', {
            id: masters[0].id,
            name: `${masters[0].firstName} ${masters[0].lastName}`,
            city: masters[0].city,
            specializations: masters[0].specializations,
            workPhotos: masters[0].workPhotos?.length || 0,
          });
        }
        setProfessionalMasters(masters);
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Функция для обновления списка (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNewOrders();
    setRefreshing(false);
  }, [loadNewOrders]);

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

  // Загружаем заказы при первом открытии и при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      loadNewOrders();
      checkPendingRatings();
    }, [loadNewOrders, checkPendingRatings])
  );

  // Анимация раскрытия категорий
  useEffect(() => {
    Animated.parallel([
      Animated.timing(categoriesHeight, {
        toValue: showAllCategories ? fullHeight : initialHeight,
        duration: 500,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(fadeOpacity, {
        toValue: showAllCategories ? 0 : 1,
        duration: 250,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showAllCategories]);

  // Real-time обновления для заказов пользователя
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    console.log('[CustomerHomeScreen] Подключаем real-time обновления заказов');

    const ordersSubscription = supabase
      .channel('customer_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${authState.user.id}`
        },
        (payload: any) => {
          console.log('[CustomerHomeScreen] Real-time изменение заказов:', payload);
          loadNewOrders();
        }
      )
      .subscribe();

    return () => {
      console.log('[CustomerHomeScreen] Отключаем real-time обновления заказов');
      ordersSubscription.unsubscribe();
    };
  }, [loadNewOrders]);

  // Real-time обновления для откликов (влияют на счетчик откликов в заказах)
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    console.log('[CustomerHomeScreen] Подключаем real-time обновления откликов');

    const applicantsSubscription = supabase
      .channel('customer_applicants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applicants'
        },
        (payload: any) => {
          console.log('[CustomerHomeScreen] Real-time изменение откликов:', payload);
          // Обновляем заказы чтобы увидеть изменения в счетчике откликов
          loadNewOrders();
        }
      )
      .subscribe();

    return () => {
      console.log('[CustomerHomeScreen] Отключаем real-time обновления откликов');
      applicantsSubscription.unsubscribe();
    };
  }, [loadNewOrders]);

  const handleOrderPress = (orderId: string) => {
    navigation.navigate('OrderDetails', { orderId });
  };

  const handleNotificationsPress = () => {
    navigation.navigate('NotificationsList');
  };

  const handleCategoryPress = (specializationId: string) => {
    navigation.navigate('ProfessionalMastersList', { specializationId });
  };

  const handleMasterPress = (masterId: string) => {
    navigation.navigate('ProfessionalMasterProfile', { masterId });
  };

  const handleViewAllMasters = () => {
    navigation.navigate('ProfessionalMastersList', {});
  };

  const handleViewAllCategories = () => {
    navigation.navigate('Categories');
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <ModernOrderCard
      order={item}
      onPress={() => handleOrderPress(item.id)}
      showApplicantsCount={true}
      showCreateTime={true}
    />
  );

  const renderCategoryCard = (item: typeof SPECIALIZATIONS[0], index: number) => (
    <TouchableOpacity
      key={item.id}
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item.id)}
      activeOpacity={0.8}
    >
      <CategoryIcon
        icon={item.icon}
        iconComponent={item.iconComponent}
        size={32}
        style={styles.categoryIconWrapper}
      />
      <Text style={styles.categoryName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderMasterCard = ({ item }: { item: ProfessionalMaster }) => (
    <ProfessionalMasterCard
      master={item}
      onPress={() => handleMasterPress(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
        {/* Header with notifications */}
        <View style={[styles.header, { paddingTop: theme.spacing.lg + getAndroidStatusBarHeight() }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{t('home_screen')}</Text>
            <Text style={styles.subtitle}>
              {newOrders.length > 0
                ? t('active_orders_count', { count: newOrders.length })
                : t('create_first_order')
              }
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

        {/* Main Content */}
        {isLoading && newOrders.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('loading_orders')}</Text>
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
            {/* Professional Masters Categories */}
            <View style={styles.mastersSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>Профессиональные мастера</Text>
              </View>
              <View style={styles.categoriesContainer}>
                <Animated.View
                  style={[
                    styles.categoriesGrid,
                    {
                      height: categoriesHeight,
                      overflow: 'hidden',
                    }
                  ]}
                >
                  {SPECIALIZATIONS.map((item, index) => renderCategoryCard(item, index))}
                </Animated.View>
                <Animated.View
                  style={[
                    styles.categoriesFadeContainer,
                    {
                      opacity: fadeOpacity,
                      pointerEvents: showAllCategories ? 'none' : 'auto',
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(248, 249, 250, 0)', 'rgba(248, 249, 250, 0.8)', 'rgba(248, 249, 250, 1)']}
                    style={styles.categoriesFade}
                  />
                  <TouchableOpacity
                    style={styles.showAllButton}
                    onPress={() => setShowAllCategories(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.showAllButtonText}>Показать все</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>

            {/* Random Professional Masters List */}
            {professionalMasters.length > 0 && (
              <View style={styles.mastersListSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderTitle}>Рекомендуем</Text>
                  <TouchableOpacity onPress={handleViewAllMasters}>
                    <Text style={styles.viewAllText}>Все →</Text>
                  </TouchableOpacity>
                </View>
                {professionalMasters.map((master) => (
                  <ProfessionalMasterCard
                    key={master.id}
                    master={master}
                    onPress={() => handleMasterPress(master.id)}
                  />
                ))}
              </View>
            )}

            {/* Orders List */}
            {newOrders.length > 0 && (
              <View style={styles.ordersSection}>
                <Text style={styles.sectionTitle}>Мои заказы</Text>
                {newOrders.map((order) => (
                  <View key={order.id}>
                    {renderOrderCard({ item: order })}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
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
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
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
  mastersSection: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
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
  viewAllText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  categoriesContainer: {
    position: 'relative',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  categoriesFadeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: theme.spacing.md,
  },
  categoriesFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  showAllButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    zIndex: 2,
    ...lightElevationStyles,
  },
  showAllButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
  },
  categoryCard: {
    width: categoryCardWidth,
    height: categoryCardWidth * 1.2,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...lightElevationStyles,
  },
  categoryIconWrapper: {
    marginBottom: theme.spacing.xs,
  },
  categoryName: {
    fontSize: 11,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  mastersListSection: {
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
}); 