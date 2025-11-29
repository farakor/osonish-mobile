import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { getSafeAreaPadding } from '../../utils/responsive';
import { theme } from '../../constants/theme';

interface SafeHeaderProps {
  children: React.ReactNode;
  backgroundColor?: string;
  style?: any;
  extraPadding?: number; // Дополнительный отступ для еще большего комфорта
}

export const SafeHeader: React.FC<SafeHeaderProps> = ({
  children,
  backgroundColor = theme.colors.primary,
  style,
  extraPadding = 8, // По умолчанию добавляем еще 8px для комфорта
}) => {
  const safeAreaPadding = getSafeAreaPadding();

  const headerStyle = [
    styles.header,
    {
      backgroundColor,
      paddingTop: safeAreaPadding.headerTop + extraPadding,
    },
    style,
  ];

  return (
    <View style={headerStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
});
