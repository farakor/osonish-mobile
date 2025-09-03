import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface AnimatedIconProps {
  source: any;
  width?: number;
  height?: number;
  loop?: boolean;
  autoPlay?: boolean;
  speed?: number;
  style?: any;
  isSelected?: boolean;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  source,
  width = 60,
  height = 60,
  loop = true,
  autoPlay = true,
  speed = 1,
  style,
  isSelected = false,
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (isSelected) {
      animationRef.current?.play();
    } else {
      animationRef.current?.reset();
    }
  }, [isSelected]);

  return (
    <View style={[styles.container, { width, height }, style]}>
      <LottieView
        ref={animationRef}
        source={source}
        style={styles.animation}
        loop={loop}
        autoPlay={false}
        speed={speed}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
