import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import animationJson from '../../assets/osonish-animation.json';

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
  const animationWidth = SCREEN_WIDTH;
  const animationHeight = SCREEN_WIDTH / 5.47;
  // Увеличим высоту в 2 раза для лучшей видимости
  const displayHeight = animationHeight * 2;

  useEffect(() => {
    addDebug('[PremiumSplashScreen] 🎬 Компонент смонтирован');
    addDebug(`[PremiumSplashScreen] 📱 Размеры: ${SCREEN_WIDTH.toFixed(0)} x ${SCREEN_HEIGHT.toFixed(0)}`);
    addDebug(`[PremiumSplashScreen] 📐 Анимация: ${animationWidth.toFixed(0)} x ${displayHeight.toFixed(0)}`);
    addDebug(`[PremiumSplashScreen] 📦 JSON загружен, размер: ${JSON.stringify(animationJson).length} символов`);
    
    // Принудительный запуск через разные интервалы
    const timers = [
      setTimeout(() => {
        addDebug('[PremiumSplashScreen] 🎯 Попытка 1: play()');
        animationRef.current?.play(0, 180);
      }, 100),
      
      setTimeout(() => {
        addDebug('[PremiumSplashScreen] 🎯 Попытка 2: reset + play');
        animationRef.current?.reset();
        animationRef.current?.play();
      }, 500),
      
      setTimeout(() => {
        addDebug('[PremiumSplashScreen] 🎯 Попытка 3: play from frame 0');
        animationRef.current?.play(0);
      }, 1000),
    ];
    
    // Страховочный таймер
    const safetyTimer = setTimeout(() => {
      if (!hasCalledComplete.current) {
        addDebug('[PremiumSplashScreen] ⏰ Страховочный таймер сработал');
        hasCalledComplete.current = true;
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    }, 6000);

    return () => {
      timers.forEach(t => clearTimeout(t));
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
        <Text style={styles.debugTitle}>🔍 DEBUG v3</Text>
        {debugInfo.slice(-6).map((info, index) => (
          <Text key={index} style={styles.debugText}>{info}</Text>
        ))}
      </View>

      {/* Видимая рамка вокруг анимации */}
      <View style={[styles.animationContainer, {
        borderWidth: 3,
        borderColor: '#00ff00',
        backgroundColor: '#000000',
      }]}>
        <Text style={styles.labelText}>
          📦 {animationWidth.toFixed(0)} x {displayHeight.toFixed(0)}
        </Text>
        
        <LottieView
          ref={animationRef}
          source={animationJson}
          style={{
            width: animationWidth,
            height: displayHeight,
            backgroundColor: '#ffffff',
          }}
          autoPlay={true}
          loop={true}
          onAnimationFinish={handleAnimationFinish}
          progress={0}
        />
      </View>
      
      <Text style={styles.infoText}>
        Если видите белый прямоугольник - LottieView загружен{'\n'}
        Если видите движение - анимация работает!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  debugContainer: {
    position: 'absolute',
    top: 40,
    left: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 8,
    borderRadius: 5,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  debugTitle: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  debugText: {
    color: '#ffffff',
    fontSize: 9,
    marginBottom: 1,
    fontFamily: 'monospace',
  },
  animationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  labelText: {
    fontSize: 12,
    color: '#00ff00',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  infoText: {
    marginTop: 20,
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

