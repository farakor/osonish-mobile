import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedLogoProps {
  onAnimationComplete?: () => void;
}

// Создаем анимированные компоненты для SVG
const AnimatedG = Animated.createAnimatedComponent(G);

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ onAnimationComplete }) => {
  // Анимации для буквы O с черточкой (первая буква)
  const oScale = useRef(new Animated.Value(3)).current;
  const oOpacity = useRef(new Animated.Value(0)).current;
  const oTranslateX = useRef(new Animated.Value(0)).current;

  // Анимации для остальных букв
  const sOpacity = useRef(new Animated.Value(0)).current;
  const sTranslateX = useRef(new Animated.Value(50)).current;

  const o2Opacity = useRef(new Animated.Value(0)).current;
  const o2TranslateX = useRef(new Animated.Value(50)).current;

  const nOpacity = useRef(new Animated.Value(0)).current;
  const nTranslateX = useRef(new Animated.Value(50)).current;

  const iOpacity = useRef(new Animated.Value(0)).current;
  const iTranslateX = useRef(new Animated.Value(50)).current;

  const s2Opacity = useRef(new Animated.Value(0)).current;
  const s2TranslateX = useRef(new Animated.Value(50)).current;

  const hOpacity = useRef(new Animated.Value(0)).current;
  const hTranslateX = useRef(new Animated.Value(50)).current;

  // Анимация для черточки
  const lineOpacity = useRef(new Animated.Value(0)).current;
  const lineTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Последовательность анимации
    Animated.sequence([
      // 1. Появление буквы O с zoom out (0-800ms)
      Animated.parallel([
        Animated.timing(oOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(oScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),

      // 2. Пауза (800-1000ms)
      Animated.delay(200),

      // 3. Появление буквы S и сдвиг O влево (1000-1300ms)
      Animated.parallel([
        Animated.timing(sOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(sTranslateX, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(oTranslateX, {
          toValue: -120,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(lineTranslateX, {
          toValue: -120,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // 4. Появление второй O (1300-1600ms)
      Animated.parallel([
        Animated.timing(o2Opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(o2TranslateX, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(oTranslateX, {
          toValue: -240,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(lineTranslateX, {
          toValue: -240,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(sTranslateX, {
          toValue: -120,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // 5. Появление N (1600-1900ms)
      Animated.parallel([
        Animated.timing(nOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(nTranslateX, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(oTranslateX, {
          toValue: -360,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(lineTranslateX, {
          toValue: -360,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(sTranslateX, {
          toValue: -240,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(o2TranslateX, {
          toValue: -120,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // 6. Появление I (1900-2200ms)
      Animated.parallel([
        Animated.timing(iOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(iTranslateX, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(oTranslateX, {
          toValue: -420,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(lineTranslateX, {
          toValue: -420,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(sTranslateX, {
          toValue: -300,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(o2TranslateX, {
          toValue: -180,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(nTranslateX, {
          toValue: -60,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // 7. Появление второй S (2200-2500ms)
      Animated.parallel([
        Animated.timing(s2Opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(s2TranslateX, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(oTranslateX, {
          toValue: -540,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(lineTranslateX, {
          toValue: -540,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(sTranslateX, {
          toValue: -420,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(o2TranslateX, {
          toValue: -300,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(nTranslateX, {
          toValue: -180,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(iTranslateX, {
          toValue: -60,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // 8. Появление H (2500-2800ms)
      Animated.parallel([
        Animated.timing(hOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(hTranslateX, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(oTranslateX, {
          toValue: -583,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(lineTranslateX, {
          toValue: -583,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(sTranslateX, {
          toValue: -463,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(o2TranslateX, {
          toValue: -343,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(nTranslateX, {
          toValue: -223,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(iTranslateX, {
          toValue: -103,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(s2TranslateX, {
          toValue: -43,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // 9. Появление черточки (2800-3100ms)
      Animated.timing(lineOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),

      // 10. Финальная пауза (3100-3400ms)
      Animated.delay(300),
    ]).start(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <Svg width={SCREEN_WIDTH * 0.9} height="200" viewBox="0 0 1166 213" style={styles.svg}>
        {/* Буква O с анимацией (первая буква) - зеленая */}
        <AnimatedG
          opacity={oOpacity}
          translateX={oTranslateX}
          scale={oScale}
          origin="90, 83"
        >
          <Path
            d="m44.02,156.16c-13.04-7.02-22.96-16.82-29.75-29.4-6.8-12.58-10.19-27.05-10.19-43.41s3.39-30.83,10.19-43.41c6.79-12.58,16.7-22.38,29.75-29.4C57.06,3.52,72.61,0,90.67,0s33.61,3.51,46.65,10.53c13.04,7.02,22.95,16.82,29.75,29.4,6.79,12.58,10.18,27.05,10.18,43.41s-3.4,30.83-10.18,43.41c-6.8,12.58-16.71,22.38-29.75,29.4-13.04,7.02-28.59,10.53-46.65,10.53s-33.61-3.51-46.65-10.53h0Zm87.63-29.63c9.72-10.57,14.59-24.96,14.59-43.17s-5.06-32.79-15.16-43.29c-10.11-10.49-24.35-15.74-42.71-15.74-16.82,0-29.9,5.36-39.24,16.09-9.34,10.73-14.01,25.04-14.01,42.94s4.86,32.61,14.59,43.17c9.72,10.57,23.38,15.86,40.98,15.86s31.25-5.28,40.98-15.86h-.02Z"
            fill="#679b00"
          />
        </AnimatedG>

        {/* Буква S - зеленая */}
        <AnimatedG opacity={sOpacity} translateX={sTranslateX}>
          <Path
            d="m236.52,159.17c-13.28-5.01-24.77-12.23-34.49-21.65-2.32-2.31-3.47-4.94-3.47-7.87,0-3.39,1.54-6.63,4.63-9.72,2.46-2.47,5.17-3.7,8.1-3.7,3.09,0,6.79,1.78,11.11,5.32,7.25,6.64,15.86,11.77,25.81,15.39,9.96,3.63,20.26,5.44,30.9,5.44s18.13-1.74,23.85-5.21,8.57-8.37,8.57-14.7-3.09-12-9.26-16.09-16.66-7.76-31.48-11c-23.3-5.09-40.25-11.81-50.82-20.14s-15.86-19.06-15.86-32.18c0-8.33,2.78-15.78,8.33-22.34s13.31-11.65,23.27-15.28c9.96-3.62,21.33-5.44,34.15-5.44,14.35,0,27.12,2.35,38.31,7.06s19.71,11.31,25.58,19.79c2,3.24,3.01,6.02,3.01,8.33-.16,3.86-2.08,7.18-5.79,9.95-2.01,1.39-4.32,2.08-6.95,2.08-4.79,0-8.72-1.85-11.81-5.56-4.48-5.4-10.46-9.64-17.94-12.73-7.49-3.09-15.63-4.63-24.42-4.63-10.96,0-19.49,1.66-25.58,4.98-6.1,3.32-9.14,7.91-9.14,13.77s2.97,10.69,8.91,14.47,16.24,7.37,30.9,10.77c16.21,3.86,29.24,8.22,39.13,13.08,9.87,4.86,17.09,10.61,21.64,17.25s6.83,14.58,6.83,23.85-2.63,16.55-7.87,23.27c-5.25,6.71-12.66,11.89-22.22,15.51-9.57,3.62-20.69,5.44-33.34,5.44-15.13,0-29.33-2.51-42.6-7.52h.01Z"
            fill="#679b00"
          />
        </AnimatedG>

        {/* Вторая буква O - зеленая */}
        <AnimatedG opacity={o2Opacity} translateX={o2TranslateX}>
          <Path
            d="m403.78,156.16c-13.05-7.02-22.96-16.82-29.75-29.4s-10.18-27.05-10.18-43.41,3.39-30.83,10.18-43.41c6.79-12.58,16.7-22.38,29.75-29.4C416.82,3.52,432.37,0,450.43,0s33.6,3.51,46.64,10.53c13.04,7.02,22.96,16.82,29.75,29.4s10.18,27.05,10.18,43.41-3.39,30.83-10.18,43.41c-6.79,12.58-16.71,22.38-29.75,29.4s-28.59,10.53-46.64,10.53-33.61-3.51-46.65-10.53Zm87.62-29.63c9.73-10.57,14.59-24.96,14.59-43.17s-5.06-32.79-15.16-43.29c-10.11-10.49-24.35-15.74-42.71-15.74-16.82,0-29.91,5.36-39.24,16.09-9.34,10.73-14.01,25.04-14.01,42.94s4.86,32.61,14.59,43.17c9.72,10.57,23.38,15.86,40.98,15.86s31.25-5.28,40.97-15.86h-.01Z"
            fill="#679b00"
          />
        </AnimatedG>

        {/* Буква N - зеленая */}
        <AnimatedG opacity={nOpacity} translateX={nTranslateX}>
          <Path
            d="m557.84,162.99c-2.78-2.47-4.17-5.86-4.17-10.19v-87.28c0-20.52,6.41-36.58,19.22-48.15C585.7,5.8,603.45,0,626.14,0s40.43,5.79,53.24,17.36c12.81,11.58,19.22,27.63,19.22,48.15v87.28c0,4.32-1.39,7.72-4.17,10.19-2.78,2.47-6.48,3.7-11.11,3.7s-8.37-1.27-11.23-3.82c-2.86-2.55-4.28-5.9-4.28-10.07v-87.97c0-13.12-3.55-23.15-10.65-30.1-7.1-6.94-17.44-10.42-31.02-10.42s-23.93,3.47-31.03,10.42c-7.1,6.95-10.65,16.98-10.65,30.1v87.97c0,4.17-1.43,7.52-4.28,10.07-2.86,2.55-6.6,3.82-11.23,3.82s-8.33-1.24-11.11-3.7h0Z"
            fill="#679b00"
          />
        </AnimatedG>

        {/* Буква I - зеленая */}
        <AnimatedG opacity={iOpacity} translateX={iTranslateX}>
          <Path
            d="m796.52,162.99c-2.78-2.47-4.17-5.86-4.17-10.19V13.9c0-4.32,1.39-7.72,4.17-10.19,2.78-2.47,6.48-3.7,11.11-3.7s8.18,1.24,11.11,3.7c2.93,2.47,4.4,5.87,4.4,10.19v138.9c0,4.32-1.47,7.72-4.4,10.19-2.94,2.47-6.64,3.7-11.11,3.7s-8.33-1.24-11.11-3.7Z"
            fill="#679b00"
          />
        </AnimatedG>

        {/* Вторая буква S - зеленая */}
        <AnimatedG opacity={s2Opacity} translateX={s2TranslateX}>
          <Path
            d="m891.67,159.17c-13.28-5.01-24.77-12.23-34.5-21.65-2.31-2.31-3.47-4.94-3.47-7.87,0-3.39,1.54-6.63,4.63-9.72,2.47-2.47,5.17-3.7,8.11-3.7s6.79,1.78,11.11,5.32c7.25,6.64,15.86,11.77,25.81,15.39,9.96,3.63,20.26,5.44,30.91,5.44s18.13-1.74,23.85-5.21c5.71-3.47,8.56-8.37,8.56-14.7s-3.09-12-9.26-16.09-16.67-7.76-31.48-11c-23.31-5.09-40.25-11.81-50.82-20.14s-15.86-19.06-15.86-32.18c0-8.33,2.78-15.78,8.33-22.34,5.56-6.56,13.31-11.65,23.27-15.28,9.96-3.62,21.34-5.44,34.15-5.44,14.35,0,27.12,2.35,38.31,7.06s19.71,11.31,25.58,19.79c2.01,3.24,3.01,6.02,3.01,8.33-.16,3.86-2.08,7.18-5.78,9.95-2.01,1.39-4.32,2.08-6.95,2.08-4.79,0-8.72-1.85-11.81-5.56-4.48-5.4-10.46-9.64-17.94-12.73-7.49-3.09-15.62-4.63-24.42-4.63-10.96,0-19.49,1.66-25.58,4.98-6.1,3.32-9.14,7.91-9.14,13.77s2.97,10.69,8.91,14.47,16.24,7.37,30.91,10.77c16.2,3.86,29.24,8.22,39.12,13.08,9.88,4.86,17.09,10.61,21.64,17.25s6.83,14.58,6.83,23.85-2.62,16.55-7.87,23.27c-5.25,6.71-12.65,11.89-22.22,15.51s-20.68,5.44-33.33,5.44c-15.13,0-29.33-2.51-42.6-7.52h-.01Z"
            fill="#679b00"
          />
        </AnimatedG>

        {/* Буква H - зеленая */}
        <AnimatedG opacity={hOpacity} translateX={hTranslateX}>
          <Path
            d="m1025.48,162.99c-2.78-2.47-4.17-5.86-4.17-10.19V13.9c0-4.32,1.39-7.72,4.17-10.19S1031.96,0,1036.59,0s8.37,1.27,11.23,3.82c2.85,2.55,4.28,5.9,4.28,10.07v55.33h83.11V13.9c0-4.17,1.43-7.52,4.28-10.07,2.85-2.55,6.6-3.82,11.23-3.82s8.33,1.24,11.11,3.7c2.78,2.47,4.17,5.87,4.17,10.19v138.9c0,4.32-1.39,7.72-4.17,10.19s-6.48,3.7-11.11,3.7-8.37-1.27-11.23-3.82c-2.86-2.55-4.28-5.9-4.28-10.07v-59.73h-83.11v59.73c0,4.17-1.43,7.52-4.28,10.07-2.86,2.55-6.6,3.82-11.23,3.82s-8.33-1.24-11.11-3.7Z"
            fill="#679b00"
          />
        </AnimatedG>

        {/* Черточка (желтая) - появляется в конце */}
        <AnimatedG opacity={lineOpacity} translateX={lineTranslateX}>
          <Path
            d="m170.31,212.54c-52.68-8.34-106.13-8.34-158.81,0-5.21.82-10.15-3.17-10.99-8.99-.13-.93-.26-1.85-.39-2.78-.83-5.82,2.92-11.38,8.36-12.24,54.68-8.66,110.17-8.66,164.85,0,5.44.86,9.2,6.42,8.36,12.24-.13.93-.26,1.85-.39,2.78-.84,5.82-5.78,9.81-10.99,8.99h0Z"
            fill="#ffaf00"
          />
        </AnimatedG>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F5FC',
  },
  svg: {
    alignSelf: 'center',
  },
});
