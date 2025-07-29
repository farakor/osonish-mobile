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
import { theme } from '../../constants/theme';


type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

type Application = {
  id: string;
  jobId: string;
  jobTitle: string;
  jobCategory: string;
  customerName: string;
  customerRating: number;
  budget: number;
  status: ApplicationStatus;
  appliedAt: string;
  deadline: string;
  location: string;
  message: string;
};

const mockApplications: Application[] = [
  {
    id: '1',
    jobId: 'j1',
    jobTitle: 'Уборка 3-комнатной квартиры',
    jobCategory: 'Уборка дома',
    customerName: 'Азиза К.',
    customerRating: 4.8,
    budget: 150000,
    status: 'accepted',
    appliedAt: '2024-01-15T10:30:00Z',
    deadline: '2024-01-20',
    location: 'Ташкент, Юнусабад',
    message: 'Здравствуйте! Имею опыт уборки квартир более 3 лет. Работаю качественно и в срок.',
  },
  {
    id: '2',
    jobId: 'j2',
    jobTitle: 'Ремонт стиральной машины',
    jobCategory: 'Ремонт техники',
    customerName: 'Фарход Н.',
    customerRating: 4.9,
    budget: 200000,
    status: 'pending',
    appliedAt: '2024-01-14T15:45:00Z',
    deadline: '2024-01-18',
    location: 'Ташкент, Мирзо-Улугбек',
    message: 'Специализируюсь на ремонте стиральных машин Samsung. Диагностика бесплатно.',
  },
  {
    id: '3',
    jobId: 'j3',
    jobTitle: 'Настройка домашней сети',
    jobCategory: 'IT услуги',
    customerName: 'Дилшод А.',
    customerRating: 4.6,
    budget: 120000,
    status: 'completed',
    appliedAt: '2024-01-10T09:15:00Z',
    deadline: '2024-01-12',
    location: 'Ташкент, Чиланзар',
    message: 'Настрою роутер и Wi-Fi сеть. Гарантия 6 месяцев.',
  },
  {
    id: '4',
    jobId: 'j4',
    jobTitle: 'Репетиторство по математике',
    jobCategory: 'Репетиторство',
    customerName: 'Севара М.',
    customerRating: 4.7,
    budget: 100000,
    status: 'rejected',
    appliedAt: '2024-01-08T14:20:00Z',
    deadline: '2024-01-25',
    location: 'Ташкент, Сергели',
    message: 'Преподаватель математики с опытом 5 лет. Индивидуальный подход.',
  },
  {
    id: '5',
    jobId: 'j5',
    jobTitle: 'Генеральная уборка офиса',
    jobCategory: 'Уборка дома',
    customerName: 'ООО "Бизнес"',
    customerRating: 4.5,
    budget: 300000,
    status: 'accepted',
    appliedAt: '2024-01-12T11:00:00Z',
    deadline: '2024-01-16',
    location: 'Ташкент, Мирабад',
    message: 'Выполню качественную уборку офиса. Свои моющие средства и инвентарь.',
  },
];

export const WorkerApplicationsScreen: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | 'all'>('all');

  const statusFilters = [
    { key: 'all', label: 'Все', emoji: '📋', count: mockApplications.length },
    { key: 'pending', label: 'Ожидание', emoji: '⏳', count: mockApplications.filter(a => a.status === 'pending').length },
    { key: 'accepted', label: 'Принято', emoji: '✅', count: mockApplications.filter(a => a.status === 'accepted').length },
    { key: 'completed', label: 'Выполнено', emoji: '🎉', count: mockApplications.filter(a => a.status === 'completed').length },
    { key: 'rejected', label: 'Отклонено', emoji: '❌', count: mockApplications.filter(a => a.status === 'rejected').length },
  ];

  const filteredApplications = mockApplications.filter(app =>
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

  const handleApplicationAction = (applicationId: string, action: string) => {
    console.log(`Action: ${action} for application: ${applicationId}`);
    // TODO: Implement application actions
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

  const renderApplicationCard = ({ item }: { item: Application }) => (
    <View style={styles.applicationCard}>
      {/* Header with title, budget and status */}
      <View style={styles.applicationHeader}>
        <View style={styles.applicationInfo}>
          <Text style={styles.jobTitle}>{item.jobTitle}</Text>
          <Text style={styles.jobBudget}>{formatBudget(item.budget)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {/* Category */}
      <View style={styles.categoryContainer}>
        <Text style={styles.jobCategory}>{item.jobCategory}</Text>
      </View>

      {/* Details in new layout */}
      <View style={styles.applicationDetailsLayout}>
        <View style={styles.locationCard}>
          <View style={styles.detailValue}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        </View>
        <View style={styles.topRow}>
          <View style={styles.detailCard}>
            <View style={styles.detailValue}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>{formatDate(item.deadline)}</Text>
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
            onPress={() => handleApplicationAction(item.id, 'contact')}
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
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={styles.emptyStateTitle}>Нет заявок</Text>
              <Text style={styles.emptyStateText}>
                {selectedStatus === 'all'
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