import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PremiumSplashScreenProps {
  onAnimationComplete?: () => void;
}

export const PremiumSplashScreen: React.FC<PremiumSplashScreenProps> = ({ 
  onAnimationComplete 
}) => {
  const animationRef = useRef<LottieView>(null);
  const hasCalledComplete = useRef(false);

  useEffect(() => {
    console.log('[PremiumSplashScreen] 🎬 Компонент смонтирован');
    console.log('[PremiumSplashScreen] 📱 Размеры экрана:', SCREEN_WIDTH, 'x', SCREEN_HEIGHT);
    
    // Страховочный таймер на случай, если анимация не запустится
    const safetyTimer = setTimeout(() => {
      if (!hasCalledComplete.current) {
        console.log('[PremiumSplashScreen] ⏰ Страховочный таймер сработал');
        hasCalledComplete.current = true;
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    }, 4000); // 4 секунды - анимация должна быть 3 секунды

    return () => {
      clearTimeout(safetyTimer);
    };
  }, [onAnimationComplete]);

  const handleAnimationFinish = () => {
    if (!hasCalledComplete.current) {
      console.log('[PremiumSplashScreen] ✅ Анимация завершена');
      hasCalledComplete.current = true;
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }
  };

  // Анимация имеет соотношение сторон 1166:213 ≈ 5.47:1 (очень широкая)
  // Подгоняем под ширину экрана с отступами
  const animationWidth = SCREEN_WIDTH * 0.95; // 95% ширины экрана
  const animationHeight = animationWidth / 5.47; // Сохраняем пропорции

  return (
    <View style={styles.container}>
      <View style={styles.animationContainer}>
        <LottieView
          ref={animationRef}
          source={require('../../assets/osonish-animation.json')}
          style={{
            width: animationWidth,
            height: animationHeight,
          }}
          autoPlay={true}
          loop={false}
          onAnimationFinish={handleAnimationFinish}
          resizeMode="contain"
          speed={1.0}
          renderMode="SOFTWARE"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: SCREEN_WIDTH,
  },
});
