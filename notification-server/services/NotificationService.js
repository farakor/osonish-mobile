/**
 * 🔔 Сервис уведомлений с поддержкой FCM и APNs
 */

const admin = require('firebase-admin');
const apn = require('apn');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.fcmApp = null;
    this.apnProvider = null;
    this.analytics = [];
  }

  /**
   * Инициализация сервиса
   */
  async initialize() {
    try {
      logger.info('Инициализация NotificationService...');

      // Инициализация Firebase Admin SDK
      await this.initializeFirebase();

      // Инициализация Apple Push Notification Service
      await this.initializeAPNs();

      logger.info('✅ NotificationService инициализирован');
    } catch (error) {
      logger.error('❌ Ошибка инициализации NotificationService:', error);
      throw error;
    }
  }

  /**
   * Инициализация Firebase
   */
  async initializeFirebase() {
    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      
      if (!serviceAccountPath) {
        logger.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_PATH не настроен, FCM недоступен');
        return;
      }

      const serviceAccount = require(serviceAccountPath);

      this.fcmApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });

      logger.info('✅ Firebase Admin SDK инициализирован');
    } catch (error) {
      logger.error('❌ Ошибка инициализации Firebase:', error);
      // Не выбрасываем ошибку, чтобы сервер мог работать без FCM
    }
  }

  /**
   * Инициализация Apple Push Notifications
   */
  async initializeAPNs() {
    try {
      const apnsKeyPath = process.env.APNS_KEY_PATH;
      const apnsKeyId = process.env.APNS_KEY_ID;
      const apnsTeamId = process.env.APNS_TEAM_ID;
      const apnsBundleId = process.env.APNS_BUNDLE_ID || 'com.farakor.osonishmobile';

      if (!apnsKeyPath || !apnsKeyId || !apnsTeamId) {
        logger.warn('⚠️ APNs credentials не настроены, iOS push недоступен');
        return;
      }

      const options = {
        token: {
          key: apnsKeyPath,
          keyId: apnsKeyId,
          teamId: apnsTeamId
        },
        production: process.env.NODE_ENV === 'production'
      };

      this.apnProvider = new apn.Provider(options);
      this.apnsBundleId = apnsBundleId;

      logger.info('✅ Apple Push Notification Service инициализирован');
    } catch (error) {
      logger.error('❌ Ошибка инициализации APNs:', error);
      // Не выбрасываем ошибку, чтобы сервер мог работать без APNs
    }
  }

  /**
   * Отправка одного уведомления
   */
  async sendNotification(notification) {
    const startTime = Date.now();
    
    try {
      const { token, title, body, data, platform } = notification;

      logger.info('Отправка уведомления', {
        platform,
        title: title.substring(0, 50),
        tokenPrefix: token.substring(0, 10)
      });

      let result;

      if (platform === 'ios') {
        result = await this.sendAPNsNotification(token, title, body, data);
      } else {
        result = await this.sendFCMNotification(token, title, body, data);
      }

      // Логируем аналитику
      this.logAnalytics({
        platform,
        status: result.success ? 'sent' : 'failed',
        error: result.error,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      logger.error('Ошибка отправки уведомления:', error);

      this.logAnalytics({
        platform: notification.platform || 'unknown',
        status: 'failed',
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Отправка через Firebase FCM (Android)
   */
  async sendFCMNotification(token, title, body, data = {}) {
    try {
      if (!this.fcmApp) {
        throw new Error('Firebase не инициализирован');
      }

      const message = {
        token,
        notification: {
          title,
          body
        },
        data: {
          ...data,
          // Конвертируем все значения в строки (требование FCM)
          ...Object.keys(data).reduce((acc, key) => {
            acc[key] = String(data[key]);
            return acc;
          }, {})
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
            priority: 'high'
          }
        }
      };

      const response = await admin.messaging().send(message);

      logger.info('FCM уведомление отправлено', {
        messageId: response,
        tokenPrefix: token.substring(0, 10)
      });

      return {
        success: true,
        messageId: response,
        platform: 'android'
      };
    } catch (error) {
      logger.error('Ошибка отправки FCM:', error);

      return {
        success: false,
        error: error.message,
        platform: 'android'
      };
    }
  }

  /**
   * Отправка через Apple APNs (iOS)
   */
  async sendAPNsNotification(token, title, body, data = {}) {
    try {
      if (!this.apnProvider) {
        throw new Error('APNs не инициализирован');
      }

      const notification = new apn.Notification();
      
      notification.topic = this.apnsBundleId;
      notification.alert = {
        title,
        body
      };
      notification.sound = 'default';
      notification.badge = 1;
      notification.payload = data;

      const result = await this.apnProvider.send(notification, token);

      if (result.sent && result.sent.length > 0) {
        logger.info('APNs уведомление отправлено', {
          sent: result.sent.length,
          tokenPrefix: token.substring(0, 10)
        });

        return {
          success: true,
          messageId: result.sent[0].device,
          platform: 'ios'
        };
      } else if (result.failed && result.failed.length > 0) {
        const failure = result.failed[0];
        logger.error('APNs уведомление не доставлено', {
          error: failure.error,
          status: failure.status,
          tokenPrefix: token.substring(0, 10)
        });

        return {
          success: false,
          error: `APNs error: ${failure.error} (${failure.status})`,
          platform: 'ios'
        };
      } else {
        return {
          success: false,
          error: 'Неизвестная ошибка APNs',
          platform: 'ios'
        };
      }
    } catch (error) {
      logger.error('Ошибка отправки APNs:', error);

      return {
        success: false,
        error: error.message,
        platform: 'ios'
      };
    }
  }

  /**
   * Пакетная отправка уведомлений
   */
  async sendBatch(notifications) {
    try {
      logger.info('Пакетная отправка уведомлений', {
        count: notifications.length
      });

      // Разделяем по платформам для оптимизации
      const androidNotifications = notifications.filter(n => n.platform !== 'ios');
      const iosNotifications = notifications.filter(n => n.platform === 'ios');

      const results = [];

      // Отправляем Android уведомления через FCM batch API
      if (androidNotifications.length > 0 && this.fcmApp) {
        const fcmResults = await this.sendFCMBatch(androidNotifications);
        results.push(...fcmResults);
      }

      // Отправляем iOS уведомления
      if (iosNotifications.length > 0 && this.apnProvider) {
        const apnsResults = await this.sendAPNsBatch(iosNotifications);
        results.push(...apnsResults);
      }

      // Если нет соответствующих сервисов, отправляем по одному
      const remainingNotifications = notifications.filter(n => {
        if (n.platform === 'ios' && !this.apnProvider) return true;
        if (n.platform !== 'ios' && !this.fcmApp) return true;
        return false;
      });

      for (const notification of remainingNotifications) {
        const result = await this.sendNotification(notification);
        results.push(result);
      }

      return results;
    } catch (error) {
      logger.error('Ошибка пакетной отправки:', error);
      throw error;
    }
  }

  /**
   * Пакетная отправка FCM
   */
  async sendFCMBatch(notifications) {
    try {
      const messages = notifications.map(({ token, title, body, data = {} }) => ({
        token,
        notification: { title, body },
        data: Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {}),
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default'
          }
        }
      }));

      const response = await admin.messaging().sendAll(messages);

      logger.info('FCM batch отправлен', {
        total: response.responses.length,
        success: response.successCount,
        failures: response.failureCount
      });

      return response.responses.map((result, index) => ({
        success: result.success,
        messageId: result.messageId,
        error: result.error?.message,
        platform: 'android',
        originalIndex: index
      }));
    } catch (error) {
      logger.error('Ошибка FCM batch:', error);
      throw error;
    }
  }

  /**
   * Пакетная отправка APNs
   */
  async sendAPNsBatch(notifications) {
    try {
      const results = [];

      // APNs не поддерживает batch API, отправляем параллельно
      const promises = notifications.map(async ({ token, title, body, data = {} }, index) => {
        const result = await this.sendAPNsNotification(token, title, body, data);
        return { ...result, originalIndex: index };
      });

      const batchResults = await Promise.allSettled(promises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason.message,
            platform: 'ios'
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Ошибка APNs batch:', error);
      throw error;
    }
  }

  /**
   * Логирование аналитики
   */
  logAnalytics(data) {
    this.analytics.push(data);

    // Ограничиваем размер массива аналитики
    if (this.analytics.length > 10000) {
      this.analytics = this.analytics.slice(-5000);
    }
  }

  /**
   * Получение аналитики
   */
  async getAnalytics(filters = {}) {
    try {
      const { from, to, platform } = filters;

      let filteredAnalytics = [...this.analytics];

      // Фильтрация по времени
      if (from) {
        filteredAnalytics = filteredAnalytics.filter(
          item => new Date(item.timestamp) >= from
        );
      }

      if (to) {
        filteredAnalytics = filteredAnalytics.filter(
          item => new Date(item.timestamp) <= to
        );
      }

      // Фильтрация по платформе
      if (platform) {
        filteredAnalytics = filteredAnalytics.filter(
          item => item.platform === platform
        );
      }

      // Подсчет статистики
      const total = filteredAnalytics.length;
      const successful = filteredAnalytics.filter(item => item.status === 'sent').length;
      const failed = filteredAnalytics.filter(item => item.status === 'failed').length;

      const platformStats = {};
      filteredAnalytics.forEach(item => {
        if (!platformStats[item.platform]) {
          platformStats[item.platform] = { total: 0, successful: 0, failed: 0 };
        }
        platformStats[item.platform].total++;
        if (item.status === 'sent') {
          platformStats[item.platform].successful++;
        } else {
          platformStats[item.platform].failed++;
        }
      });

      return {
        summary: {
          total,
          successful,
          failed,
          successRate: total > 0 ? (successful / total * 100).toFixed(2) + '%' : '0%'
        },
        platformStats,
        recentEvents: filteredAnalytics.slice(-50), // Последние 50 событий
        timeRange: {
          from: from ? from.toISOString() : null,
          to: to ? to.toISOString() : null
        }
      };
    } catch (error) {
      logger.error('Ошибка получения аналитики:', error);
      throw error;
    }
  }

  /**
   * Очистка аналитики
   */
  clearAnalytics() {
    this.analytics = [];
    logger.info('Аналитика очищена');
  }
}

module.exports = NotificationService;
