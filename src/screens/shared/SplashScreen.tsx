import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
// import OsonishLogo from '../../../assets/oson-ish-logo-white.svg';

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
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <View style={styles.content}>
        <Image
          source={require('../../../assets/logo-osonish-vertical.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 340,
    height: 340,
    marginBottom: 24,
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
