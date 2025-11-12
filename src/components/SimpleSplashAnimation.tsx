import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedG = Animated.createAnimatedComponent(G);

interface SimpleSplashAnimationProps {
  onAnimationComplete?: () => void;
}

type LetterDefinition = {
  id: string;
  path: string;
  origin?: string;
};

const LETTERS: LetterDefinition[] = [
  {
    id: 'o1',
    path: 'M44.02,156.16c-13.04-7.02-22.96-16.82-29.75-29.4-6.8-12.58-10.19-27.05-10.19-43.41s3.39-30.83,10.19-43.41c6.79-12.58,16.7-22.38,29.75-29.4C57.06,3.52,72.61,0,90.67,0s33.61,3.51,46.65,10.53c13.04,7.02,22.95,16.82,29.75,29.4,6.79,12.58,10.18,27.05,10.18,43.41s-3.4,30.83-10.18,43.41c-6.8,12.58-16.71,22.38-29.75,29.4-13.04,7.02-28.59,10.53-46.65,10.53s-33.61-3.51-46.65-10.53Zm87.63-29.63c9.72-10.57,14.59-24.96,14.59-43.17s-5.06-32.79-15.16-43.29c-10.11-10.49-24.35-15.74-42.71-15.74-16.82,0-29.9,5.36-39.24,16.09-9.34,10.73-14.01,25.04-14.01,42.94s4.86,32.61,14.59,43.17c9.72,10.57,23.38,15.86,40.98,15.86s31.25-5.28,40.98-15.86h-.02Z',
    origin: '90.67, 83',
  },
  {
    id: 's1',
    path: 'M236.52,159.17c-13.28-5.01-24.77-12.23-34.49-21.65-2.32-2.31-3.47-4.94-3.47-7.87,0-3.39,1.54-6.63,4.63-9.72,2.46-2.47,5.17-3.7,8.1-3.7,3.09,0,6.79,1.78,11.11,5.32,7.25,6.64,15.86,11.77,25.81,15.39,9.96,3.63,20.26,5.44,30.9,5.44s18.13-1.74,23.85-5.21,8.57-8.37,8.57-14.7-3.09-12-9.26-16.09-16.66-7.76-31.48-11c-23.3-5.09-40.25-11.81-50.82-20.14s-15.86-19.06-15.86-32.18c0-8.33,2.78-15.78,8.33-22.34s13.31-11.65,23.27-15.28c9.96-3.62,21.33-5.44,34.15-5.44,14.35,0,27.12,2.35,38.31,7.06s19.71,11.31,25.58,19.79c2,3.24,3.01,6.02,3.01,8.33-.16,3.86-2.08,7.18-5.79,9.95-2.01,1.39-4.32,2.08-6.95,2.08-4.79,0-8.72-1.85-11.81-5.56-4.48-5.4-10.46-9.64-17.94-12.73-7.49-3.09-15.63-4.63-24.42-4.63-10.96,0-19.49,1.66-25.58,4.98-6.1,3.32-9.14,7.91-9.14,13.77s2.97,10.69,8.91,14.47,16.24,7.37,30.9,10.77c16.21,3.86,29.24,8.22,39.13,13.08,9.87,4.86,17.09,10.61,21.64,17.25s6.83,14.58,6.83,23.85-2.63,16.55-7.87,23.27c-5.25,6.71-12.66,11.89-22.22,15.51-9.57,3.62-20.69,5.44-33.34,5.44-15.13,0-29.33-2.51-42.6-7.52h.01Z',
  },
  {
    id: 'o2',
    path: 'M403.78,156.16c-13.05-7.02-22.96-16.82-29.75-29.4s-10.18-27.05-10.18-43.41,3.39-30.83,10.18-43.41c6.79-12.58,16.7-22.38,29.75-29.4C416.82,3.52,432.37,0,450.43,0s33.6,3.51,46.64,10.53c13.04,7.02,22.96,16.82,29.75,29.4s10.18,27.05,10.18,43.41-3.39,30.83-10.18,43.41c-6.79,12.58-16.71,22.38-29.75,29.4s-28.59,10.53-46.64,10.53-33.61-3.51-46.65-10.53Zm87.62-29.63c9.73-10.57,14.59-24.96,14.59-43.17s-5.06-32.79-15.16-43.29c-10.11-10.49-24.35-15.74-42.71-15.74-16.82,0-29.91,5.36-39.24,16.09-9.34,10.73-14.01,25.04-14.01,42.94s4.86,32.61,14.59,43.17c9.72,10.57,23.38,15.86,40.98,15.86s31.25-5.28,40.97-15.86h-.01Z',
    origin: '450.43, 83',
  },
  {
    id: 'n',
    path: 'M557.84,162.99c-2.78-2.47-4.17-5.86-4.17-10.19v-87.28c0-20.52,6.41-36.58,19.22-48.15C585.7,5.8,603.45,0,626.14,0s40.43,5.79,53.24,17.36c12.81,11.58,19.22,27.63,19.22,48.15v87.28c0,4.32-1.39,7.72-4.17,10.19-2.78,2.47-6.48,3.7-11.11,3.7s-8.37-1.27-11.23-3.82c-2.86-2.55-4.28-5.9-4.28-10.07v-87.97c0-13.12-3.55-23.15-10.65-30.1-7.1-6.94-17.44-10.42-31.02-10.42s-23.93,3.47-31.03,10.42c-7.1,6.95-10.65,16.98-10.65,30.1v87.97c0,4.17-1.43,7.52-4.28,10.07-2.86,2.55-6.6,3.82-11.23,3.82s-8.33-1.24-11.11-3.7h0Z',
  },
  {
    id: 'i',
    path: 'M796.52,162.99c-2.78-2.47-4.17-5.86-4.17-10.19V13.9c0-4.32,1.39-7.72,4.17-10.19,2.78-2.47,6.48-3.7,11.11-3.7s8.18,1.24,11.11,3.7c2.93,2.47,4.4,5.87,4.4,10.19v138.9c0,4.32-1.47,7.72-4.4,10.19-2.94,2.47-6.64,3.7-11.11,3.7s-8.33-1.24-11.11-3.7Z',
  },
  {
    id: 's2',
    path: 'M891.67,159.17c-13.28-5.01-24.77-12.23-34.5-21.65-2.31-2.31-3.47-4.94-3.47-7.87,0-3.39,1.54-6.63,4.63-9.72,2.47-2.47,5.17-3.7,8.11-3.7s6.79,1.78,11.11,5.32c7.25,6.64,15.86,11.77,25.81,15.39,9.96,3.63,20.26,5.44,30.91,5.44s18.13-1.74,23.85-5.21c5.71-3.47,8.56-8.37,8.56-14.7s-3.09-12-9.26-16.09-16.67-7.76-31.48-11c-23.31-5.09-40.25-11.81-50.82-20.14s-15.86-19.06-15.86-32.18c0-8.33,2.78-15.78,8.33-22.34,5.56-6.56,13.31-11.65,23.27-15.28,9.96-3.62,21.34-5.44,34.15-5.44,14.35,0,27.12,2.35,38.31,7.06s19.71,11.31,25.58,19.79c2.01,3.24,3.01,6.02,3.01,8.33-.16,3.86-2.08,7.18-5.78,9.95-2.01,1.39-4.32,2.08-6.95,2.08-4.79,0-8.72-1.85-11.81-5.56-4.48-5.4-10.46-9.64-17.94-12.73-7.49-3.09-15.62-4.63-24.42-4.63-10.96,0-19.49,1.66-25.58,4.98-6.1,3.32-9.14,7.91-9.14,13.77s2.97,10.69,8.91,14.47,16.24,7.37,30.91,10.77c16.2,3.86,29.24,8.22,39.12,13.08,9.88,4.86,17.09,10.61,21.64,17.25s6.83,14.58,6.83,23.85-2.62,16.55-7.87,23.27c-5.25,6.71-12.65,11.89-22.22,15.51s-20.68,5.44-33.33,5.44c-15.13,0-29.33-2.51-42.6-7.52h-.01Z',
  },
  {
    id: 'h',
    path: 'M1025.48,162.99c-2.78-2.47-4.17-5.86-4.17-10.19V13.9c0-4.32,1.39-7.72,4.17-10.19S1031.96,0,1036.59,0s8.37,1.27,11.23,3.82c2.85,2.55,4.28,5.9,4.28,10.07v55.33h83.11V13.9c0-4.17,1.43-7.52,4.28-10.07,2.85-2.55,6.6-3.82,11.23-3.82s8.33,1.24,11.11,3.7c2.78,2.47,4.17,5.87,4.17,10.19v138.9c0,4.32-1.39,7.72-4.17,10.19s-6.48,3.7-11.11,3.7-8.37-1.27-11.23-3.82c-2.86-2.55-4.28-5.9-4.28-10.07v-59.73h-83.11v59.73c0,4.17-1.43,7.52-4.28,10.07-2.86,2.55-6.6,3.82-11.23,3.82s-8.33-1.24-11.11-3.7Z',
  },
];

export const SimpleSplashAnimation: React.FC<SimpleSplashAnimationProps> = ({
  onAnimationComplete,
}) => {
  const logoGroupOpacity = useRef(new Animated.Value(0)).current;
  const logoGroupScale = useRef(new Animated.Value(0.9)).current;

  const firstLetterScale = useRef(new Animated.Value(0.9)).current;

  const letterAnimations = useMemo(
    () =>
      LETTERS.map(() => ({
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(14),
      })),
    []
  );

  const underlineProgress = useRef(new Animated.Value(0)).current;
  const underlineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const scheduleHaptic = (
      delay: number,
      style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
    ) => {
      const timer = setTimeout(() => {
        Haptics.impactAsync(style).catch(() => {});
      }, delay);
      timers.push(timer);
    };

    const stage1Duration = 750;
    const firstLetterDuration = 480;
    const letterAnimationDuration = 460;
    const staggerInterval = 120;
    const underlineDelay = 160;

    scheduleHaptic(stage1Duration, Haptics.ImpactFeedbackStyle.Medium);
    LETTERS.slice(1).forEach((_, index) => {
      scheduleHaptic(
        stage1Duration + firstLetterDuration + staggerInterval * index,
        Haptics.ImpactFeedbackStyle.Light
      );
    });
    const underlineStart =
      stage1Duration +
      firstLetterDuration +
      letterAnimationDuration +
      staggerInterval * (LETTERS.length - 2) +
      underlineDelay;
    scheduleHaptic(underlineStart, Haptics.ImpactFeedbackStyle.Light);

    const trailingLetters = LETTERS.slice(1).map((_, index) =>
      Animated.parallel([
        Animated.timing(letterAnimations[index + 1].opacity, {
          toValue: 1,
          duration: 460,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: false,
        }),
        Animated.timing(letterAnimations[index + 1].translateY, {
          toValue: 0,
          duration: 460,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );

    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoGroupOpacity, {
          toValue: 1,
          duration: 750,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(logoGroupScale, {
          toValue: 1,
          duration: 750,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.timing(letterAnimations[0].opacity, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(letterAnimations[0].translateY, {
          toValue: 0,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(firstLetterScale, {
          toValue: 1.02,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.stagger(120, trailingLetters),
      Animated.delay(160),
      Animated.parallel([
        Animated.timing(underlineOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(underlineProgress, {
          toValue: 1,
          duration: 720,
          easing: Easing.bezier(0.33, 0, 0.15, 1),
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(500),
    ]).start(() => {
      onAnimationComplete?.();
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [
    firstLetterScale,
    letterAnimations,
    logoGroupOpacity,
    logoGroupScale,
    onAnimationComplete,
    underlineOpacity,
    underlineProgress,
  ]);

  const logoWidth = SCREEN_WIDTH * 0.84;
  const logoHeight = (logoWidth * 213) / 1166;
  const firstOCenterRatio = 90 / 1166;
  const underlineWidthRatio = 160 / 1166;
  const underlineFullWidth = logoWidth * underlineWidthRatio;
  const underlineHeight = Math.max(6, logoHeight * 0.085);

  const underlineWidth = underlineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, underlineFullWidth],
  });

  const underlineLeft = logoWidth * (firstOCenterRatio - underlineWidthRatio / 2);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            width: logoWidth,
            height: logoHeight + underlineHeight * 0.9,
            opacity: logoGroupOpacity,
            transform: [{ scale: logoGroupScale }],
          },
        ]}
      >
        <Svg width={logoWidth} height={logoHeight} viewBox="0 0 1166 213">
          {LETTERS.map((letter, index) => (
            <AnimatedG
              key={letter.id}
              opacity={letterAnimations[index].opacity}
              translateY={letterAnimations[index].translateY}
              scale={index === 0 ? firstLetterScale : 1}
              origin={letter.origin}
            >
              <Path d={letter.path} fill="#679b00" />
            </AnimatedG>
          ))}
        </Svg>

        <Animated.View
          style={[
            styles.underline,
            {
              width: underlineWidth,
              height: underlineHeight,
              left: underlineLeft,
              bottom: -underlineHeight * 0.35,
              opacity: underlineOpacity,
              borderRadius: underlineHeight / 2,
            },
          ]}
        />
      </Animated.View>
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
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  underline: {
    position: 'absolute',
    backgroundColor: '#ffaf00',
  },
});
