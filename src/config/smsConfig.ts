/**
 * Конфигурация SMS сервисов для Oson Ish
 * Поддерживает Eskiz.uz и Twilio
 */

import { EskizConfig } from '../services/eskizSMSService';
import { SMSServiceConfig } from '../services/smsService';

// Тип SMS провайдера
export type SMSProvider = 'eskiz' | 'twilio';

// Конфигурация для разных окружений
interface SMSEnvironmentConfig {
  provider: SMSProvider;
  eskiz?: EskizConfig;
  twilio?: SMSServiceConfig;
  senderName?: string; // Имя отправителя для SMS
}

// Получение переменных окружения с fallback значениями
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // В React Native используем process.env для переменных окружения
  // Для Expo используем переменные с префиксом EXPO_PUBLIC_ или прямое обращение
  if (key === 'FORCE_PRODUCTION_SMS') {
    // Специальная обработка для переключения режимов
    return process.env.FORCE_PRODUCTION_SMS || process.env.EXPO_PUBLIC_FORCE_PRODUCTION_SMS || defaultValue;
  }
  return process.env[key] || defaultValue;
};

// Конфигурация для разработки
const developmentConfig: SMSEnvironmentConfig = {
  provider: 'eskiz', // Используем Eskiz по умолчанию
  eskiz: {
    email: getEnvVar('ESKIZ_EMAIL', 'your_eskiz_email@example.com'),
    password: getEnvVar('ESKIZ_PASSWORD', 'your_eskiz_password'),
    baseUrl: getEnvVar('ESKIZ_BASE_URL', 'https://notify.eskiz.uz/api'),
  },
  twilio: {
    accountSid: getEnvVar('TWILIO_ACCOUNT_SID', 'your_twilio_account_sid'),
    authToken: getEnvVar('TWILIO_AUTH_TOKEN', 'your_twilio_auth_token'),
    fromNumber: getEnvVar('TWILIO_FROM_NUMBER', '+1234567890'),
  },
  senderName: getEnvVar('SMS_SENDER_NAME', 'OsonIsh'),
};

// Конфигурация для продакшена
const productionConfig: SMSEnvironmentConfig = {
  provider: 'eskiz',
  eskiz: {
    email: getEnvVar('ESKIZ_EMAIL'),
    password: getEnvVar('ESKIZ_PASSWORD'),
    baseUrl: getEnvVar('ESKIZ_BASE_URL', 'https://notify.eskiz.uz/api'),
  },
  twilio: {
    accountSid: getEnvVar('TWILIO_ACCOUNT_SID'),
    authToken: getEnvVar('TWILIO_AUTH_TOKEN'),
    fromNumber: getEnvVar('TWILIO_FROM_NUMBER'),
  },
  senderName: getEnvVar('SMS_SENDER_NAME', 'OsonIsh'),
};

// Конфигурация для тестирования
const testConfig: SMSEnvironmentConfig = {
  provider: 'eskiz',
  eskiz: {
    email: 'test@example.com',
    password: 'test_password',
    baseUrl: 'https://notify.eskiz.uz/api',
  },
  twilio: {
    accountSid: 'test_account_sid',
    authToken: 'test_auth_token',
    fromNumber: '+1234567890',
  },
  senderName: 'TestOsonIsh',
};

// Определение текущего окружения
const getEnvironment = (): 'development' | 'production' | 'test' => {
  if (__DEV__) {
    return 'development';
  }

  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }

  return 'production';
};

// Получение конфигурации для текущего окружения
const getConfigForEnvironment = (): SMSEnvironmentConfig => {
  const env = getEnvironment();

  switch (env) {
    case 'development':
      return developmentConfig;
    case 'test':
      return testConfig;
    case 'production':
    default:
      return productionConfig;
  }
};

// Экспортируемая конфигурация
export const smsConfig = getConfigForEnvironment();

// Валидация конфигурации
export const validateSMSConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const config = smsConfig;

  if (!config.provider) {
    errors.push('SMS provider не указан');
  }

  if (config.provider === 'eskiz' && config.eskiz) {
    if (!config.eskiz.email) {
      errors.push('Eskiz email не указан');
    }
    if (!config.eskiz.password) {
      errors.push('Eskiz password не указан');
    }
    if (!config.eskiz.baseUrl) {
      errors.push('Eskiz baseUrl не указан');
    }
  }

  if (config.provider === 'twilio' && config.twilio) {
    if (!config.twilio.accountSid) {
      errors.push('Twilio Account SID не указан');
    }
    if (!config.twilio.authToken) {
      errors.push('Twilio Auth Token не указан');
    }
    if (!config.twilio.fromNumber) {
      errors.push('Twilio From Number не указан');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Логирование конфигурации (только для разработки)
if (__DEV__) {
  console.log('[SMSConfig] 🔧 Текущая конфигурация SMS:', {
    environment: getEnvironment(),
    provider: smsConfig.provider,
    senderName: smsConfig.senderName,
    eskizConfigured: !!smsConfig.eskiz?.email,
    twilioConfigured: !!smsConfig.twilio?.accountSid,
  });

  const validation = validateSMSConfig();
  if (!validation.isValid) {
    console.warn('[SMSConfig] ⚠️ Проблемы с конфигурацией SMS:', validation.errors);
  } else {
    console.log('[SMSConfig] ✅ Конфигурация SMS валидна');
  }
}
