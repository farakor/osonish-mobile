// Пример использования улучшенной системы безопасных отступов

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaContainer, SafeHeader } from '../components/common';
import { useAdaptiveStyles } from '../hooks/useAdaptiveStyles';
import { theme } from '../constants/theme';

// Пример 1: Использование SafeAreaContainer с увеличенными отступами
export const ExampleScreen1: React.FC = () => {
  return (
    <SafeAreaContainer
      backgroundColor={theme.colors.primary}
      statusBarStyle="light-content"
      hasHeader={true}
    >
      <Text style={styles.title}>Безопасный заголовок</Text>
      <Text style={styles.subtitle}>
        Этот заголовок автоматически размещается на безопасном расстоянии от статус-бара
      </Text>
    </SafeAreaContainer>
  );
};

// Пример 2: Использование SafeHeader компонента
export const ExampleScreen2: React.FC = () => {
  return (
    <View style={styles.container}>
      <SafeHeader
        backgroundColor={theme.colors.primary}
        extraPadding={12} // Дополнительный отступ для еще большего комфорта
      >
        <Text style={styles.title}>Заголовок с SafeHeader</Text>
        <Text style={styles.subtitle}>
          Автоматические безопасные отступы + дополнительный комфорт
        </Text>
      </SafeHeader>

      <View style={styles.content}>
        <Text>Основной контент экрана</Text>
      </View>
    </View>
  );
};

// Пример 3: Использование адаптивных стилей с контекстными отступами
export const ExampleScreen3: React.FC = () => {
  const adaptiveStyles = useAdaptiveStyles();

  // Создаем header с комфортными отступами
  const comfortableHeaderStyle = adaptiveStyles.createSafeHeader(
    theme.colors.primary,
    'comfortable' // Контекст для максимального комфорта
  );

  // Получаем контекстные отступы для критически важного контента
  const criticalPadding = adaptiveStyles.getContextualPadding('critical');

  return (
    <View style={styles.container}>
      {/* Header с комфортными отступами */}
      <View style={comfortableHeaderStyle}>
        <Text style={styles.title}>Критически важный экран</Text>
        <Text style={styles.subtitle}>
          Максимальные безопасные отступы для важного контента
        </Text>
      </View>

      {/* Контент с критическими отступами */}
      <View style={[styles.content, { paddingTop: criticalPadding.contentTop }]}>
        <Text>Этот контент имеет максимальные безопасные отступы</Text>
      </View>
    </View>
  );
};

// Пример 4: Адаптивные отступы в зависимости от размера экрана
export const ExampleScreen4: React.FC = () => {
  const adaptiveStyles = useAdaptiveStyles();

  // Выбираем контекст в зависимости от размера экрана
  const context = adaptiveStyles.isSmallScreen ? 'compact' : 'comfortable';
  const contextualPadding = adaptiveStyles.getContextualPadding(context);

  return (
    <View style={styles.container}>
      <View style={[
        styles.adaptiveHeader,
        { paddingTop: contextualPadding.headerTop }
      ]}>
        <Text style={styles.title}>Адаптивный заголовок</Text>
        <Text style={styles.subtitle}>
          {adaptiveStyles.isSmallScreen
            ? 'Компактные отступы для маленького экрана'
            : 'Комфортные отступы для большого экрана'
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  adaptiveHeader: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
});

/*
РЕЗЮМЕ НОВЫХ ВОЗМОЖНОСТЕЙ:

1. SafeAreaContainer - автоматические безопасные отступы
2. SafeHeader - специальный компонент для header с увеличенными отступами
3. Контекстные отступы: 'compact', 'default', 'comfortable', 'critical'
4. Адаптивные отступы в зависимости от размера экрана
5. Утилиты для создания безопасных стилей

ПРЕИМУЩЕСТВА:
✅ Универсальная совместимость со всеми устройствами
✅ Автоматическая адаптация под размер экрана
✅ Увеличенные отступы для максимального комфорта
✅ Гибкая система контекстов для разных типов экранов
✅ Простота использования и интеграции
*/
