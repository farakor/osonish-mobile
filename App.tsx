import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

console.log('[App] 🔄 App.tsx загружается...');
console.log('[App] 📦 eskizSMSService импортирован:', !!eskizSMSService);


// Подключаем тестовые утилиты в dev режиме
if (__DEV__) {
  import('./src/utils/testingHelpers');
}

export default function App() {
  useEffect(() => {
    // Инициализируем сервисы при запуске приложения
    const initializeServices = async () => {
      try {
        // Инициализируем SMS сервисы
        const smsResult = await initializeSMSServices();
        if (!smsResult.success) {
          console.error('❌ Ошибка инициализации SMS:', smsResult.error);
        }

        // Инициализируем сервис авторизации
        await authService.init();

        // Инициализируем сервис уведомлений
        await notificationService.init();

        console.log('Сервисы успешно инициализированы');
      } catch (error) {
        console.error('Ошибка инициализации сервисов:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <OrdersProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </OrdersProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}