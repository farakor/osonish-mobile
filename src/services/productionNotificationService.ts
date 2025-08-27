import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Безопасный импорт expo-notifications
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  console.log('[ProductionNotificationService] ✅ expo-notifications загружен');
} catch (error) {
  console.warn('[ProductionNotificationService] ⚠️ expo-notifications недоступен:', error.message);
}

import { supabase } from './supabaseClient';
import { authService } from './authService';

// Типы для production уведомлений
export interface ProductionNotificationConfig {
  useCustomServer: boolean;
  customServerUrl?: string;
  customServerToken?: string;
  fcmServerKey?: string;
  apnsKeyId?: string;
  apnsTeamId?: string;
}

export interface NotificationAnalytics {
  userId: string;
  notificationType: string;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
  platform: string;
  appVersion: string;
  error?: string;
  timestamp: string;
}

export interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  userId: string;
  notificationType: 'new_order' | 'new_application' | 'order_update' | 'order_completed' | 'work_reminder' | 'complete_work_reminder';
}

class ProductionNotificationService {
  private static instance: ProductionNotificationService;
  private isInitialized = false;
  private currentPushToken: string | null = null;
  private isRegistering = false;
  private config: ProductionNotificationConfig;

  // Ключи для локального хранения
  private static readonly STORAGE_KEY_CONFIG = '@osonish_notification_config';
  private static readonly STORAGE_KEY_ANALYTICS = '@osonish_notification_analytics';

  static getInstance(): ProductionNotificationService {
    if (!ProductionNotificationService.instance) {
      ProductionNotificationService.instance = new ProductionNotificationService();
    }
    return ProductionNotificationService.instance;
  }

  constructor() {
    // Дефолтная конфигурация - использовать Expo Push Service
    this.config = {
      useCustomServer: false,
    };
  }

  /**
   * Инициализация production сервиса уведомлений
   */
  async init(config?: Partial<ProductionNotificationConfig>): Promise<void> {
    if (this.isInitialized) {
      console.log('[ProductionNotificationService] ⚠️ Сервис уже инициализирован');
      return;
    }

    this.isInitialized = true;

    try {
      console.log('[ProductionNotificationService] 🚀 Инициализация production сервиса уведомлений...');

      // Загружаем конфигурацию
      await this.loadConfig(config);

      // Проверяем доступность Notifications
      if (!Notifications) {
        console.log('[ProductionNotificationService] ⚠️ Notifications недоступны. Работаем без push-уведомлений.');
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

      // Запрос разрешений
      await this.requestPermissions();

      // Регистрация для push уведомлений
      await this.registerForPushNotifications();

      // Настройка слушателей
      this.setupNotificationListeners();

      console.log('[ProductionNotificationService] ✅ Production сервис уведомлений инициализирован');
      console.log('[ProductionNotificationService] 📊 Конфигурация:', {
        useCustomServer: this.config.useCustomServer,
        hasCustomServerUrl: !!this.config.customServerUrl,
        platform: Platform.OS
      });
    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка инициализации:', error);
    }
  }

  /**
   * Загрузка конфигурации
   */
  private async loadConfig(config?: Partial<ProductionNotificationConfig>): Promise<void> {
    try {
      // Загружаем сохраненную конфигурацию
      const savedConfig = await AsyncStorage.getItem(ProductionNotificationService.STORAGE_KEY_CONFIG);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        this.config = { ...this.config, ...parsedConfig };
      }

      // Применяем переданную конфигурацию
      if (config) {
        this.config = { ...this.config, ...config };
        await this.saveConfig();
      }

      console.log('[ProductionNotificationService] ⚙️ Конфигурация загружена:', {
        useCustomServer: this.config.useCustomServer,
        hasCustomUrl: !!this.config.customServerUrl
      });
    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка загрузки конфигурации:', error);
    }
  }

  /**
   * Сохранение конфигурации
   */
  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        ProductionNotificationService.STORAGE_KEY_CONFIG,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка сохранения конфигурации:', error);
    }
  }

  /**
   * Обновление конфигурации
   */
  async updateConfig(config: Partial<ProductionNotificationConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.saveConfig();
    console.log('[ProductionNotificationService] ✅ Конфигурация обновлена');
  }

  /**
   * Запрос разрешений на уведомления
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      if (!Notifications || !Device.isDevice) {
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[ProductionNotificationService] ⚠️ Разрешение на уведомления не получено');
        return false;
      }

      console.log('[ProductionNotificationService] ✅ Разрешение на уведомления получено');
      return true;
    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка запроса разрешений:', error);
      return false;
    }
  }

  /**
   * Регистрация для push уведомлений
   */
  private async registerForPushNotifications(): Promise<void> {
    if (this.isRegistering) {
      console.log('[ProductionNotificationService] ⚠️ Регистрация уже выполняется');
      return;
    }

    this.isRegistering = true;

    try {
      if (!Notifications || !Device.isDevice) {
        console.log('[ProductionNotificationService] ⚠️ Пропускаем регистрацию push токена');
        return;
      }

      // Получаем projectId
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId ||
        Constants.manifest?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn('[ProductionNotificationService] ⚠️ ProjectId не настроен');
        return;
      }

      // Получаем Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      if (this.currentPushToken === tokenData.data) {
        console.log('[ProductionNotificationService] 📱 Push token не изменился');
        return;
      }

      this.currentPushToken = tokenData.data;
      console.log('[ProductionNotificationService] 📱 Push token получен:',
        this.currentPushToken.substring(0, 20) + '...');

      // Сохраняем токен в базе данных
      await this.savePushTokenToDatabase(tokenData.data);

      // Логируем аналитику
      await this.logAnalytics({
        userId: authService.getAuthState().user?.id || 'unknown',
        notificationType: 'token_registration',
        status: 'sent',
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version || '1.0.0',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка регистрации push токена:', error);

      // Логируем ошибку
      await this.logAnalytics({
        userId: authService.getAuthState().user?.id || 'unknown',
        notificationType: 'token_registration',
        status: 'failed',
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version || '1.0.0',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      this.isRegistering = false;
    }
  }

  /**
   * Сохранение push токена в базе данных
   */
  private async savePushTokenToDatabase(token: string): Promise<void> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        console.warn('[ProductionNotificationService] ⚠️ Пользователь не авторизован');
        return;
      }

      const deviceType = Platform.OS as 'ios' | 'android';
      const deviceId = Constants.deviceId || Constants.sessionId;

      // Удаляем старые токены для этого устройства
      const { error: deleteError } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', authState.user.id)
        .eq('device_id', deviceId);

      if (deleteError) {
        console.warn('[ProductionNotificationService] ⚠️ Ошибка удаления старых токенов:', deleteError);
      }

      // Добавляем новый токен
      const { error } = await supabase
        .from('push_tokens')
        .insert({
          user_id: authState.user.id,
          token: token,
          device_type: deviceType,
          device_id: deviceId,
          is_active: true
        });

      if (error) {
        console.error('[ProductionNotificationService] ❌ Ошибка сохранения токена в БД:', error);
        throw error;
      }

      console.log('[ProductionNotificationService] ✅ Push token сохранен в БД');
    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка сохранения токена:', error);
      throw error;
    }
  }

  /**
   * Настройка слушателей уведомлений
   */
  private setupNotificationListeners(): void {
    if (!Notifications) {
      return;
    }

    // Слушатель полученных уведомлений
    Notifications.addNotificationReceivedListener(async (notification) => {
      console.log('[ProductionNotificationService] 📬 Уведомление получено:', notification);

      // Логируем доставку
      const data = notification.request?.content?.data;
      if (data?.userId && data?.notificationType) {
        await this.logAnalytics({
          userId: data.userId,
          notificationType: data.notificationType,
          status: 'delivered',
          platform: Platform.OS,
          appVersion: Constants.expoConfig?.version || '1.0.0',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Слушатель нажатий на уведомления
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      console.log('[ProductionNotificationService] 👆 Нажатие на уведомление:', response);

      // Логируем открытие
      const data = response?.notification?.request?.content?.data;
      if (data?.userId && data?.notificationType) {
        await this.logAnalytics({
          userId: data.userId,
          notificationType: data.notificationType,
          status: 'opened',
          platform: Platform.OS,
          appVersion: Constants.expoConfig?.version || '1.0.0',
          timestamp: new Date().toISOString()
        });
      }

      this.handleNotificationTap(response);
    });
  }

  /**
   * Обработка нажатий на уведомления
   */
  private handleNotificationTap(response: any): void {
    try {
      const data = response?.notification?.request?.content?.data;
      console.log('[ProductionNotificationService] 🎯 Данные уведомления:', data);

      // TODO: Добавить навигацию в зависимости от типа уведомления
      // Например:
      // - new_order -> перейти к списку заказов
      // - new_application -> перейти к заказу с откликами
      // - work_reminder -> перейти к деталям заказа

    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка обработки нажатия:', error);
    }
  }

  /**
   * Отправка push уведомления (production версия)
   */
  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data: any = {},
    notificationType: PushNotificationData['notificationType']
  ): Promise<boolean> {
    try {
      console.log('[ProductionNotificationService] 🚀 Отправка уведомления пользователю:', userId);

      // Получаем токены пользователя
      const tokens = await this.getUserPushTokens(userId);
      if (tokens.length === 0) {
        console.log('[ProductionNotificationService] ⚠️ У пользователя нет активных push токенов');
        return false;
      }

      // Используем самый новый токен
      const latestToken = tokens[tokens.length - 1];
      console.log('[ProductionNotificationService] 🎯 Используем токен:',
        latestToken.token.substring(0, 20) + '...');

      let success = false;

      // Выбираем метод отправки в зависимости от конфигурации
      if (this.config.useCustomServer && this.config.customServerUrl) {
        success = await this.sendViaCustomServer(
          latestToken.token,
          title,
          body,
          { ...data, userId, notificationType }
        );
      } else {
        success = await this.sendViaExpoService(
          latestToken.token,
          title,
          body,
          { ...data, userId, notificationType }
        );
      }

      // Логируем результат
      await this.logAnalytics({
        userId,
        notificationType,
        status: success ? 'sent' : 'failed',
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version || '1.0.0',
        timestamp: new Date().toISOString()
      });

      return success;
    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка отправки уведомления:', error);

      // Логируем ошибку
      await this.logAnalytics({
        userId,
        notificationType,
        status: 'failed',
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version || '1.0.0',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return false;
    }
  }

  /**
   * Отправка через Expo Push Service
   */
  private async sendViaExpoService(
    token: string,
    title: string,
    body: string,
    data: any = {}
  ): Promise<boolean> {
    try {
      console.log('[ProductionNotificationService] 📡 Отправка через Expo Push Service');

      const message = {
        to: token,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
        channelId: 'default',
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
        console.error('[ProductionNotificationService] ❌ Ошибка Expo API:', result);
        return false;
      }

      // Проверяем статус в ответе
      if (result.data && result.data[0]?.status === 'ok') {
        console.log('[ProductionNotificationService] ✅ Уведомление отправлено через Expo');
        return true;
      } else {
        console.error('[ProductionNotificationService] ❌ Ошибка от Expo:', result.data?.[0]?.details);
        return false;
      }
    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка Expo отправки:', error);
      return false;
    }
  }

  /**
   * Отправка через собственный сервер
   */
  private async sendViaCustomServer(
    token: string,
    title: string,
    body: string,
    data: any = {}
  ): Promise<boolean> {
    try {
      console.log('[ProductionNotificationService] 🖥️ Отправка через собственный сервер');

      if (!this.config.customServerUrl || !this.config.customServerToken) {
        console.error('[ProductionNotificationService] ❌ Не настроен собственный сервер');
        return false;
      }

      const payload = {
        token,
        title,
        body,
        data,
        platform: Platform.OS
      };

      const response = await fetch(`${this.config.customServerUrl}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.customServerToken}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('[ProductionNotificationService] ❌ Ошибка собственного сервера:', response.statusText);
        return false;
      }

      const result = await response.json();
      console.log('[ProductionNotificationService] ✅ Уведомление отправлено через собственный сервер');
      return result.success || false;
    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка собственного сервера:', error);
      return false;
    }
  }

  /**
   * Получение push токенов пользователя
   */
  private async getUserPushTokens(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('push_tokens')
        .select('token, device_type, device_id, created_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[ProductionNotificationService] ❌ Ошибка получения токенов:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка получения токенов:', error);
      return [];
    }
  }

  /**
   * Логирование аналитики
   */
  private async logAnalytics(analytics: NotificationAnalytics): Promise<void> {
    try {
      // Сохраняем локально
      const stored = await AsyncStorage.getItem(ProductionNotificationService.STORAGE_KEY_ANALYTICS);
      const analyticsArray = stored ? JSON.parse(stored) : [];

      analyticsArray.push(analytics);

      // Ограничиваем размер локального хранилища
      if (analyticsArray.length > 1000) {
        analyticsArray.splice(0, analyticsArray.length - 1000);
      }

      await AsyncStorage.setItem(
        ProductionNotificationService.STORAGE_KEY_ANALYTICS,
        JSON.stringify(analyticsArray)
      );

      // Пытаемся отправить в базу данных (опционально)
      try {
        await supabase
          .from('notification_analytics')
          .insert(analytics);
      } catch (dbError) {
        console.warn('[ProductionNotificationService] ⚠️ Не удалось сохранить аналитику в БД:', dbError.message);
      }

      console.log('[ProductionNotificationService] 📊 Аналитика сохранена:', {
        type: analytics.notificationType,
        status: analytics.status,
        platform: analytics.platform
      });
    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка логирования аналитики:', error);
    }
  }

  /**
   * Получение аналитики
   */
  async getAnalytics(): Promise<NotificationAnalytics[]> {
    try {
      const stored = await AsyncStorage.getItem(ProductionNotificationService.STORAGE_KEY_ANALYTICS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка получения аналитики:', error);
      return [];
    }
  }

  /**
   * Очистка аналитики
   */
  async clearAnalytics(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ProductionNotificationService.STORAGE_KEY_ANALYTICS);
      console.log('[ProductionNotificationService] 🗑️ Аналитика очищена');
    } catch (error) {
      console.error('[ProductionNotificationService] ❌ Ошибка очистки аналитики:', error);
    }
  }

  /**
   * Диагностика production системы
   */
  async diagnose(): Promise<void> {
    console.log('\n🔍 === ДИАГНОСТИКА PRODUCTION УВЕДОМЛЕНИЙ ===');

    try {
      // Базовая информация
      console.log('📱 Базовая информация:');
      console.log('  - Device.isDevice:', Device.isDevice);
      console.log('  - Platform.OS:', Platform.OS);
      console.log('  - Notifications доступны:', !!Notifications);
      console.log('  - Текущий токен:', this.currentPushToken ? 'есть' : 'нет');

      // Конфигурация
      console.log('\n⚙️ Конфигурация:');
      console.log('  - Собственный сервер:', this.config.useCustomServer);
      console.log('  - URL сервера:', this.config.customServerUrl || 'не настроен');
      console.log('  - Токен сервера:', this.config.customServerToken ? 'есть' : 'нет');

      // Разрешения
      if (Notifications) {
        console.log('\n🔐 Разрешения:');
        const { status } = await Notifications.getPermissionsAsync();
        console.log('  - Статус разрешений:', status);
      }

      // Аналитика
      console.log('\n📊 Аналитика:');
      const analytics = await this.getAnalytics();
      console.log('  - Записей аналитики:', analytics.length);

      if (analytics.length > 0) {
        const recent = analytics.slice(-5);
        console.log('  - Последние 5 записей:');
        recent.forEach((record, index) => {
          console.log(`    ${index + 1}. ${record.notificationType} - ${record.status} (${record.platform})`);
        });
      }

      console.log('\n✅ Диагностика завершена');
    } catch (error) {
      console.error('❌ Ошибка диагностики:', error);
    }
  }

  /**
   * Получение текущего токена
   */
  getCurrentPushToken(): string | null {
    return this.currentPushToken;
  }

  /**
   * Получение конфигурации
   */
  getConfig(): ProductionNotificationConfig {
    return { ...this.config };
  }
}

export const productionNotificationService = ProductionNotificationService.getInstance();
