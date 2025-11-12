import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev, message]);
  };

  // Анимация имеет соотношение сторон 1166:213 ≈ 5.47:1 (очень широкая)
  const animationWidth = SCREEN_WIDTH * 0.95;
  const animationHeight = animationWidth / 5.47;
  // Увеличим высоту в 3 раза для лучшей видимости
  const displayHeight = animationHeight * 3;

  useEffect(() => {
    addDebug('[PremiumSplashScreen] 🎬 Компонент смонтирован');
    addDebug(`[PremiumSplashScreen] 📱 Размеры экрана: ${SCREEN_WIDTH.toFixed(0)} x ${SCREEN_HEIGHT.toFixed(0)}`);
    addDebug(`[PremiumSplashScreen] 📐 Размеры анимации: ${animationWidth.toFixed(0)} x ${displayHeight.toFixed(0)}`);
    
    // Попробуем принудительно запустить анимацию
    setTimeout(() => {
      addDebug('[PremiumSplashScreen] 🎯 Принудительный запуск анимации');
      animationRef.current?.reset();
      animationRef.current?.play();
    }, 300);
    
    // Страховочный таймер
    const safetyTimer = setTimeout(() => {
      if (!hasCalledComplete.current) {
        addDebug('[PremiumSplashScreen] ⏰ Страховочный таймер сработал');
        hasCalledComplete.current = true;
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    }, 8000); // Увеличим до 8 секунд для отладки

    return () => {
      clearTimeout(safetyTimer);
    };
  }, []);

  const handleAnimationFinish = () => {
    if (!hasCalledComplete.current) {
      addDebug('[PremiumSplashScreen] ✅ Анимация завершена');
      hasCalledComplete.current = true;
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Отладочная информация */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>🔍 ОТЛАДКА LOTTIE</Text>
        {debugInfo.slice(-5).map((info, index) => (
          <Text key={index} style={styles.debugText}>{info}</Text>
        ))}
      </View>

      {/* Видимая рамка вокруг анимации */}
      <View style={[styles.animationContainer, {
        borderWidth: 2,
        borderColor: '#ff0000',
        backgroundColor: '#f0f0f0',
      }]}>
        <Text style={styles.labelText}>
          📦 Анимация: {animationWidth.toFixed(0)} x {displayHeight.toFixed(0)}
        </Text>
        <LottieView
          ref={animationRef}
          source={require('../../assets/osonish-animation.json')}
          style={{
            width: animationWidth,
            height: displayHeight,
            backgroundColor: '#ffffff', // Белый фон
          }}
          autoPlay={false}
          loop={true}
          onAnimationFinish={handleAnimationFinish}
          resizeMode="cover"
          speed={1.0}
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
    padding: 20,
  },
  debugContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
  debugTitle: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    color: '#ffffff',
    fontSize: 10,
    marginBottom: 2,
  },
  animationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  labelText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 10,
    fontWeight: 'bold',
  },
});

