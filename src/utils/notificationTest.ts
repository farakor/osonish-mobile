import { notificationService } from '../services/notificationService';
import { authService } from '../services/authService';

/**
 * Утилиты для тестирования push уведомлений
 */
export class NotificationTest {

  /**
   * Полная диагностика push уведомлений
   */
  static async runFullDiagnostics(): Promise<void> {
    console.log('\n🔍 === ПОЛНАЯ ДИАГНОСТИКА PUSH УВЕДОМЛЕНИЙ ===');

    try {
      // Диагностика сервиса уведомлений
      await notificationService.diagnosePushNotifications();

      // Проверка текущего токена
      const currentToken = notificationService.getCurrentPushToken();
      console.log('\n📱 Текущий push токен:', currentToken ? 'есть' : 'отсутствует');

      if (currentToken) {
        console.log('🎫 Токен:', currentToken.substring(0, 30) + '...');
      }

      // Проверка аутентификации
      const authState = authService.getAuthState();
      console.log('\n👤 Статус аутентификации:');
      console.log('   - Авторизован:', authState.isAuthenticated);
      console.log('   - User ID:', authState.user?.id || 'нет');
      console.log('   - Телефон:', authState.user?.phone || 'нет');

      // Проверка настроек уведомлений
      if (authState.user?.id) {
        const settings = await notificationService.getUserNotificationSettings(authState.user.id);
        console.log('\n⚙️ Настройки уведомлений:');
        console.log('   - Все уведомления:', settings.allNotificationsEnabled);
      }

      console.log('\n✅ Диагностика завершена');

    } catch (error) {
      console.error('❌ Ошибка диагностики:', error);
    }
  }

  /**
   * Тест отправки уведомления самому себе
   */
  static async testSelfNotification(): Promise<boolean> {
    console.log('\n🧪 === ТЕСТ САМОУВЕДОМЛЕНИЯ ===');

    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        console.error('❌ Пользователь не авторизован');
        return false;
      }

      console.log('👤 Отправляем тестовое уведомление пользователю:', authState.user.id);

      const success = await notificationService.testPushNotification();

      if (success) {
        console.log('✅ Тестовое уведомление отправлено успешно!');
        console.log('💡 Проверьте устройство - уведомление должно появиться');
      } else {
        console.error('❌ Не удалось отправить тестовое уведомление');
      }

      return success;
    } catch (error) {
      console.error('❌ Ошибка тестирования:', error);
      return false;
    }
  }

  /**
   * Обновление push токена
   */
  static async refreshPushToken(): Promise<boolean> {
    console.log('\n🔄 === ОБНОВЛЕНИЕ PUSH ТОКЕНА ===');

    try {
      const success = await notificationService.refreshPushToken();

      if (success) {
        console.log('✅ Push токен успешно обновлен');
        const newToken = notificationService.getCurrentPushToken();
        if (newToken) {
          console.log('🎫 Новый токен:', newToken.substring(0, 30) + '...');
        }
      } else {
        console.error('❌ Не удалось обновить push токен');
      }

      return success;
    } catch (error) {
      console.error('❌ Ошибка обновления токена:', error);
      return false;
    }
  }

  /**
   * Добавление тестового локального уведомления
   */
  static async addTestLocalNotification(): Promise<boolean> {
    console.log('\n📱 === ТЕСТ ЛОКАЛЬНОГО УВЕДОМЛЕНИЯ ===');

    try {
      const success = await notificationService.addTestNotification();

      if (success) {
        console.log('✅ Тестовое локальное уведомление добавлено');
        console.log('💡 Проверьте список уведомлений в приложении');
      } else {
        console.error('❌ Не удалось добавить тестовое уведомление');
      }

      return success;
    } catch (error) {
      console.error('❌ Ошибка добавления тестового уведомления:', error);
      return false;
    }
  }

  /**
   * Полный тест всех функций уведомлений
   */
  static async runFullTest(): Promise<void> {
    console.log('\n🚀 === ПОЛНЫЙ ТЕСТ УВЕДОМЛЕНИЙ ===');

    // 1. Диагностика
    await this.runFullDiagnostics();

    // 2. Обновление токена
    await this.refreshPushToken();

    // 3. Тест локального уведомления
    await this.addTestLocalNotification();

    // 4. Тест push уведомления
    await this.testSelfNotification();

    console.log('\n🏁 === ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ===');
    console.log('💡 Проверьте консоль и устройство на наличие уведомлений');
  }
}

// Экспортируем для использования в __DEV__ режиме
if (__DEV__) {
  // Добавляем в глобальный объект для доступа из консоли
  (global as any).NotificationTest = NotificationTest;

  console.log('🧪 NotificationTest доступен в глобальном объекте');
  console.log('💡 Используйте: NotificationTest.runFullTest()');
}
