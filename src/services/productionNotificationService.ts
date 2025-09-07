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
      console.log('[ProductionNotificationService] 🚀 Отправка через Expo Push Service');
      console.log('[ProductionNotificationService] 🎯 Токен получателя:', message.to.substring(0, 30) + '...');
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

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expoMessage),
      });

      const result = await response.json();
      console.log('[ProductionNotificationService] 📡 Ответ Expo API:', result);

      return result.data && result.data.status === 'ok';
    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка Expo API:', error);
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