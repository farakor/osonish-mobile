import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingTabBarProps {
  children: React.ReactNode;
  style?: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({ children, style }) => {
  const insets = useSafeAreaInsets();
  
  // Высота tab bar в зависимости от платформы
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 65 : 70;
  const BOTTOM_PADDING = Platform.OS === 'ios' ? insets.bottom : 16;

  return (
    <View style={[styles.container, { paddingBottom: BOTTOM_PADDING }]}>
      {/* Основной контейнер с blur эффектом */}
      <View style={[styles.tabBarContainer, { height: TAB_BAR_HEIGHT }]}>
        {/* Blur эффект для glass morphism */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 100}
          tint={Platform.OS === 'ios' ? 'systemChromeMaterialLight' : 'extraLight'}
          style={[StyleSheet.absoluteFillObject, Platform.OS === 'android' && { borderRadius: 28 }]}
        >
          {/* Градиент для Android (имитация glass эффекта) */}
          {Platform.OS === 'android' && (
            <>
              {/* Первый слой - полупрозрачный белый */}
              <View style={[styles.glassOverlay, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />
              {/* Второй слой - легкий градиент для глубины */}
              <LinearGradient
                colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.3)']}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
            </>
          )}

          {/* Тонкая граница сверху */}
          <View style={styles.topBorder} />
        </BlurView>

        {/* Контент tab bar */}
        <View style={[styles.contentContainer, style]}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible', // Позволяет tooltip выходить за пределы
  },
  tabBarContainer: {
    width: SCREEN_WIDTH - 32, // Отступы по бокам для floating эффекта
    maxWidth: 500, // Максимальная ширина для планшетов
    borderRadius: 28,
    // Легкая рамка для обеих платформ
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    // Тень для floating эффекта (только для iOS)
    ...Platform.select({
      ios: {
        overflow: 'hidden', // Для iOS - скругленные углы
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        // overflow: 'visible', // Для Android - tooltip не обрезается
        elevation: 0,
      },
    }),
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 28,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    overflow: 'visible', // Позволяет tooltip выходить за пределы tab bar
  },
});

