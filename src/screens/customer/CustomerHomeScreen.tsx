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
import { theme } from '../../constants';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CustomerTabParamList, CustomerStackParamList } from '../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FilePlusIcon from '../../../assets/file-plus-03_2.svg';
import NotificationIcon from '../../../assets/notification-message.svg';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { notificationService } from '../../services/notificationService';
import { supabase } from '../../services/supabaseClient';
import { Order } from '../../types';
import { ModernOrderCard } from '../../components/cards';

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
      <Text style={styles.emptyStateIcon}>📋</Text>
      <Text style={styles.emptyStateTitle}>У вас пока нет активных заказов</Text>
      <Text style={styles.emptyStateDescription}>
        Создайте свой первый заказ, чтобы найти надежного исполнителя
      </Text>
      <TouchableOpacity
        style={styles.createOrderButton}
        onPress={handleCreateOrder}
        activeOpacity={0.8}
      >
        <Text style={styles.createOrderButtonText}>➕ Создать заказ</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        {/* Header with notifications */}
        <View style={[styles.header, { paddingTop: theme.spacing.lg + getAndroidStatusBarHeight() }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Мои заказы</Text>
            <Text style={styles.subtitle}>
              {newOrders.length > 0
                ? `У вас ${newOrders.length} активных заказов`
                : 'Создайте свой первый заказ'
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
              <FilePlusIcon width={20} height={20} style={{ marginRight: theme.spacing.sm }} />
              <Text style={styles.quickCreateText}>Создать новый заказ</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Orders List or Empty State */}
        {isLoading && newOrders.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Загружаем ваши заказы...</Text>
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
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
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
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  createOrderButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
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