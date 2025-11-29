import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

interface SplashAnimationProps {
  onAnimationFinish?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function SplashAnimation({
  onAnimationFinish,
  autoPlay = true,
  loop = false,
  style
}: SplashAnimationProps) {
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
        resizeMode="contain"
        colorFilters={[
          {
            keypath: "o main.**",
            color: "#ffffff"
          },
          {
            keypath: "**.Path.**",
            color: "#ffffff"
          },
          {
            keypath: "**.Fill**",
            color: "#ffffff"
          }
        ]}
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
    width: screenWidth * 1.2,
    height: screenHeight * 1.2,
    maxWidth: screenWidth * 1.5,
    maxHeight: screenHeight * 1.5,
  },
});