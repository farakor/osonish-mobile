import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { notificationService } from '../../services/notificationService';
import { authService } from '../../services/authService';
import { productionNotificationService } from '../../services/productionNotificationService';

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'info';
  message: string;
}

export const NotificationTestButton: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const addResult = (step: string, status: 'success' | 'error' | 'info', message: string) => {
    setResults(prev => [...prev, { step, status, message }]);
  };

  const runDiagnostics = async () => {
    setIsTesting(true);
    setResults([]);

    try {
      addResult('Начало', 'info', 'Запуск диагностики уведомлений...');

      // 1. Проверка токена
      const token = notificationService.getCurrentPushToken();
      if (token) {
        addResult('Токен', 'success', `Токен найден: ${token.substring(0, 30)}...`);
        addResult('Полный токен', 'info', token);
        console.log('🎫 ПОЛНЫЙ ТОКЕН ДЛЯ КОПИРОВАНИЯ:', token);
      } else {
        addResult('Токен', 'error', 'Push токен не найден');
      }

      // 2. Проверка устройства
      const Device = require('expo-device');
      if (Device.isDevice) {
        addResult('Устройство', 'success', 'Реальное устройство');
      } else {
        addResult('Устройство', 'error', 'Симулятор (push уведомления не работают)');
      }

      // 2.1. Проверка production среды
      const envInfo = productionNotificationService.getEnvironmentInfo();
      addResult('Среда выполнения', 'info',
        `${envInfo.isProduction ? 'Production' : 'Development'} (${envInfo.platform})`);
      addResult('Push сервис', 'info', envInfo.expectedService);
      addResult('App Ownership', 'info', envInfo.appOwnership || 'unknown');

      if (envInfo.isProduction) {
        addResult('Production режим', 'success', 'Используются нативные push сервисы');
      } else {
        addResult('Development режим', 'info', 'Используется Expo Push Service');
      }

      // 3. Проверка разрешений
      try {
        const Notifications = require('expo-notifications');
        const { status } = await Notifications.getPermissionsAsync();

        if (status === 'granted') {
          addResult('Разрешения', 'success', 'Разрешения предоставлены');
        } else {
          addResult('Разрешения', 'error', `Разрешения: ${status}`);

          // Попробуем запросить разрешения
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          addResult('Запрос разрешений', newStatus === 'granted' ? 'success' : 'error',
            `Новый статус: ${newStatus}`);
        }
      } catch (error) {
        addResult('Разрешения', 'error', `Ошибка проверки: ${error instanceof Error ? error.message : String(error)}`);
      }

      // 4. Проверка аутентификации
      const authState = authService.getAuthState();
      if (authState.isAuthenticated && authState.user) {
        addResult('Аутентификация', 'success', `Пользователь: ${authState.user.id}`);
      } else {
        addResult('Аутентификация', 'error', 'Пользователь не авторизован');
      }

      // 5. Тест отправки уведомления
      if (token && Device.isDevice && authState.user) {
        addResult('Тест отправки', 'info', 'Отправляем тестовое уведомление...');

        try {
          const success = await notificationService.testPushNotification();
          if (success) {
            addResult('Тест отправки', 'success', 'Уведомление отправлено! Проверьте устройство');
          } else {
            addResult('Тест отправки', 'error', 'Не удалось отправить уведомление');
          }
        } catch (error) {
          addResult('Тест отправки', 'error', `Ошибка: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        addResult('Тест отправки', 'error', 'Невозможно - нет токена, симулятор или не авторизован');
      }

      // 6. Обновление токена
      addResult('Обновление токена', 'info', 'Пробуем обновить push токен...');
      try {
        const refreshed = await notificationService.refreshPushToken();
        if (refreshed) {
          const newToken = notificationService.getCurrentPushToken();
          addResult('Обновление токена', 'success',
            `Токен обновлен: ${newToken?.substring(0, 30)}...`);
          if (newToken) {
            addResult('Новый полный токен', 'info', newToken);
            console.log('🎫 НОВЫЙ ПОЛНЫЙ ТОКЕН:', newToken);
          }
        } else {
          addResult('Обновление токена', 'error', 'Не удалось обновить токен');
        }
      } catch (error) {
        addResult('Обновление токена', 'error', `Ошибка: ${error instanceof Error ? error.message : String(error)}`);
      }

    } catch (error) {
      addResult('Ошибка', 'error', `Критическая ошибка: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsTesting(false);
      addResult('Завершение', 'info', 'Диагностика завершена');
    }
  };

  const sendDirectTest = async () => {
    const token = notificationService.getCurrentPushToken();

    if (!token) {
      Alert.alert('Ошибка', 'Push токен не найден');
      return;
    }

    try {
      const message = {
        to: token,
        sound: 'default',
        title: 'Прямой тест',
        body: `Время: ${new Date().toLocaleTimeString()}`,
        data: { test: true, direct: true },
        priority: 'high',
        channelId: 'default',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.data && result.data.status === 'ok') {
        Alert.alert('Успех', 'Уведомление отправлено! Проверьте устройство');
      } else {
        Alert.alert('Ошибка', `Ошибка отправки: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      Alert.alert('Ошибка', `Ошибка: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const getStatusColor = (status: 'success' | 'error' | 'info') => {
    switch (status) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'info': return '#3B82F6';
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'info') => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
    }
  };

  return (
    <View style={{
      position: 'absolute',
      top: 100,
      right: 10,
      backgroundColor: 'white',
      padding: 10,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      maxWidth: 300,
      maxHeight: 400,
      zIndex: 1000
    }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
        🔔 Тест уведомлений
      </Text>

      <TouchableOpacity
        onPress={runDiagnostics}
        disabled={isTesting}
        style={{
          backgroundColor: isTesting ? '#9CA3AF' : '#3B82F6',
          padding: 10,
          borderRadius: 5,
          marginBottom: 10
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          {isTesting ? 'Тестирование...' : '🔍 Полная диагностика'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={sendDirectTest}
        style={{
          backgroundColor: '#10B981',
          padding: 10,
          borderRadius: 5,
          marginBottom: 5
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          🚀 Прямой тест
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          const token = notificationService.getCurrentPushToken();
          console.log('🎫 === ПОЛНЫЙ ТОКЕН ДЛЯ КОПИРОВАНИЯ ===');
          console.log(token);
          console.log('💡 Скопируйте токен выше для тестирования');
          Alert.alert('Токен', token ? `Токен скопирован в консоль:\n${token.substring(0, 50)}...` : 'Токен не найден');
        }}
        style={{
          backgroundColor: '#F59E0B',
          padding: 10,
          borderRadius: 5,
          marginBottom: 10
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          📋 Показать токен
        </Text>
      </TouchableOpacity>

      {results.length > 0 && (
        <ScrollView style={{ maxHeight: 200 }}>
          {results.map((result, index) => (
            <View key={index} style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginBottom: 5,
              padding: 5,
              backgroundColor: '#F3F4F6',
              borderRadius: 3
            }}>
              <Text style={{ marginRight: 5 }}>
                {getStatusIcon(result.status)}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: getStatusColor(result.status)
                }}>
                  {result.step}
                </Text>
                <Text style={{ fontSize: 11, color: '#374151' }}>
                  {result.message}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default NotificationTestButton;
