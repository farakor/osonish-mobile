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
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CustomerTabParamList, CustomerStackParamList } from '../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FilePlusIcon from '../../../assets/file-plus-03_2.svg';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';




export const CustomerHomeScreen: React.FC = () => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<BottomTabNavigationProp<CustomerTabParamList> & NativeStackNavigationProp<CustomerStackParamList>>();

  // Функция для загрузки активных заказов
  const loadActiveOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const orders = await orderService.getUserActiveOrders();
      setActiveOrders(orders);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Функция для обновления списка (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActiveOrders();
    setRefreshing(false);
  }, [loadActiveOrders]);

  // Загружаем заказы при первом открытии и при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      loadActiveOrders();
    }, [loadActiveOrders])
  );

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'active':
        return theme.colors.primary;
      default:
        return 'transparent';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'active':
        return 'Активный';
      default:
        return '';
    }
  };

  const handleOrderPress = (orderId: string) => {
    navigation.navigate('OrderDetails', { orderId });
  };

  const handleCreateOrder = () => {
    navigation.navigate('CreateOrder');
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

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderPress(item.id)}
      activeOpacity={0.8}
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
        {/* Content Header */}
        <View style={styles.contentHeader}>
          <Text style={styles.greeting}>Мои заказы</Text>
          <Text style={styles.subtitle}>
            {activeOrders.length > 0
              ? `У вас ${activeOrders.length} активных заказа`
              : 'Создайте свой первый заказ'
            }
          </Text>
        </View>

        {/* Quick Create Button */}
        {activeOrders.length > 0 && (
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
        {isLoading && activeOrders.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Загружаем ваши заказы...</Text>
          </View>
        ) : activeOrders.length > 0 ? (
          <FlatList
            data={activeOrders}
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  greeting: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
  },
  quickCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickCreateIcon: {
    fontSize: 18,
    color: theme.colors.white,
    marginRight: theme.spacing.sm,
  },
  quickCreateText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.white,
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
  orderDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
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
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
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
}); 