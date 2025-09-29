import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { AppNavigator } from './src/navigation';
import { OrdersProvider } from './src/hooks';
import { LanguageProvider } from './src/contexts/LanguageContext';

// Инициализация i18n
import './src/i18n';

// Инициализация сервисов
import { initializeSMSServices } from './src/services/smsServiceInitializer';
import { authService } from './src/services/authService';
import { notificationService } from './src/services/notificationService';
// Принудительный импорт eskizSMSService для отладки
import { eskizSMSService } from './src/services/eskizSMSService';
// Утилиты для navigation bar
import { setupTransparentNavigationBar } from './src/utils/navigationBarUtils';

console.log('[App] 🔄 App.tsx загружается...');
console.log('[App] 📦 eskizSMSService импортирован:', !!eskizSMSService);


// Импортируем orderService для отладки
import { orderService } from './src/services/orderService';

// Подключаем тестовые утилиты в dev режиме
if (__DEV__) {
  import('./src/utils/testingHelpers');
  import('./src/utils/notificationTest');
  import('./src/utils/quickNotificationTest');

  // Добавляем функции для отладки уведомлений в глобальный объект
  (global as any).debugNotifications = {
    testNewOrderNotifications: (orderId?: string) => orderService.testNewOrderNotifications(orderId),
    clearNotificationCache: () => orderService.clearNotificationCache(),
    getNotifiedOrders: () => orderService.getNotifiedOrders(),
  };

  console.log('[App] 🧪 Функции отладки уведомлений доступны в global.debugNotifications');
  console.log('[App] 💡 Используйте:');
  console.log('[App] 💡 - global.debugNotifications.testNewOrderNotifications() - тест уведомлений');
  console.log('[App] 💡 - global.debugNotifications.clearNotificationCache() - очистка кэша');
  console.log('[App] 💡 - global.debugNotifications.getNotifiedOrders() - список уведомленных заказов');
}

export default function App() {
  useEffect(() => {
    // Инициализируем базовые сервисы при запуске приложения (кроме authService, он инициализируется в SplashScreen)
    const initializeServices = async () => {
      try {
        console.log('[App] 🚀 Инициализация базовых сервисов...');

        // Инициализируем SMS сервисы
        const smsResult = await initializeSMSServices();
        if (!smsResult.success) {
          console.error('[App] ❌ Ошибка инициализации SMS:', smsResult.error);
        } else {
          console.log('[App] ✅ SMS сервисы инициализированы');
        }

        // Инициализируем сервис уведомлений
        await notificationService.init();
        console.log('[App] ✅ Сервис уведомлений инициализирован');

        // Фоновые задачи отключены из-за ограничений App Store
        // (background-processing и background-fetch недопустимы без специального разрешения)
        console.log('[App] ℹ️ Фоновые задачи отключены для соответствия требованиям App Store');

        // Настраиваем прозрачный navigation bar для Android с поддержкой Edge-to-Edge
        if (Platform.OS === 'android') {
          await setupTransparentNavigationBar();
        }

        // ВАЖНО: authService.init() НЕ вызываем здесь, 
        // он инициализируется в SplashScreen для правильной последовательности

        console.log('[App] ✅ Базовые сервисы успешно инициализированы');
      } catch (error) {
        console.error('[App] ❌ Ошибка инициализации сервисов:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <OrdersProvider>
          <StatusBar
            style="dark"
            translucent={Platform.OS === 'android'}
            backgroundColor="transparent"
          />
          <AppNavigator />
        </OrdersProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}