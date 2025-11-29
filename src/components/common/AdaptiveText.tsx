import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { isSmallScreen, isVerySmallScreen } from '../../utils/responsive';

interface AdaptiveTextProps extends TextProps {
  children: React.ReactNode;
  fontSize?: number;
  maxLines?: number;
  adjustsFontSizeToFit?: boolean;
}

export const AdaptiveText: React.FC<AdaptiveTextProps> = ({
  children,
  style,
  fontSize,
  maxLines,
  adjustsFontSizeToFit = true,
  ...props
}) => {
  const getAdaptiveFontSize = (baseFontSize?: number) => {
    if (!baseFontSize) return undefined;

    if (isVerySmallScreen()) {
      return baseFontSize * 0.85; // Уменьшаем на 15% для очень маленьких экранов
    }

    if (isSmallScreen()) {
      return baseFontSize * 0.9; // Уменьшаем на 10% для маленьких экранов
    }

    return baseFontSize;
  };

  const adaptiveStyle = [
    style,
    fontSize && { fontSize: getAdaptiveFontSize(fontSize) }
  ];

  return (
    <Text
      style={adaptiveStyle}
      numberOfLines={maxLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit && isSmallScreen()}
      minimumFontScale={0.8}
      {...props}
    >
      {children}
    </Text>
  );
};
