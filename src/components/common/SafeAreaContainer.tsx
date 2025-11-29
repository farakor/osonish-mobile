import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useAdaptiveStyles } from '../../hooks/useAdaptiveStyles';
import { getSafeStatusBarPadding, getStatusBarHeightSafe } from '../../utils/statusBar';

interface SafeAreaContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  hasHeader?: boolean;
  style?: any;
}

export const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({
  children,
  backgroundColor = '#679B00',
  statusBarStyle = 'light-content',
  hasHeader = false,
  style,
}) => {
  const adaptiveStyles = useAdaptiveStyles();

  // Получаем увеличенные безопасные отступы
  const getTopPadding = () => {
    if (Platform.OS === 'ios') {
      // Для iOS используем SafeAreaView + дополнительный отступ
      return hasHeader ? getSafeStatusBarPadding() : 0;
    } else {
      // Для Android используем полный расчет с увеличенными отступами
      return hasHeader ? adaptiveStyles.safeArea.headerTop : getStatusBarHeightSafe() + getSafeStatusBarPadding();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={Platform.OS === 'android' ? backgroundColor : undefined}
        translucent={Platform.OS === 'android'}
      />
      {Platform.OS === 'ios' ? (
        <SafeAreaView style={styles.content}>
          <View style={hasHeader && { paddingTop: getTopPadding() }}>
            {children}
          </View>
        </SafeAreaView>
      ) : (
        <View style={[styles.content, { paddingTop: getTopPadding() }]}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
