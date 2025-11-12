import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
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

interface AnimatedTabScreenProps {
  children: React.ReactNode;
  enableHaptics?: boolean;
}

// HOC для создания анимированных экранов табов
export function withAnimatedTabScreen<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  enableHaptics: boolean = true
) {
  return function AnimatedTabScreenWrapper(props: P) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const scale = useSharedValue(0.98);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));

    useFocusEffect(
      React.useCallback(() => {
        // Анимация без колебаний с плавным easing
        opacity.value = withTiming(1, {
          duration: 500,
          easing: Easing.out(Easing.cubic)
        });
        translateY.value = withTiming(0, {
          duration: 400,
          easing: Easing.out(Easing.cubic)
        });
        scale.value = withTiming(1, {
          duration: 400,
          easing: Easing.out(Easing.cubic)
        });

        // Haptic feedback при переключении экрана
        if (enableHaptics) {
          runOnJS(triggerHapticFeedback)();
        }

        return () => {
          // Более плавная анимация исчезновения при потере фокуса
          opacity.value = withTiming(0, { duration: 250 });
          translateY.value = 20;
          scale.value = 0.98;
        };
      }, [])
    );

    return (
      <Animated.View style={[styles.container, animatedStyle]}>
        <WrappedComponent {...props} />
      </Animated.View>
    );
  };
}

// Простой компонент для анимированного экрана таба
export const AnimatedTabScreen: React.FC<AnimatedTabScreenProps> = ({
  children,
  enableHaptics = true,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.98);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  useFocusEffect(
    React.useCallback(() => {
      // Анимация без колебаний с плавным easing
      opacity.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic)
      });
      translateY.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.cubic)
      });
      scale.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic)
      });

      // Haptic feedback при переключении экрана
      if (enableHaptics) {
        runOnJS(triggerHapticFeedback)();
      }

      return () => {
        // Более плавная анимация исчезновения при потере фокуса
        opacity.value = withTiming(0, { duration: 250 });
        translateY.value = 20;
        scale.value = 0.98;
      };
    }, [enableHaptics])
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// Компонент для плавного перехода между экранами с направлением
export const AnimatedTabScreenWithDirection: React.FC<{
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  enableHaptics?: boolean;
}> = ({ children, direction = 'right', enableHaptics = true }) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(direction === 'left' ? -30 : direction === 'right' ? 30 : 0);
  const translateY = useSharedValue(direction === 'up' ? -30 : direction === 'down' ? 30 : 0);
  const scale = useSharedValue(0.95);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  useFocusEffect(
    React.useCallback(() => {
      // Анимация без колебаний - используем timing
      opacity.value = withTiming(1, { duration: 600 });
      translateX.value = withTiming(0, { duration: 500 });
      translateY.value = withTiming(0, { duration: 500 });
      scale.value = withTiming(1, { duration: 500 });

      // Haptic feedback
      if (enableHaptics) {
        runOnJS(triggerHapticFeedback)();
      }

      return () => {
        // Более плавная анимация исчезновения
        opacity.value = withTiming(0, { duration: 300 });
        translateX.value = direction === 'left' ? -30 : direction === 'right' ? 30 : 0;
        translateY.value = direction === 'up' ? -30 : direction === 'down' ? 30 : 0;
        scale.value = 0.95;
      };
    }, [direction, enableHaptics])
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Убрали backgroundColor чтобы фон наследовался от дочернего компонента
    // Это позволяет экранам устанавливать свой собственный фон
  },
});
