import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Production сервис для отправки push уведомлений
 * Всегда использует Expo Push Service (Expo шлёт дальше в FCM/APNs)
 */

interface ProductionPushMessage {
  to: string;
  title: string;
  body: string;
  data?: any;
  sound?: string;
  priority?: 'normal' | 'high';
  channelId?: string;
}

class ProductionNotificationService {
  private static instance: ProductionNotificationService;
  static getInstance(): ProductionNotificationService {
    if (!ProductionNotificationService.instance) {
      ProductionNotificationService.instance = new ProductionNotificationService();
    }
    return ProductionNotificationService.instance;
  }

  /**
   * Определяет, находимся ли мы в production сборке
   */
  private isProductionBuild(): boolean {
    return !__DEV__ && (Constants.appOwnership as string) === 'standalone';
  }

  /**
   * Получает FCM Server Key из EAS credentials
   */
  // Удаляем попытки прямой отправки в FCM/APNs — используем только Expo API

  /**
   * Отправляет push уведомление через FCM (Android)
   */
  private async sendFCMNotification(_message: ProductionPushMessage): Promise<boolean> {
    return this.sendViaExpoAPI(_message);
  }

  /**
   * Отправляет push уведомление через APNs (iOS)
   */
  private async sendAPNsNotification(_message: ProductionPushMessage): Promise<boolean> {
    return this.sendViaExpoAPI(_message);
  }

  /**
   * Fallback отправка через Expo API
   */
  private async sendViaExpoAPI(message: ProductionPushMessage): Promise<boolean> {
    try {
      console.log('\n🚀 [ProductionNotificationService] ОТПРАВКА ЧЕРЕЗ EXPO PUSH SERVICE');
      console.log('[ProductionNotificationService] 🎯 Токен получателя:', message.to.substring(0, 30) + '...');
      console.log('[ProductionNotificationService] 📝 Заголовок:', message.title);
      console.log('[ProductionNotificationService] 📄 Текст:', message.body);
      console.log('[ProductionNotificationService] 📱 Платформа:', Platform.OS);
      console.log('[ProductionNotificationService] 🏗️ Среда:', this.isProductionBuild() ? 'Production' : 'Development/Expo Go');

      const expoMessage = {
        to: message.to,
        sound: message.sound || 'default',
        title: message.title,
        body: message.body,
        data: message.data || {},
        priority: message.priority || 'high',
        channelId: message.channelId || 'default',
      };

      console.log('[ProductionNotificationService] 📦 Полное сообщение для Expo API:');
      console.log(JSON.stringify(expoMessage, null, 2));

      console.log('[ProductionNotificationService] 🌐 Отправляем HTTP запрос к Expo API...');
      const requestStartTime = Date.now();

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expoMessage),
      });

      const requestTime = Date.now() - requestStartTime;
      console.log(`[ProductionNotificationService] ⏱️ HTTP запрос выполнен за ${requestTime}мс`);
      console.log(`[ProductionNotificationService] 📊 HTTP статус: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        console.error(`[ProductionNotificationService] ❌ HTTP ошибка: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('[ProductionNotificationService] 📄 Тело ошибки:', errorText);
        return false;
      }

      const result = await response.json();
      console.log('[ProductionNotificationService] 📡 Полный ответ Expo API:');
      console.log(JSON.stringify(result, null, 2));

      // Проверяем успешность отправки
      const isSuccess = result.data && result.data.status === 'ok';

      if (isSuccess) {
        console.log('[ProductionNotificationService] ✅ УСПЕШНО: Уведомление принято Expo API');
        if (result.data.id) {
          console.log('[ProductionNotificationService] 🆔 ID уведомления:', result.data.id);
        }
      } else {
        console.error('[ProductionNotificationService] ❌ ОШИБКА: Expo API отклонил уведомление');
        if (result.data && result.data.status) {
          console.error('[ProductionNotificationService] 📊 Статус от Expo:', result.data.status);
        }
        if (result.data && result.data.message) {
          console.error('[ProductionNotificationService] 💬 Сообщение от Expo:', result.data.message);
        }
        if (result.errors) {
          console.error('[ProductionNotificationService] 🚨 Ошибки от Expo:', result.errors);
        }
      }

      return isSuccess;
    } catch (error) {
      console.error('\n🚨 [ProductionNotificationService] КРИТИЧЕСКАЯ ОШИБКА EXPO API 🚨');
      console.error('[ProductionNotificationService] ❌ Ошибка:', error);
      console.error('[ProductionNotificationService] 📊 Stack trace:', error instanceof Error ? error.stack : 'Нет stack trace');
      console.error('[ProductionNotificationService] 💡 Возможные причины:');
      console.error('[ProductionNotificationService] 💡 - Нет интернет соединения');
      console.error('[ProductionNotificationService] 💡 - Недействительный токен');
      console.error('[ProductionNotificationService] 💡 - Проблемы с Expo Push Service');
      return false;
    }
  }

  /**
   * Основной метод отправки уведомлений
   */
  async sendPushNotification(message: ProductionPushMessage): Promise<boolean> {
    try {
      console.log('[ProductionNotificationService] 📱 Отправка push уведомления');
      console.log('[ProductionNotificationService] 🏗️ Production build:', this.isProductionBuild());
      console.log('[ProductionNotificationService] 📱 Platform:', Platform.OS);
      console.log('[ProductionNotificationService] 🎯 To:', message.to.substring(0, 20) + '...');

      // Всегда используем Expo API. Expo сам маршрутизирует в FCM/APNs по токену и проекту
      return await this.sendViaExpoAPI(message);

    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка отправки:', error);
      return false;
    }
  }

  /**
   * Проверяет, поддерживается ли токен в текущей среде
   */
  isTokenCompatible(token: string): boolean {
    if (!token) return false;

    // Expo токены работают везде
    if (token.startsWith('ExponentPushToken[')) {
      return true;
    }

    // Остальные (не Expo) токены считаем несовместимыми с клиентской отправкой
    return false;
  }

  /**
   * Получает информацию о текущей среде
   */
  getEnvironmentInfo() {
    return {
      isProduction: this.isProductionBuild(),
      platform: Platform.OS,
      appOwnership: Constants.appOwnership,
      isDev: __DEV__,
      expectedService: 'Expo Push Service'
    };
  }
}

export const productionNotificationService = ProductionNotificationService.getInstance();