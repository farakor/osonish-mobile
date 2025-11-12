import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet, ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { SvgXml } from 'react-native-svg';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CustomerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService } from '../../services/authService';
import { Order } from '../../types';
import { ModernOrderCard } from '../../components/cards';
import { VacancyCard } from '../../components/vacancy';
import { useCustomerTranslation, useWorkerTranslation } from '../../hooks/useTranslation';
import { OrderCardSkeleton } from '../../components/skeletons';
import { useMyOrders } from '../../hooks/queries';

// SVG иконка empty-state-completed-orders
const emptyStateCompletedOrdersSvg = `<svg width="161" height="160" viewBox="0 0 161 160" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M42.3936 130.312L77.7025 119.248V73.8867L42.3936 84.8654V130.312Z" fill="#D5DAE5"/>
<path d="M113.012 130.312L77.7026 119.248V73.8867L113.012 84.8654V130.312Z" fill="#F1F3FA"/>
<path opacity="0.6" d="M113.012 130.312L77.7026 119.248V73.8867L113.012 84.8654V130.312Z" fill="#AAB2C5"/>
<g opacity="0.13">
<path d="M42.3936 130.312L77.7025 119.248V73.8867L42.3936 84.8654V130.312Z" fill="url(#paint0_linear_6007_2268)"/>
<path d="M113.011 130.312L77.7025 119.248V73.8867L113.011 84.8654V130.312Z" fill="url(#paint1_linear_6007_2268)"/>
</g>
<path d="M77.7025 141.461L42.3936 130.397V85.0356L77.7025 96.0995V141.461Z" fill="#F1F3FA"/>
<path d="M77.7026 141.461L113.012 130.397V85.0356L77.7026 96.0995V141.461Z" fill="#D5DAE5"/>
<path opacity="0.09" d="M69.7025 133.461L42.3936 130.397V85.0356L77.7025 96.0995L69.7025 133.461Z" fill="url(#paint2_linear_6007_2268)"/>
<path opacity="0.2" d="M85.7026 125.461L113.012 130.397V85.0356L77.7026 96.0995L85.7026 125.461Z" fill="url(#paint3_linear_6007_2268)"/>
<path d="M77.7026 73.8867L61.1015 61.4612L25.2026 73.5463L42.3936 84.8654L77.7026 73.8867Z" fill="#D5DAE5"/>
<path d="M77.7026 73.8867L94.3038 61.4612L130.203 73.5463L113.012 84.8654L77.7026 73.8867Z" fill="#D5DAE5"/>
<path d="M42.3936 85.0356L77.7026 96.0995L60.0903 107.334L25.2026 95.759L42.3936 85.0356Z" fill="#F1F3FA"/>
<path d="M113.012 85.0356L77.7026 96.0995L95.315 107.334L130.203 95.759L113.012 85.0356Z" fill="#F1F3FA"/>
<path d="M87.5541 30.338C92.5007 43.7624 93.9751 46.7452 94.459 59.9731C94.273 62.9926 94.1576 66.276 92.734 68.9199C90.8329 72.9643 86.1828 75.7653 81.7895 75.8107C77.2636 75.8916 72.8265 73.1204 70.8293 68.8473C69.4242 66.254 69.4689 62.7067 71.3963 60.3522C73.4916 58.094 77.1778 57.531 79.8295 58.942C82.7464 60.2819 84.4874 63.0681 85.1323 66.0064C85.7772 68.9448 85.4938 72.1317 84.7067 75.0294C83.0604 82.0768 81.6969 82.4178 77.6596 94.3495" stroke="#AAB2C5" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="4 4"/>
<path d="M93.5743 23.2325C93.5628 25.2065 91.7258 26.4152 89.3963 25.7849C86.9436 25.3668 85.2076 24.9359 85.0959 23.1741C85.1521 21.3673 87.1234 20.6601 89.4308 19.863C92.1973 18.7636 93.4178 21.3035 93.5743 23.2325Z" fill="#D5DAE5"/>
<path d="M77.7253 29.2689C78.9683 30.5485 81.589 30.9216 82.8661 28.967C84.2665 26.8003 85.4651 25.225 84.1773 23.7782C82.9343 22.4986 81.7245 23.3601 78.958 24.4594C76.7402 25.5909 76.2695 27.8671 77.7253 29.2689Z" fill="#D5DAE5"/>
<path d="M83.4609 21.1036C84.5922 20.6214 85.9474 20.9751 86.552 21.8882C86.8096 22.1776 87.1119 22.6341 87.2015 22.9685C88.1644 25.219 87.8616 27.4502 86.5624 27.9773C85.1398 28.7167 83.18 27.4498 82.4299 25.3215C82.2508 24.6528 82.1613 24.3184 82.0269 23.8169C81.8815 22.6016 82.3297 21.5857 83.4609 21.1036C83.6289 21.0586 83.4609 21.1036 83.4609 21.1036Z" fill="#AAB2C5"/>
<path d="M31.4599 57.3314H29.2699V55.1414H27.3927V57.3314H25.2026V59.2712H27.3927V61.4612H29.2699V59.2712H31.4599V57.3314Z" fill="url(#paint4_linear_6007_2268)"/>
<path d="M36.2704 112.279H34.0804V110.089H32.2032V112.279H30.0132V114.218H32.2032V116.408H34.0804V114.218H36.2704V112.279Z" fill="url(#paint5_linear_6007_2268)"/>
<path d="M132.008 112.403L129.329 111.05L130.682 108.37L128.385 107.211L127.032 109.89L124.352 108.537L123.154 110.911L125.834 112.263L124.481 114.943L126.778 116.103L128.131 113.423L130.81 114.776L132.008 112.403Z" fill="url(#paint6_linear_6007_2268)"/>
<defs>
<linearGradient id="paint0_linear_6007_2268" x1="66.5563" y1="77.172" x2="61.7403" y2="97.2218" gradientUnits="userSpaceOnUse">
<stop offset="0.00289017" stop-color="#606673" stop-opacity="0"/>
<stop offset="1" stop-color="#373C47"/>
</linearGradient>
<linearGradient id="paint1_linear_6007_2268" x1="66.5563" y1="77.172" x2="61.7403" y2="97.2218" gradientUnits="userSpaceOnUse">
<stop offset="0.00289017" stop-color="#606673" stop-opacity="0"/>
<stop offset="1" stop-color="#373C47"/>
</linearGradient>
<linearGradient id="paint2_linear_6007_2268" x1="50.3096" y1="116.081" x2="58.7922" y2="92.1228" gradientUnits="userSpaceOnUse">
<stop offset="0.00289017" stop-color="#6C80AA" stop-opacity="0"/>
<stop offset="1" stop-color="#5D6A86"/>
</linearGradient>
<linearGradient id="paint3_linear_6007_2268" x1="96.7584" y1="122.625" x2="97.4255" y2="92.2228" gradientUnits="userSpaceOnUse">
<stop offset="0.00289017" stop-color="#314F91" stop-opacity="0"/>
<stop offset="1" stop-color="#324264"/>
</linearGradient>
<linearGradient id="paint4_linear_6007_2268" x1="28.3318" y1="55.3609" x2="28.3318" y2="58.9082" gradientUnits="userSpaceOnUse">
<stop stop-color="#B0BACC"/>
<stop offset="1" stop-color="#969EAE"/>
</linearGradient>
<linearGradient id="paint5_linear_6007_2268" x1="33.1423" y1="110.308" x2="33.1423" y2="113.855" gradientUnits="userSpaceOnUse">
<stop stop-color="#B0BACC"/>
<stop offset="1" stop-color="#969EAE"/>
</linearGradient>
<linearGradient id="paint6_linear_6007_2268" x1="129.398" y1="108.059" x2="127.207" y2="112.399" gradientUnits="userSpaceOnUse">
<stop stop-color="#B0BACC"/>
<stop offset="1" stop-color="#969EAE"/>
</linearGradient>
</defs>
</svg>`;

// Функция для получения высоты статусбара только на Android
const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

type TabType = 'active' | 'completed';

export const MyOrdersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const t = useCustomerTranslation();
  const tWorker = useWorkerTranslation();

  const [activeTab, setActiveTab] = useState<TabType>('active');
  
  // НОВОЕ: Определяем роль пользователя
  const authState = authService.getAuthState();
  const isWorker = authState.user?.role === 'worker';

  // ✨ React Query - автоматическое кэширование и управление состоянием
  const { data: allOrders = [], isLoading, refetch, isRefetching } = useMyOrders();

  // Функция для обновления списка (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Перезагружаем данные при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Real-time обновления для заказов пользователя
  // ВРЕМЕННО ОТКЛЮЧЕНО: для диагностики ошибки Maximum update depth
  /*
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
  */

  // Real-time обновления для откликов (влияют на статус заказов)
  /*
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
  */

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

  // Фильтрация заказов в зависимости от активного таба
  const filteredOrders = allOrders
    .filter((order: Order) => {
      if (activeTab === 'active') {
        // Активные заказы: новые, с откликами, в процессе
        return order.status === 'new' || order.status === 'response_received' || order.status === 'in_progress';
      } else {
        // Завершенные заказы: завершенные и отмененные
        return order.status === 'completed' || order.status === 'cancelled';
      }
    })
    .sort((a, b) => {
      // Если мы в активных заказах, сортируем по приоритету откликов
      if (activeTab === 'active') {
        const aHasPending = (a.pendingApplicantsCount || 0) > 0;
        const bHasPending = (b.pendingApplicantsCount || 0) > 0;
        const aHasApplicants = a.applicantsCount > 0;
        const bHasApplicants = b.applicantsCount > 0;
        
        // Приоритет 1: Заказы с непринятыми откликами (требуют внимания)
        if (aHasPending && !bHasPending) return -1;
        if (!aHasPending && bHasPending) return 1;
        
        // Если оба имеют непринятые отклики, сортируем по их количеству (больше первыми)
        if (aHasPending && bHasPending) {
          const pendingDiff = (b.pendingApplicantsCount || 0) - (a.pendingApplicantsCount || 0);
          if (pendingDiff !== 0) return pendingDiff;
        }
        
        // Приоритет 2: Заказы с откликами (но все уже приняты/отклонены)
        if (aHasApplicants && !bHasApplicants) return -1;
        if (!aHasApplicants && bHasApplicants) return 1;
        
        // Приоритет 3: Сортировка по дате создания (новые первыми)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      
      // Для завершенных заказов сортируем по дате обновления (последние первыми)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const renderOrder = ({ item }: { item: Order }) => (
    item.type === 'vacancy' ? (
      <VacancyCard
        vacancy={item}
        onPress={() => {
          if (item.type === 'vacancy') {
            navigation.navigate('VacancyDetailsCustomer', { vacancyId: item.id });
          } else {
            navigation.navigate('OrderDetails', { orderId: item.id });
          }
        }}
      />
    ) : (
      <ModernOrderCard
        order={item}
        onPress={() => {
          if (item.type === 'vacancy') {
            navigation.navigate('VacancyDetailsCustomer', { vacancyId: item.id });
          } else {
            navigation.navigate('OrderDetails', { orderId: item.id });
          }
        }}
        showApplicantsCount={true}
        showCreateTime={true}
      />
    )
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
        {/* Content Header */}
        <View style={[styles.contentHeader, { paddingTop: theme.spacing.xl + getAndroidStatusBarHeight() }]}>
          <Text style={styles.title}>{t('my_orders_title')}</Text>
          <Text style={styles.subtitle}>{t('my_orders_subtitle')}</Text>
          
          {/* НОВОЕ: Подсказка для исполнителей */}
          {isWorker && (
            <View style={styles.workerHintContainer}>
              <Text style={styles.workerHintText}>
                💼 {tWorker('orders_created_by_you')}
              </Text>
            </View>
          )}
        </View>

        {/* Tabs - Pill Style */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'active' && styles.activeTab]}
              onPress={() => setActiveTab('active')}
            >
              <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
                {t('orders_tab_active')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
              onPress={() => setActiveTab('completed')}
            >
              <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
                {t('orders_tab_completed')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Orders List */}
        {isLoading && allOrders.length === 0 ? (
          <FlatList
            data={[1, 2, 3, 4, 5]}
            renderItem={() => <OrderCardSkeleton />}
            keyExtractor={(item) => `skeleton-${item}`}
            contentContainerStyle={styles.ordersList}
            showsVerticalScrollIndicator={false}
          />
        ) : filteredOrders.length > 0 ? (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrder}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.ordersList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
            }
            // Оптимизация производительности - виртуализация
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={10}
            // Оптимизация высоты элементов
            getItemLayout={(data, index) => ({
              length: 180, // Примерная высота карточки заказа
              offset: 180 * index,
              index,
            })}
            onEndReachedThreshold={0.5}
          />
        ) : (
          <View style={styles.emptyState}>
            <SvgXml xml={emptyStateCompletedOrdersSvg} style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateTitle}>
              {activeTab === 'active' ? t('no_active_orders_empty') : t('no_completed_orders')}
            </Text>
            <Text style={styles.emptyStateText}>
              {activeTab === 'active'
                ? (isWorker ? tWorker('no_created_orders_hint') : t('no_active_orders_description_empty'))
                : t('no_completed_orders_text')
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
    backgroundColor: '#F4F5FC',
  },
  content: {
    flex: 1,
    backgroundColor: '#F4F5FC',
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
  tabsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 8,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginVertical: 2,
  },
  activeTab: {
    backgroundColor: theme.colors.white,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
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
    borderWidth: 0, borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
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
    borderWidth: 0, borderColor: theme.colors.border + '30',
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
    borderWidth: 0, borderColor: theme.colors.border + '30',
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
    width: 80,
    height: 80,
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
  workerHintContainer: {
    marginTop: theme.spacing.md,
    backgroundColor: `${theme.colors.primary}10`,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  workerHintText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  loadingMoreContainer: {
    paddingVertical: theme.spacing.md,
  },
}); 