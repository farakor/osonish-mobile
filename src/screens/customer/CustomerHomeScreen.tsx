import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { theme } from '../../constants';

interface ServiceCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
}

const serviceCategories: ServiceCategory[] = [
  { id: '1', title: 'Уборка дома', icon: '🧹', color: '#FF6B6B' },
  { id: '2', title: 'Ремонт техники', icon: '🔧', color: '#4ECDC4' },
  { id: '3', title: 'Доставка', icon: '🚚', color: '#45B7D1' },
  { id: '4', title: 'Репетиторство', icon: '📚', color: '#96CEB4' },
  { id: '5', title: 'Красота', icon: '💄', color: '#FFEAA7' },
  { id: '6', title: 'Фотография', icon: '📸', color: '#DDA0DD' },
  { id: '7', title: 'Строительство', icon: '🏗️', color: '#F39C12' },
  { id: '8', title: 'IT услуги', icon: '💻', color: '#6C5CE7' },
];

export const CustomerHomeScreen: React.FC = () => {
  const handleCategoryPress = (category: ServiceCategory) => {
    console.log('Selected category:', category.title);
    // TODO: Навигация к списку исполнителей в категории
  };

  const CategoryCard = ({ category }: { category: ServiceCategory }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: category.color }]}
      onPress={() => handleCategoryPress(category)}
      activeOpacity={0.8}
    >
      <Text style={styles.categoryIcon}>{category.icon}</Text>
      <Text style={styles.categoryTitle}>{category.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Добро пожаловать!</Text>
          <Text style={styles.subtitle}>Выберите нужную услугу</Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.7}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Поиск услуг...</Text>
        </TouchableOpacity>

        {/* Categories Grid */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Популярные категории</Text>
          <View style={styles.categoriesGrid}>
            {serviceCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Быстрые действия</Text>
          <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.8}>
            <Text style={styles.quickActionIcon}>⚡</Text>
            <View style={styles.quickActionText}>
              <Text style={styles.quickActionTitle}>Срочный заказ</Text>
              <Text style={styles.quickActionSubtitle}>Нужно выполнить сегодня</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = (width - theme.spacing.lg * 3) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  searchPlaceholder: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  categoriesSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: cardWidth,
    aspectRatio: 1.2,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  categoryTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.white,
    textAlign: 'center',
  },
  quickActions: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickActionIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  quickActionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
}); 