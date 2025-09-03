import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
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

// Инициализация Firebase (только если еще не инициализирован)
let firebaseApp;
try {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
    console.log('🔥 Firebase инициализирован успешно');
  } else {
    firebaseApp = getApps()[0];
    console.log('🔥 Firebase уже инициализирован');
  }
} catch (error) {
  console.error('❌ Ошибка инициализации Firebase:', error);
  firebaseApp = null;
}

export { firebaseApp };

// Функция для получения FCM токена (только для Android в production)
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // FCM работает только на Android в production сборках
    if (Platform.OS !== 'android' || __DEV__) {
      console.log('🔥 FCM пропущен: не Android production');
      return null;
    }

    if (!firebaseApp) {
      console.error('❌ Firebase не инициализирован');
      return null;
    }

    // Проверяем поддержку messaging
    const supported = await isSupported();
    if (!supported) {
      console.log('🔥 FCM не поддерживается на этом устройстве');
      return null;
    }

    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging);

    if (token) {
      console.log('🎯 FCM токен получен:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.log('⚠️ FCM токен не получен');
      return null;
    }
  } catch (error) {
    console.error('❌ Ошибка получения FCM токена:', error);
    return null;
  }
};

// Функция для инициализации Firebase в приложении
export const initializeFirebase = () => {
  try {
    console.log('🔥 Инициализация Firebase для push уведомлений...');

    if (!firebaseApp) {
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
