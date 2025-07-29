export interface SMSServiceConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface VerificationCodeData {
  phone: string;
  code: string;
  timestamp: number;
  attempts: number;
}

class SMSService {
  private config: SMSServiceConfig | null = null;
  private verificationCodes: Map<string, VerificationCodeData> = new Map();
  private readonly CODE_EXPIRY_TIME = 10 * 60 * 1000; // 10 минут
  private readonly MAX_ATTEMPTS = 3;

  // Инициализация сервиса с конфигурацией
  init(config: SMSServiceConfig) {
    this.config = config;
  }

  // Генерация 6-значного кода
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Форматирование номера телефона
  private formatPhoneNumber(phone: string): string {
    // Убираем все символы кроме цифр
    const digits = phone.replace(/\D/g, '');

    // Если номер начинается с 998, добавляем +
    if (digits.startsWith('998')) {
      return '+' + digits;
    }

    // Если номер начинается с 8, заменяем на +998
    if (digits.startsWith('8') && digits.length === 10) {
      return '+998' + digits.slice(1);
    }

    return phone;
  }

  // Отправка SMS через Twilio API
  private async sendSMSViaTwilio(phone: string, message: string): Promise<SMSResponse> {
    if (!this.config) {
      return { success: false, error: 'SMS сервис не настроен' };
    }

    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${this.config.accountSid}:${this.config.authToken}`)
        },
        body: new URLSearchParams({
          To: phone,
          From: this.config.fromNumber,
          Body: message
        })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, messageId: data.sid };
      } else {
        return { success: false, error: data.message || 'Ошибка отправки SMS' };
      }
    } catch (error) {
      console.error('SMS отправка ошибка:', error);
      return { success: false, error: 'Не удалось отправить SMS' };
    }
  }

  // Отправка кода верификации
  async sendVerificationCode(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      // Проверяем, не отправляли ли код недавно
      const existingCode = this.verificationCodes.get(formattedPhone);
      if (existingCode && (Date.now() - existingCode.timestamp) < 60000) { // 1 минута
        return { success: false, error: 'Код уже был отправлен. Подождите минуту.' };
      }

      const code = this.generateCode();
      const message = `Ваш код подтверждения для Osonish: ${code}. Не сообщайте этот код никому.`;

      // В режиме разработки используем тестовый код
      if (__DEV__) {
        console.log(`[DEV] SMS код для ${formattedPhone}: ${code}`);

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
      const result = await this.sendSMSViaTwilio(formattedPhone, message);

      if (result.success) {
        // Сохраняем код для верификации
        this.verificationCodes.set(formattedPhone, {
          phone: formattedPhone,
          code,
          timestamp: Date.now(),
          attempts: 0
        });
      }

      return result;
    } catch (error) {
      console.error('Ошибка отправки кода:', error);
      return { success: false, error: 'Произошла ошибка при отправке кода' };
    }
  }

  // Верификация кода
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
      console.error('Ошибка верификации кода:', error);
      return { success: false, error: 'Произошла ошибка при проверке кода' };
    }
  }

  // Очистка истекших кодов
  cleanupExpiredCodes(): void {
    const now = Date.now();
    for (const [phone, codeData] of this.verificationCodes) {
      if (now - codeData.timestamp > this.CODE_EXPIRY_TIME) {
        this.verificationCodes.delete(phone);
      }
    }
  }
}

// Экспортируем синглтон
export const smsService = new SMSService();

// Инициализация сервиса (вызывается при запуске приложения)
export const initSMSService = () => {
  // В реальном приложении эти данные должны быть в переменных окружения
  const config: SMSServiceConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'your_twilio_account_sid',
    authToken: process.env.TWILIO_AUTH_TOKEN || 'your_twilio_auth_token',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '+1234567890'
  };

  smsService.init(config);

  // Запускаем очистку истекших кодов каждые 5 минут
  setInterval(() => {
    smsService.cleanupExpiredCodes();
  }, 5 * 60 * 1000);
}; 