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
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CustomerTabParamList, CustomerStackParamList } from '../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FilePlusIcon from '../../../assets/file-plus-03_2.svg';


interface Order {
  id: string;
  title: string;
  category: string;
  budget: string;
  status: 'active' | 'completed';
  createdAt: string;
  applicantsCount: number;
  description: string;
  location: string;
  serviceDate: string;
}

// Mock data - активные заказы пользователя
const mockActiveOrders: Order[] = [
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
    status: 'active',
    createdAt: '1 день назад',
    applicantsCount: 3,
    description: 'Стиральная машина Samsung не включается.',
    location: 'Ташкент, Мирзо-Улугбек',
    serviceDate: '2024-01-18',
  },
];

// Для демонстрации пустого состояния используйте:
// const mockActiveOrders: Order[] = [];

export const CustomerHomeScreen: React.FC = () => {
  const [activeOrders] = useState<Order[]>(mockActiveOrders);
  const navigation = useNavigation<BottomTabNavigationProp<CustomerTabParamList> & NativeStackNavigationProp<CustomerStackParamList>>();

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

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderPress(item.id)}
      activeOpacity={0.8}
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
        {activeOrders.length > 0 ? (
          <FlatList
            data={activeOrders}
            renderItem={renderOrderCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.ordersList}
            showsVerticalScrollIndicator={false}
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
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
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
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
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
    marginBottom: theme.spacing.sm,
  },
  orderDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
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
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: theme.typography.fontSize.md,
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
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    textAlign: 'center',
  },
}); 