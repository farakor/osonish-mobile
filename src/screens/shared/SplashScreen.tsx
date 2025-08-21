import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import { authService } from '../../services/authService';
import { useLanguage } from '../../contexts/LanguageContext';
import type { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SplashScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isLanguageSelected } = useLanguage();

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        // Небольшая задержка для показа splash экрана
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Сначала проверяем выбор языка
        if (!isLanguageSelected) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'LanguageSelection' }],
          });
          return;
        }

        // Проверяем состояние авторизации
        const authState = authService.getAuthState();

        if (authState.isAuthenticated && authState.user) {
          // Пользователь авторизован - переходим в основное приложение
          if (authState.user.role === 'customer') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'CustomerTabs' }],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'WorkerTabs' }],
            });
          }
        } else {
          // Пользователь не авторизован - переходим к экрану авторизации
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        // В случае ошибки переходим к экрану выбора языка или авторизации
        if (!isLanguageSelected) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'LanguageSelection' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        }
      }
    };

    checkAuthAndNavigate();
  }, [navigation, isLanguageSelected]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>OSONISH</Text>
        </View>
        <Text style={styles.tagline}>Платформа для поиска работы и исполнителей</Text>
      </View>

      {/* Loading indicator */}
      <View style={styles.loadingSection}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: theme.colors.background,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.background,
    textAlign: 'center',
    fontWeight: theme.fonts.weights.medium,
    opacity: 0.9,
  },
  loadingSection: {
    position: 'absolute',
    bottom: theme.spacing.xxxl,
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.background,
    opacity: 0.8,
  },
});
