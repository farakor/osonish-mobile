import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Vibration,
} from 'react-native';
// Статический импорт для haptic feedback
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolation,
  withDelay,
} from 'react-native-reanimated';
import { theme } from '../../constants';
import { AnimatedIcon } from './AnimatedIcon';

// Импортируем анимированные иконки категорий
const BricksAnimation = require('../../../assets/bricks.json');
const CleaningToolsAnimation = require('../../../assets/cleaning-tools.json');
const OliveTreeAnimation = require('../../../assets/olive-tree.json');
const FoodDeliveryAnimation = require('../../../assets/food-delivery.json');
const DeliveryTruckAnimation = require('../../../assets/delivery-truck.json');
const DiscussionAnimation = require('../../../assets/discussion.json');

// Функция для получения анимированной иконки по ключу категории
const getCategoryAnimation = (categoryKey: string) => {
  switch (categoryKey) {
    case 'construction':
      return BricksAnimation;
    case 'cleaning':
      return CleaningToolsAnimation;
    case 'garden':
      return OliveTreeAnimation;
    case 'catering':
      return FoodDeliveryAnimation;
    case 'moving':
      return DeliveryTruckAnimation;
    case 'other':
      return DiscussionAnimation;
    default:
      return DiscussionAnimation;
  }
};

// Функция для haptic feedback (вне анимированного контекста)
const triggerHapticFeedback = () => {
  if (Platform.OS === 'ios') {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Fallback to vibration if haptics fail
      Vibration.vibrate(10);
    }
  }
};

// Анимированная кнопка с spring эффектом
export const AnimatedButton: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
  variant?: 'primary' | 'secondary';
}> = ({ children, onPress, disabled = false, style, variant = 'primary' }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (disabled) return;

    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    });

    // Haptic feedback с правильной реализацией 🎉
    runOnJS(triggerHapticFeedback)();
  };

  const handlePressOut = () => {
    if (disabled) return;

    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  useEffect(() => {
    opacity.value = withTiming(disabled ? 0.5 : 1, { duration: 200 });
  }, [disabled]);

  const buttonStyle = [
    variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
    style,
  ];

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[buttonStyle, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// Анимированный прогресс бар
export const AnimatedProgressBar: React.FC<{
  progress: number;
  total: number;
}> = ({ progress, total }) => {
  const progressValue = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    const targetProgress = (progress - 1) / (total - 1);
    progressValue.value = withSpring(targetProgress, {
      damping: 20,
      stiffness: 100,
    });

    // Возвращаем glow effect с withSequence - четвертая фича
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 600 })
    );
  }, [progress, total]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
        <Animated.View style={[styles.progressGlow, progressStyle, glowStyle]} />
      </View>
    </View>
  );
};

// Анимированный step контейнер с слайд эффектом
export const AnimatedStepContainer: React.FC<{
  children: React.ReactNode;
  isActive: boolean;
  direction?: 'left' | 'right';
}> = ({ children, isActive, direction = 'right' }) => {
  const translateX = useSharedValue(direction === 'right' ? 50 : -50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (isActive) {
      // Параллельные анимации для входа
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 100,
      });
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 100,
      });
    } else {
      // Быстрый выход
      translateX.value = direction === 'right' ? 50 : -50;
      opacity.value = 0;
      scale.value = 0.95;
    }
  }, [isActive, direction]);

  if (!isActive) return null;

  return (
    <Animated.View style={[styles.stepContainer, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// Статичная карточка категории без анимации
export const AnimatedCategoryCard: React.FC<{
  emoji: string;
  label: string;
  categoryKey: string;
  isSelected: boolean;
  onPress: () => void;
  isSmallScreen?: boolean;
}> = ({ emoji, label, categoryKey, isSelected, onPress, isSmallScreen = false }) => {
  // Убираем анимации, оставляем только haptic feedback при нажатии
  const handlePress = () => {
    triggerHapticFeedback();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View
        style={[
          styles.categoryCard,
          isSelected && styles.categoryCardSelected,
          isSmallScreen && styles.categoryCardSmall,
        ]}
      >
        <View style={[styles.categoryIconContainer, isSmallScreen && styles.categoryIconContainerSmall]}>
          <AnimatedIcon
            source={getCategoryAnimation(categoryKey)}
            width={isSmallScreen ? 30 : 36} // Уменьшили размер иконки
            height={isSmallScreen ? 30 : 36} // Уменьшили размер иконки
            loop={true}
            autoPlay={false}
            speed={0.8}
            isSelected={isSelected}
          />
        </View>
        <Text style={[
          styles.categoryLabel,
          isSelected && styles.categoryLabelSelected,
          isSmallScreen && styles.categoryLabelSmall,
        ]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Анимированный индикатор загрузки
export const AnimatedLoadingIndicator: React.FC<{
  visible: boolean;
  text?: string;
}> = ({ visible, text = 'Загрузка...' }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const rotation = useSharedValue(0);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` },
    ],
  }));

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 20, stiffness: 100 });

      // Возвращаем бесконечную ротацию с callback - третья фича
      const rotate = () => {
        rotation.value = withTiming(360, { duration: 1000 }, (finished) => {
          if (finished && visible) {
            rotation.value = 0;
            rotate(); // Рекурсивный вызов для бесконечной ротации
          }
        });
      };
      rotate();
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
      rotation.value = 0; // Сброс ротации
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={[styles.loadingBackdrop, backdropStyle]} />
      <Animated.View style={[styles.loadingContent, contentStyle]}>
        <View style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>{text}</Text>
      </Animated.View>
    </View>
  );
};

// Статичный компонент поля без анимации
export const AnimatedField: React.FC<{
  children: React.ReactNode;
  delay?: number;
  isActive: boolean;
  resetKey?: string | number; // Ключ для принудительного сброса анимации
}> = ({ children, delay = 0, isActive, resetKey = '' }) => {
  // Убираем все анимации, просто отображаем статичный контент
  if (!isActive) return null;

  return (
    <View>
      {children}
    </View>
  );
};

// Статичный элемент категории без анимации
const AnimatedCategoryItem: React.FC<{
  category: { key: string; label: string; emoji: string };
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  isActive: boolean;
  delay: number;
  resetKey?: string | number;
  isSmallScreen?: boolean;
}> = ({ category, selectedCategory, onSelectCategory, isActive, delay, resetKey = '', isSmallScreen = false }) => {
  // Убираем все анимации, просто отображаем статичный контент
  if (!isActive) return null;

  return (
    <View>
      <AnimatedCategoryCard
        emoji={category.emoji}
        label={category.label}
        categoryKey={category.key}
        isSelected={selectedCategory === category.key}
        onPress={() => onSelectCategory(category.key)}
        isSmallScreen={isSmallScreen}
      />
    </View>
  );
};

// Статичная сетка категорий без анимации
export const AnimatedCategoryGrid: React.FC<{
  categories: Array<{ key: string; label: string; emoji: string }>;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  isActive: boolean;
  resetKey?: string | number;
  isSmallScreen?: boolean;
}> = ({ categories, selectedCategory, onSelectCategory, isActive, resetKey = '', isSmallScreen = false }) => {
  // Разбиваем категории на строки по 3 элемента
  const rows = [];
  for (let i = 0; i < categories.length; i += 3) {
    rows.push(categories.slice(i, i + 3));
  }

  return (
    <View style={[styles.categoriesGrid, isSmallScreen && styles.categoriesGridSmall]}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.categoryRow, isSmallScreen && styles.categoryRowSmall]}>
          {row.map((cat, index) => (
            <AnimatedCategoryItem
              key={`${cat.key}-${resetKey}`}
              category={cat}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              isActive={isActive}
              delay={0} // Убираем задержки
              resetKey={resetKey}
              isSmallScreen={isSmallScreen}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

// Статичная кнопка навигации без анимации появления
export const AnimatedNavigationButton: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  isVisible: boolean;
  delay?: number;
  resetKey?: string | number;
}> = ({ children, onPress, disabled = false, variant = 'primary', isVisible, delay = 0, resetKey = '' }) => {
  // Убираем анимации появления, оставляем только видимость
  if (!isVisible) return null;

  return (
    <View>
      <AnimatedButton
        variant={variant}
        onPress={onPress}
        disabled={disabled}
      >
        {children}
      </AnimatedButton>
    </View>
  );
};

// Статичный контейнер для интерактивных элементов без анимации
export const AnimatedInteractiveContainer: React.FC<{
  children: React.ReactNode;
  isActive: boolean;
  delay?: number;
  resetKey?: string | number;
}> = ({ children, isActive, delay = 0, resetKey = '' }) => {
  // Убираем все анимации, просто отображаем статичный контент
  if (!isActive) return null;

  return (
    <View>
      {children}
    </View>
  );
};

// Статичный элемент сводки без анимации
export const AnimatedSummaryItem: React.FC<{
  label: string;
  value: string;
  index: number;
  isActive: boolean;
  resetKey?: string | number;
  isFullWidth?: boolean;
}> = ({ label, value, index, isActive, resetKey = '', isFullWidth = false }) => {
  // Получаем иконку и цвет в зависимости от типа поля
  const getIconAndColor = (label: string) => {
    switch (label.toLowerCase()) {
      case 'название':
        return { icon: '📝', color: theme.colors.text.primary, iconBg: '#E8F5E8' };
      case 'категория':
        return { icon: '🏷️', color: theme.colors.text.primary, iconBg: '#F0E8FF' };
      case 'описание':
        return { icon: '📄', color: theme.colors.text.primary, iconBg: '#E8F3FF' };
      case 'местоположение':
        return { icon: '📍', color: theme.colors.text.primary, iconBg: '#FFE8E8' };
      case 'бюджет':
        return { icon: '💰', color: theme.colors.primary, iconBg: '#E8F5E8' };
      case 'работников':
        return { icon: '👥', color: theme.colors.text.primary, iconBg: '#FFF3E8' };
      case 'дата':
        return { icon: '📅', color: theme.colors.text.primary, iconBg: '#F8E8FF' };
      case 'медиа файлы':
        return { icon: '🖼️', color: theme.colors.text.primary, iconBg: '#E8FFE8' };
      default:
        return { icon: '📋', color: theme.colors.text.primary, iconBg: '#F5F5F5' };
    }
  };

  const { icon, color, iconBg } = getIconAndColor(label);

  // Убираем все анимации, просто отображаем статичный контент
  if (!isActive) return null;

  return (
    <View style={[
      isFullWidth ? styles.summaryItemCardFullWidth : styles.summaryItemCard
    ]}>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text
          style={[
            styles.summaryValue,
            { color: color }
          ]}
          numberOfLines={isFullWidth && label.toLowerCase() === 'описание' ? 2 : (isFullWidth ? 3 : 1)}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
      </View>
    </View>
  );
};

// Статичная сетка summary элементов без анимации
export const AnimatedSummaryGrid: React.FC<{
  items: Array<{ label: string; value: string }>;
  isActive: boolean;
  resetKey?: string | number;
}> = ({ items, isActive, resetKey = '' }) => {
  // Находим элементы для полноширинного отображения
  const descriptionItem = items.find(item => item.label.toLowerCase() === 'описание');
  const dateItem = items.find(item => item.label.toLowerCase() === 'дата');
  const otherItems = items.filter(item =>
    item.label.toLowerCase() !== 'описание' &&
    item.label.toLowerCase() !== 'дата'
  );

  // Разбиваем остальные элементы на пары для двухколоночного layout
  const rows = [];
  for (let i = 0; i < otherItems.length; i += 2) {
    rows.push(otherItems.slice(i, i + 2));
  }

  return (
    <View style={styles.summaryGrid}>
      {/* Описание в отдельной полноширинной карточке */}
      {descriptionItem && (
        <View style={[
          styles.summaryFullWidthRow,
          otherItems.length === 0 && { marginBottom: 0 }
        ]}>
          <AnimatedSummaryItem
            key={`${descriptionItem.label}-${resetKey}`}
            label={descriptionItem.label}
            value={descriptionItem.value}
            index={0}
            isActive={isActive}
            resetKey={resetKey}
            isFullWidth={true}
          />
        </View>
      )}

      {/* Остальные элементы в двухколоночном формате */}
      {rows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={[
            styles.summaryRowGrid,
            rowIndex === rows.length - 1 && { marginBottom: 0 }
          ]}
        >
          {row.map((item, index) => (
            <AnimatedSummaryItem
              key={`${item.label}-${resetKey}`}
              label={item.label}
              value={item.value}
              index={0} // Убираем индексы для задержек
              isActive={isActive}
              resetKey={resetKey}
              isFullWidth={false}
            />
          ))}
          {row.length === 1 && <View style={styles.summaryPlaceholder} />}
        </View>
      ))}

      {/* Дата в отдельной полноширинной карточке */}
      {dateItem && (
        <View style={styles.summaryFullWidthRow}>
          <AnimatedSummaryItem
            key={`${dateItem.label}-${resetKey}`}
            label={dateItem.label}
            value={dateItem.value}
            index={0} // Убираем индексы для задержек
            isActive={isActive}
            resetKey={resetKey}
            isFullWidth={true}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  progressTrack: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: 105, // Уменьшили размер карточки
    height: 105, // Уменьшили размер карточки
    marginHorizontal: 6, // Уменьшили отступ между карточками для лучшего размещения
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryIconContainer: {
    width: 42, // Уменьшили размер контейнера иконки
    height: 42, // Уменьшили размер контейнера иконки
    backgroundColor: 'transparent',
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryIconContainerSmall: {
    width: 36, // Уменьшили размер контейнера иконки для маленьких экранов
    height: 36, // Уменьшили размер контейнера иконки для маленьких экранов
    borderRadius: 18,
    marginBottom: 4,
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 6,
    textAlign: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 14,
  },
  categoryLabelSelected: {
    color: '#1A1A1A',
  },
  categoriesGrid: {
    paddingVertical: theme.spacing.sm, // Уменьшили с lg до sm для поднятия сетки выше
    paddingHorizontal: theme.spacing.lg, // Увеличили отступ от края экрана для всех устройств
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm, // Уменьшили отступ между строками
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: theme.colors.border,
    borderTopColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  // Стили для компактных summary карточек
  summaryItemCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 0,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    flex: 1,
    minHeight: 56,
  },
  // Стили для полноширинных карточек (только описание)
  summaryItemCardFullWidth: {
    backgroundColor: theme.colors.background,
    borderRadius: 0,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    width: '100%',
    minHeight: 72,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  summaryIconText: {
    fontSize: 14,
  },
  summaryContent: {
    flex: 1,
    paddingTop: 0,
  },
  summaryLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginBottom: 3,
    fontWeight: theme.fonts.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
    lineHeight: 18,
    color: theme.colors.text.primary,
  },
  summaryValueLarge: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    lineHeight: 20,
    color: theme.colors.text.primary,
  },
  // Стили для компактной сетки
  summaryGrid: {
    paddingTop: theme.spacing.sm,
  },
  summaryRowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  summaryFullWidthRow: {
    marginBottom: theme.spacing.sm,
  },
  summaryPlaceholder: {
    flex: 1,
  },
  // Стили для маленьких экранов
  categoriesGridSmall: {
    paddingVertical: theme.spacing.xs, // Уменьшили с md до xs для маленьких экранов
    paddingHorizontal: theme.spacing.lg, // Увеличили отступ от края экрана для маленьких устройств
  },
  categoryRowSmall: {
    marginBottom: theme.spacing.xs, // Уменьшили отступ между строками для маленьких экранов
  },
  categoryCardSmall: {
    width: 90, // Уменьшили размер карточки для маленьких экранов
    height: 75, // Уменьшили размер карточки для маленьких экранов
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    marginHorizontal: 4, // Уменьшили отступ между карточками для экономии места
  },
  categoryEmojiSmall: {
    fontSize: 28,
    marginBottom: 5,
  },
  categoryLabelSmall: {
    fontSize: 11,
    lineHeight: 13,
  },
});