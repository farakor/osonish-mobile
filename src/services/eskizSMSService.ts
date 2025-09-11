/**
 * Eskiz.uz SMS Service для отправки SMS через узбекский SMS-шлюз
 * Документация API: https://documenter.getpostman.com/view/663428/RzfmES4z?version=latest
 */

export interface EskizConfig {
  email: string;
  password: string;
  baseUrl?: string;
}

export interface EskizAuthResponse {
  message: string;
  data: {
    token: string;
  };
  token_type: string;
}

export interface EskizSMSRequest {
  mobile_phone: string;
  message: string;
  from?: string;
  callback_url?: string;
}

export interface EskizSMSResponse {
  id: string;
  status: string;
  message: string;
}

export interface EskizBalanceResponse {
  balance: number;
}

export interface EskizUserInfoResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  sms_api_login: string;
  sms_api_password: string;
  uz_price: number;
  ru_price: number;
  test_phone: string;
}

interface VerificationCodeData {
  phone: string;
  code: string;
  timestamp: number;
  attempts: number;
}

export class EskizSMSService {
  private config: EskizConfig | null = null;
  private accessToken: string | null = null;
  private tokenExpiryTime: number = 0;
  private verificationCodes: Map<string, VerificationCodeData> = new Map();

  private readonly BASE_URL = 'https://notify.eskiz.uz/api';
  private readonly CODE_EXPIRY_TIME = 10 * 60 * 1000; // 10 минут
  private readonly MAX_ATTEMPTS = 3;
  private readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 минут до истечения токена

  /**
   * Инициализация сервиса с конфигурацией
   */
  init(config: EskizConfig): void {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || this.BASE_URL
    };
  }

  /**
   * Аутентификация в Eskiz API и получение токена доступа
   */
  private async authenticate(): Promise<boolean> {
    if (!this.config) {
      console.error('[EskizSMS] Сервис не инициализирован');
      return false;
    }

    try {
      console.log('[EskizSMS] 🔐 Аутентификация в Eskiz API...');

      const response = await fetch(`${this.config.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.config.email,
          password: this.config.password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EskizSMS] ❌ Ошибка аутентификации:', response.status, errorText);
        return false;
      }

      const data: EskizAuthResponse = await response.json();

      if (data.data && data.data.token) {
        this.accessToken = data.data.token;
        // Токен действителен 30 дней, но мы будем обновлять его каждые 29 дней
        this.tokenExpiryTime = Date.now() + (29 * 24 * 60 * 60 * 1000);
        console.log('[EskizSMS] ✅ Успешная аутентификация');
        return true;
      } else {
        console.error('[EskizSMS] ❌ Неверный формат ответа аутентификации:', data);
        return false;
      }
    } catch (error) {
      console.error('[EskizSMS] ❌ Ошибка при аутентификации:', error);
      return false;
    }
  }

  /**
   * Проверка и обновление токена при необходимости
   */
  private async ensureValidToken(): Promise<boolean> {
    if (!this.accessToken || Date.now() > (this.tokenExpiryTime - this.TOKEN_REFRESH_BUFFER)) {
      console.log('[EskizSMS] 🔄 Токен истек или отсутствует, обновляем...');
      return await this.authenticate();
    }
    return true;
  }

  /**
   * Форматирование номера телефона для Узбекистана
   */
  private formatPhoneNumber(phone: string): string {
    // Убираем все символы кроме цифр
    const digits = phone.replace(/\D/g, '');

    // Если номер начинается с 998, возвращаем как есть
    if (digits.startsWith('998')) {
      return digits;
    }

    // Если номер начинается с 8 и длина 10, заменяем на 998
    if (digits.startsWith('8') && digits.length === 10) {
      return '998' + digits.slice(1);
    }

    // Если номер начинается с 9 и длина 9, добавляем 998
    if (digits.startsWith('9') && digits.length === 9) {
      return '998' + digits;
    }

    // Если номер уже в правильном формате (12 цифр, начинается с 998)
    if (digits.length === 12 && digits.startsWith('998')) {
      return digits;
    }

    console.warn('[EskizSMS] ⚠️ Неопознанный формат номера:', phone);
    return digits;
  }

  /**
   * Генерация 6-значного кода верификации
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Отправка SMS через Eskiz API
   */
  private async sendSMSViaEskiz(phone: string, message: string, from?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!(await this.ensureValidToken())) {
      return { success: false, error: 'Не удалось аутентифицироваться в Eskiz API' };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      const requestBody: EskizSMSRequest = {
        mobile_phone: formattedPhone,
        message: message,
      };

      if (from) {
        requestBody.from = from;
      }

      console.log('[EskizSMS] 📤 Отправка SMS на номер:', formattedPhone);

      const response = await fetch(`${this.config!.baseUrl}/message/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.id) {
        console.log('[EskizSMS] ✅ SMS успешно отправлено, ID:', data.id);
        return { success: true, messageId: data.id };
      } else {
        console.error('[EskizSMS] ❌ Ошибка отправки SMS:', data);
        return { success: false, error: data.message || 'Ошибка отправки SMS' };
      }
    } catch (error) {
      console.error('[EskizSMS] ❌ Исключение при отправке SMS:', error);
      return { success: false, error: 'Не удалось отправить SMS' };
    }
  }

  /**
   * Получение баланса аккаунта
   */
  async getBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
    if (!(await this.ensureValidToken())) {
      return { success: false, error: 'Не удалось аутентифицироваться в Eskiz API' };
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/user/get-limit`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (response.ok) {
        const data: EskizBalanceResponse = await response.json();
        return { success: true, balance: data.balance };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Ошибка получения баланса' };
      }
    } catch (error) {
      console.error('[EskizSMS] ❌ Ошибка получения баланса:', error);
      return { success: false, error: 'Не удалось получить баланс' };
    }
  }

  /**
   * Получение информации о пользователе
   */
  async getUserInfo(): Promise<{ success: boolean; userInfo?: EskizUserInfoResponse; error?: string }> {
    if (!(await this.ensureValidToken())) {
      return { success: false, error: 'Не удалось аутентифицироваться в Eskiz API' };
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/auth/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (response.ok) {
        const userInfo: EskizUserInfoResponse = await response.json();
        return { success: true, userInfo };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Ошибка получения информации о пользователе' };
      }
    } catch (error) {
      console.error('[EskizSMS] ❌ Ошибка получения информации о пользователе:', error);
      return { success: false, error: 'Не удалось получить информацию о пользователе' };
    }
  }

  /**
   * Проверка, является ли номер тестовым для App Store/Google Play
   */
  private isTestNumber(phone: string): boolean {
    const formattedPhone = this.formatPhoneNumber(phone);
    // Тестовый номер для App Store и Google Play
    return formattedPhone === '998999999999';
  }

  /**
   * Отправка кода верификации
   */
  async sendVerificationCode(phone: string, from?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      // Проверяем, не отправляли ли код недавно (защита от спама)
      const existingCode = this.verificationCodes.get(formattedPhone);
      if (existingCode && (Date.now() - existingCode.timestamp) < 60000) { // 1 минута
        return { success: false, error: 'Код уже был отправлен. Подождите минуту.' };
      }

      // Специальная обработка для тестового номера App Store/Google Play
      if (this.isTestNumber(formattedPhone)) {
        const testCode = '123456'; // Фиксированный код для тестового номера
        console.log(`[EskizSMS TEST] Тестовый номер ${formattedPhone}, используем код: ${testCode}`);

        // Сохраняем тестовый код для верификации
        this.verificationCodes.set(formattedPhone, {
          phone: formattedPhone,
          code: testCode,
          timestamp: Date.now(),
          attempts: 0
        });

        return { success: true };
      }

      const code = this.generateCode();
      const message = `${code} - Код подтверждения авторизации в приложении Oson Ish`;

      // В режиме разработки используем тестовый код (если не принудительно включен продакшн)
      const { shouldSendRealSMS } = require('../config/smsMode.js');

      if (!shouldSendRealSMS()) {
        console.log(`[EskizSMS DEV] SMS код для ${formattedPhone}: ${code}`);

        // Сохраняем код для верификации
        this.verificationCodes.set(formattedPhone, {
          phone: formattedPhone,
          code,
          timestamp: Date.now(),
          attempts: 0
        });

        return { success: true };
      }

      // В продакшене отправляем реальный SMS
      const result = await this.sendSMSViaEskiz(formattedPhone, message, from);

      if (result.success) {
        // Сохраняем код для верификации
        this.verificationCodes.set(formattedPhone, {
          phone: formattedPhone,
          code,
          timestamp: Date.now(),
          attempts: 0
        });

        console.log('[EskizSMS] ✅ Код верификации отправлен на номер:', formattedPhone);
      }

      return result;
    } catch (error) {
      console.error('[EskizSMS] ❌ Ошибка отправки кода верификации:', error);
      return { success: false, error: 'Произошла ошибка при отправке кода' };
    }
  }

  /**
   * Верификация введенного кода
   */
  async verifyCode(phone: string, inputCode: string): Promise<{ success: boolean; error?: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const codeData = this.verificationCodes.get(formattedPhone);

      if (!codeData) {
        return { success: false, error: 'Код не найден. Запросите новый код.' };
      }

      // Проверяем срок действия кода
      if (Date.now() - codeData.timestamp > this.CODE_EXPIRY_TIME) {
        this.verificationCodes.delete(formattedPhone);
        return { success: false, error: 'Код истек. Запросите новый код.' };
      }

      // Проверяем количество попыток
      if (codeData.attempts >= this.MAX_ATTEMPTS) {
        this.verificationCodes.delete(formattedPhone);
        return { success: false, error: 'Превышено количество попыток. Запросите новый код.' };
      }

      // Увеличиваем счетчик попыток
      codeData.attempts++;

      // Проверяем код
      if (codeData.code === inputCode) {
        // Удаляем код после успешной верификации
        this.verificationCodes.delete(formattedPhone);
        console.log('[EskizSMS] ✅ Код успешно верифицирован для номера:', formattedPhone);
        return { success: true };
      } else {
        // Обновляем данные с увеличенным счетчиком попыток
        this.verificationCodes.set(formattedPhone, codeData);
        return {
          success: false,
          error: `Неверный код. Осталось попыток: ${this.MAX_ATTEMPTS - codeData.attempts}`
        };
      }
    } catch (error) {
      console.error('[EskizSMS] ❌ Ошибка верификации кода:', error);
      return { success: false, error: 'Произошла ошибка при проверке кода' };
    }
  }

  /**
   * Очистка истекших кодов верификации
   */
  cleanupExpiredCodes(): void {
    const now = Date.now();
    this.verificationCodes.forEach((codeData, phone) => {
      if (now - codeData.timestamp > this.CODE_EXPIRY_TIME) {
        this.verificationCodes.delete(phone);
        console.log('[EskizSMS] 🧹 Удален истекший код для номера:', phone);
      }
    });
  }

  /**
   * Проверка статуса сервиса
   */
  async checkServiceStatus(): Promise<{ success: boolean; authenticated: boolean; balance?: number; error?: string }> {
    try {
      const authResult = await this.ensureValidToken();
      if (!authResult) {
        return { success: false, authenticated: false, error: 'Не удалось аутентифицироваться' };
      }

      const balanceResult = await this.getBalance();
      return {
        success: true,
        authenticated: true,
        balance: balanceResult.balance,
        error: balanceResult.error
      };
    } catch (error) {
      console.error('[EskizSMS] ❌ Ошибка проверки статуса сервиса:', error);
      return { success: false, authenticated: false, error: 'Ошибка проверки статуса' };
    }
  }
}

// Конфигурация Eskiz (прямо в коде для React Native)
const ESKIZ_CONFIG: EskizConfig = {
  email: 'info@oson-ish.uz',
  password: 'O0gKE3R1MLVT8JRwbXnQf70TuIvLhHrekjEiwu6g', // Реальный пароль из .env
  baseUrl: 'https://notify.eskiz.uz/api'
};

// Логируем конфигурацию (с полными данными для отладки)
console.log('[EskizSMS] 🔧 Конфигурация Eskiz:', {
  email: ESKIZ_CONFIG.email,
  password: ESKIZ_CONFIG.password, // Временно показываем пароль для отладки
  baseUrl: ESKIZ_CONFIG.baseUrl,
  hasPassword: !!ESKIZ_CONFIG.password
});

// Экспортируем синглтон
export const eskizSMSService = new EskizSMSService();

// Автоматическая инициализация при загрузке модуля
eskizSMSService.init(ESKIZ_CONFIG);

// Запускаем очистку истекших кодов каждые 5 минут
setInterval(() => {
  eskizSMSService.cleanupExpiredCodes();
}, 5 * 60 * 1000);

console.log('[EskizSMS] 🚀 Eskiz SMS сервис автоматически инициализирован');

/**
 * Инициализация Eskiz SMS сервиса (для совместимости)
 */
export const initEskizSMSService = (config?: EskizConfig) => {
  if (config) {
    eskizSMSService.init(config);
    console.log('[EskizSMS] 🔄 Eskiz SMS сервис переинициализирован с новой конфигурацией');
  }
};
