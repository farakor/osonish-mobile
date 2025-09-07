import { notificationService } from '../services/notificationService';

/**
 * Быстрый тест уведомлений для отладки в Expo Go
 */
export const quickNotificationTest = {

  /**
   * Получить текущий push токен
   */
  getToken: () => {
    const token = notificationService.getCurrentPushToken();
    console.log('🎫 Текущий push токен:', token);
    console.log('📋 ПОЛНЫЙ ТОКЕН ДЛЯ КОПИРОВАНИЯ:', token);
    if (token) {
      console.log('💡 Скопируйте этот токен для тестирования через скрипт');
    }
    return token;
  },

  /**
   * Отправить тестовое уведомление через внешний API
   */
  sendTest: async (token?: string) => {
    const pushToken = token || notificationService.getCurrentPushToken();

    if (!pushToken) {
      console.error('❌ Push токен не найден');
      return false;
    }

    console.log('🚀 Отправляем тестовое уведомление...');
    console.log('🎫 Токен:', pushToken.substring(0, 30) + '...');

    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title: 'Тест из приложения',
        body: `Время: ${new Date().toLocaleTimeString()}`,
        data: { test: true },
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
      console.log('📡 Ответ Expo:', JSON.stringify(result, null, 2));

      if (result.data && result.data.status === 'ok') {
        console.log('✅ Уведомление отправлено успешно!');
        console.log('💡 Проверьте устройство - должно появиться уведомление');
        return true;
      } else {
        console.error('❌ Ошибка отправки:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
      return false;
    }
  },

  /**
   * Проверить разрешения на уведомления
   */
  checkPermissions: async () => {
    try {
      const Notifications = require('expo-notifications');
      const { status } = await Notifications.getPermissionsAsync();

      console.log('🔐 Статус разрешений:', status);

      if (status !== 'granted') {
        console.log('⚠️ Разрешения не предоставлены, запрашиваем...');
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        console.log('🔐 Новый статус:', newStatus);
        return newStatus === 'granted';
      }

      return true;
    } catch (error) {
      console.error('❌ Ошибка проверки разрешений:', error);
      return false;
    }
  },

  /**
   * Полная диагностика
   */
  diagnose: async () => {
    console.log('\n🔍 === БЫСТРАЯ ДИАГНОСТИКА ===');

    // 1. Проверка токена
    const token = quickNotificationTest.getToken();

    // 2. Проверка разрешений
    const hasPermissions = await quickNotificationTest.checkPermissions();
    console.log('🔐 Разрешения:', hasPermissions ? '✅ Есть' : '❌ Нет');

    // 3. Проверка устройства
    const Device = require('expo-device');
    console.log('📱 Реальное устройство:', Device.isDevice ? '✅ Да' : '❌ Нет (симулятор)');

    // 4. Тест отправки
    if (token && hasPermissions) {
      console.log('\n🧪 Отправляем тестовое уведомление...');
      await quickNotificationTest.sendTest(token);
    } else {
      console.log('❌ Не можем отправить тест - нет токена или разрешений');
    }

    console.log('\n✅ Диагностика завершена');
  }
};

// Добавляем в глобальный объект для доступа из консоли
if (__DEV__) {
  (global as any).quickTest = quickNotificationTest;
  console.log('🧪 quickTest доступен в консоли');
  console.log('💡 Используйте: quickTest.diagnose()');
}
