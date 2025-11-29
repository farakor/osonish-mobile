/**
 * 🖥️ Собственный сервер push уведомлений для Osonish
 * 
 * Этот сервер предоставляет альтернативу Expo Push Service
 * с поддержкой Firebase FCM и Apple APNs
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const NotificationService = require('./services/NotificationService');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Логирование запросов
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Инициализация сервиса уведомлений
const notificationService = new NotificationService();

// Middleware для проверки авторизации
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  // Проверяем токен (в production используйте JWT или другую систему)
  const validToken = process.env.API_TOKEN || 'osonish-notification-server-token';
  
  if (token !== validToken) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid access token' 
    });
  }

  next();
};

// Маршруты

/**
 * Проверка здоровья сервера
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * Информация о сервере
 */
app.get('/info', (req, res) => {
  res.json({
    success: true,
    server: 'Osonish Notification Server',
    version: '1.0.0',
    features: [
      'Firebase FCM (Android)',
      'Apple APNs (iOS)',
      'Batch notifications',
      'Analytics tracking',
      'Retry mechanism'
    ],
    endpoints: {
      sendNotification: 'POST /send-notification',
      sendBatch: 'POST /send-batch',
      analytics: 'GET /analytics',
      health: 'GET /health'
    }
  });
});

/**
 * Отправка одного уведомления
 */
app.post('/send-notification', authenticateToken, async (req, res) => {
  try {
    const { token, title, body, data, platform } = req.body;

    // Валидация
    if (!token || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: token, title, body'
      });
    }

    logger.info('Sending notification', {
      platform: platform || 'unknown',
      title: title.substring(0, 50),
      tokenPrefix: token.substring(0, 10)
    });

    const result = await notificationService.sendNotification({
      token,
      title,
      body,
      data: data || {},
      platform: platform || 'android'
    });

    if (result.success) {
      logger.info('Notification sent successfully', {
        messageId: result.messageId,
        platform: platform || 'unknown'
      });

      res.json({
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.error('Failed to send notification', {
        error: result.error,
        platform: platform || 'unknown'
      });

      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Server error while sending notification', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Отправка пакета уведомлений
 */
app.post('/send-batch', authenticateToken, async (req, res) => {
  try {
    const { notifications } = req.body;

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'notifications must be a non-empty array'
      });
    }

    if (notifications.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 notifications per batch'
      });
    }

    logger.info('Sending batch notifications', {
      count: notifications.length
    });

    const results = await notificationService.sendBatch(notifications);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logger.info('Batch notifications completed', {
      total: results.length,
      success: successCount,
      failures: failureCount
    });

    res.json({
      success: true,
      total: results.length,
      successful: successCount,
      failed: failureCount,
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Server error while sending batch notifications', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Получение аналитики
 */
app.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { from, to, platform } = req.query;
    
    const analytics = await notificationService.getAnalytics({
      from: from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000), // последние 24 часа
      to: to ? new Date(to) : new Date(),
      platform
    });

    res.json({
      success: true,
      analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Server error while getting analytics', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Тестовое уведомление
 */
app.post('/test-notification', authenticateToken, async (req, res) => {
  try {
    const { token, platform } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const testNotification = {
      token,
      title: '🧪 Тестовое уведомление',
      body: `Сервер работает! Время: ${new Date().toLocaleTimeString()}`,
      data: {
        test: true,
        timestamp: Date.now()
      },
      platform: platform || 'android'
    };

    logger.info('Sending test notification', {
      platform: testNotification.platform,
      tokenPrefix: token.substring(0, 10)
    });

    const result = await notificationService.sendNotification(testNotification);

    res.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Server error while sending test notification', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Обработка ошибок
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 обработчик
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  logger.info(`🚀 Osonish Notification Server запущен на порту ${PORT}`);
  logger.info('📋 Доступные endpoints:');
  logger.info('  GET  /health - проверка здоровья');
  logger.info('  GET  /info - информация о сервере');
  logger.info('  POST /send-notification - отправка уведомления');
  logger.info('  POST /send-batch - пакетная отправка');
  logger.info('  POST /test-notification - тестовое уведомление');
  logger.info('  GET  /analytics - аналитика');
  
  // Инициализация сервиса уведомлений
  notificationService.initialize().then(() => {
    logger.info('✅ Notification Service инициализирован');
  }).catch((error) => {
    logger.error('❌ Ошибка инициализации Notification Service:', error);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM получен, завершение работы...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT получен, завершение работы...');
  process.exit(0);
});

module.exports = app;
