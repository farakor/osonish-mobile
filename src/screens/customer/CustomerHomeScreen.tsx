import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { theme } from '../../constants';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CustomerTabParamList, CustomerStackParamList } from '../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FilePlusIcon from '../../../assets/file-plus-03_2.svg';
import PlusSquareIcon from '../../../assets/plus-square.svg';
import NotificationIcon from '../../../assets/notification-message.svg';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { notificationService } from '../../services/notificationService';
import { supabase } from '../../services/supabaseClient';
import { Order } from '../../types';
import { ModernOrderCard } from '../../components/cards';
import { useCustomerTranslation } from '../../hooks/useTranslation';

// SVG иконка empty-state-no-active-orders
const emptyStateNoActiveOrdersSvg = `<svg width="161" height="167" viewBox="0 0 161 167" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M83.3025 138.938C111.303 138.938 134.003 116.238 134.003 88.1384C134.003 60.0384 111.203 37.3384 83.3025 37.3384C55.3025 37.3384 32.6025 60.0384 32.6025 88.1384C32.6025 116.238 55.3025 138.938 83.3025 138.938Z" fill="#F1F3FA"/>
<path d="M150.571 62.1887H145.61V57.2275H141.358V62.1887H136.397V66.5828H141.358V71.544H145.61V66.5828H150.571V62.1887Z" fill="url(#paint0_linear_6007_2307)"/>
<path d="M78.4708 25.241H74.2297V21H70.5946V25.241H66.3535V28.9974H70.5946V33.2385H74.2297V28.9974H78.4708V25.241Z" fill="url(#paint1_linear_6007_2307)"/>
<path d="M28.5556 67.5527H24.9321V63.9292H21.8262V67.5527H18.2026V70.7622H21.8262V74.3857H24.9321V70.7622H28.5556V67.5527Z" fill="url(#paint2_linear_6007_2307)"/>
<g filter="url(#filter0_d_6007_2307)">
<path d="M118.967 78.3419L108.953 53.8903C107.168 49.5434 102.511 47.0594 97.9308 48.0685L72.082 53.6575C69.9086 54.1232 68.0456 55.5981 66.9589 57.5387L42.3521 104.424C41.3429 106.364 42.0416 108.848 44.0598 109.857L88.6159 133.3C90.5565 134.309 93.0405 133.61 94.0496 131.592L118.656 84.7071C119.743 82.7665 119.821 80.4377 118.967 78.3419ZM94.2049 68.4836C91.0223 66.8535 89.7803 62.8947 91.488 59.7121C93.1181 56.5296 97.0769 55.2876 100.26 56.9953C103.442 58.6254 104.684 62.5842 102.976 65.7668C101.346 68.9494 97.3874 70.1914 94.2049 68.4836Z" fill="url(#paint3_linear_6007_2307)"/>
</g>
<path d="M97.3875 62.5066C117.647 52.0274 125.643 36.4249 115.086 29.6717C104.529 22.9184 94.1273 29.6717 91.488 49.3105" stroke="#AAB2C5" stroke-width="5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M124.561 109.864C124.238 111.234 123.754 112.686 123.19 113.895C121.658 116.878 119.239 119.217 116.256 120.748C113.192 122.28 109.564 122.925 105.935 122.119C97.3889 120.345 91.9062 111.96 93.68 103.413C95.4538 94.8668 103.759 89.3035 112.305 91.1579C115.369 91.8029 118.03 93.3349 120.287 95.4312C124.077 99.2207 125.689 104.703 124.561 109.864Z" fill="url(#paint4_linear_6007_2307)"/>
<path d="M114.16 105.268H110.531V101.639C110.531 100.914 109.967 100.269 109.161 100.269C108.435 100.269 107.79 100.833 107.79 101.639V105.268H104.162C103.436 105.268 102.791 105.832 102.791 106.638C102.791 107.445 103.355 108.009 104.162 108.009H107.79V111.637C107.79 112.363 108.354 113.008 109.161 113.008C109.886 113.008 110.531 112.444 110.531 111.637V108.009H114.16C114.885 108.009 115.53 107.445 115.53 106.638C115.53 105.832 114.885 105.268 114.16 105.268Z" fill="white"/>
<defs>
<filter id="filter0_d_6007_2307" x="19.8943" y="36.8447" width="121.652" height="129.913" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="11"/>
<feGaussianBlur stdDeviation="11"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.397708 0 0 0 0 0.47749 0 0 0 0 0.575 0 0 0 0.27 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_6007_2307"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_6007_2307" result="shape"/>
</filter>
<linearGradient id="paint0_linear_6007_2307" x1="143.485" y1="57.7249" x2="143.485" y2="65.7606" gradientUnits="userSpaceOnUse">
<stop stop-color="#B0BACC"/>
<stop offset="1" stop-color="#969EAE"/>
</linearGradient>
<linearGradient id="paint1_linear_6007_2307" x1="72.4131" y1="21.4251" x2="72.4131" y2="28.2945" gradientUnits="userSpaceOnUse">
<stop stop-color="#B0BACC"/>
<stop offset="1" stop-color="#969EAE"/>
</linearGradient>
<linearGradient id="paint2_linear_6007_2307" x1="23.3799" y1="64.2924" x2="23.3799" y2="70.1616" gradientUnits="userSpaceOnUse">
<stop stop-color="#B0BACC"/>
<stop offset="1" stop-color="#969EAE"/>
</linearGradient>
<linearGradient id="paint3_linear_6007_2307" x1="80.6952" y1="45.8575" x2="80.6952" y2="134.684" gradientUnits="userSpaceOnUse">
<stop stop-color="#FDFEFF"/>
<stop offset="0.9964" stop-color="#ECF0F5"/>
</linearGradient>
<linearGradient id="paint4_linear_6007_2307" x1="109.133" y1="91.9011" x2="109.133" y2="109.676" gradientUnits="userSpaceOnUse">
<stop stop-color="#B0BACC"/>
<stop offset="1" stop-color="#969EAE"/>
</linearGradient>
</defs>
</svg>`;

// Функция для получения высоты статусбара только на Android
const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

export const CustomerHomeScreen: React.FC = () => {
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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

  // Загружаем заказы при первом открытии и при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      loadNewOrders();
    }, [loadNewOrders])
  );

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

  const handleCreateOrder = () => {
    navigation.navigate('CreateOrder');
  };

  const handleNotificationsPress = () => {
    navigation.navigate('NotificationsList');
  };



  const renderOrderCard = ({ item }: { item: Order }) => (
    <ModernOrderCard
      order={item}
      onPress={() => handleOrderPress(item.id)}
      showApplicantsCount={true}
      showCreateTime={true}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <SvgXml xml={emptyStateNoActiveOrdersSvg} style={styles.emptyStateIcon} />
      <Text style={styles.emptyStateTitle}>{t('no_active_orders')}</Text>
      <Text style={styles.emptyStateDescription}>
        {t('no_active_orders_description')}
      </Text>
      <TouchableOpacity
        style={styles.createOrderButton}
        onPress={handleCreateOrder}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <PlusSquareIcon width={20} height={20} style={{ marginRight: theme.spacing.sm }} />
          <Text style={styles.createOrderButtonText}>{t('create_order')}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        {/* Header with notifications */}
        <View style={[styles.header, { paddingTop: theme.spacing.lg + getAndroidStatusBarHeight() }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{t('my_orders')}</Text>
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

        {/* Quick Create Button */}
        {newOrders.length > 0 && (
          <TouchableOpacity
            style={styles.quickCreateButton}
            onPress={handleCreateOrder}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <PlusSquareIcon width={20} height={20} style={{ marginRight: theme.spacing.sm }} />
              <Text style={styles.quickCreateText}>{t('create_new_order')}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Orders List or Empty State */}
        {isLoading && newOrders.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('loading_orders')}</Text>
          </View>
        ) : newOrders.length > 0 ? (
          <FlatList
            data={newOrders}
            renderItem={renderOrderCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.ordersList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
        ) : (
          renderEmptyState()
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
  quickCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingVertical: 24,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 64,
    borderRadius: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quickCreateIcon: {
    fontSize: 18,
    color: theme.colors.white,
    marginRight: theme.spacing.sm,
  },
  quickCreateText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.white,
  },
  ordersList: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    marginBottom: theme.spacing.lg,
    alignSelf: 'center',
  },
  emptyStateTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    alignSelf: 'center',
  },
  emptyStateDescription: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
    alignSelf: 'center',
  },
  createOrderButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 24,
    minHeight: 64,
    width: '100%',
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  createOrderButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.white,
    textAlign: 'center',
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