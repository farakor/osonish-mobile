import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import { authService } from '../../services/authService';
import { useLanguage } from '../../contexts/LanguageContext';
import type { RootStackParamList } from '../../types';
import { LogoOsonishWhite } from '../../components/common';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SplashScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isLanguageSelected, isLoading } = useLanguage();
  const [isAuthServiceInitialized, setIsAuthServiceInitialized] = useState(false);

  useEffect(() => {
    console.log('[SplashScreen] 🚀 Инициализация SplashScreen...');

    // Слушатель изменений состояния приложения
    const handleAppStateChange = (nextAppState: string) => {
      console.log('[SplashScreen] 📱 Состояние приложения изменилось:', nextAppState);
      if (nextAppState === 'active' && isAuthServiceInitialized) {
        // Когда приложение становится активным, проверяем аутентификацию заново
        setTimeout(() => {
          checkAuthAndNavigate();
        }, 500);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    const initializeAndCheck = async () => {
      try {
        console.log('[SplashScreen] 🔄 Ожидание инициализации AuthService...');

        // Ждем полной инициализации AuthService
        await authService.init();
        console.log('[SplashScreen] ✅ AuthService инициализирован');

        setIsAuthServiceInitialized(true);

        // Только после инициализации проверяем аутентификацию
        await checkAuthAndNavigate();
      } catch (error) {
        console.error('[SplashScreen] ❌ Ошибка инициализации:', error);
        setIsAuthServiceInitialized(true); // Все равно продолжаем
        await checkAuthAndNavigate();
      }
    };

    const checkAuthAndNavigate = async () => {
      try {
        console.log('[SplashScreen] 🔍 Проверка аутентификации...');

        // Ждем завершения загрузки языковых настроек
        if (isLoading) {
          console.log('[SplashScreen] ⏳ Ожидание загрузки языковых настроек...');
          return;
        }

        // Небольшая задержка для показа splash экрана (только при первом запуске)
        if (!isAuthServiceInitialized) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Сначала проверяем выбор языка
        if (!isLanguageSelected) {
          console.log('[SplashScreen] 🌐 Язык не выбран, переходим к выбору языка');
          navigation.reset({
            index: 0,
            routes: [{ name: 'LanguageSelection' }],
          });
          return;
        }

        // Проверяем состояние авторизации
        const authState = authService.getAuthState();
        console.log('[SplashScreen] 🔐 Состояние аутентификации:', {
          isAuthenticated: authState.isAuthenticated,
          hasUser: !!authState.user,
          userRole: authState.user?.role,
          userId: authState.user?.id
        });

        if (authState.isAuthenticated && authState.user) {
          // Пользователь авторизован - переходим в основное приложение
          console.log(`[SplashScreen] ✅ Пользователь авторизован как ${authState.user.role}`);
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
          console.log('[SplashScreen] ❌ Пользователь не авторизован, переходим к Auth');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        }
      } catch (error) {
        console.error('[SplashScreen] ❌ Ошибка проверки авторизации:', error);
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

    initializeAndCheck();

    return () => {
      subscription?.remove();
    };
  }, [navigation, isLanguageSelected, isLoading, isAuthServiceInitialized]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <LogoOsonishWhite width={280} height={51} />
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
