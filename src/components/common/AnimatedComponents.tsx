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

// Анимированная карточка категории
export const AnimatedCategoryCard: React.FC<{
  emoji: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ emoji, label, isSelected, onPress }) => {
  const scale = useSharedValue(1);
  const elevation = useSharedValue(2);
  const rotateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateY: `${rotateY.value}deg` },
    ],
    shadowOpacity: interpolate(
      elevation.value,
      [2, 8],
      [0.1, 0.25],
      Extrapolation.CLAMP
    ),
    elevation: elevation.value,
  }));

  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(1.05, { damping: 15, stiffness: 300 });
      elevation.value = withSpring(8);
      // Возвращаем sequence анимацию - вторая фича
      rotateY.value = withSequence(
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 200 })
      );
    } else {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      elevation.value = withSpring(2);
      rotateY.value = withTiming(0, { duration: 150 });
    }
  }, [isSelected]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    // Haptic feedback для категорий тоже 🎉
    runOnJS(triggerHapticFeedback)();
  };

  const handlePressOut = () => {
    scale.value = withSpring(isSelected ? 1.05 : 1, { damping: 15, stiffness: 300 });
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.categoryCard,
          isSelected && styles.categoryCardSelected,
          animatedStyle,
        ]}
      >
        <Text style={styles.categoryEmoji}>{emoji}</Text>
        <Text style={[
          styles.categoryLabel,
          isSelected && styles.categoryLabelSelected,
        ]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
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

// Улучшенный компонент анимированного поля с принудительным сбросом
export const AnimatedField: React.FC<{
  children: React.ReactNode;
  delay?: number;
  isActive: boolean;
  resetKey?: string | number; // Ключ для принудительного сброса анимации
}> = ({ children, delay = 0, isActive, resetKey = '' }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.9);
  const prevResetKey = useRef(resetKey);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Принудительный сброс при изменении resetKey
    if (prevResetKey.current !== resetKey) {
      opacity.value = 0;
      translateY.value = 30;
      scale.value = 0.9;
      prevResetKey.current = resetKey;
      hasAnimated.current = false;
    }

    if (isActive && !hasAnimated.current) {
      // Анимация появления с задержкой
      opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
      translateY.value = withDelay(delay, withSpring(0, {
        damping: 20,
        stiffness: 100
      }));
      scale.value = withDelay(delay, withSpring(1, {
        damping: 15,
        stiffness: 200
      }));
      hasAnimated.current = true;
    } else if (!isActive && hasAnimated.current) {
      // Быстрый сброс при переходе к неактивному состоянию
      opacity.value = 0;
      translateY.value = 30;
      scale.value = 0.9;
      hasAnimated.current = false;
    }
  }, [isActive, delay, resetKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

// Анимированный элемент категории
const AnimatedCategoryItem: React.FC<{
  category: { label: string; emoji: string };
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  isActive: boolean;
  delay: number;
  resetKey?: string | number;
}> = ({ category, selectedCategory, onSelectCategory, isActive, delay, resetKey = '' }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.9);
  const prevResetKey = useRef(resetKey);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Принудительный сброс при изменении resetKey
    if (prevResetKey.current !== resetKey) {
      opacity.value = 0;
      translateY.value = 30;
      scale.value = 0.9;
      prevResetKey.current = resetKey;
      hasAnimated.current = false;
    }

    if (isActive && !hasAnimated.current) {
      opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
      translateY.value = withDelay(delay, withSpring(0, {
        damping: 20,
        stiffness: 100
      }));
      scale.value = withDelay(delay, withSpring(1, {
        damping: 15,
        stiffness: 200
      }));
      hasAnimated.current = true;
    } else if (!isActive && hasAnimated.current) {
      opacity.value = 0;
      translateY.value = 30;
      scale.value = 0.9;
      hasAnimated.current = false;
    }
  }, [isActive, delay, resetKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <AnimatedCategoryCard
        emoji={category.emoji}
        label={category.label}
        isSelected={selectedCategory === category.label}
        onPress={() => onSelectCategory(category.label)}
      />
    </Animated.View>
  );
};

// Анимированная сетка категорий с индивидуальными задержками
export const AnimatedCategoryGrid: React.FC<{
  categories: Array<{ label: string; emoji: string }>;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  isActive: boolean;
  resetKey?: string | number;
}> = ({ categories, selectedCategory, onSelectCategory, isActive, resetKey = '' }) => {
  return (
    <View style={styles.categoriesGrid}>
      {categories.map((cat, index) => (
        <AnimatedCategoryItem
          key={`${cat.label}-${resetKey}`}
          category={cat}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          isActive={isActive}
          delay={index * 100 + 300}
          resetKey={resetKey}
        />
      ))}
    </View>
  );
};

// Анимированная кнопка для навигации с появлением
export const AnimatedNavigationButton: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  isVisible: boolean;
  delay?: number;
  resetKey?: string | number;
}> = ({ children, onPress, disabled = false, variant = 'primary', isVisible, delay = 0, resetKey = '' }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateX = useSharedValue(variant === 'primary' ? 50 : -50);
  const prevResetKey = useRef(resetKey);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Принудительный сброс при изменении resetKey
    if (prevResetKey.current !== resetKey) {
      opacity.value = 0;
      scale.value = 0.8;
      translateX.value = variant === 'primary' ? 50 : -50;
      prevResetKey.current = resetKey;
      hasAnimated.current = false;
    }

    if (isVisible && !hasAnimated.current) {
      opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
      scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 200 }));
      translateX.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 100 }));
      hasAnimated.current = true;
    } else if (!isVisible && hasAnimated.current) {
      opacity.value = 0;
      scale.value = 0.8;
      translateX.value = variant === 'primary' ? 50 : -50;
      hasAnimated.current = false;
    }
  }, [isVisible, delay, resetKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateX: translateX.value }
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <AnimatedButton
        variant={variant}
        onPress={onPress}
        disabled={disabled}
      >
        {children}
      </AnimatedButton>
    </Animated.View>
  );
};

// Анимированный контейнер для интерактивных элементов
export const AnimatedInteractiveContainer: React.FC<{
  children: React.ReactNode;
  isActive: boolean;
  delay?: number;
  resetKey?: string | number;
}> = ({ children, isActive, delay = 0, resetKey = '' }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.95);
  const prevResetKey = useRef(resetKey);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Принудительный сброс при изменении resetKey
    if (prevResetKey.current !== resetKey) {
      opacity.value = 0;
      translateY.value = 20;
      scale.value = 0.95;
      prevResetKey.current = resetKey;
      hasAnimated.current = false;
    }

    if (isActive && !hasAnimated.current) {
      opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
      translateY.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 100 }));
      scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 150 }));
      hasAnimated.current = true;
    } else if (!isActive && hasAnimated.current) {
      opacity.value = 0;
      translateY.value = 20;
      scale.value = 0.95;
      hasAnimated.current = false;
    }
  }, [isActive, delay, resetKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

// Анимированный элемент сводки с индивидуальной задержкой
export const AnimatedSummaryItem: React.FC<{
  label: string;
  value: string;
  index: number;
  isActive: boolean;
  resetKey?: string | number;
}> = ({ label, value, index, isActive, resetKey = '' }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.9);
  const prevResetKey = useRef(resetKey);
  const hasAnimated = useRef(false);
  const delay = index * 100 + 400;

  useEffect(() => {
    // Принудительный сброс при изменении resetKey
    if (prevResetKey.current !== resetKey) {
      opacity.value = 0;
      translateY.value = 30;
      scale.value = 0.9;
      prevResetKey.current = resetKey;
      hasAnimated.current = false;
    }

    if (isActive && !hasAnimated.current) {
      opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
      translateY.value = withDelay(delay, withSpring(0, {
        damping: 20,
        stiffness: 100
      }));
      scale.value = withDelay(delay, withSpring(1, {
        damping: 15,
        stiffness: 200
      }));
      hasAnimated.current = true;
    } else if (!isActive && hasAnimated.current) {
      opacity.value = 0;
      translateY.value = 30;
      scale.value = 0.9;
      hasAnimated.current = false;
    }
  }, [isActive, delay, resetKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  return (
    <Animated.View style={[styles.summaryItem, animatedStyle]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </Animated.View>
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
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  categoryLabel: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },
  categoryLabelSelected: {
    color: theme.colors.white,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
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
});