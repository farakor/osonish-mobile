import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { theme } from '../../constants/theme';

type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  location: string;
  customerName: string;
  customerRating: number;
  applicantsCount: number;
  createdAt: string;
  isUrgent?: boolean;
};

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Уборка 3-комнатной квартиры',
    description: 'Нужна генеральная уборка квартиры 85 кв.м. Включая мытье окон, уборка всех комнат, кухни и ванной.',
    category: 'Уборка дома',
    budget: 150000,
    deadline: '2024-01-20',
    location: 'Ташкент, Юнусабад',
    customerName: 'Азиза К.',
    customerRating: 4.8,
    applicantsCount: 3,
    createdAt: '2024-01-15',
    isUrgent: true,
  },
  {
    id: '2',
    title: 'Ремонт стиральной машины',
    description: 'Стиральная машина Samsung не включается. Нужна диагностика и ремонт.',
    category: 'Ремонт техники',
    budget: 200000,
    deadline: '2024-01-18',
    location: 'Ташкент, Мирзо-Улугбек',
    customerName: 'Фарход Н.',
    customerRating: 4.9,
    applicantsCount: 7,
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    title: 'Доставка мебели',
    description: 'Доставить диван из магазина до дома (3-й этаж). Помочь занести в квартиру.',
    category: 'Доставка',
    budget: 100000,
    deadline: '2024-01-16',
    location: 'Ташкент, Сергели',
    customerName: 'Мадина С.',
    customerRating: 4.7,
    applicantsCount: 12,
    createdAt: '2024-01-13',
  },
];

export const WorkerJobsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    'Все',
    'Уборка дома',
    'Ремонт техники',
    'Доставка',
    'Репетиторство',
    'Красота',
    'Фотография',
    'Строительство',
    'IT услуги',
  ];

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'Все' || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatBudget = (amount: number) => {
    return `${amount.toLocaleString()} сум`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const handleApplyToJob = (jobId: string) => {
    console.log('Applying to job:', jobId);
    // TODO: Implement job application logic
  };

  const renderJobCard = ({ item }: { item: Job }) => (
    <View style={styles.jobCard}>
      {item.isUrgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>🔥 СРОЧНО</Text>
        </View>
      )}

      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <Text style={styles.jobBudget}>{formatBudget(item.budget)}</Text>
      </View>

      <Text style={styles.jobCategory}>{item.category}</Text>
      <Text style={styles.jobDescription}>{item.description}</Text>

      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 Местоположение:</Text>
          <Text style={styles.detailValue}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📅 Срок:</Text>
          <Text style={styles.detailValue}>до {formatDate(item.deadline)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>👤 Заказчик:</Text>
          <Text style={styles.detailValue}>{item.customerName} (⭐ {item.customerRating})</Text>
        </View>
      </View>

      <View style={styles.jobFooter}>
        <Text style={styles.applicantsText}>
          📝 {item.applicantsCount} заявок
        </Text>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => handleApplyToJob(item.id)}
        >
          <Text style={styles.applyButtonText}>Откликнуться</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryChip = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryChip,
        selectedCategory === category && styles.categoryChipActive
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryChipText,
        selectedCategory === category && styles.categoryChipTextActive
      ]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Доступные заказы</Text>
        <Text style={styles.subtitle}>Найдите подходящую работу</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск заказов..."
          placeholderTextColor={theme.colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(renderCategoryChip)}
      </ScrollView>

      <FlatList
        data={filteredJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        style={styles.jobsList}
        contentContainerStyle={styles.jobsListContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoriesContainer: {
    marginBottom: theme.spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  categoryChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  categoryChipTextActive: {
    color: theme.colors.white,
  },
  jobsList: {
    flex: 1,
  },
  jobsListContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  jobCard: {
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
    position: 'relative',
  },
  urgentBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  urgentText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    marginRight: 80, // Место для urgentBadge
  },
  jobTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  jobBudget: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  jobCategory: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.sm,
  },
  jobDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  jobDetails: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    width: 120,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    flex: 1,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  applicantsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  applyButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
}); 