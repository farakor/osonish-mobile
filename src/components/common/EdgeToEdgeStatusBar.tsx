import React from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

/**
 * Компонент StatusBar с поддержкой Edge-to-Edge для Android 15+
 * Заменяет устаревшие API StatusBar для совместимости
 */

interface EdgeToEdgeStatusBarProps {
  style?: 'auto' | 'inverted' | 'light' | 'dark';
  backgroundColor?: string;
  translucent?: boolean;
  hidden?: boolean;
}

export const EdgeToEdgeStatusBar: React.FC<EdgeToEdgeStatusBarProps> = ({
  style = 'dark',
  backgroundColor = 'transparent',
  translucent = true,
  hidden = false,
}) => {
  // Для Android 15+ всегда используем прозрачный фон и Edge-to-Edge режим
  const finalStyle = Platform.OS === 'android' ? style : style;
  const finalBackgroundColor = Platform.OS === 'android' ? 'transparent' : backgroundColor;
  const finalTranslucent = Platform.OS === 'android' ? true : translucent;

  if (hidden) {
    return <ExpoStatusBar hidden />;
  }

  return (
    <ExpoStatusBar
      style={finalStyle}
      backgroundColor={finalBackgroundColor}
      translucent={finalTranslucent}
    />
  );
};

/**
 * Хук для получения конфигурации StatusBar с поддержкой Edge-to-Edge
 */
export const useEdgeToEdgeStatusBarConfig = () => {
  return {
    style: 'dark' as const,
    backgroundColor: 'transparent',
    translucent: Platform.OS === 'android',
  };
};
