import React from 'react';
import { StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants';
import PlusIcon from '../../../assets/plus-square.svg';

interface FloatingCreateButtonProps {
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const FloatingCreateButton: React.FC<FloatingCreateButtonProps> = ({ onPress }) => {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.85, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSequence(
      withSpring(1.05, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
  };

  const handlePress = () => {
    // Легкое вращение при нажатии
    rotate.value = withSequence(
      withSpring(10, { damping: 10 }),
      withSpring(0, { damping: 10 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { 
          rotate: `${interpolate(
            rotate.value,
            [0, 10],
            [0, 10],
            Extrapolate.CLAMP
          )}deg` 
        },
      ],
    };
  });

  const containerStyle = {
    bottom: insets.bottom + (Platform.OS === 'ios' ? 90 : 95), // Над tab bar
    right: 20,
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, containerStyle, animatedStyle]}
    >
      <LinearGradient
        colors={['#679B00', '#7AB800']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <PlusIcon width={28} height={28} color="#FFFFFF" />
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    zIndex: 1000,
    // Тень для depth
    shadowColor: '#679B00',
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
  },
});

