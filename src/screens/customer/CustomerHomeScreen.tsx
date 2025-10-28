import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { theme, SPECIALIZATIONS, getTranslatedSpecializationName } from '../../constants';
import { lightElevationStyles } from '../../utils/noShadowStyles';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CustomerTabParamList, CustomerStackParamList } from '../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import NotificationIcon from '../../../assets/notification-message.svg';
import ArrowNarrowRight from '../../../assets/arrow-narrow-right.svg';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { notificationService } from '../../services/notificationService';
import { professionalMasterService, ProfessionalMaster } from '../../services/professionalMasterService';
import { ProfessionalMasterCard } from '../../components/cards';
import { CategoryIcon } from '../../components/common';
import { useCustomerTranslation } from '../../hooks/useTranslation';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');
const categoryCardWidth = (screenWidth - theme.spacing.lg * 2 - theme.spacing.sm * 3) / 4;
const categoryCardHeight = categoryCardWidth * 1.2;
const categoriesPerRow = 4;
const maxVisibleCategories = 7; // Показываем 7 категорий + 1 кнопка "Показать все"

// Функция для получения высоты статусбара только на Android
const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

const RESPONSE_NOTIFICATION_KEY = '@response_notification_dismissed';

export const CustomerHomeScreen: React.FC = () => {
  const [professionalMasters, setProfessionalMasters] = useState<ProfessionalMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showResponseNotification, setShowResponseNotification] = useState(false);
  const [hasOrdersWithResponses, setHasOrdersWithResponses] = useState(false);
  const navigation = useNavigation<BottomTabNavigationProp<CustomerTabParamList> & NativeStackNavigationProp<CustomerStackParamList>>();
  const t = useCustomerTranslation();
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

  // Функция для загрузки уведомлений и профессиональных мастеров
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

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
        {getTranslatedSpecializationName(item.id, tCommon)}
      </Text>
    </TouchableOpacity>
  );

  const renderShowAllCard = () => (
    <TouchableOpacity
      key="show-all"
      style={[styles.categoryCard, styles.showAllCard]}
      onPress={handleViewAllCategories}
      activeOpacity={0.8}
    >
      <View style={styles.showAllIconWrapper}>
        <ArrowNarrowRight width={40} height={40} />
      </View>
      <Text style={styles.showAllCardText} numberOfLines={2}>
        {t('show_all_categories')}
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
              {t('find_professional_masters')}
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
            {/* Professional Masters Categories */}
            <View style={styles.mastersSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>{t('professional_masters_section')}</Text>
              </View>
              <View style={styles.categoriesGrid}>
                {SPECIALIZATIONS.slice(0, maxVisibleCategories).map((item, index) => renderCategoryCard(item, index))}
                {renderShowAllCard()}
              </View>
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

            {/* Random Professional Masters List */}
            {professionalMasters.length > 0 && (
              <View style={styles.mastersListSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderTitle}>{t('recommended_masters')}</Text>
                  <TouchableOpacity onPress={handleViewAllMasters} style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>{t('all_masters')}</Text>
                    <ArrowNarrowRight width={18} height={18} style={styles.viewAllIcon} />
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
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
  showAllCard: {
    backgroundColor: theme.colors.primary,
  },
  showAllIconWrapper: {
    marginBottom: theme.spacing.xs,
  },
  showAllCardText: {
    fontSize: 11,
    color: theme.colors.white,
    textAlign: 'center',
    fontWeight: '600',
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
}); 