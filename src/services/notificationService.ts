import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Безопасный импорт expo-notifications для development build
let Notifications: any = null;
try {
  // В development build должен работать нормально
  Notifications = require('expo-notifications');
  console.log('[NotificationService] ✅ expo-notifications загружен');
} catch (error) {
  console.warn('[NotificationService] ⚠️ expo-notifications недоступен:', error.message);
}
import { supabase } from './supabaseClient';
import { authService } from './authService';

// Типы для уведомлений
export interface NotificationSettings {
  allNotificationsEnabled: boolean;
  newOrdersEnabled: boolean;
  newApplicationsEnabled: boolean;
  orderUpdatesEnabled: boolean;
  orderCompletedEnabled: boolean;
}

export interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  userId: string;
  notificationType: 'new_order' | 'new_application' | 'order_update' | 'order_completed';
}

export interface PushToken {
  token: string;
  deviceType: 'ios' | 'android' | 'web';
  deviceId?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private currentPushToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Инициализация сервиса уведомлений
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('[NotificationService] 🔔 Инициализация сервиса уведомлений...');

      // Проверяем доступность Notifications
      if (!Notifications) {
        console.log('[NotificationService] ⚠️ Notifications недоступны. Работаем без push-уведомлений.');
        this.isInitialized = true;
        return;
      }

      // Настройка обработчика уведомлений
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Запрос разрешений на уведомления
      await this.requestPermissions();

      // Регистрация для push уведомлений
      await this.registerForPushNotifications();

      // Настройка слушателей уведомлений
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('[NotificationService] ✅ Сервис уведомлений инициализирован');
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка инициализации:', error);
      console.log('[NotificationService] 💡 Приложение будет работать без push уведомлений');
      // Помечаем как инициализированный, чтобы избежать повторных попыток
      this.isInitialized = true;
    }
  }

  /**
   * Запрос разрешений на уведомления
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      if (!Notifications) {
        console.warn('[NotificationService] ⚠️ Notifications недоступны');
        return false;
      }

      if (!Device.isDevice) {
        console.warn('[NotificationService] ⚠️ Push уведомления работают только на реальных устройствах');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[NotificationService] ⚠️ Разрешение на уведомления не получено');
        return false;
      }

      console.log('[NotificationService] ✅ Разрешение на уведомления получено');
      return true;
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка запроса разрешений:', error);
      return false;
    }
  }

  /**
   * Регистрация для push уведомлений
   */
  private async registerForPushNotifications(): Promise<void> {
    try {
      if (!Notifications) {
        console.log('[NotificationService] ⚠️ Notifications недоступны - пропускаем регистрацию push токена');
        return;
      }

      if (!Device.isDevice) {
        console.log('[NotificationService] ⚠️ Не на реальном устройстве - пропускаем регистрацию push токена');
        return;
      }

      // Проверяем наличие projectId
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId ||
        Constants.manifest?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn('[NotificationService] ⚠️ ProjectId не настроен - пропускаем регистрацию push токена');
        console.log('[NotificationService] 💡 Для продакшена настройте EAS проект');
        return;
      }

      // Получаем Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      this.currentPushToken = tokenData.data;
      console.log('[NotificationService] 📱 Push token получен:', this.currentPushToken);

      // Сохраняем токен в базе данных
      await this.savePushTokenToDatabase(tokenData.data);
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка регистрации push токена:', error);
      // Не выбрасываем ошибку, чтобы приложение продолжало работать
      console.log('[NotificationService] 💡 Приложение будет работать без push уведомлений');
    }
  }

  /**
   * Сохранение push токена в базе данных
   */
  private async savePushTokenToDatabase(token: string): Promise<void> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        console.warn('[NotificationService] ⚠️ Пользователь не авторизован, токен не сохранен');
        return;
      }

      const deviceType = Platform.OS as 'ios' | 'android';
      const deviceId = Constants.deviceId || Constants.sessionId;

      // Деактивируем старые токены для этого устройства
      await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', authState.user.id)
        .eq('device_id', deviceId);

      // Добавляем новый токен
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: authState.user.id,
          token: token,
          device_type: deviceType,
          device_id: deviceId,
          is_active: true
        });

      if (error) {
        console.error('[NotificationService] ❌ Ошибка сохранения токена в БД:', error);
        throw error;
      }

      console.log('[NotificationService] ✅ Push token сохранен в БД');
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка сохранения токена:', error);
      throw error;
    }
  }

  /**
   * Настройка слушателей уведомлений
   */
  private setupNotificationListeners(): void {
    if (!Notifications) {
      console.log('[NotificationService] ⚠️ Notifications недоступны - пропускаем настройку слушателей');
      return;
    }

    // Слушатель полученных уведомлений
    Notifications.addNotificationReceivedListener(notification => {
      console.log('[NotificationService] 📬 Уведомление получено:', notification);
    });

    // Слушатель нажатий на уведомления
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[NotificationService] 👆 Нажатие на уведомление:', response);
      this.handleNotificationTap(response);
    });
  }

  /**
   * Обработка нажатий на уведомления
   */
  private handleNotificationTap(response: any): void {
    try {
      const data = response?.notification?.request?.content?.data;

      // TODO: Добавить навигацию в зависимости от типа уведомления
      console.log('[NotificationService] 🎯 Данные уведомления:', data);
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка обработки нажатия на уведомление:', error);
    }
  }

  /**
   * Отправка push уведомления конкретному пользователю
   */
  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data: any = {},
    notificationType: PushNotificationData['notificationType']
  ): Promise<boolean> {
    try {
      // Проверяем настройки уведомлений пользователя
      const settings = await this.getUserNotificationSettings(userId);
      if (!settings.allNotificationsEnabled) {
        console.log('[NotificationService] 🔇 Уведомления отключены для пользователя:', userId);
        return false;
      }

      // Проверяем конкретную настройку типа уведомления
      if (!this.shouldSendNotification(notificationType, settings)) {
        console.log('[NotificationService] 🔇 Тип уведомления отключен:', notificationType);
        return false;
      }

      // Получаем активные токены пользователя
      const tokens = await this.getUserPushTokens(userId);
      if (tokens.length === 0) {
        console.log('[NotificationService] ⚠️ У пользователя нет активных push токенов:', userId);
        return true; // Возвращаем true, чтобы не блокировать работу приложения
      }

      // Отправляем уведомления
      const promises = tokens.map(token =>
        this.sendPushNotification(token.token, title, body, data)
      );

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(result => result.status === 'fulfilled').length;

      // Сохраняем лог уведомления
      await this.logNotification(userId, title, body, data, notificationType);

      console.log(`[NotificationService] 📤 Отправлено ${successCount}/${tokens.length} уведомлений пользователю: ${userId}`);
      return successCount > 0;
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка отправки уведомления:', error);
      return false;
    }
  }

  /**
   * Отправка push уведомления множественным пользователям
   */
  async sendNotificationToUsers(
    userIds: string[],
    title: string,
    body: string,
    data: any = {},
    notificationType: PushNotificationData['notificationType']
  ): Promise<number> {
    try {
      const promises = userIds.map(userId =>
        this.sendNotificationToUser(userId, title, body, data, notificationType)
      );

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(result =>
        result.status === 'fulfilled' && result.value === true
      ).length;

      console.log(`[NotificationService] 📤 Отправлено уведомлений ${successCount}/${userIds.length} пользователям`);
      return successCount;
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка массовой отправки уведомлений:', error);
      return 0;
    }
  }

  /**
   * Проверка, нужно ли отправлять уведомление данного типа
   */
  private shouldSendNotification(
    type: PushNotificationData['notificationType'],
    settings: NotificationSettings
  ): boolean {
    switch (type) {
      case 'new_order':
        return settings.newOrdersEnabled;
      case 'new_application':
        return settings.newApplicationsEnabled;
      case 'order_update':
        return settings.orderUpdatesEnabled;
      case 'order_completed':
        return settings.orderCompletedEnabled;
      default:
        return true;
    }
  }

  /**
   * Получение push токенов пользователя
   */
  private async getUserPushTokens(userId: string): Promise<PushToken[]> {
    try {
      const { data, error } = await supabase
        .from('push_tokens')
        .select('token, device_type, device_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('[NotificationService] ❌ Ошибка получения токенов:', error);
        return [];
      }

      return data.map(item => ({
        token: item.token,
        deviceType: item.device_type as 'ios' | 'android' | 'web',
        deviceId: item.device_id
      }));
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка получения токенов:', error);
      return [];
    }
  }

  /**
   * Отправка push уведомления через Expo
   */
  private async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data: any = {}
  ): Promise<void> {
    try {
      const message = {
        to: token,
        sound: 'default',
        title,
        body,
        data,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Push notification failed: ${result.message || response.statusText}`);
      }

      console.log('[NotificationService] ✅ Push уведомление отправлено:', result);
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка отправки push уведомления:', error);
      throw error;
    }
  }

  /**
   * Получение настроек уведомлений пользователя
   */
  async getUserNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const { data, error } = await supabase
        .rpc('get_notification_settings', { target_user_id: userId });

      if (error) {
        console.error('[NotificationService] ❌ Ошибка получения настроек:', error);
        // Возвращаем дефолтные настройки
        return {
          allNotificationsEnabled: true,
          newOrdersEnabled: true,
          newApplicationsEnabled: true,
          orderUpdatesEnabled: true,
          orderCompletedEnabled: true,
        };
      }

      const settings = data[0];
      return {
        allNotificationsEnabled: settings.all_notifications_enabled,
        newOrdersEnabled: settings.new_orders_enabled,
        newApplicationsEnabled: settings.new_applications_enabled,
        orderUpdatesEnabled: settings.order_updates_enabled,
        orderCompletedEnabled: settings.order_completed_enabled,
      };
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка получения настроек:', error);
      // Возвращаем дефолтные настройки
      return {
        allNotificationsEnabled: true,
        newOrdersEnabled: true,
        newApplicationsEnabled: true,
        orderUpdatesEnabled: true,
        orderCompletedEnabled: true,
      };
    }
  }

  /**
   * Обновление настроек уведомлений пользователя
   */
  async updateNotificationSettings(settings: NotificationSettings): Promise<boolean> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        throw new Error('Пользователь не авторизован');
      }

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: authState.user.id,
          all_notifications_enabled: settings.allNotificationsEnabled,
          new_orders_enabled: settings.newOrdersEnabled,
          new_applications_enabled: settings.newApplicationsEnabled,
          order_updates_enabled: settings.orderUpdatesEnabled,
          order_completed_enabled: settings.orderCompletedEnabled,
        });

      if (error) {
        console.error('[NotificationService] ❌ Ошибка обновления настроек:', error);
        return false;
      }

      console.log('[NotificationService] ✅ Настройки уведомлений обновлены');
      return true;
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка обновления настроек:', error);
      return false;
    }
  }

  /**
   * Логирование отправленного уведомления
   */
  private async logNotification(
    userId: string,
    title: string,
    body: string,
    data: any,
    notificationType: PushNotificationData['notificationType']
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .insert({
          user_id: userId,
          title,
          body,
          data,
          notification_type: notificationType,
          status: 'sent'
        });

      if (error) {
        console.error('[NotificationService] ❌ Ошибка логирования уведомления:', error);
      }
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка логирования уведомления:', error);
    }
  }

  /**
   * Отключение всех push токенов для текущего пользователя
   */
  async unregisterPushTokens(): Promise<void> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return;
      }

      const { error } = await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', authState.user.id);

      if (error) {
        console.error('[NotificationService] ❌ Ошибка деактивации токенов:', error);
        return;
      }

      console.log('[NotificationService] ✅ Push токены деактивированы');
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка деактивации токенов:', error);
    }
  }

  /**
   * Получение текущего push токена
   */
  getCurrentPushToken(): string | null {
    return this.currentPushToken;
  }
}

export const notificationService = NotificationService.getInstance();