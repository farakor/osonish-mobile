/**
 * 📝 Логгер для сервера уведомлений
 */

const winston = require('winston');
const path = require('path');

// Создаем директорию для логов если её нет
const logDir = path.join(__dirname, '..', 'logs');
require('fs').mkdirSync(logDir, { recursive: true });

// Настройка форматирования
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Настройка консольного форматирования
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ' ' + JSON.stringify(meta, null, 0);
    }
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);

// Создание логгера
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'osonish-notification-server' },
  transports: [
    // Файл для ошибок
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),

    // Файл для всех логов
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),

    // Консоль
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

// В production убираем консольные логи debug уровня
if (process.env.NODE_ENV === 'production') {
  logger.transports.forEach(transport => {
    if (transport instanceof winston.transports.Console) {
      transport.level = 'info';
    }
  });
}

module.exports = logger;
