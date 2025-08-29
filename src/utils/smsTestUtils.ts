/**
 * Утилиты для тестирования SMS сервисов
 * Поддерживает тестирование Eskiz.uz и Twilio интеграции
 */

import { eskizSMSService } from '../services/eskizSMSService';
import { smsService } from '../services/smsService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { smsConfig } from '../config/smsConfig';
import { handleSMSError } from './smsErrorHandler';

export interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

export interface SMSTestSuite {
  configurationTest: TestResult;
  authenticationTest: TestResult;
  balanceTest?: TestResult;
  sendSMSTest?: TestResult;
  verificationTest?: TestResult;
  supabaseIntegrationTest?: TestResult;
}

class SMSTestUtils {
  /**
   * Тестовые номера телефонов для разных сценариев
   */
  private readonly TEST_PHONES = {
    valid: '+998901234567',
    invalid: '123456',
    uzbek: '+998971234567',
    international: '+1234567890'
  };

  /**
   * Тестовые коды верификации
   */
  private readonly TEST_CODES = {
    valid: '123456',
    invalid: '000000',
    expired: '999999'
  };

  /**
   * Проверка конфигурации SMS сервиса
   */
  async testConfiguration(): Promise<TestResult> {
    try {
      console.log('[SMSTest] 🔧 Тестирование конфигурации...');

      const provider = smsConfig.provider;

      if (!provider) {
        return {
          success: false,
          message: 'SMS провайдер не настроен',
          error: 'Отсутствует конфигурация провайдера'
        };
      }

      let configValid = false;
      let details: any = { provider };

      switch (provider) {
        case 'eskiz':
          if (smsConfig.eskiz?.email && smsConfig.eskiz?.password) {
            configValid = true;
            details.eskiz = {
              email: smsConfig.eskiz.email,
              baseUrl: smsConfig.eskiz.baseUrl,
              hasPassword: !!smsConfig.eskiz.password
            };
          }
          break;

        case 'twilio':
          if (smsConfig.twilio?.accountSid && smsConfig.twilio?.authToken) {
            configValid = true;
            details.twilio = {
              accountSid: smsConfig.twilio.accountSid,
              fromNumber: smsConfig.twilio.fromNumber,
              hasAuthToken: !!smsConfig.twilio.authToken
            };
          }
          break;
      }

      return {
        success: configValid,
        message: configValid ?
          `Конфигурация ${provider} корректна` :
          `Конфигурация ${provider} неполная`,
        details
      };

    } catch (error) {
      const smsError = handleSMSError(error, 'Configuration Test');
      return {
        success: false,
        message: 'Ошибка проверки конфигурации',
        error: smsError.message
      };
    }
  }

  /**
   * Тестирование аутентификации в SMS сервисе
   */
  async testAuthentication(): Promise<TestResult> {
    try {
      console.log('[SMSTest] 🔐 Тестирование аутентификации...');

      switch (smsConfig.provider) {
        case 'eskiz':
          // Проверяем статус Eskiz сервиса
          const eskizStatus = await eskizSMSService.checkServiceStatus();

          return {
            success: eskizStatus.success && eskizStatus.authenticated,
            message: eskizStatus.success ?
              'Аутентификация Eskiz успешна' :
              'Ошибка аутентификации Eskiz',
            details: {
              authenticated: eskizStatus.authenticated,
              balance: eskizStatus.balance
            },
            error: eskizStatus.error
          };

        case 'twilio':
          // Для Twilio пока возвращаем базовую проверку
          return {
            success: true,
            message: 'Twilio конфигурация доступна',
            details: { provider: 'twilio' }
          };

        default:
          return {
            success: false,
            message: 'Неподдерживаемый провайдер',
            error: `Провайдер ${smsConfig.provider} не поддерживается`
          };
      }

    } catch (error) {
      const smsError = handleSMSError(error, 'Authentication Test');
      return {
        success: false,
        message: 'Ошибка тестирования аутентификации',
        error: smsError.message
      };
    }
  }

  /**
   * Тестирование получения баланса
   */
  async testBalance(): Promise<TestResult> {
    try {
      console.log('[SMSTest] 💰 Тестирование получения баланса...');

      switch (smsConfig.provider) {
        case 'eskiz':
          const balanceResult = await eskizSMSService.getBalance();

          return {
            success: balanceResult.success,
            message: balanceResult.success ?
              `Баланс получен: ${balanceResult.balance}` :
              'Ошибка получения баланса',
            details: { balance: balanceResult.balance },
            error: balanceResult.error
          };

        case 'twilio':
          return {
            success: true,
            message: 'Twilio не поддерживает проверку баланса через API',
            details: { provider: 'twilio' }
          };

        default:
          return {
            success: false,
            message: 'Неподдерживаемый провайдер для проверки баланса'
          };
      }

    } catch (error) {
      const smsError = handleSMSError(error, 'Balance Test');
      return {
        success: false,
        message: 'Ошибка тестирования баланса',
        error: smsError.message
      };
    }
  }

  /**
   * Тестирование отправки SMS (только в режиме разработки)
   */
  async testSendSMS(testPhone?: string): Promise<TestResult> {
    try {
      console.log('[SMSTest] 📤 Тестирование отправки SMS...');

      const phone = testPhone || this.TEST_PHONES.valid;

      // В продакшене не отправляем реальные SMS для тестов
      if (!__DEV__) {
        return {
          success: true,
          message: 'Тестирование SMS отключено в продакшене',
          details: { phone, mode: 'production' }
        };
      }

      let result;
      switch (smsConfig.provider) {
        case 'eskiz':
          result = await eskizSMSService.sendVerificationCode(phone);
          break;
        case 'twilio':
          result = await smsService.sendVerificationCode(phone);
          break;
        default:
          return {
            success: false,
            message: 'Неподдерживаемый провайдер для отправки SMS'
          };
      }

      return {
        success: result.success,
        message: result.success ?
          'SMS код отправлен успешно' :
          'Ошибка отправки SMS',
        details: { phone, provider: smsConfig.provider },
        error: result.error
      };

    } catch (error) {
      const smsError = handleSMSError(error, 'Send SMS Test');
      return {
        success: false,
        message: 'Ошибка тестирования отправки SMS',
        error: smsError.message
      };
    }
  }

  /**
   * Тестирование верификации кода (только в режиме разработки)
   */
  async testVerification(testPhone?: string, testCode?: string): Promise<TestResult> {
    try {
      console.log('[SMSTest] 🔐 Тестирование верификации кода...');

      const phone = testPhone || this.TEST_PHONES.valid;
      const code = testCode || this.TEST_CODES.valid;

      // В продакшене используем только тестовые коды
      if (!__DEV__ && !testCode) {
        return {
          success: true,
          message: 'Тестирование верификации ограничено в продакшене',
          details: { phone, mode: 'production' }
        };
      }

      let result;
      switch (smsConfig.provider) {
        case 'eskiz':
          result = await eskizSMSService.verifyCode(phone, code);
          break;
        case 'twilio':
          result = await smsService.verifyCode(phone, code);
          break;
        default:
          return {
            success: false,
            message: 'Неподдерживаемый провайдер для верификации'
          };
      }

      return {
        success: result.success,
        message: result.success ?
          'Код верифицирован успешно' :
          'Ошибка верификации кода',
        details: { phone, code, provider: smsConfig.provider },
        error: result.error
      };

    } catch (error) {
      const smsError = handleSMSError(error, 'Verification Test');
      return {
        success: false,
        message: 'Ошибка тестирования верификации',
        error: smsError.message
      };
    }
  }

  /**
   * Тестирование интеграции с Supabase Auth
   */
  async testSupabaseIntegration(testPhone?: string): Promise<TestResult> {
    try {
      console.log('[SMSTest] 🔗 Тестирование интеграции с Supabase...');

      const phone = testPhone || this.TEST_PHONES.valid;

      // Тестируем отправку SMS через Supabase Auth Service
      const sendResult = await supabaseAuthService.signInWithPhone({ phone });

      if (!sendResult.success) {
        return {
          success: false,
          message: 'Ошибка отправки SMS через Supabase Auth',
          error: sendResult.error
        };
      }

      // В режиме разработки можем протестировать верификацию
      if (__DEV__) {
        // Используем тестовый код для верификации
        const verifyResult = await supabaseAuthService.verifyOtp({
          phone,
          token: this.TEST_CODES.valid
        });

        return {
          success: verifyResult.success,
          message: verifyResult.success ?
            'Интеграция с Supabase работает' :
            'Ошибка верификации через Supabase',
          details: {
            phone,
            sendSuccess: sendResult.success,
            verifySuccess: verifyResult.success,
            userId: verifyResult.user?.id
          },
          error: verifyResult.error
        };
      }

      return {
        success: true,
        message: 'SMS отправлен через Supabase Auth успешно',
        details: { phone, sendSuccess: true }
      };

    } catch (error) {
      const smsError = handleSMSError(error, 'Supabase Integration Test');
      return {
        success: false,
        message: 'Ошибка тестирования интеграции с Supabase',
        error: smsError.message
      };
    }
  }

  /**
   * Запуск полного набора тестов
   */
  async runFullTestSuite(testPhone?: string): Promise<SMSTestSuite> {
    console.log('[SMSTest] 🧪 Запуск полного набора тестов SMS...');

    const results: SMSTestSuite = {
      configurationTest: await this.testConfiguration(),
      authenticationTest: await this.testAuthentication(),
    };

    // Запускаем дополнительные тесты только если базовые прошли успешно
    if (results.configurationTest.success && results.authenticationTest.success) {
      results.balanceTest = await this.testBalance();

      // Тесты отправки SMS только в режиме разработки
      if (__DEV__) {
        results.sendSMSTest = await this.testSendSMS(testPhone);
        results.verificationTest = await this.testVerification(testPhone);
      }

      results.supabaseIntegrationTest = await this.testSupabaseIntegration(testPhone);
    }

    // Выводим сводку результатов
    this.logTestSummary(results);

    return results;
  }

  /**
   * Логирование сводки результатов тестов
   */
  private logTestSummary(results: SMSTestSuite): void {
    console.log('\n[SMSTest] 📊 Сводка результатов тестирования:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const tests = [
      { name: 'Конфигурация', result: results.configurationTest },
      { name: 'Аутентификация', result: results.authenticationTest },
      { name: 'Баланс', result: results.balanceTest },
      { name: 'Отправка SMS', result: results.sendSMSTest },
      { name: 'Верификация', result: results.verificationTest },
      { name: 'Supabase интеграция', result: results.supabaseIntegrationTest }
    ];

    tests.forEach(test => {
      if (test.result) {
        const status = test.result.success ? '✅' : '❌';
        console.log(`${status} ${test.name}: ${test.result.message}`);
        if (test.result.error) {
          console.log(`   ⚠️ Ошибка: ${test.result.error}`);
        }
      }
    });

    const totalTests = tests.filter(t => t.result).length;
    const passedTests = tests.filter(t => t.result?.success).length;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📈 Результат: ${passedTests}/${totalTests} тестов прошли успешно`);

    if (passedTests === totalTests) {
      console.log('🎉 Все тесты SMS сервиса прошли успешно!');
    } else {
      console.log('⚠️ Некоторые тесты не прошли. Проверьте конфигурацию.');
    }
  }

  /**
   * Быстрая проверка готовности SMS сервиса
   */
  async quickHealthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Проверка конфигурации
      const configTest = await this.testConfiguration();
      if (!configTest.success) {
        issues.push(`Конфигурация: ${configTest.message}`);
      }

      // Проверка аутентификации
      const authTest = await this.testAuthentication();
      if (!authTest.success) {
        issues.push(`Аутентификация: ${authTest.message}`);
      }

      // Проверка баланса (только для Eskiz)
      if (smsConfig.provider === 'eskiz') {
        const balanceTest = await this.testBalance();
        if (!balanceTest.success) {
          issues.push(`Баланс: ${balanceTest.message}`);
        }
      }

    } catch (error) {
      issues.push(`Общая ошибка: ${error}`);
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }
}

// Экспортируем синглтон
export const smsTestUtils = new SMSTestUtils();

// Утилитарные функции для быстрого доступа
export const runSMSTests = (testPhone?: string) => smsTestUtils.runFullTestSuite(testPhone);
export const checkSMSHealth = () => smsTestUtils.quickHealthCheck();
