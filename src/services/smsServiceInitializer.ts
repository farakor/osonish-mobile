/**
 * Инициализатор SMS сервисов для Oson Ish
 * Настраивает и инициализирует выбранный SMS провайдер
 */

const { smsConfig, validateSMSConfig } = require('../config/smsConfig.js');
import { initSMSService } from './smsService';
import { initEskizSMSService } from './eskizSMSService';

/**
 * Инициализация SMS сервисов в зависимости от конфигурации
 */
export const initializeSMSServices = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[SMSInitializer] 🚀 Инициализация SMS сервисов...');

    // Валидация конфигурации
    const validation = validateSMSConfig();
    if (!validation.isValid) {
      const errorMessage = `Неверная конфигурация SMS: ${validation.errors.join(', ')}`;
      console.error('[SMSInitializer] ❌', errorMessage);
      return { success: false, error: errorMessage };
    }

    // Инициализация в зависимости от провайдера
    switch (smsConfig.provider) {
      case 'eskiz':
        if (!smsConfig.eskiz) {
          const error = 'Конфигурация Eskiz не найдена';
          console.error('[SMSInitializer] ❌', error);
          return { success: false, error };
        }

        console.log('[SMSInitializer] 📱 Инициализация Eskiz SMS сервиса...');
        initEskizSMSService(smsConfig.eskiz);

        // Проверяем статус сервиса в продакшене
        if (!__DEV__) {
          const { eskizSMSService } = await import('./eskizSMSService');
          const statusCheck = await eskizSMSService.checkServiceStatus();

          if (!statusCheck.success) {
            const error = `Ошибка инициализации Eskiz: ${statusCheck.error}`;
            console.error('[SMSInitializer] ❌', error);
            return { success: false, error };
          }

          console.log('[SMSInitializer] ✅ Eskiz SMS сервис успешно инициализирован');
          console.log('[SMSInitializer] 💰 Баланс аккаунта:', statusCheck.balance);
        }
        break;

      case 'twilio':
        if (!smsConfig.twilio) {
          const error = 'Конфигурация Twilio не найдена';
          console.error('[SMSInitializer] ❌', error);
          return { success: false, error };
        }

        console.log('[SMSInitializer] 📱 Инициализация Twilio SMS сервиса...');
        initSMSService();
        console.log('[SMSInitializer] ✅ Twilio SMS сервис инициализирован');
        break;

      default:
        const error = `Неподдерживаемый SMS провайдер: ${smsConfig.provider}`;
        console.error('[SMSInitializer] ❌', error);
        return { success: false, error };
    }

    console.log('[SMSInitializer] 🎉 SMS сервисы успешно инициализированы');
    console.log('[SMSInitializer] 📋 Активный провайдер:', smsConfig.provider);
    console.log('[SMSInitializer] 📤 Имя отправителя:', smsConfig.senderName);

    return { success: true };
  } catch (error) {
    const errorMessage = `Ошибка инициализации SMS сервисов: ${error}`;
    console.error('[SMSInitializer] ❌', errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Получение информации о текущем SMS провайдере
 */
export const getSMSProviderInfo = () => {
  return {
    provider: smsConfig.provider,
    senderName: smsConfig.senderName,
    isConfigured: validateSMSConfig().isValid,
  };
};

/**
 * Проверка статуса SMS сервиса
 */
export const checkSMSServiceStatus = async (): Promise<{
  success: boolean;
  provider: string;
  authenticated?: boolean;
  balance?: number;
  error?: string;
}> => {
  try {
    const providerInfo = getSMSProviderInfo();

    if (!providerInfo.isConfigured) {
      return {
        success: false,
        provider: providerInfo.provider,
        error: 'SMS сервис не настроен'
      };
    }

    switch (smsConfig.provider) {
      case 'eskiz':
        const { eskizSMSService } = await import('./eskizSMSService');
        const eskizStatus = await eskizSMSService.checkServiceStatus();

        return {
          success: eskizStatus.success,
          provider: 'eskiz',
          authenticated: eskizStatus.authenticated,
          balance: eskizStatus.balance,
          error: eskizStatus.error
        };

      case 'twilio':
        // Для Twilio пока возвращаем базовую информацию
        return {
          success: true,
          provider: 'twilio',
          authenticated: true
        };

      default:
        return {
          success: false,
          provider: smsConfig.provider,
          error: 'Неподдерживаемый провайдер'
        };
    }
  } catch (error) {
    return {
      success: false,
      provider: smsConfig.provider,
      error: `Ошибка проверки статуса: ${error}`
    };
  }
};
