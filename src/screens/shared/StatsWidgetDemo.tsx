import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { theme } from '../../constants';
import { StatsWidget, StatItem, HeaderWithBack } from '../../components/common';

export const StatsWidgetDemo: React.FC = () => {
  const customerStats: StatItem[] = [
    {
      id: 'orders',
      icon: '📦',
      value: '12',
      label: 'Заказов',
      color: theme.colors.primary,
      onPress: () => console.log('Заказы нажаты'),
    },
    {
      id: 'rating',
      icon: '⭐',
      value: '4.8',
      label: 'Рейтинг',
      color: '#FF9500',
    },
    {
      id: 'months',
      icon: '📅',
      value: '6',
      label: 'мес на Oson Ish',
      color: '#34C759',
    },
  ];

  const workerStats: StatItem[] = [
    {
      id: 'completed',
      icon: '✅',
      value: '23',
      label: 'Выполнено заказов',
      color: '#34C759',
    },
    {
      id: 'rating',
      icon: '⭐',
      value: '4.9',
      label: 'Рейтинг',
      color: '#FF9500',
    },
    {
      id: 'experience',
      icon: '🕐',
      value: '8 мес',
      label: 'На платформе',
      color: theme.colors.primary,
    },
  ];

  const platformStats: StatItem[] = [
    {
      id: 'users',
      icon: '👥',
      value: '50K+',
      label: 'Пользователей',
      color: theme.colors.primary,
    },
    {
      id: 'orders',
      icon: '📦',
      value: '100K+',
      label: 'Заказов',
      color: '#34C759',
    },
    {
      id: 'rating',
      icon: '⭐',
      value: '4.9',
      label: 'Средний рейтинг',
      color: '#FF9500',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBack />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Градиентный стиль</Text>
          <Text style={styles.sectionDescription}>
            Современный дизайн с анимациями для профиля заказчика
          </Text>
          <StatsWidget
            stats={customerStats}
            variant="gradient"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Карточки</Text>
          <Text style={styles.sectionDescription}>
            Отдельные карточки с тенями для профиля работника
          </Text>
          <StatsWidget
            stats={workerStats}
            variant="cards"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Стандартный стиль</Text>
          <Text style={styles.sectionDescription}>
            Компактный дизайн для регистрации и мотивации
          </Text>
          <StatsWidget
            stats={platformStats}
            variant="default"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Без анимации</Text>
          <Text style={styles.sectionDescription}>
            Тот же градиентный стиль, но без анимации появления
          </Text>
          <StatsWidget
            stats={customerStats}
            variant="gradient"
            animated={false}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>Возможности виджета:</Text>
          <Text style={styles.infoText}>
            • 3 различных стиля дизайна{'\n'}
            • Анимация появления{'\n'}
            • Интерактивность (onPress){'\n'}
            • Настраиваемые цвета{'\n'}
            • Иконки для каждой метрики{'\n'}
            • Адаптивная верстка{'\n'}
            • TypeScript поддержка
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 20,
  },
  info: {
    backgroundColor: `${theme.colors.primary}10`,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
  },
  infoTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
}); 