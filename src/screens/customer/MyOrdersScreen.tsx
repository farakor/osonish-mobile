import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { theme } from '../../constants';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CustomerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { supabase } from '../../services/supabaseClient';
import { Order } from '../../types';
import { ModernOrderCard } from '../../components/cards';
import { useCustomerTranslation } from '../../hooks/useTranslation';

// Функция для получения высоты статусбара только на Android
const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

export const MyOrdersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const t = useCustomerTranslation();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Функция для загрузки всех заказов пользователя
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const orders = await orderService.getCustomerOrders();
      setAllOrders(orders);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Функция для обновления списка (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  // Загружаем заказы при первом открытии и при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  // Real-time обновления для заказов пользователя
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    console.log('[MyOrdersScreen] Подключаем real-time обновления заказов');

    const ordersSubscription = supabase
      .channel('my_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${authState.user.id}`
        },
        (payload: any) => {
          console.log('[MyOrdersScreen] Real-time изменение заказов:', payload);
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      console.log('[MyOrdersScreen] Отключаем real-time обновления заказов');
      ordersSubscription.unsubscribe();
    };
  }, [loadOrders]);

  // Real-time обновления для откликов (влияют на статус заказов)
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    console.log('[MyOrdersScreen] Подключаем real-time обновления откликов');

    const applicantsSubscription = supabase
      .channel('my_orders_applicants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applicants'
        },
        (payload: any) => {
          console.log('[MyOrdersScreen] Real-time изменение откликов:', payload);
          // Обновляем заказы чтобы увидеть изменения в статусе
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      console.log('[MyOrdersScreen] Отключаем real-time обновления откликов');
      applicantsSubscription.unsubscribe();
    };
  }, [loadOrders]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return theme.colors.primary;
      case 'response_received':
        return '#10B981'; // зеленый цвет для статуса "отклик получен"
      case 'in_progress':
        return '#FFA500';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#DC3545';
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return t('status_new');
      case 'response_received':
        return t('status_response_received');
      case 'in_progress':
        return t('status_in_progress');
      case 'completed':
        return t('status_completed');
      case 'cancelled':
        return t('status_cancelled');
      default:
        return status;
    }
  };

  // Утилитарные функции для форматирования данных
  const formatBudget = (budget: number) => {
    return budget.toLocaleString('ru-RU');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return t('minutes_ago', { count: diffInMinutes });
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return t('hours_ago', { count: hours });
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return t('days_ago', { count: days });
    }
  };

  // Фильтрация заказов - показываем завершенные и отмененные
  const filteredOrders = allOrders.filter((order: Order) =>
    order.status === 'completed' || order.status === 'cancelled'
  );

  const renderOrder = ({ item }: { item: Order }) => (
    <ModernOrderCard
      order={item}
      onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
      showApplicantsCount={true}
      showCreateTime={true}
    />
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        {/* Content Header */}
        <View style={[styles.contentHeader, { paddingTop: theme.spacing.xl + getAndroidStatusBarHeight() }]}>
          <Text style={styles.title}>{t('my_orders_title')}</Text>
          <Text style={styles.subtitle}>{t('my_orders_subtitle')}</Text>
        </View>



        {/* Orders List */}
        {isLoading && allOrders.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('loading_my_orders')}</Text>
          </View>
        ) : filteredOrders.length > 0 ? (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrder}
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
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateTitle}>
              {t('no_completed_orders')}
            </Text>
            <Text style={styles.emptyStateText}>
              {t('no_completed_orders_text')}
            </Text>
          </View>
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
    paddingBottom: theme.spacing.lg,
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
  },
  tabs: {
    paddingHorizontal: theme.spacing.none,
    marginBottom: theme.spacing.lg,
  },
  tabsContainer: {
    paddingHorizontal: theme.spacing.none,
  },
  tabsContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  tab: {
    flexShrink: 0,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
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
  ordersList: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  orderTitle: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  orderBudget: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  categoryContainer: {
    marginBottom: theme.spacing.md,
  },
  orderCategory: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.secondary,
    fontWeight: theme.fonts.weights.medium,
    backgroundColor: `${theme.colors.secondary}15`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  orderDetailsLayout: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  locationCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border + '30',
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: theme.fonts.sizes.sm,
    marginRight: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.semiBold,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  detailCard: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border + '30',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.medium,
  },
  orderTime: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
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
    lineHeight: 22,
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
}); 