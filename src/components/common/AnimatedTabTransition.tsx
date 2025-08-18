import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants';

// Функция для haptic feedback
const triggerHapticFeedback = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Игнорируем ошибки haptic feedback
  }
};

// Типы анимаций переходов
export type TransitionType = 'slide' | 'fade' | 'scale' | 'slideUp';

interface AnimatedTabTransitionProps {
  children: React.ReactNode;
  isActive: boolean;
  transitionType?: TransitionType;
  duration?: number;
  delay?: number;
  enableHaptics?: boolean;
}

export const AnimatedTabTransition: React.FC<AnimatedTabTransitionProps> = ({
  children,
  isActive,
  transitionType = 'slide',
  duration = 300,
  delay = 0,
  enableHaptics = true,
}) => {
  const opacity = useSharedValue(isActive ? 1 : 0);
  const translateX = useSharedValue(isActive ? 0 : 50);
  const translateY = useSharedValue(isActive ? 0 : 30);
  const scale = useSharedValue(isActive ? 1 : 0.95);

  const animatedStyle = useAnimatedStyle(() => {
    switch (transitionType) {
      case 'fade':
        return {
          opacity: opacity.value,
        };

      case 'scale':
        return {
          opacity: opacity.value,
          transform: [{ scale: scale.value }],
        };

      case 'slideUp':
        return {
          opacity: opacity.value,
          transform: [{ translateY: translateY.value }],
        };

      case 'slide':
      default:
        return {
          opacity: opacity.value,
          transform: [{ translateX: translateX.value }],
        };
    }
  });

  useEffect(() => {
    if (isActive) {
      // Анимация появления
      setTimeout(() => {
        opacity.value = withTiming(1, { duration });

        switch (transitionType) {
          case 'slide':
            translateX.value = withSpring(0, {
              damping: 20,
              stiffness: 100,
            });
            break;

          case 'slideUp':
            translateY.value = withSpring(0, {
              damping: 20,
              stiffness: 100,
            });
            break;

          case 'scale':
            scale.value = withSpring(1, {
              damping: 15,
              stiffness: 200,
            });
            break;
        }

        // Haptic feedback при активации
        if (enableHaptics) {
          runOnJS(triggerHapticFeedback)();
        }
      }, delay);
    } else {
      // Быстрая анимация исчезновения
      opacity.value = withTiming(0, { duration: duration / 2 });

      switch (transitionType) {
        case 'slide':
          translateX.value = 50;
          break;

        case 'slideUp':
          translateY.value = 30;
          break;

        case 'scale':
          scale.value = 0.95;
          break;
      }
    }
  }, [isActive, transitionType, duration, delay, enableHaptics]);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// Компонент для анимированного контейнера экрана
export const AnimatedScreenContainer: React.FC<{
  children: React.ReactNode;
  isActive: boolean;
  screenName?: string;
}> = ({ children, isActive, screenName }) => {
  const opacity = useSharedValue(isActive ? 1 : 0);
  const translateY = useSharedValue(isActive ? 0 : 20);
  const scale = useSharedValue(isActive ? 1 : 0.98);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  useEffect(() => {
    if (isActive) {
      // Плавное появление экрана
      opacity.value = withTiming(1, { duration: 400 });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 100,
      });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      // Быстрое исчезновение
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = 20;
      scale.value = 0.98;
    }
  }, [isActive]);

  return (
    <Animated.View style={[styles.screenContainer, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// Анимированная иконка таба с эффектами
export const AnimatedTabIcon: React.FC<{
  children: React.ReactNode;
  focused: boolean;
  color: string;
}> = ({ children, focused, color }) => {
  const scale = useSharedValue(focused ? 1 : 0.9);
  const opacity = useSharedValue(focused ? 1 : 0.7);
  const bounceScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * bounceScale.value },
    ],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (focused) {
      // Анимация без колебаний - используем timing
      scale.value = withTiming(1.1, { duration: 300 });
      opacity.value = withTiming(1, { duration: 350 });

      // Простой bounce без spring колебаний
      bounceScale.value = withTiming(1.05, { duration: 150 }, () => {
        bounceScale.value = withTiming(1, { duration: 200 });
      });
    } else {
      scale.value = withTiming(0.9, { duration: 250 });
      opacity.value = withTiming(0.7, { duration: 300 });
      bounceScale.value = 1;
    }
  }, [focused]);

  return (
    <Animated.View style={[styles.iconContainer, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// Анимированный лейбл таба
export const AnimatedTabLabel: React.FC<{
  children: React.ReactNode;
  focused: boolean;
  color: string;
}> = ({ children, focused, color }) => {
  const scale = useSharedValue(focused ? 1 : 0.95);
  const opacity = useSharedValue(focused ? 1 : 0.8);
  const translateY = useSharedValue(focused ? 0 : 2);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (focused) {
      scale.value = withTiming(1.05, { duration: 300 });
      opacity.value = withTiming(1, { duration: 350 });
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      scale.value = withTiming(0.95, { duration: 250 });
      opacity.value = withTiming(0.8, { duration: 300 });
      translateY.value = withTiming(2, { duration: 250 });
    }
  }, [focused]);

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

// Анимированный индикатор активного таба
export const AnimatedTabIndicator: React.FC<{
  focused: boolean;
  color: string;
}> = ({ focused, color }) => {
  const scale = useSharedValue(focused ? 1 : 0);
  const opacity = useSharedValue(focused ? 0.2 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    backgroundColor: color,
  }));

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
      opacity.value = withTiming(0.2, { duration: 200 });
    } else {
      scale.value = withSpring(0, {
        damping: 15,
        stiffness: 300,
      });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [focused]);

  return <Animated.View style={[styles.tabIndicator, animatedStyle]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIndicator: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 20,
    zIndex: -1,
  },
});
