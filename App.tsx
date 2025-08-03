import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation';
import { OrdersProvider } from './src/hooks';

// Инициализация сервисов
import { initSMSService } from './src/services/smsService';
import { authService } from './src/services/authService';

// Подключаем тестовые утилиты в dev режиме
if (__DEV__) {
  import('./src/utils/testingHelpers');
}

export default function App() {
  useEffect(() => {
    // Инициализируем сервисы при запуске приложения
    const initializeServices = async () => {
      try {
        // Инициализируем SMS сервис
        initSMSService();

        // Инициализируем сервис авторизации
        await authService.init();

        console.log('Сервисы успешно инициализированы');
      } catch (error) {
        console.error('Ошибка инициализации сервисов:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <OrdersProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </OrdersProvider>
  );
}
