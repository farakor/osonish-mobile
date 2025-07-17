import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { theme } from '../../constants';
import { useNavigation } from '@react-navigation/native';
import { CustomerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '../../components/common';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

interface Order {
  id: string;
  title: string;
  category: string;
  budget: string;
  status: 'active' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  applicantsCount: number;
  description: string;
  location: string;
  serviceDate: string;
}

const mockOrders: Order[] = [
  {
    id: '1',
    title: 'Уборка 2-комнатной квартиры',
    category: 'Уборка дома',
    budget: '150,000',
    status: 'active',
    createdAt: '2 часа назад',
    applicantsCount: 5,
    description: 'Нужна генеральная уборка квартиры. Включая мытье окон.',
    location: 'Ташкент, Юнусабад',
    serviceDate: '2024-01-20',
  },
  {
    id: '2',
    title: 'Ремонт стиральной машины',
    category: 'Ремонт техники',
    budget: '200,000',
    status: 'in_progress',
    createdAt: '1 день назад',
    applicantsCount: 3,
    description: 'Стиральная машина Samsung не включается.',
    location: 'Ташкент, Мирзо-Улугбек',
    serviceDate: '2024-01-18',
  },
  {
    id: '3',
    title: 'Доставка мебели',
    category: 'Доставка',
    budget: '100,000',
    status: 'completed',
    createdAt: '3 дня назад',
    applicantsCount: 8,
    description: 'Необходимо доставить диван и кресло на 5 этаж.',
    location: 'Ташкент, Чиланзар',
    serviceDate: '2024-01-15',
  },
];

export const MyOrdersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'active':
        return theme.colors.primary;
      case 'in_progress':
        return '#F39C12';
      case 'completed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'active':
        return 'Активный';
      case 'in_progress':
        return 'В работе';
      case 'completed':
        return 'Завершен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const filteredOrders = activeTab === 'all'
    ? mockOrders
    : mockOrders.filter(order =>
      activeTab === 'active'
        ? order.status === 'active' || order.status === 'in_progress'
        : order.status === 'completed'
    );

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.orderCategory}>{item.category}</Text>

      <View style={styles.orderDetails}>
        <View style={styles.orderDetail}>
          <Text style={styles.orderDetailLabel}>📍 Местоположение:</Text>
          <Text style={styles.orderDetailValue}>{item.location}</Text>
        </View>
        <View style={styles.orderDetail}>
          <Text style={styles.orderDetailLabel}>💰 Бюджет:</Text>
          <Text style={styles.orderDetailValue}>{item.budget} сум</Text>
        </View>
        <View style={styles.orderDetail}>
          <Text style={styles.orderDetailLabel}>📝 Откликов:</Text>
          <Text style={styles.orderDetailValue}>{item.applicantsCount}</Text>
        </View>
        <View style={styles.orderDetail}>
          <Text style={styles.orderDetailLabel}>📅 Дата:</Text>
          <Text style={styles.orderDetailValue}>{item.serviceDate}</Text>
        </View>
      </View>

      <Text style={styles.orderTime}>Создан {item.createdAt}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header />
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
        {filteredOrders.length > 0 ? (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrder}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.ordersList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateTitle}>Заказов пока нет</Text>
            <Text style={styles.emptyStateText}>
              Создайте свой первый заказ, чтобы найти исполнителя
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
  orderCategory: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  orderDetails: {
    marginBottom: theme.spacing.sm,
  },
  orderDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  orderDetailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  orderDetailValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  orderTime: {
    fontSize: theme.typography.fontSize.xs,
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
}); 