import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

interface SimpleSplashAnimationProps {
  onAnimationFinish?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function SimpleSplashAnimation({
  onAnimationFinish,
  autoPlay = true,
  loop = false,
  style
}: SimpleSplashAnimationProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (autoPlay && animationRef.current) {
      animationRef.current.play();
    }
  }, [autoPlay]);

  const handleAnimationFinish = () => {
    if (onAnimationFinish) {
      onAnimationFinish();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <LottieView
        ref={animationRef}
        source={require('../../../assets/splash-anim.json')}
        autoPlay={autoPlay}
        loop={loop}
        style={styles.animation}
        onAnimationFinish={handleAnimationFinish}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#ffffff',
  },
  animation: {
    width: screenWidth,
    height: screenHeight,
  },
});
