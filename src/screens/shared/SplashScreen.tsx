import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, AppState, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import { authService } from '../../services/authService';
import { useLanguage } from '../../contexts/LanguageContext';
import type { RootStackParamList } from '../../types';
import { SplashAnimation, SimpleSplashAnimation } from '../../components/common';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SplashScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isLanguageSelected, isLoading } = useLanguage();
  const [isAuthServiceInitialized, setIsAuthServiceInitialized] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [useSimpleAnimation, setUseSimpleAnimation] = useState(false);

  const checkAuthAndNavigate = useCallback(async () => {
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
  }, [navigation, isLanguageSelected, isLoading, isAuthServiceInitialized]);

  useEffect(() => {
    console.log('[SplashScreen] 🚀 Инициализация SplashScreen...');

    // Слушатель изменений состояния приложения
    const handleAppStateChange = (nextAppState: string) => {
      console.log('[SplashScreen] 📱 Состояние приложения изменилось:', nextAppState);
      if (nextAppState === 'active' && isAuthServiceInitialized && animationCompleted) {
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

        // Не вызываем checkAuthAndNavigate здесь, ждем завершения анимации
      } catch (error) {
        console.error('[SplashScreen] ❌ Ошибка инициализации:', error);
        setIsAuthServiceInitialized(true); // Все равно продолжаем
        // Не вызываем checkAuthAndNavigate здесь, ждем завершения анимации
      }
    };

    initializeAndCheck();

    return () => {
      subscription?.remove();
    };
  }, [isLanguageSelected, isLoading, isAuthServiceInitialized]);

  // Обработка завершения анимации
  useEffect(() => {
    if (animationCompleted && isAuthServiceInitialized) {
      console.log('[SplashScreen] 🎯 Анимация завершена, запускаем основную логику');
      checkAuthAndNavigate();
    }
  }, [animationCompleted, isAuthServiceInitialized, checkAuthAndNavigate]);

  // Fallback на случай проблем с основной анимацией
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (showAnimation && !animationCompleted) {
        console.log('[SplashScreen] ⚠️ Переключение на простую анимацию');
        setUseSimpleAnimation(true);
      }
    }, 3000); // Если через 3 секунды анимация не завершилась, переключаемся на простую

    return () => clearTimeout(fallbackTimer);
  }, [showAnimation, animationCompleted]);

  const handleAnimationFinish = () => {
    console.log('[SplashScreen] 🎬 Анимация завершена');
    setShowAnimation(false);
    setAnimationCompleted(true);
  };

  const handleSkipAnimation = () => {
    console.log('[SplashScreen] ⏭️ Анимация пропущена');
    setShowAnimation(false);
    setAnimationCompleted(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {showAnimation ? (
        <TouchableOpacity
          style={styles.animationContainer}
          onPress={handleSkipAnimation}
          activeOpacity={1}
        >
          {useSimpleAnimation ? (
            <SimpleSplashAnimation
              onAnimationFinish={handleAnimationFinish}
              autoPlay={true}
              loop={false}
              style={styles.animationContainer}
            />
          ) : (
            <SplashAnimation
              onAnimationFinish={handleAnimationFinish}
              autoPlay={true}
              loop={false}
              style={styles.animationContainer}
            />
          )}
        </TouchableOpacity>
      ) : (
        // Показываем пустой экран после анимации, пока идет навигация
        <View style={styles.emptyContainer} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  animationContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
  },
});
