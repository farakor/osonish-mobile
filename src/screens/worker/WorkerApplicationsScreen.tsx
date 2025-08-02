import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { supabase } from '../../services/supabaseClient';
import { WorkerApplication } from '../../types';


type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export const WorkerApplicationsScreen: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | 'all'>('all');
  const [applications, setApplications] = useState<WorkerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Функция загрузки заявок
  const loadApplications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const workerApplications = await orderService.getWorkerApplications();
      setApplications(workerApplications);
      console.log(`[WorkerApplicationsScreen] Загружено ${workerApplications.length} заявок`);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить заявки');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Загружаем заявки при первом открытии экрана
  useEffect(() => {
    loadApplications();
  }, []);

  // Обновляем данные когда экран получает фокус
  useFocusEffect(
    React.useCallback(() => {
      loadApplications();
    }, [])
  );

  // Real-time обновления заявок
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    console.log('[WorkerApplicationsScreen] Подключаем real-time обновления заявок');

    const subscription = supabase
      .channel('worker_applications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applicants',
          filter: `worker_id=eq.${authState.user.id}`
        },
        (payload: any) => {
          console.log('[WorkerApplicationsScreen] Real-time изменение заявки:', payload);
          // Перезагружаем данные при любых изменениях
          loadApplications();
        }
      )
      .subscribe();

    return () => {
      console.log('[WorkerApplicationsScreen] Отключаем real-time обновления заявок');
      subscription.unsubscribe();
    };
  }, []);

  const statusFilters = [
    { key: 'all', label: 'Все', emoji: '📋', count: applications.length },
    { key: 'pending', label: 'Ожидание', emoji: '⏳', count: applications.filter(a => a.status === 'pending').length },
    { key: 'accepted', label: 'Принято', emoji: '✅', count: applications.filter(a => a.status === 'accepted').length },
    { key: 'completed', label: 'Выполнено', emoji: '🎉', count: applications.filter(a => a.status === 'completed').length },
    { key: 'rejected', label: 'Отклонено', emoji: '❌', count: applications.filter(a => a.status === 'rejected').length },
  ];

  const filteredApplications = applications.filter(app =>
    selectedStatus === 'all' || app.status === selectedStatus
  );

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'accepted': return theme.colors.primary;
      case 'rejected': return '#FF3B30';
      case 'completed': return '#6B7280';
      default: return theme.colors.text.secondary;
    }
  };

  const getStatusText = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending': return 'Ожидание';
      case 'accepted': return 'Принято';
      case 'rejected': return 'Отклонено';
      case 'completed': return 'Выполнено';
      default: return status;
    }
  };

  const formatBudget = (amount: number) => {
    return `${amount.toLocaleString()} сум`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleApplicationAction = async (applicationId: string, action: string, customerPhone?: string) => {
    console.log(`Action: ${action} for application: ${applicationId}`);

    if (action === 'cancel') {
      Alert.alert(
        'Отменить заявку',
        'Вы действительно хотите отменить эту заявку?',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Отменить заявку',
            style: 'destructive',
            onPress: async () => {
              try {
                const success = await orderService.cancelWorkerApplication(applicationId);
                if (success) {
                  Alert.alert('Успешно', 'Заявка отменена');
                  loadApplications(); // Перезагружаем данные
                } else {
                  Alert.alert('Ошибка', 'Не удалось отменить заявку');
                }
              } catch (error) {
                console.error('Ошибка отмены заявки:', error);
                Alert.alert('Ошибка', 'Произошла ошибка при отмене заявки');
              }
            }
          }
        ]
      );
    } else if (action === 'contact' && customerPhone) {
      Alert.alert(
        'Связаться с заказчиком',
        `Позвонить по номеру ${customerPhone}?`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Позвонить',
            onPress: () => {
              Linking.openURL(`tel:${customerPhone}`);
            }
          }
        ]
      );
    }
  };

  const renderStatusFilter = (filter: any) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterChip,
        selectedStatus === filter.key && styles.filterChipActive
      ]}
      onPress={() => setSelectedStatus(filter.key)}
    >
      <Text style={styles.filterEmoji}>{filter.emoji}</Text>
      <Text style={[
        styles.filterChipText,
        selectedStatus === filter.key && styles.filterChipTextActive
      ]}>
        {filter.label}
      </Text>
      <Text style={[
        styles.filterChipCount,
        selectedStatus === filter.key && styles.filterChipCountActive
      ]}>
        ({filter.count})
      </Text>
    </TouchableOpacity>
  );

  const renderApplicationCard = ({ item }: { item: WorkerApplication }) => (
    <View style={styles.applicationCard}>
      {/* Header with title, budget and status */}
      <View style={styles.applicationHeader}>
        <View style={styles.applicationInfo}>
          <Text style={styles.jobTitle}>{item.orderTitle}</Text>
          <Text style={styles.jobBudget}>{formatBudget(item.orderBudget)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {/* Category */}
      <View style={styles.categoryContainer}>
        <Text style={styles.jobCategory}>{item.orderCategory}</Text>
      </View>

      {/* Details in new layout */}
      <View style={styles.applicationDetailsLayout}>
        <View style={styles.locationCard}>
          <View style={styles.detailValue}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{item.orderLocation}</Text>
          </View>
        </View>
        <View style={styles.topRow}>
          <View style={styles.detailCard}>
            <View style={styles.detailValue}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>{formatDate(item.orderServiceDate)}</Text>
            </View>
          </View>
          <View style={styles.detailCard}>
            <View style={styles.detailValue}>
              <Text style={styles.detailIcon}>👤</Text>
              <Text style={styles.detailText}>{item.customerName}</Text>
            </View>
          </View>
        </View>

      </View>



      <View style={styles.applicationActions}>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleApplicationAction(item.id, 'cancel')}
          >
            <Text style={styles.cancelButtonText}>Отменить заявку</Text>
          </TouchableOpacity>
        )}

        {(item.status === 'accepted' || item.status === 'completed') && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleApplicationAction(item.id, 'contact', item.customerPhone)}
          >
            <Text style={styles.contactButtonText}>Связаться с заказчиком</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.title}>Мои заявки</Text>
          <Text style={styles.subtitle}>
            Отслеживайте статус ваших заявок на заказы
          </Text>
        </View>

        {/* Улучшенная карусель статусов */}
        <View style={styles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {statusFilters.map(renderStatusFilter)}
          </ScrollView>
        </View>

        <FlatList
          data={filteredApplications}
          renderItem={renderApplicationCard}
          keyExtractor={(item) => item.id}
          style={styles.applicationsList}
          contentContainerStyle={styles.applicationsListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadApplications(true)}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={styles.emptyStateTitle}>
                {isLoading ? 'Загрузка...' : 'Нет заявок'}
              </Text>
              <Text style={styles.emptyStateText}>
                {isLoading
                  ? 'Загружаем ваши заявки...'
                  : selectedStatus === 'all'
                    ? 'Вы еще не подавали заявки на заказы'
                    : `Нет заявок со статусом "${statusFilters.find(f => f.key === selectedStatus)?.label}"`
                }
              </Text>
            </View>
          }
        />
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
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  filtersSection: {
    marginBottom: theme.spacing.lg,
  },
  filtersContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  filtersContent: {
    paddingRight: theme.spacing.lg,
  },
  filterChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    minHeight: 90,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.2,
  },
  filterEmoji: {
    fontSize: 28,
    marginBottom: theme.spacing.xs,
  },
  filterChipText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  filterChipTextActive: {
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.semiBold,
  },
  filterChipCount: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.fonts.weights.medium,
    textAlign: 'center',
  },
  filterChipCountActive: {
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.semiBold,
  },
  applicationsList: {
    flex: 1,
  },
  applicationsListContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  applicationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  applicationInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  jobTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  jobCategory: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.bold,
  },
  jobBudget: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  categoryContainer: {
    marginBottom: theme.spacing.md,
  },
  applicationDetailsLayout: {
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
  topRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 14,
    marginRight: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.semiBold,
    flex: 1,
  },

  applicationActions: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.semiBold,
  },
  contactButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.semiBold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 