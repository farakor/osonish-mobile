/**
 * Конфигурация SMS сервисов для мобильного приложения (JavaScript версия)
 * Простая конфигурация без зависимости от переменных окружения
 */

// 🔧 КОНФИГУРАЦИЯ ESKIZ.UZ
// Замените на ваши реальные данные
const ESKIZ_CONFIG = {
  email: 'info@oson-ish.uz',
  password: 'O0gKE3R1MLVT8JRwbXnQf70TuIvLhHrekjEiwu6g', // Правильный пароль
  baseUrl: 'https://notify.eskiz.uz/api'
};

// 🔧 КОНФИГУРАЦИЯ TWILIO (резервная)
const TWILIO_CONFIG = {
  accountSid: 'your_twilio_account_sid',
  authToken: 'your_twilio_auth_token',
  fromNumber: '+1234567890'
};

// 🔧 ОБЩИЕ НАСТРОЙКИ
const SMS_SENDER_NAME = 'OsonIsh';
const SMS_PROVIDER = 'eskiz'; // 'eskiz' или 'twilio'

// Конфигурация для разных окружений
const smsConfig = {
  provider: SMS_PROVIDER,
  eskiz: ESKIZ_CONFIG,
  twilio: TWILIO_CONFIG,
  senderName: SMS_SENDER_NAME
};

/**
 * Валидация конфигурации SMS
 */
const validateSMSConfig = () => {
  const errors = [];

  if (!smsConfig.provider) {
    errors.push('SMS provider не указан');
  }

  if (smsConfig.provider === 'eskiz' && smsConfig.eskiz) {
    if (!smsConfig.eskiz.email) {
      errors.push('Eskiz email не указан');
    }
    if (!smsConfig.eskiz.password) {
      errors.push('Eskiz password не указан');
    }
    if (!smsConfig.eskiz.baseUrl) {
      errors.push('Eskiz baseUrl не указан');
    }
  }

  if (smsConfig.provider === 'twilio' && smsConfig.twilio) {
    if (!smsConfig.twilio.accountSid) {
      errors.push('Twilio Account SID не указан');
    }
    if (!smsConfig.twilio.authToken) {
      errors.push('Twilio Auth Token не указан');
    }
    if (!smsConfig.twilio.fromNumber) {
      errors.push('Twilio From Number не указан');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Логирование конфигурации в dev режиме
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('[SMSConfig] 🔧 Конфигурация SMS:', {
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

module.exports = {
  smsConfig,
  validateSMSConfig
};
