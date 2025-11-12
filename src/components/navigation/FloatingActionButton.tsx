import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants';

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  focused?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  icon, 
  onPress,
  focused = false 
}) => {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      // Пульсация при активации
      scale.value = withSequence(
        withSpring(1.1, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );
      rotate.value = withSequence(
        withTiming(360, { duration: 400 }),
        withTiming(0, { duration: 0 })
      );
    }
  }, [focused]);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 10 });
    glowOpacity.value = withTiming(0.6, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
    glowOpacity.value = withTiming(0, { duration: 300 });
  };

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { 
          rotate: `${interpolate(
            rotate.value,
            [0, 360],
            [0, 360],
            Extrapolate.CLAMP
          )}deg` 
        },
      ],
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
      transform: [{ scale: interpolate(glowOpacity.value, [0, 0.6], [0.8, 1.2]) }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Animated glow effect */}
      <Animated.View style={[styles.glowContainer, animatedGlowStyle]}>
        <LinearGradient
          colors={[`${theme.colors.primary}40`, `${theme.colors.primary}00`]}
          style={styles.glow}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Main button */}
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.button, animatedButtonStyle]}
      >
        <LinearGradient
          colors={[theme.colors.primary, '#5B7FFF']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconContainer}>
            {icon}
          </View>
          
          {/* Inner highlight для глянцевого эффекта */}
          <View style={styles.innerHighlight} />
        </LinearGradient>

        {/* Белая рамка для дополнительного объема */}
        <View style={styles.borderRing} />
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -20 : -25,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  glowContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    zIndex: 0,
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    zIndex: 1,
    // Тень для depth
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  innerHighlight: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    height: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    zIndex: 1,
  },
  borderRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    zIndex: 0,
  },
});

