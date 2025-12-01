import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { theme } from '../../constants/theme';


type ServiceCategory = {
  id: string;
  name: string;
  icon: string;
  description: string;
  isEnabled: boolean;
  avgPrice: string;
  demandLevel: 'high' | 'medium' | 'low';
};

const mockCategories: ServiceCategory[] = [
  {
    id: '1',
    name: 'Уборка дома',
    icon: '🧹',
    description: 'Генеральная уборка, мытье окон, уборка после ремонта',
    isEnabled: true,
    avgPrice: '100-200 тыс. сум',
    demandLevel: 'high',
  },
  {
    id: '2',
    name: 'Ремонт техники',
    icon: '🔧',
    description: 'Ремонт бытовой техники, диагностика, замена деталей',
    isEnabled: true,
    avgPrice: '150-500 тыс. сум',
    demandLevel: 'high',
  },
  {
    id: '3',
    name: 'Доставка',
    icon: '🚚',
    description: 'Доставка товаров, перевозка мебели, курьерские услуги',
    isEnabled: false,
    avgPrice: '50-150 тыс. сум',
    demandLevel: 'medium',
  },
  {
    id: '4',
    name: 'Репетиторство',
    icon: '📚',
    description: 'Частные уроки, подготовка к экзаменам, языки',
    isEnabled: false,
    avgPrice: '80-120 тыс. сум/час',
    demandLevel: 'medium',
  },
  {
    id: '5',
    name: 'Красота',
    icon: '💄',
    description: 'Маникюр, педикюр, макияж, прически',
    isEnabled: false,
    avgPrice: '50-100 тыс. сум',
    demandLevel: 'high',
  },
  {
    id: '6',
    name: 'Фотография',
    icon: '📸',
    description: 'Фотосессии, обработка фото, событийная съемка',
    isEnabled: false,
    avgPrice: '200-500 тыс. сум',
    demandLevel: 'low',
  },
  {
    id: '7',
    name: 'Строительство',
    icon: '🏗️',
    description: 'Мелкий ремонт, отделочные работы, сантехника',
    isEnabled: true,
    avgPrice: '300-800 тыс. сум',
    demandLevel: 'high',
  },
  {
    id: '8',
    name: 'IT услуги',
    icon: '💻',
    description: 'Настройка ПК, восстановление данных, установка ПО',
    isEnabled: false,
    avgPrice: '100-300 тыс. сум',
    demandLevel: 'medium',
  },
];

export const WorkerCategoriesScreen: React.FC = () => {
  const [categories, setCategories] = useState(mockCategories);

  const handleToggleCategory = (categoryId: string, newValue: boolean) => {
    setCategories(prev =>
      prev.map(category =>
        category.id === categoryId
          ? { ...category, isEnabled: newValue }
          : category
      )
    );

    const category = categories.find(c => c.id === categoryId);
    if (category) {
      Alert.alert(
        'Категория обновлена',
        newValue
          ? `Вы добавили "${category.name}" в ваши услуги`
          : `Вы убрали "${category.name}" из ваших услуг`,
        [{ text: 'OK' }]
      );
    }
  };

  const getDemandColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return theme.colors.primary;
      case 'medium': return '#FF9500';
      case 'low': return theme.colors.text.secondary;
    }
  };

  const getDemandText = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'Высокий спрос';
      case 'medium': return 'Средний спрос';
      case 'low': return 'Низкий спрос';
    }
  };

  const enabledCategories = categories.filter(c => c.isEnabled);

  const renderCategoryCard = (category: ServiceCategory) => (
    <View key={category.id} style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryInfo}>
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
          </View>
          <Text style={styles.categoryDescription}>{category.description}</Text>
        </View>

        <Switch
          value={category.isEnabled}
          onValueChange={(value) => handleToggleCategory(category.id, value)}
          trackColor={{
            false: theme.colors.border,
            true: `${theme.colors.primary}80`
          }}
          thumbColor={category.isEnabled ? theme.colors.primary : theme.colors.surface}
        />
      </View>

      <View style={styles.categoryDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>💰 Средняя цена:</Text>
          <Text style={styles.detailValue}>{category.avgPrice}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>📊 Спрос:</Text>
          <Text style={[
            styles.detailValue,
            { color: getDemandColor(category.demandLevel) }
          ]}>
            {getDemandText(category.demandLevel)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.title}>Мои категории</Text>
          <Text style={styles.subtitle}>
            Выберите услуги, которые вы готовы оказывать
          </Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{enabledCategories.length}</Text>
              <Text style={styles.statLabel}>Активных категорий</Text>
            </View>
          </View>

          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Все категории</Text>
            {categories.map(renderCategoryCard)}
          </View>

          <View style={styles.bottomInfo}>
            <Text style={styles.infoText}>
              💡 Включите категории, в которых у вас есть опыт и навыки.
              Это поможет заказчикам найти вас быстрее.
            </Text>
          </View>
        </ScrollView>
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
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  statsContainer: {
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  categoriesContainer: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  categoryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  categoryInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  categoryName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  categoryDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  categoryDetails: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  bottomInfo: {
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
}); 