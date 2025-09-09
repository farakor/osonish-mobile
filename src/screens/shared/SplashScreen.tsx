import React, { useEffect, useState } from 'react';
import { View, StyleSheet, AppState, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';
import { theme } from '../../constants';
import { authService } from '../../services/authService';
import { useLanguage } from '../../contexts/LanguageContext';
import type { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function SplashScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isLanguageSelected, isLoading } = useLanguage();
  const [isAuthServiceInitialized, setIsAuthServiceInitialized] = useState(false);
  const [isReadyToNavigate, setIsReadyToNavigate] = useState(false);
  const [isAnimationFinished, setIsAnimationFinished] = useState(false);

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

        // Все готово, устанавливаем флаг готовности к навигации
        console.log('[SplashScreen] ✅ Система готова к навигации');
        setIsReadyToNavigate(true);
      } catch (error) {
        console.error('[SplashScreen] ❌ Ошибка проверки авторизации:', error);
        // В случае ошибки также устанавливаем готовность к навигации
        console.log('[SplashScreen] ⚠️ Ошибка, но продолжаем с навигацией');
        setIsReadyToNavigate(true);
      }
    };

    initializeAndCheck();

    return () => {
      subscription?.remove();
    };
  }, [navigation, isLanguageSelected, isLoading, isAuthServiceInitialized]);

  // Отдельный useEffect для навигации когда все готово
  useEffect(() => {
    console.log('[SplashScreen] 🔄 Проверка готовности к навигации:', {
      isReadyToNavigate,
      isAnimationFinished,
      isAuthServiceInitialized,
      isLoading: !isLoading
    });

    if (isReadyToNavigate && isAnimationFinished && isAuthServiceInitialized && !isLoading) {
      const performNavigation = async () => {
        try {
          // Добавляем тактильную вибрацию для iOS
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

          const authState = authService.getAuthState();

          // Сначала проверяем выбор языка
          if (!isLanguageSelected) {
            console.log('[SplashScreen] 🌐 Язык не выбран, переходим к выбору языка');
            navigation.reset({
              index: 0,
              routes: [{ name: 'LanguageSelection' }],
            });
            return;
          }

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
          console.error('[SplashScreen] ❌ Ошибка при навигации:', error);
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

      performNavigation();
    }
  }, [isReadyToNavigate, isAnimationFinished, isAuthServiceInitialized, isLoading, isLanguageSelected, navigation]);

  const handleAnimationFinish = () => {
    console.log('[SplashScreen] ✅ Анимация завершена');
    setIsAnimationFinished(true);
  };

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../../assets/splash-anim.json')}
        autoPlay
        loop={false}
        style={styles.animation}
        resizeMode="cover"
        onAnimationFinish={handleAnimationFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  animation: {
    width: screenWidth,
    height: screenHeight,
  },
});
