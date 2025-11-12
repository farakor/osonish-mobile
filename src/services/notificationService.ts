import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Безопасный импорт expo-notifications для development build
let Notifications: any = null;
try {
  // В development build должен работать нормально
  Notifications = require('expo-notifications');
  console.log('[NotificationService] ✅ expo-notifications загружен');
} catch (error: any) {
  console.warn('[NotificationService] ⚠️ expo-notifications недоступен:', error.message);
}
import { supabase } from './supabaseClient';
import { supabaseAdmin, isAdminAvailable } from './supabaseAdminClient';
import { authService } from './authService';
// Убираем прямую работу с FCM/APNs. Используем только Expo Push Service
import { productionNotificationService } from './productionNotificationService';

// Типы для уведомлений
export interface NotificationSettings {
  allNotificationsEnabled: boolean;
}

export interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  userId: string;
  notificationType: 'new_order' | 'new_application' | 'order_update' | 'order_completed' | 'order_cancelled' | 'work_reminder' | 'complete_work_reminder';
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: any;
  notificationType: 'new_order' | 'new_application' | 'order_update' | 'order_completed' | 'work_reminder' | 'complete_work_reminder';
  isRead: boolean;
  createdAt: string;
}

export interface PushToken {
  token: string;
  deviceType: 'ios' | 'android' | 'web';
  deviceId?: string;
  createdAt?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private currentPushToken: string | null = null;
  private isRegistering = false;

  // Ключи для локального хранения уведомлений
  private static readonly STORAGE_KEY_NOTIFICATIONS = '@osonish_notifications';
  private static readonly MAX_LOCAL_NOTIFICATIONS = 100; // Максимальное количество уведомлений в кэше

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
      console.log('[NotificationService] ⚠️ Сервис уже инициализирован, пропускаем');
      return;
    }

    // Помечаем как инициализирующийся, чтобы избежать повторных вызовов
    this.isInitialized = true;

    try {
      console.log('[NotificationService] 🔔 Инициализация сервиса уведомлений...');

      // Проверяем доступность Notifications
      if (!Notifications) {
        console.log('[NotificationService] ⚠️ Notifications недоступны. Работаем без push-уведомлений.');
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

      // Создаём канал уведомлений для Android
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          });
          console.log('[NotificationService] ✅ Android notification channel настроен');
        }
      } catch (channelError) {
        console.warn('[NotificationService] ⚠️ Не удалось настроить Android канал уведомлений:', channelError);
      }

      // Запрос разрешений на уведомления
      await this.requestPermissions();

      // Очищаем старые токены перед регистрацией
      await this.cleanupOldTokens();

      // Регистрация для push уведомлений
      await this.registerForPushNotifications();

      // Настройка слушателей уведомлений
      this.setupNotificationListeners();

      console.log('[NotificationService] ✅ Сервис уведомлений инициализирован');
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка инициализации:', error);
      console.log('[NotificationService] 💡 Приложение будет работать без push уведомлений');
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
    // Защита от повторных вызовов
    if (this.isRegistering) {
      console.log('[NotificationService] ⚠️ Регистрация уже выполняется, пропускаем');
      return;
    }

    this.isRegistering = true;

    try {
      if (!Device.isDevice) {
        console.log('[NotificationService] ⚠️ Не на реальном устройстве - пропускаем регистрацию push токена');
        return;
      }

      // Всегда получаем Expo Push Token через EAS projectId (и в dev, и в prod)
      if (!Notifications) {
        console.log('[NotificationService] ⚠️ Notifications недоступны - пропускаем регистрацию push токена');
        return;
      }

      // Проверяем наличие projectId
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId ||
        (Constants.manifest as any)?.extra?.eas?.projectId;

      console.log('[NotificationService] 🔍 Поиск EAS projectId...');
      console.log('[NotificationService] 📋 Constants.expoConfig?.extra?.eas?.projectId:', Constants.expoConfig?.extra?.eas?.projectId);
      console.log('[NotificationService] 📋 Constants.easConfig?.projectId:', Constants.easConfig?.projectId);
      console.log('[NotificationService] 📋 Constants.manifest?.extra?.eas?.projectId:', (Constants.manifest as any)?.extra?.eas?.projectId);
      console.log('[NotificationService] ✅ Итоговый projectId:', projectId);

      if (!projectId) {
        console.warn('[NotificationService] ⚠️ ProjectId не настроен - пропускаем регистрацию push токена');
        console.log('[NotificationService] 💡 Для продакшена настройте EAS проект');
        return;
      }

      console.log('[NotificationService] 📱 Получение Expo push токена с projectId:', projectId);

      // Получаем Expo push token (на проде это будет FCM/APNs под капотом)
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      // Проверяем, не изменился ли токен
      if (this.currentPushToken === tokenData.data) {
        console.log('[NotificationService] 📱 Expo push token не изменился, пропускаем сохранение');
        return;
      }

      this.currentPushToken = tokenData.data;
      console.log('[NotificationService] ✅ Expo push token получен:', this.currentPushToken);
      console.log('[NotificationService] 🎫 ПОЛНЫЙ ТОКЕН ДЛЯ ТЕСТИРОВАНИЯ:', this.currentPushToken);

      // Сохраняем токен в базе данных
      await this.savePushTokenToDatabase(tokenData.data);
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка регистрации push токена:', error);
      // Не выбрасываем ошибку, чтобы приложение продолжало работать
      console.log('[NotificationService] 💡 Приложение будет работать без push уведомлений');
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
        console.warn('[NotificationService] ⚠️ Пользователь не авторизован, токен не сохранен');
        return;
      }

      const deviceType = Platform.OS as 'ios' | 'android';
      const deviceId = Constants.deviceId || Constants.sessionId;

      // Используем UPSERT (INSERT ... ON CONFLICT ... DO UPDATE)
      // Это атомарная операция, которая предотвращает дубликаты
      const tokenData = {
        user_id: authState.user.id,
        token: token,
        device_type: deviceType,
        device_id: deviceId,
        is_active: true
      };

      // Используем upsert - если токен существует, обновляем его
      const { error } = await supabase
        .from('push_tokens')
        .upsert(tokenData, {
          onConflict: 'user_id,token', // Конфликт по комбинации user_id + token
          ignoreDuplicates: false // Обновляем существующую запись
        });

      if (error) {
        console.error('[NotificationService] ❌ Ошибка сохранения токена в БД:', error);
        throw error;
      }

      console.log('[NotificationService] ✅ Push token сохранен/обновлен в БД');
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
    Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('[NotificationService] 📬 Уведомление получено:', notification);
      // Сохраняем уведомление локально при получении
      this.saveNotificationLocally(notification);
    });

    // Слушатель нажатий на уведомления
    Notifications.addNotificationResponseReceivedListener((response: any) => {
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
   * 
   * ⚠️ ОТКЛЮЧЕНО: Уведомления теперь отправляются только с сервера
   * См. osonish-admin/src/app/api/cron/process-notification-queue/route.ts
   */
  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data: any = {},
    notificationType: PushNotificationData['notificationType']
  ): Promise<boolean> {
    // 🚫 KILL SWITCH: Отключаем отправку уведомлений из мобильного приложения
    console.log(`\n🚫 [NotificationService] ОТПРАВКА ОТКЛЮЧЕНА - используется серверная система`);
    console.log(`[NotificationService] 👤 Пользователь: ${userId}`);
    console.log(`[NotificationService] 📝 Заголовок: "${title}"`);
    console.log(`[NotificationService] 📄 Текст: "${body}"`);
    console.log(`[NotificationService] 🏷️ Тип: ${notificationType}`);
    console.log(`[NotificationService] 🖥️ Уведомление будет отправлено автоматически с сервера через database triggers`);
    console.log(`[NotificationService] 📚 Документация: SQL/create_notification_triggers.sql`);
    return true; // Возвращаем true для обратной совместимости
    
    // ========== СТАРЫЙ КОД (ОТКЛЮЧЕН) ==========
    /*
    try {
      console.log(`\n🔔 [NotificationService] ОТПРАВКА УВЕДОМЛЕНИЯ ПОЛЬЗОВАТЕЛЮ ${userId}`);
      console.log(`[NotificationService] 📝 Заголовок: "${title}"`);
      console.log(`[NotificationService] 📄 Текст: "${body}"`);
      console.log(`[NotificationService] 🏷️ Тип: ${notificationType}`);
      console.log(`[NotificationService] 📦 Данные:`, data);

      // Проверяем настройки уведомлений пользователя
      console.log(`[NotificationService] 🔍 Проверяем настройки уведомлений пользователя...`);
      const settingsStartTime = Date.now();
      const settings = await this.getUserNotificationSettings(userId);
      const settingsTime = Date.now() - settingsStartTime;

      console.log(`[NotificationService] ⏱️ Настройки получены за ${settingsTime}мс:`, settings);

      if (!settings.allNotificationsEnabled) {
        console.log('[NotificationService] 🔇 БЛОКИРОВКА: Все уведомления отключены для пользователя:', userId);
        return false;
      }

      // Проверяем конкретную настройку типа уведомления
      console.log(`[NotificationService] 🔍 Проверяем настройку для типа "${notificationType}"...`);
      const shouldSend = this.shouldSendNotification(notificationType, settings);
      console.log(`[NotificationService] 📊 Результат проверки shouldSend: ${shouldSend}`);

      if (!shouldSend) {
        console.log('[NotificationService] 🔇 БЛОКИРОВКА: Тип уведомления отключен:', notificationType);
        return false;
      }

      // Получаем активные токены пользователя
      console.log(`[NotificationService] 🔍 Получаем push токены пользователя...`);
      const tokensStartTime = Date.now();
      const tokens = await this.getUserPushTokens(userId);
      const tokensTime = Date.now() - tokensStartTime;

      console.log(`[NotificationService] ⏱️ Токены получены за ${tokensTime}мс`);
      console.log(`[NotificationService] 📊 Найдено токенов: ${tokens.length}`);

      if (tokens.length === 0) {
        console.log('[NotificationService] ⚠️ ПРОБЛЕМА: У пользователя нет активных push токенов:', userId);
        console.log('[NotificationService] 💡 Возможные причины:');
        console.log('[NotificationService] 💡 - Пользователь не дал разрешения на уведомления');
        console.log('[NotificationService] 💡 - Приложение не зарегистрировало токен');
        console.log('[NotificationService] 💡 - Токены были удалены из БД');
        return true; // Возвращаем true, чтобы не блокировать работу приложения
      }

      // Показываем информацию о токенах
      console.log(`[NotificationService] 📋 Информация о токенах:`);
      tokens.forEach((tokenData, index) => {
        const tokenPreview = tokenData.token.substring(0, 20) + '...';
        console.log(`[NotificationService]   ${index + 1}. ${tokenPreview} (создан: ${tokenData.createdAt || 'неизвестно'})`);
      });

      // 🔧 ИСПРАВЛЕНИЕ: Используем только САМЫЙ НОВЫЙ токен для предотвращения дублирования
      // Если у пользователя несколько токенов, отправляем только на последний (самый актуальный)
      const latestToken = tokens[tokens.length - 1];
      const tokenPreview = latestToken.token.substring(0, 20) + '...';
      console.log(`[NotificationService] 🎯 Используем самый новый токен: ${tokenPreview}`);

      if (tokens.length > 1) {
        console.log(`[NotificationService] ⚠️ Обнаружено ${tokens.length} токенов у пользователя. Возможно нужна очистка старых токенов.`);
      }

      // Отправляем уведомление только на один (самый новый) токен
      console.log(`[NotificationService] 📤 Отправляем push уведомление...`);
      const pushStartTime = Date.now();

      try {
        await this.sendPushNotification(latestToken.token, title, body, data);
        const pushTime = Date.now() - pushStartTime;
        console.log(`[NotificationService] ✅ Push уведомление отправлено за ${pushTime}мс`);
      } catch (pushError) {
        const pushTime = Date.now() - pushStartTime;
        console.error(`[NotificationService] ❌ Ошибка отправки push уведомления за ${pushTime}мс:`, pushError);
        return false;
      }

      const successCount = 1;

      // Сохраняем лог уведомления
      console.log(`[NotificationService] 💾 Сохраняем лог уведомления...`);
      const logStartTime = Date.now();

      try {
        await this.logNotification(userId, title, body, data, notificationType);
        const logTime = Date.now() - logStartTime;
        console.log(`[NotificationService] ✅ Лог сохранен за ${logTime}мс`);
      } catch (logError) {
        const logTime = Date.now() - logStartTime;
        console.error(`[NotificationService] ⚠️ Ошибка сохранения лога за ${logTime}мс:`, logError);
        // Не возвращаем false, так как уведомление уже отправлено
      }

      console.log(`[NotificationService] 📤 ИТОГ: Отправлено ${successCount}/${tokens.length} уведомлений пользователю: ${userId}`);

      // Автоматически очищаем старые токены если их много
      if (tokens.length > 1) {
        console.log(`[NotificationService] 🧹 Запускаем очистку старых токенов...`);
        this.cleanupOldTokensForUser(userId).catch(error => {
          console.error('[NotificationService] ⚠️ Ошибка очистки старых токенов:', error);
        });
      }

      return successCount > 0;
    } catch (error) {
      console.error('\n🚨 [NotificationService] КРИТИЧЕСКАЯ ОШИБКА ОТПРАВКИ УВЕДОМЛЕНИЯ 🚨');
      console.error('[NotificationService] 👤 Пользователь:', userId);
      console.error('[NotificationService] 📝 Заголовок:', title);
      console.error('[NotificationService] ❌ Ошибка:', error);
      console.error('[NotificationService] 📊 Stack trace:', error instanceof Error ? error.stack : 'Нет stack trace');
      return false;
    }
    */
    // ========== КОНЕЦ СТАРОГО КОДА ==========
  }

  /**
   * Отправка push уведомления множественным пользователям (ОПТИМИЗИРОВАННАЯ)
   * 
   * ⚠️ ОТКЛЮЧЕНО: Уведомления теперь отправляются только с сервера
   * См. osonish-admin/src/app/api/cron/process-notification-queue/route.ts
   */
  async sendNotificationToUsers(
    userIds: string[],
    title: string,
    body: string,
    data: any = {},
    notificationType: PushNotificationData['notificationType']
  ): Promise<number> {
    // 🚫 KILL SWITCH: Отключаем пакетную отправку уведомлений из мобильного приложения
    console.log(`\n🚫 [NotificationService] ПАКЕТНАЯ ОТПРАВКА ОТКЛЮЧЕНА - используется серверная система`);
    console.log(`[NotificationService] 👥 Пользователей: ${userIds.length}`);
    console.log(`[NotificationService] 📝 Заголовок: "${title}"`);
    console.log(`[NotificationService] 📄 Текст: "${body}"`);
    console.log(`[NotificationService] 🏷️ Тип: ${notificationType}`);
    console.log(`[NotificationService] 🖥️ Уведомления будут отправлены автоматически с сервера через database triggers`);
    console.log(`[NotificationService] 📚 Документация: SQL/create_notification_triggers.sql`);
    return userIds.length; // Возвращаем количество пользователей для обратной совместимости
    
    // ========== СТАРЫЙ КОД (ОТКЛЮЧЕН) ==========
    /*
    try {
      console.log(`\n🚀 [NotificationService] ПАКЕТНАЯ ОТПРАВКА ${userIds.length} ПОЛЬЗОВАТЕЛЯМ`);
      console.log(`[NotificationService] 📝 Заголовок: "${title}"`);
      console.log(`[NotificationService] 📄 Текст: "${body}"`);

      // Получаем все токены пользователей одним запросом
      console.log(`[NotificationService] 🔍 Получаем токены для ${userIds.length} пользователей...`);
      const tokensStartTime = Date.now();

      // Используем админский клиент для массовых операций (обходит RLS ограничения)
      const client = isAdminAvailable() ? supabaseAdmin : supabase;
      if (!isAdminAvailable()) {
        console.warn('[NotificationService] ⚠️ Используется обычный клиент (ANON_KEY). Могут быть ограничения.');
        console.warn('[NotificationService] ⚠️ Для массовых операций настройте SUPABASE_SERVICE_ROLE_KEY');
      }

      const { data: tokenData, error: tokensError } = await client
        .from('push_tokens')
        .select('user_id, token, device_type, created_at')
        .in('user_id', userIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false }); // Самые новые токены первыми

      const tokensTime = Date.now() - tokensStartTime;
      console.log(`[NotificationService] ⏱️ Токены получены за ${tokensTime}мс`);

      if (tokensError) {
        console.error('[NotificationService] ❌ Ошибка получения токенов:', tokensError);
        return 0;
      }

      if (!tokenData || tokenData.length === 0) {
        console.log('[NotificationService] ⚠️ Не найдено активных токенов для пользователей');
        return 0;
      }

      // Группируем токены по пользователям (берем только самый новый токен для каждого)
      const userTokens = new Map<string, string>();
      const processedUsers = new Set<string>();

      tokenData.forEach((token: any) => {
        if (!processedUsers.has(token.user_id)) {
          userTokens.set(token.user_id, token.token);
          processedUsers.add(token.user_id);
        }
      });

      console.log(`[NotificationService] 📊 Найдено токенов: ${userTokens.size} из ${userIds.length} пользователей`);

      // Получаем настройки уведомлений для всех пользователей одним запросом
      console.log(`[NotificationService] 🔍 Проверяем настройки уведомлений...`);
      const settingsStartTime = Date.now();

      const { data: settingsData, error: settingsError } = await client
        .from('user_notification_settings')
        .select('user_id, all_notifications_enabled')
        .in('user_id', Array.from(userTokens.keys()));

      const settingsTime = Date.now() - settingsStartTime;
      console.log(`[NotificationService] ⏱️ Настройки получены за ${settingsTime}мс`);

      // Создаем карту настроек (по умолчанию уведомления включены)
      const userSettings = new Map<string, boolean>();
      settingsData?.forEach((setting: any) => {
        userSettings.set(setting.user_id, setting.all_notifications_enabled);
      });

      // Фильтруем пользователей с включенными уведомлениями
      const allowedTokens: string[] = [];
      const blockedCount = { settings: 0, noToken: 0 };

      userIds.forEach(userId => {
        const token = userTokens.get(userId);
        if (!token) {
          blockedCount.noToken++;
          return;
        }

        const settingsEnabled = userSettings.get(userId) ?? true; // По умолчанию включены
        if (!settingsEnabled) {
          blockedCount.settings++;
          return;
        }

        allowedTokens.push(token);
      });

      console.log(`[NotificationService] 📊 Статистика фильтрации:`);
      console.log(`[NotificationService] ✅ Разрешено: ${allowedTokens.length}`);
      console.log(`[NotificationService] 🔇 Заблокировано настройками: ${blockedCount.settings}`);
      console.log(`[NotificationService] ⚠️ Нет токенов: ${blockedCount.noToken}`);

      if (allowedTokens.length === 0) {
        console.log('[NotificationService] ⚠️ Нет пользователей для отправки уведомлений');
        return 0;
      }

      // Разбиваем на батчи по 100 токенов (лимит FCM)
      const batchSize = 100;
      const batches: string[][] = [];
      for (let i = 0; i < allowedTokens.length; i += batchSize) {
        batches.push(allowedTokens.slice(i, i + batchSize));
      }

      console.log(`[NotificationService] 📦 Разбито на ${batches.length} батчей по ${batchSize} токенов`);

      // Отправляем все батчи параллельно
      const batchStartTime = Date.now();
      const batchPromises = batches.map(async (batch, index) => {
        console.log(`[NotificationService] 🚀 Отправляем батч ${index + 1}/${batches.length} (${batch.length} токенов)`);

        try {
          // Отправляем через Expo API (который поддерживает массивы)
          const batchMessages = batch.map(token => ({
            to: token,
            title,
            body,
            data,
            sound: 'default',
            priority: 'high' as const,
            channelId: 'default',
          }));

          const success = await this.sendBatchPushNotifications(batchMessages);
          console.log(`[NotificationService] ✅ Батч ${index + 1} отправлен: ${success ? batch.length : 0}/${batch.length}`);
          return success ? batch.length : 0;
        } catch (error) {
          console.error(`[NotificationService] ❌ Ошибка батча ${index + 1}:`, error);
          return 0;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      const batchTime = Date.now() - batchStartTime;

      const successCount = batchResults.reduce((sum, result) => {
        return sum + (result.status === 'fulfilled' ? result.value : 0);
      }, 0);

      console.log(`[NotificationService] ⚡ Пакетная отправка завершена за ${batchTime}мс`);
      console.log(`[NotificationService] 📤 ИТОГ: Отправлено ${successCount}/${allowedTokens.length} уведомлений`);

      // Логируем уведомления (асинхронно, чтобы не замедлять)
      this.logBatchNotifications(userIds, title, body, data, notificationType, successCount)
        .catch(error => console.error('[NotificationService] ⚠️ Ошибка логирования:', error));

      return successCount;
    } catch (error) {
      console.error('\n🚨 [NotificationService] КРИТИЧЕСКАЯ ОШИБКА ПАКЕТНОЙ ОТПРАВКИ 🚨');
      console.error('[NotificationService] ❌ Ошибка:', error);
      console.error('[NotificationService] 📊 Stack trace:', error instanceof Error ? error.stack : 'Нет stack trace');
      return 0;
    }
    */
    // ========== КОНЕЦ СТАРОГО КОДА ==========
  }

  /**
   * Пакетная отправка push уведомлений через Expo API
   */
  private async sendBatchPushNotifications(messages: any[]): Promise<boolean> {
    try {
      console.log(`[NotificationService] 📦 Отправляем пакет из ${messages.length} уведомлений через Expo API`);

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        console.error(`[NotificationService] ❌ HTTP ошибка: ${response.status} ${response.statusText}`);
        return false;
      }

      const result = await response.json();
      console.log(`[NotificationService] 📡 Ответ Expo API для пакета:`, result);

      // Проверяем успешность отправки всех сообщений в пакете
      if (Array.isArray(result.data)) {
        const successCount = result.data.filter((item: any) => item.status === 'ok').length;
        const errorCount = result.data.filter((item: any) => item.status === 'error').length;

        console.log(`[NotificationService] 📊 Результаты пакета: ${successCount} успешно, ${errorCount} ошибок`);

        if (errorCount > 0) {
          console.log(`[NotificationService] ⚠️ Ошибки в пакете:`,
            result.data.filter((item: any) => item.status === 'error')
          );
        }

        return successCount > 0;
      } else {
        // Одиночное сообщение
        return result.data && result.data.status === 'ok';
      }
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка пакетной отправки через Expo API:', error);
      return false;
    }
  }

  /**
   * Логирование пакетных уведомлений
   */
  private async logBatchNotifications(
    userIds: string[],
    title: string,
    body: string,
    data: any,
    notificationType: PushNotificationData['notificationType'],
    successCount: number
  ): Promise<void> {
    try {
      console.log(`[NotificationService] 📝 Логируем пакетные уведомления: ${successCount}/${userIds.length}`);

      // Простое логирование в консоль (можно расширить для сохранения в БД)
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'batch_notification',
        notificationType,
        title,
        body,
        userCount: userIds.length,
        successCount,
        data
      };

      console.log('[NotificationService] 📋 Лог пакетного уведомления:', logEntry);
    } catch (error) {
      console.error('[NotificationService] ⚠️ Ошибка логирования пакетных уведомлений:', error);
    }
  }

  /**
   * Проверка, нужно ли отправлять уведомление данного типа
   */
  private shouldSendNotification(
    type: PushNotificationData['notificationType'],
    settings: NotificationSettings
  ): boolean {
    // Теперь все типы уведомлений контролируются одной настройкой
    return settings.allNotificationsEnabled;
  }

  /**
   * Получение push токенов пользователя
   */
  private async getUserPushTokens(userId: string): Promise<PushToken[]> {
    try {
      const { data, error } = await supabase
        .from('push_tokens')
        .select('token, device_type, device_id, created_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true }); // Сортируем по дате создания

      if (error) {
        console.error('[NotificationService] ❌ Ошибка получения токенов:', error);
        return [];
      }

      return data.map((item: any) => ({
        token: item.token,
        deviceType: item.device_type as 'ios' | 'android' | 'web',
        deviceId: item.device_id,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка получения токенов:', error);
      return [];
    }
  }

  /**
   * Очистка старых токенов для пользователя (оставляем только самый новый)
   */
  private async cleanupOldTokensForUser(userId: string): Promise<void> {
    try {
      console.log(`[NotificationService] 🧹 Очищаем старые токены для пользователя: ${userId}`);

      const { data: tokens, error: selectError } = await supabase
        .from('push_tokens')
        .select('id, token, created_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (selectError) {
        console.error('[NotificationService] ❌ Ошибка получения токенов для очистки:', selectError);
        return;
      }

      if (!tokens || tokens.length <= 1) {
        console.log('[NotificationService] ✅ У пользователя нет лишних токенов');
        return;
      }

      // Оставляем только самый новый токен, остальные деактивируем
      const tokensToDeactivate = tokens.slice(0, -1); // Все кроме последнего
      const tokenIds = tokensToDeactivate.map((t: any) => t.id);

      console.log(`[NotificationService] 🗑️ Деактивируем ${tokenIds.length} старых токенов`);

      const { error: updateError } = await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .in('id', tokenIds);

      if (updateError) {
        console.error('[NotificationService] ❌ Ошибка деактивации старых токенов:', updateError);
      } else {
        console.log(`[NotificationService] ✅ Успешно деактивировано ${tokenIds.length} старых токенов`);
      }
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка очистки старых токенов:', error);
    }
  }

  /**
   * Отправка push уведомления (автоматический выбор сервиса)
   */
  private async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data: any = {}
  ): Promise<void> {
    try {
      console.log('[NotificationService] 🚀 Отправляем push уведомление...');
      console.log('[NotificationService] 🎯 Токен:', token.substring(0, 20) + '...');
      console.log('[NotificationService] 📰 Заголовок:', title);
      console.log('[NotificationService] 💬 Сообщение:', body);

      // Получаем информацию о среде
      const envInfo = productionNotificationService.getEnvironmentInfo();
      console.log('[NotificationService] 🏗️ Среда выполнения:', JSON.stringify(envInfo, null, 2));
      console.log('[NotificationService] 🎫 Тип токена:', token.startsWith('ExponentPushToken[') ? 'Expo Push Token' : 'Нативный токен');
      console.log('[NotificationService] 📱 Приложение:', (envInfo.appOwnership as string) === 'standalone' ? 'Production сборка' : 'Expo Go / Development');
      console.log('[NotificationService] 🔧 Режим разработки:', envInfo.isDev ? 'Development (__DEV__ = true)' : 'Production (__DEV__ = false)');

      // Используем production сервис для автоматического выбора
      const success = await productionNotificationService.sendPushNotification({
        to: token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      });

      if (success) {
        console.log('[NotificationService] ✅ Push уведомление отправлено через', envInfo.expectedService);
      } else {
        throw new Error('Не удалось отправить уведомление');
      }

    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка отправки push уведомления:', error);
      console.error('[NotificationService] 🔍 Проверьте интернет соединение и валидность токена');
      throw error;
    }
  }

  /**
   * Получение настроек уведомлений пользователя
   */
  async getUserNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      console.log('[NotificationService] 📱 Получаем настройки уведомлений для пользователя:', userId);

      const { data, error } = await supabase
        .from('notification_settings')
        .select('all_notifications_enabled')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Если настройки не найдены (первый запуск), возвращаем дефолтные настройки
        if (error.code === 'PGRST116') { // No rows found
          console.log('[NotificationService] ℹ️ Настройки не найдены для пользователя', userId, ', используем дефолтные');
          const defaultSettings = {
            allNotificationsEnabled: true,
          };
          console.log('[NotificationService] 📱 Возвращаем дефолтные настройки:', defaultSettings);
          return defaultSettings;
        }

        console.error('[NotificationService] ❌ Ошибка получения настроек:', error);
        // Возвращаем дефолтные настройки
        const defaultSettings = {
          allNotificationsEnabled: true,
        };
        console.log('[NotificationService] 📱 Возвращаем дефолтные настройки из-за ошибки:', defaultSettings);
        return defaultSettings;
      }

      if (!data) {
        console.log('[NotificationService] ℹ️ Данные пустые, используем дефолтные настройки');
        const defaultSettings = {
          allNotificationsEnabled: true,
        };
        console.log('[NotificationService] 📱 Возвращаем дефолтные настройки (пустые данные):', defaultSettings);
        return defaultSettings;
      }

      console.log('[NotificationService] 📱 Данные из БД:', data);
      const settings = {
        allNotificationsEnabled: data.all_notifications_enabled,
      };
      console.log('[NotificationService] 📱 Преобразованные настройки:', settings);
      return settings;
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка получения настроек:', error);
      // Возвращаем дефолтные настройки
      const defaultSettings = {
        allNotificationsEnabled: true,
      };
      console.log('[NotificationService] 📱 Возвращаем дефолтные настройки из-за исключения:', defaultSettings);
      return defaultSettings;
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

      const settingsData = {
        user_id: authState.user.id,
        all_notifications_enabled: settings.allNotificationsEnabled,
      };

      // Сначала пробуем обновить существующую запись
      const { data: updateData, error: updateError } = await supabase
        .from('notification_settings')
        .update(settingsData)
        .eq('user_id', authState.user.id)
        .select();

      // Если запись не найдена (updateData пустой) или есть ошибка, создаем новую
      if (updateError || !updateData || updateData.length === 0) {
        console.log('[NotificationService] 📝 Запись не найдена, создаем новую настройку');

        const { error: insertError } = await supabase
          .from('notification_settings')
          .insert(settingsData);

        if (insertError) {
          console.error('[NotificationService] ❌ Ошибка создания настроек:', insertError);
          return false;
        }

        console.log('[NotificationService] ✅ Новые настройки уведомлений созданы');
      } else {
        console.log('[NotificationService] ✅ Настройки уведомлений обновлены');
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка обновления настроек:', error);
      return false;
    }
  }

  /**
   * Сохранение уведомления в базу данных
   */
  private async logNotification(
    userId: string,
    title: string,
    body: string,
    data: any,
    notificationType: PushNotificationData['notificationType']
  ): Promise<void> {
    // Используем fallback логирование без БД
    await this.logNotificationFallback(userId, title, body, data, notificationType);
  }

  /**
   * Fallback метод для логирования уведомлений без зависимости от RLS
   */
  private async logNotificationFallback(
    userId: string,
    title: string,
    body: string,
    data: any,
    notificationType: PushNotificationData['notificationType']
  ): Promise<void> {
    try {
      console.log('[NotificationService] 📝 Логирование уведомления (fallback режим)');
      console.log('[NotificationService] 👤 Пользователь:', userId);
      console.log('[NotificationService] 📰 Заголовок:', title);
      console.log('[NotificationService] 💬 Сообщение:', body);
      console.log('[NotificationService] 🏷️ Тип:', notificationType);
      console.log('[NotificationService] 📊 Данные:', JSON.stringify(data));
      console.log('[NotificationService] ⏰ Время:', new Date().toISOString());
      console.log('[NotificationService] ✅ Push notification отправлен, логирование в консоль выполнено');

      // Попытка сохранения в БД (необязательная)
      await this.attemptDatabaseSave(userId, title, body, data, notificationType);
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка fallback логирования:', error);
      console.log('[NotificationService] ✅ Push notification всё равно был отправлен');
    }
  }

  /**
   * Попытка сохранения в базу данных (может завершиться неудачей)
   */
  private async attemptDatabaseSave(
    userId: string,
    title: string,
    body: string,
    data: any,
    notificationType: PushNotificationData['notificationType']
  ): Promise<void> {
    try {
      console.log('[NotificationService] 💾 Опциональная попытка сохранения в БД для пользователя:', userId);

      // Простая проверка доступности Supabase
      if (!supabase) {
        console.log('[NotificationService] ⚠️ Supabase недоступен, пропускаем сохранение в БД');
        return;
      }

      // Быстрая проверка аутентификации без восстановления
      const { data: { user }, error: authCheckError } = await supabase.auth.getUser();

      if (authCheckError || !user) {
        console.log('[NotificationService] ⚠️ Supabase аутентификация недоступна, пропускаем сохранение в БД');
        return;
      }

      console.log('[NotificationService] ✅ Supabase аутентификация доступна, пытаемся сохранить');

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message: body,
          data,
          type: notificationType,
          is_read: false
        });

      if (error) {
        console.warn('[NotificationService] ⚠️ Не удалось сохранить уведомление в БД:', error.message);

        if (error.code === '42501') {
          console.warn('[NotificationService] ⚠️ RLS политика запрещает сохранение (это нормально для fallback режима)');
        }
      } else {
        console.log('[NotificationService] 🎉 Бонус: Уведомление дополнительно сохранено в БД!');
      }
    } catch (error: any) {
      console.warn('[NotificationService] ⚠️ Опциональное сохранение в БД не удалось:', error.message);
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

      // Полностью удаляем все токены пользователя
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', authState.user.id);

      if (error) {
        console.error('[NotificationService] ❌ Ошибка удаления токенов:', error);
        return;
      }

      // Сбрасываем текущий токен
      this.currentPushToken = null;

      console.log('[NotificationService] ✅ Push токены удалены');
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка удаления токенов:', error);
    }
  }

  /**
   * Очистка старых токенов для текущего пользователя
   */
  private async cleanupOldTokens(): Promise<void> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return;
      }

      const deviceId = Constants.deviceId || Constants.sessionId;

      // Удаляем все токены для текущего пользователя и устройства
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', authState.user.id)
        .eq('device_id', deviceId);

      if (error) {
        console.warn('[NotificationService] ⚠️ Ошибка очистки старых токенов:', error);
      } else {
        console.log('[NotificationService] ✅ Старые токены очищены');
      }
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка очистки токенов:', error);
    }
  }

  /**
   * Получение текущего push токена
   */
  getCurrentPushToken(): string | null {
    return this.currentPushToken;
  }

  /**
   * Регистрация push-токена после авторизации пользователя
   */
  async registerPushTokenAfterAuth(): Promise<void> {
    try {
      console.log('[NotificationService] 🔄 Перерегистрация push-токена после авторизации...');

      // Если токен уже есть, пытаемся его сохранить в БД
      if (this.currentPushToken) {
        console.log('[NotificationService] 📱 Используем существующий токен:', this.currentPushToken.substring(0, 20) + '...');
        await this.savePushTokenToDatabase(this.currentPushToken);
      } else {
        // Если токена нет, регистрируемся заново
        console.log('[NotificationService] 📱 Токен отсутствует, регистрируемся заново...');
        await this.registerForPushNotifications();
      }

      console.log('[NotificationService] ✅ Перерегистрация push-токена завершена');
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка перерегистрации push-токена:', error);
    }
  }

  /**
   * Принудительное обновление push токена
   */
  async refreshPushToken(): Promise<boolean> {
    console.log('\n🔄 === ОБНОВЛЕНИЕ PUSH ТОКЕНА ===');

    try {
      // Сбрасываем текущий токен
      this.currentPushToken = null;
      console.log('🗑️ Сброшен текущий токен');

      // Очищаем старые токены
      await this.cleanupOldTokens();
      console.log('🧹 Очищены старые токены из БД');

      // Повторно регистрируемся для push уведомлений
      await this.registerForPushNotifications();

      if (this.currentPushToken) {
        console.log('✅ Новый push токен получен:', this.currentPushToken);
        console.log('🎫 ПОЛНЫЙ ТОКЕН ДЛЯ КОПИРОВАНИЯ:', this.currentPushToken);
        return true;
      } else {
        console.error('❌ Не удалось получить новый push токен');
        return false;
      }
    } catch (error) {
      console.error('❌ Ошибка обновления push токена:', error);
      return false;
    }
  }

  /**
   * Добавление тестового уведомления для проверки локального кэша
   */
  async addTestNotification(): Promise<boolean> {
    try {
      const authState = authService.getAuthState();
      if (!authState.user?.id) {
        console.warn('[NotificationService] ⚠️ Пользователь не авторизован - нельзя добавить тестовое уведомление');
        return false;
      }

      console.log('[NotificationService] 🧪 Добавляем тестовое уведомление в локальный кэш');

      // Создаем тестовое уведомление
      const testNotification = {
        request: {
          content: {
            title: 'Тестовое уведомление',
            body: `Локальное сохранение работает! Время: ${new Date().toLocaleTimeString()}`,
            data: {
              notificationType: 'order_update',
              test: true,
              timestamp: Date.now()
            }
          }
        }
      };

      // Сохраняем как если бы это было полученное уведомление
      await this.saveNotificationLocally(testNotification);

      console.log('[NotificationService] ✅ Тестовое уведомление добавлено в локальный кэш');
      return true;
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка добавления тестового уведомления:', error);
      return false;
    }
  }

  /**
   * Тестирование отправки push уведомления текущему пользователю
   */
  async testPushNotification(): Promise<boolean> {
    console.log('\n🧪 === ТЕСТ PUSH УВЕДОМЛЕНИЯ ===');

    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        console.error('❌ Пользователь не авторизован');
        return false;
      }

      console.log('👤 Тестируем уведомление для пользователя:', authState.user.id);

      const testTitle = 'Тестовое уведомление';
      const testBody = `Тест в ${new Date().toLocaleTimeString()}`;
      const testData = {
        test: true,
        timestamp: Date.now(),
        userId: authState.user.id
      };

      console.log('📤 Отправляем тестовое уведомление...');

      const success = await this.sendNotificationToUser(
        authState.user.id,
        testTitle,
        testBody,
        testData,
        'order_update'
      );

      if (success) {
        console.log('✅ Тестовое уведомление отправлено успешно');
        console.log('💡 Если уведомление не появилось, проверьте:');
        console.log('   - Разрешения в системных настройках');
        console.log('   - Настройки уведомлений в приложении');
        console.log('   - Интернет соединение');
        console.log('   - Конфигурацию EAS проекта');
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
   * Диагностика состояния push-уведомлений
   */
  async diagnosePushNotifications(): Promise<void> {
    console.log('\n🔍 === ДИАГНОСТИКА PUSH УВЕДОМЛЕНИЙ ===');

    try {
      // 1. Проверка базовых требований
      console.log('📱 Проверка базовых требований:');
      console.log('  - Device.isDevice:', Device.isDevice);
      console.log('  - Platform.OS:', Platform.OS);
      console.log('  - Notifications доступны:', !!Notifications);

      if (!Device.isDevice) {
        console.warn('⚠️ Push уведомления работают только на реальных устройствах');
        return;
      }

      if (!Notifications) {
        console.warn('⚠️ expo-notifications недоступен');
        return;
      }

      // 2. Проверка разрешений
      console.log('\n🔐 Проверка разрешений:');
      const { status } = await Notifications.getPermissionsAsync();
      console.log('  - Статус разрешений:', status);

      if (status !== 'granted') {
        console.warn('⚠️ Разрешения на уведомления не предоставлены');
        console.log('💡 Попробуйте запросить разрешения через настройки приложения');
      }

      // 3. Проверка проекта
      console.log('\n🚀 Проверка конфигурации Expo:');
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId ||
        (Constants.manifest as any)?.extra?.eas?.projectId;

      console.log('  - Project ID:', projectId ? 'есть' : 'отсутствует');

      if (!projectId) {
        console.warn('⚠️ Project ID не настроен - уведомления не будут работать');
        console.log('💡 Настройте EAS проект для production уведомлений');
      }

      // 4. Проверка токена
      console.log('\n🎫 Проверка push токена:');
      console.log('  - Текущий токен:', this.currentPushToken ? 'есть' : 'отсутствует');

      if (this.currentPushToken) {
        console.log('  - Токен:', this.currentPushToken.substring(0, 20) + '...');
      }

      // 5. Проверка аутентификации
      console.log('\n👤 Проверка аутентификации:');
      const authState = authService.getAuthState();
      console.log('  - Пользователь авторизован:', authState.isAuthenticated);
      console.log('  - User ID:', authState.user?.id || 'нет');

      // 6. Проверка токенов в БД
      if (authState.user?.id) {
        console.log('\n💾 Проверка токенов в БД:');
        const tokens = await this.getUserPushTokens(authState.user.id);
        console.log('  - Активных токенов в БД:', tokens.length);

        tokens.forEach((token, index) => {
          console.log(`  - Токен ${index + 1}:`, token.token.substring(0, 20) + '...');
          console.log(`    Устройство: ${token.deviceType}, Активен: true`);
        });
      }

      // 7. Проверка настроек уведомлений
      if (authState.user?.id) {
        console.log('\n⚙️ Проверка настроек уведомлений:');
        const settings = await this.getUserNotificationSettings(authState.user.id);
        console.log('  - Все уведомления:', settings.allNotificationsEnabled);
      }

      console.log('\n✅ Диагностика завершена');

    } catch (error) {
      console.error('❌ Ошибка диагностики:', error);
    }
  }

  /**
   * Получение списка уведомлений пользователя (из локального кэша)
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<NotificationItem[]> {
    try {
      console.log('[NotificationService] 📱 Получаем уведомления из локального кэша для пользователя:', userId);

      // Получаем уведомления из локального хранилища
      const localNotifications = await this.getLocalNotifications(userId);

      // Ограничиваем количество и сортируем по дате (новые сверху)
      const limitedNotifications = localNotifications
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      console.log('[NotificationService] ✅ Найдено локальных уведомлений:', limitedNotifications.length);
      return limitedNotifications;
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка получения локальных уведомлений:', error);
      return [];
    }
  }

  /**
   * Получение локальных уведомлений из AsyncStorage
   */
  private async getLocalNotifications(userId: string): Promise<NotificationItem[]> {
    try {
      const key = `${NotificationService.STORAGE_KEY_NOTIFICATIONS}_${userId}`;
      const stored = await AsyncStorage.getItem(key);

      if (!stored) {
        console.log('[NotificationService] 📱 Локальные уведомления не найдены');
        return [];
      }

      const notifications: NotificationItem[] = JSON.parse(stored);
      return notifications;
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка получения локальных уведомлений:', error);
      return [];
    }
  }

  /**
   * Сохранение уведомления локально при получении
   */
  private async saveNotificationLocally(notification: any): Promise<void> {
    try {
      console.log('[NotificationService] 💾 Сохраняем уведомление локально:', notification);

      const authState = authService.getAuthState();
      if (!authState.user?.id) {
        console.warn('[NotificationService] ⚠️ Пользователь не авторизован - пропускаем локальное сохранение');
        return;
      }

      const userId = authState.user.id;

      // Извлекаем данные из полученного уведомления
      const content = notification.request?.content || notification;
      const title = content.title || 'Новое уведомление';
      const body = content.body || '';
      const data = content.data || {};

      // Определяем тип уведомления
      const notificationType = data.notificationType || data.type || 'order_update';

      // Создаем объект уведомления
      const notificationItem: NotificationItem = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        title: title,
        body: body,
        data: data,
        notificationType: notificationType as any,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      // Получаем существующие уведомления
      const existingNotifications = await this.getLocalNotifications(userId);

      // Добавляем новое уведомление в начало списка
      const updatedNotifications = [notificationItem, ...existingNotifications];

      // Ограничиваем количество уведомлений
      if (updatedNotifications.length > NotificationService.MAX_LOCAL_NOTIFICATIONS) {
        updatedNotifications.splice(NotificationService.MAX_LOCAL_NOTIFICATIONS);
      }

      // Сохраняем обновленный список
      const key = `${NotificationService.STORAGE_KEY_NOTIFICATIONS}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedNotifications));

      console.log('[NotificationService] ✅ Уведомление сохранено локально. Всего уведомлений:', updatedNotifications.length);
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка локального сохранения уведомления:', error);
    }
  }

  /**
   * Отметка уведомления как прочитанного (локально)
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const authState = authService.getAuthState();
      if (!authState.user) {
        console.error('[NotificationService] ❌ Пользователь не авторизован');
        return false;
      }

      const userId = authState.user.id;
      console.log('[NotificationService] 📱 Отмечаем уведомление как прочитанное локально:', notificationId);

      // Получаем локальные уведомления
      const notifications = await this.getLocalNotifications(userId);

      // Находим и обновляем нужное уведомление
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      );

      // Сохраняем обновленный список
      const key = `${NotificationService.STORAGE_KEY_NOTIFICATIONS}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedNotifications));

      console.log('[NotificationService] ✅ Уведомление отмечено как прочитанное локально');
      return true;
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка отметки уведомления как прочитанного:', error);
      return false;
    }
  }

  /**
   * Отметка всех уведомлений как прочитанных (локально)
   */
  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      console.log('[NotificationService] 📱 Отмечаем все уведомления как прочитанные локально для пользователя:', userId);

      // Получаем локальные уведомления
      const notifications = await this.getLocalNotifications(userId);

      // Отмечаем все как прочитанные
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        isRead: true
      }));

      // Сохраняем обновленный список
      const key = `${NotificationService.STORAGE_KEY_NOTIFICATIONS}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedNotifications));

      console.log('[NotificationService] ✅ Все уведомления отмечены как прочитанные локально');
      return true;
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка отметки всех уведомлений как прочитанных:', error);
      return false;
    }
  }

  /**
   * Получение количества непрочитанных уведомлений (из локального кэша)
   */
  async getUnreadNotificationsCount(userId: string): Promise<number> {
    try {
      console.log('[NotificationService] 📱 Подсчитываем непрочитанные уведомления локально для пользователя:', userId);

      // Получаем локальные уведомления
      const notifications = await this.getLocalNotifications(userId);

      // Считаем непрочитанные
      const unreadCount = notifications.filter(notification => !notification.isRead).length;

      console.log('[NotificationService] ✅ Количество непрочитанных уведомлений:', unreadCount);
      return unreadCount;
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка получения количества непрочитанных уведомлений:', error);
      return 0;
    }
  }

  /**
   * Проверка и восстановление Supabase аутентификации
   */
  private async ensureSupabaseAuthentication(userId: string): Promise<boolean> {
    try {
      console.log('[NotificationService] 🔍 Проверяем аутентификацию для пользователя:', userId);

      if (!supabase) {
        console.warn('[NotificationService] ⚠️ Supabase клиент недоступен');
        return false;
      }

      // Проверяем текущую сессию
      const { data: { user }, error } = await supabase.auth.getUser();

      if (user && !error) {
        console.log('[NotificationService] ✅ Supabase сессия уже активна для пользователя:', user.id);

        // Проверяем что это правильный пользователь
        const authState = authService.getAuthState();
        if (authState.user && authState.user.id === userId) {
          console.log('[NotificationService] ✅ Аутентификация соответствует текущему пользователю');
          return true;
        } else {
          console.warn('[NotificationService] ⚠️ Auth пользователь не соответствует целевому пользователю');
          console.warn('[NotificationService] ⚠️ Auth user ID:', authState.user?.id, 'Target user ID:', userId);
        }
      }

      console.log('[NotificationService] ⚠️ Supabase сессия неактивна или не соответствует пользователю');
      console.log('[NotificationService] 🔄 Пытаемся восстановить сессию для:', userId);

      await this.restoreSupabaseSession(userId);

      // Проверяем результат восстановления
      const { data: { user: restoredUser }, error: checkError } = await supabase.auth.getUser();
      if (restoredUser && !checkError) {
        console.log('[NotificationService] ✅ Сессия успешно восстановлена для пользователя:', restoredUser.id);
        return true;
      } else {
        console.warn('[NotificationService] ❌ Не удалось восстановить Supabase сессию');
        console.warn('[NotificationService] ❌ Error:', checkError?.message);
        return false;
      }
    } catch (error) {
      console.error('[NotificationService] ❌ Критическая ошибка проверки аутентификации:', error);
      return false;
    }
  }

  /**
   * Восстановление Supabase сессии из AsyncStorage
   */
  private async restoreSupabaseSession(userId: string): Promise<void> {
    try {
      const storedSession = await AsyncStorage.getItem('@osonish_supabase_session');

      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          console.log('[NotificationService] 🔄 Восстанавливаем Supabase сессию...');

          const { error } = await supabase.auth.setSession(session);

          if (error) {
            console.warn('[NotificationService] ⚠️ Сохраненная сессия истекла или невалидна:', error.message);
            console.log('[NotificationService] 🔄 Пытаемся войти напрямую...');
            await this.createNewSupabaseSession(userId);
          } else {
            console.log('[NotificationService] ✅ Supabase сессия успешно восстановлена');
          }
        } catch (parseError) {
          console.warn('[NotificationService] ⚠️ Ошибка парсинга сохраненной сессии:', parseError);
          await this.createNewSupabaseSession(userId);
        }
      } else {
        console.log('[NotificationService] ⚠️ Сохраненная сессия не найдена, выполняем вход...');
        await this.createNewSupabaseSession(userId);
      }
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка восстановления сессии:', error);
      // В крайнем случае пытаемся создать новую сессию
      try {
        await this.createNewSupabaseSession(userId);
      } catch (createError) {
        console.error('[NotificationService] ❌ Критическая ошибка создания сессии:', createError);
      }
    }
  }

  /**
   * Принудительное восстановление Supabase сессии (для повторных попыток)
   */
  private async forceRestoreSupabaseSession(userId: string): Promise<void> {
    try {
      console.log('[NotificationService] 🔄 Принудительное восстановление Supabase сессии...');

      // Сначала выходим из текущей сессии
      await supabase.auth.signOut();

      // Создаем новую сессию
      await this.createNewSupabaseSession(userId);
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка принудительного восстановления сессии:', error);
    }
  }

  /**
   * Попытка входа в Supabase или создания новой Auth сессии
   */
  private async createNewSupabaseSession(userId: string): Promise<void> {
    try {
      // Получаем данные пользователя из authService
      const authState = authService.getAuthState();
      if (!authState.user) {
        console.error('[NotificationService] ❌ Пользователь не найден в authService');
        return;
      }

      const user = authState.user;

      // Создаем email и пароль как в authService
      const email = `osonish.${user.phone.replace(/[^0-9]/g, '')}@gmail.com`;
      const password = `osonish_${user.id}`;

      console.log('[NotificationService] 🔄 Выполняем вход в Supabase для:', email);

      // Пробуем войти
      let authResult = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Если пользователя нет, создаем его
      if (authResult.error?.message?.includes('Invalid login credentials')) {
        console.log('[NotificationService] 🔄 Пользователь Auth не найден, создаем новую учетную запись...');

        authResult = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_id: user.id,
              phone: user.phone,
              first_name: user.firstName,
              last_name: user.lastName
            }
          }
        });

        if (authResult.data?.user) {
          console.log('[NotificationService] ✅ Новая Auth учетная запись создана:', authResult.data.user.id);
        }

        // Если пользователь уже зарегистрирован, используем fallback как в authService
        if (authResult.error?.message?.includes('User already registered')) {
          console.log('[NotificationService] 💡 Пользователь уже зарегистрирован в Supabase Auth');
          console.log('[NotificationService] 💡 Возможно пароль или email не соответствуют первоначальной регистрации');
          console.log('[NotificationService] 💡 Пропускаем создание Auth сессии для уведомлений');
          return;
        }
      } else if (authResult.data?.user) {
        console.log('[NotificationService] ✅ Вход выполнен с существующей Auth учетной записью:', authResult.data.user.id);
      }

      if (authResult.error) {
        // Если это не ошибка о том что пользователь уже зарегистрирован, логируем её
        if (!authResult.error.message?.includes('User already registered')) {
          console.error('[NotificationService] ❌ Ошибка создания Supabase сессии:', authResult.error);
        }
        return;
      }

      if (authResult.data.session) {
        // Сохраняем сессию в AsyncStorage
        await AsyncStorage.setItem('@osonish_supabase_session', JSON.stringify(authResult.data.session));
        console.log('[NotificationService] ✅ Новая Supabase сессия создана и сохранена');
      }
    } catch (error) {
      console.error('[NotificationService] ❌ Ошибка создания новой Supabase сессии:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();