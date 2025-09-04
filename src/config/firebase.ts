import { Platform } from 'react-native';

// Firebase конфигурация из переменных окружения
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAfT2LkFCGZFf-Rx_9Of49ejwlIPpnwsKM',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'osonish-mobile.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'osonish-mobile',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'osonish-mobile.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '416617595886',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:416617595886:android:69297fd1ce7a83f30404ff',
};

console.log('🔥 Firebase конфигурация:', {
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey,
  platform: Platform.OS,
  isDev: __DEV__
});

// Простая инициализация Firebase (без @react-native-firebase в managed workflow)
let firebaseApp = null;

// Инициализация Firebase для Expo managed workflow
const initializeFirebaseApp = async () => {
  try {
    console.log('🔥 Инициализация Firebase для Expo managed workflow...');

    // В Expo managed workflow используем стандартный Firebase
    const { initializeApp, getApps } = await import('firebase/app');

    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
      console.log('🔥 Firebase инициализирован успешно');
    } else {
      firebaseApp = getApps()[0];
      console.log('🔥 Firebase уже инициализирован');
    }

    return true;
  } catch (error) {
    console.error('❌ Ошибка инициализации Firebase:', error);
    return false;
  }
};

export { firebaseApp, firebaseConfig, initializeFirebaseApp };

// Функция для получения FCM токена (для Android production)
export const getFCMToken = async (): Promise<string | null> => {
  try {
    console.log('🔥 Попытка получить FCM токен...');
    console.log('🔥 Platform:', Platform.OS);
    console.log('🔥 __DEV__:', __DEV__);

    if (Platform.OS !== 'android') {
      console.log('🔥 FCM пропущен: не Android платформа');
      return null;
    }

    // В Expo managed workflow @react-native-firebase не работает напрямую
    // Используем только Expo Notifications с правильным projectId
    console.log('🔥 Используем Expo Notifications для получения токена...');

    let Notifications;
    try {
      Notifications = require('expo-notifications');
    } catch (error) {
      console.error('❌ expo-notifications недоступен:', error);
      return null;
    }

    // Используем EAS projectId вместо Firebase projectId
    const Constants = require('expo-constants');

    // Пробуем разные способы получения projectId
    let easProjectId = null;

    // Способ 1: из expoConfig
    if (Constants.expoConfig?.extra?.eas?.projectId) {
      easProjectId = Constants.expoConfig.extra.eas.projectId;
      console.log('🔥 ProjectId найден в expoConfig:', easProjectId);
    }
    // Способ 2: из easConfig
    else if (Constants.easConfig?.projectId) {
      easProjectId = Constants.easConfig.projectId;
      console.log('🔥 ProjectId найден в easConfig:', easProjectId);
    }
    // Способ 3: из manifest
    else if (Constants.manifest?.extra?.eas?.projectId) {
      easProjectId = Constants.manifest.extra.eas.projectId;
      console.log('🔥 ProjectId найден в manifest:', easProjectId);
    }
    // Способ 4: из manifest2
    else if (Constants.manifest2?.extra?.eas?.projectId) {
      easProjectId = Constants.manifest2.extra.eas.projectId;
      console.log('🔥 ProjectId найден в manifest2:', easProjectId);
    }
    // Способ 5: хардкод как fallback (из app.json)
    else {
      easProjectId = 'd25e6650-1e06-4ebb-8988-0085861affbf';
      console.log('🔥 Используем хардкод projectId:', easProjectId);
    }

    if (!easProjectId) {
      console.error('❌ EAS projectId не найден');
      console.log('💡 Constants.expoConfig:', JSON.stringify(Constants.expoConfig?.extra, null, 2));
      console.log('💡 Constants.easConfig:', JSON.stringify(Constants.easConfig, null, 2));
      console.log('💡 Constants.manifest:', JSON.stringify(Constants.manifest?.extra, null, 2));
      return null;
    }

    console.log('🔥 Используем EAS projectId:', easProjectId);

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: easProjectId,
      });

      if (tokenData && tokenData.data) {
        console.log('🎯 Push токен получен через Expo:', tokenData.data.substring(0, 20) + '...');

        // В production Android сборке этот токен будет FCM токеном
        if (!__DEV__) {
          console.log('🔥 В production это будет FCM токен');
        }

        return tokenData.data;
      } else {
        console.log('⚠️ Push токен не получен через Expo');
        return null;
      }
    } catch (expoError) {
      console.error('❌ Ошибка получения Expo push токена с EAS projectId:', expoError);

      // Fallback: пробуем с Firebase projectId (для development)
      if (__DEV__) {
        console.log('🔄 Fallback: пробуем с Firebase projectId для development...');

        try {
          const fallbackTokenData = await Notifications.getExpoPushTokenAsync({
            projectId: firebaseConfig.projectId,
          });

          if (fallbackTokenData && fallbackTokenData.data) {
            console.log('🎯 Push токен получен через Firebase projectId fallback:', fallbackTokenData.data.substring(0, 20) + '...');
            return fallbackTokenData.data;
          }
        } catch (fallbackError) {
          console.error('❌ Fallback тоже не сработал:', fallbackError);
        }
      }

      // Дополнительная информация об ошибке
      if (expoError.message?.includes('Invalid uuid')) {
        console.error('💡 Проблема с projectId. Проверьте настройки EAS в app.json');
      }

      return null;
    }
  } catch (error) {
    console.error('❌ Ошибка получения FCM токена:', error);
    return null;
  }
};

// Функция для инициализации Firebase в приложении
export const initializeFirebase = async () => {
  try {
    console.log('🔥 Инициализация Firebase для push уведомлений...');

    const initialized = await initializeFirebaseApp();
    if (!initialized) {
      console.error('❌ Firebase app не создан');
      return false;
    }

    console.log('✅ Firebase готов к использованию');
    return true;
  } catch (error) {
    console.error('❌ Ошибка инициализации Firebase:', error);
    return false;
  }
};
