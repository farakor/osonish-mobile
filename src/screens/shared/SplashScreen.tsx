import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';

export function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    // Здесь будем инициализировать приложение
    // Проверять аутентификацию, загружать данные и т.д.

    // Через 2 секунды переходим к экрану аутентификации
    const timer = setTimeout(() => {
      navigation.navigate('Auth' as never);
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.content}>
        <Text style={styles.title}>Osonish</Text>
        <Text style={styles.subtitle}>Marketplace for jobs</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.background,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.regular,
    color: theme.colors.background,
    opacity: 0.8,
  },
});
