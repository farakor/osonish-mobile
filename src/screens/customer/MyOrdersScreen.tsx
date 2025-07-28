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
} from 'react-native';
import { theme } from '../../constants';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CustomerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';


type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

export const MyOrdersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Функция для загрузки всех заказов пользователя
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const orders = await orderService.getUserOrders();
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

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'active':
        return theme.colors.primary;
      case 'completed':
        return '#6B7280';
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'active':
        return 'Активный';
      case 'completed':
        return 'Завершен';
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
      return `${diffInMinutes} мин назад`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ч назад`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} дн назад`;
    }
  };

  // Фильтрация заказов по активной вкладке
  const filteredOrders = activeTab === 'all'
    ? allOrders
    : allOrders.filter((order: Order) =>
      activeTab === 'active'
        ? order.status === 'active'
        : order.status === 'completed'
    );

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
    >
      {/* Header with title and budget */}
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>{item.title}</Text>
        <Text style={styles.orderBudget}>{formatBudget(item.budget)} сум</Text>
      </View>

      {/* Category */}
      <View style={styles.categoryContainer}>
        <Text style={styles.orderCategory}>{item.category}</Text>
      </View>

      {/* Details in new layout */}
      <View style={styles.orderDetailsLayout}>
        <View style={styles.locationCard}>
          <View style={styles.detailValue}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.detailCard}>
            <View style={styles.detailValue}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>{formatDate(item.serviceDate)}</Text>
            </View>
          </View>
          <View style={styles.detailCard}>
            <View style={styles.detailValue}>
              <Text style={styles.detailIcon}>📝</Text>
              <Text style={styles.detailText}>{item.applicantsCount} заявок</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.orderFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
        <Text style={styles.orderTime}>Создан {formatCreatedAt(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        {/* Content Header */}
        <View style={styles.contentHeader}>
          <Text style={styles.title}>Мои заказы</Text>
          <Text style={styles.subtitle}>Отслеживайте свои заказы</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              Все
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              Активные
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Завершенные
            </Text>
          </TouchableOpacity>
        </View>

        {/* Orders List */}
        {isLoading && allOrders.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Загружаем ваши заказы...</Text>
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
              {activeTab === 'all'
                ? 'Заказов пока нет'
                : activeTab === 'active'
                  ? 'Нет активных заказов'
                  : 'Нет завершенных заказов'
              }
            </Text>
            <Text style={styles.emptyStateText}>
              {activeTab === 'all'
                ? 'Создайте свой первый заказ, чтобы найти исполнителя'
                : activeTab === 'active'
                  ? 'Все ваши заказы завершены или отменены'
                  : 'У вас пока нет завершенных заказов'
              }
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
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  ordersList: {
    paddingHorizontal: theme.spacing.lg,
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
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  orderBudget: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  categoryContainer: {
    marginBottom: theme.spacing.md,
  },
  orderCategory: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.secondary,
    fontWeight: theme.typography.fontWeight.medium,
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
    fontSize: theme.typography.fontSize.sm,
    marginRight: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
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
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.medium,
  },
  orderTime: {
    fontSize: theme.typography.fontSize.xs,
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
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.md,
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
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
}); 