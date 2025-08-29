/**
 * Обработчик ошибок SMS сервисов с локализацией
 * Поддерживает ошибки Eskiz.uz и Twilio
 */

export interface SMSError {
  code: string;
  message: string;
  originalError?: any;
  isRetryable: boolean;
  suggestedAction?: string;
}

export type Language = 'ru' | 'uz' | 'en';

// Словарь ошибок для разных языков
const errorMessages = {
  // Общие ошибки
  NETWORK_ERROR: {
    ru: 'Ошибка сети. Проверьте подключение к интернету.',
    uz: 'Tarmoq xatosi. Internet ulanishini tekshiring.',
    en: 'Network error. Check your internet connection.'
  },
  INVALID_PHONE: {
    ru: 'Неверный формат номера телефона.',
    uz: 'Telefon raqami formati noto\'g\'ri.',
    en: 'Invalid phone number format.'
  },
  CODE_EXPIRED: {
    ru: 'Код подтверждения истек. Запросите новый код.',
    uz: 'Tasdiqlash kodi muddati tugagan. Yangi kod so\'rang.',
    en: 'Verification code expired. Request a new code.'
  },
  CODE_INVALID: {
    ru: 'Неверный код подтверждения.',
    uz: 'Tasdiqlash kodi noto\'g\'ri.',
    en: 'Invalid verification code.'
  },
  TOO_MANY_ATTEMPTS: {
    ru: 'Превышено количество попыток. Попробуйте позже.',
    uz: 'Urinishlar soni oshib ketdi. Keyinroq urinib ko\'ring.',
    en: 'Too many attempts. Try again later.'
  },
  RATE_LIMIT_EXCEEDED: {
    ru: 'Слишком много запросов. Подождите минуту.',
    uz: 'Juda ko\'p so\'rovlar. Bir daqiqa kuting.',
    en: 'Too many requests. Wait a minute.'
  },
  SERVICE_UNAVAILABLE: {
    ru: 'SMS сервис временно недоступен.',
    uz: 'SMS xizmati vaqtincha mavjud emas.',
    en: 'SMS service temporarily unavailable.'
  },
  INSUFFICIENT_BALANCE: {
    ru: 'Недостаточно средств на балансе SMS сервиса.',
    uz: 'SMS xizmati balansida mablag\' yetarli emas.',
    en: 'Insufficient balance in SMS service.'
  },
  AUTHENTICATION_FAILED: {
    ru: 'Ошибка аутентификации SMS сервиса.',
    uz: 'SMS xizmati autentifikatsiya xatosi.',
    en: 'SMS service authentication failed.'
  },
  UNKNOWN_ERROR: {
    ru: 'Произошла неизвестная ошибка.',
    uz: 'Noma\'lum xato yuz berdi.',
    en: 'An unknown error occurred.'
  },

  // Eskiz-специфичные ошибки
  ESKIZ_INVALID_CREDENTIALS: {
    ru: 'Неверные учетные данные Eskiz.',
    uz: 'Eskiz hisobga kirish ma\'lumotlari noto\'g\'ri.',
    en: 'Invalid Eskiz credentials.'
  },
  ESKIZ_TOKEN_EXPIRED: {
    ru: 'Токен доступа Eskiz истек.',
    uz: 'Eskiz kirish tokeni muddati tugagan.',
    en: 'Eskiz access token expired.'
  },
  ESKIZ_SENDER_NOT_APPROVED: {
    ru: 'Имя отправителя не одобрено в Eskiz.',
    uz: 'Jo\'natuvchi nomi Eskizda tasdiqlanmagan.',
    en: 'Sender name not approved in Eskiz.'
  },
  ESKIZ_MESSAGE_TOO_LONG: {
    ru: 'Сообщение слишком длинное для Eskiz.',
    uz: 'Xabar Eskiz uchun juda uzun.',
    en: 'Message too long for Eskiz.'
  },

  // Twilio-специфичные ошибки
  TWILIO_INVALID_CREDENTIALS: {
    ru: 'Неверные учетные данные Twilio.',
    uz: 'Twilio hisobga kirish ma\'lumotlari noto\'g\'ri.',
    en: 'Invalid Twilio credentials.'
  },
  TWILIO_INSUFFICIENT_FUNDS: {
    ru: 'Недостаточно средств в аккаунте Twilio.',
    uz: 'Twilio hisobida mablag\' yetarli emas.',
    en: 'Insufficient funds in Twilio account.'
  },
  TWILIO_INVALID_FROM_NUMBER: {
    ru: 'Неверный номер отправителя Twilio.',
    uz: 'Twilio jo\'natuvchi raqami noto\'g\'ri.',
    en: 'Invalid Twilio from number.'
  }
};

// Рекомендуемые действия для ошибок
const suggestedActions = {
  NETWORK_ERROR: {
    ru: 'Проверьте подключение к интернету и попробуйте снова.',
    uz: 'Internet ulanishini tekshiring va qayta urinib ko\'ring.',
    en: 'Check your internet connection and try again.'
  },
  INVALID_PHONE: {
    ru: 'Введите номер в формате +998XXXXXXXXX.',
    uz: 'Raqamni +998XXXXXXXXX formatida kiriting.',
    en: 'Enter number in format +998XXXXXXXXX.'
  },
  CODE_EXPIRED: {
    ru: 'Нажмите "Отправить код повторно".',
    uz: '"Kodni qayta jo\'natish" tugmasini bosing.',
    en: 'Tap "Resend code".'
  },
  TOO_MANY_ATTEMPTS: {
    ru: 'Подождите 5 минут перед следующей попыткой.',
    uz: 'Keyingi urinishdan oldin 5 daqiqa kuting.',
    en: 'Wait 5 minutes before next attempt.'
  },
  RATE_LIMIT_EXCEEDED: {
    ru: 'Подождите 1 минуту перед отправкой нового кода.',
    uz: 'Yangi kod jo\'natishdan oldin 1 daqiqa kuting.',
    en: 'Wait 1 minute before sending new code.'
  },
  SERVICE_UNAVAILABLE: {
    ru: 'Попробуйте позже или обратитесь в поддержку.',
    uz: 'Keyinroq urinib ko\'ring yoki qo\'llab-quvvatlashga murojaat qiling.',
    en: 'Try later or contact support.'
  },
  INSUFFICIENT_BALANCE: {
    ru: 'Обратитесь к администратору для пополнения баланса.',
    uz: 'Balansni to\'ldirish uchun administratorga murojaat qiling.',
    en: 'Contact administrator to top up balance.'
  }
};

class SMSErrorHandler {
  private currentLanguage: Language = 'ru';

  /**
   * Установка языка для локализации ошибок
   */
  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  /**
   * Получение текущего языка
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Определение типа ошибки по сообщению или коду
   */
  private determineErrorCode(error: any): string {
    if (!error) return 'UNKNOWN_ERROR';

    const errorMessage = error.message || error.error || error.toString().toLowerCase();
    const errorCode = error.code || error.status;

    // Проверка сетевых ошибок
    if (errorMessage.includes('network') || errorMessage.includes('connection') ||
      errorMessage.includes('timeout') || errorCode === 'NETWORK_ERROR') {
      return 'NETWORK_ERROR';
    }

    // Проверка ошибок телефона
    if (errorMessage.includes('invalid phone') || errorMessage.includes('phone number') ||
      errorMessage.includes('invalid mobile')) {
      return 'INVALID_PHONE';
    }

    // Проверка ошибок кода
    if (errorMessage.includes('code expired') || errorMessage.includes('expired')) {
      return 'CODE_EXPIRED';
    }

    if (errorMessage.includes('invalid code') || errorMessage.includes('wrong code') ||
      errorMessage.includes('incorrect code')) {
      return 'CODE_INVALID';
    }

    if (errorMessage.includes('too many attempts') || errorMessage.includes('max attempts')) {
      return 'TOO_MANY_ATTEMPTS';
    }

    // Проверка rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests') ||
      errorCode === 429) {
      return 'RATE_LIMIT_EXCEEDED';
    }

    // Проверка баланса
    if (errorMessage.includes('insufficient balance') || errorMessage.includes('balance') ||
      errorMessage.includes('funds')) {
      return 'INSUFFICIENT_BALANCE';
    }

    // Проверка аутентификации
    if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized') ||
      errorMessage.includes('invalid credentials') || errorCode === 401) {
      return 'AUTHENTICATION_FAILED';
    }

    // Eskiz-специфичные ошибки
    if (errorMessage.includes('eskiz')) {
      if (errorMessage.includes('credentials') || errorMessage.includes('login')) {
        return 'ESKIZ_INVALID_CREDENTIALS';
      }
      if (errorMessage.includes('token')) {
        return 'ESKIZ_TOKEN_EXPIRED';
      }
      if (errorMessage.includes('sender') || errorMessage.includes('from')) {
        return 'ESKIZ_SENDER_NOT_APPROVED';
      }
      if (errorMessage.includes('message too long') || errorMessage.includes('length')) {
        return 'ESKIZ_MESSAGE_TOO_LONG';
      }
    }

    // Twilio-специфичные ошибки
    if (errorMessage.includes('twilio')) {
      if (errorMessage.includes('credentials') || errorMessage.includes('sid')) {
        return 'TWILIO_INVALID_CREDENTIALS';
      }
      if (errorMessage.includes('funds') || errorMessage.includes('balance')) {
        return 'TWILIO_INSUFFICIENT_FUNDS';
      }
      if (errorMessage.includes('from number')) {
        return 'TWILIO_INVALID_FROM_NUMBER';
      }
    }

    // Проверка доступности сервиса
    if (errorCode >= 500 || errorMessage.includes('service unavailable') ||
      errorMessage.includes('server error')) {
      return 'SERVICE_UNAVAILABLE';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Определение, можно ли повторить операцию
   */
  private isRetryable(errorCode: string): boolean {
    const retryableErrors = [
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
      'ESKIZ_TOKEN_EXPIRED'
    ];

    return retryableErrors.includes(errorCode);
  }

  /**
   * Обработка ошибки и создание структурированного объекта ошибки
   */
  handleError(error: any, context?: string): SMSError {
    const errorCode = this.determineErrorCode(error);
    const isRetryable = this.isRetryable(errorCode);

    const message = errorMessages[errorCode as keyof typeof errorMessages]?.[this.currentLanguage] ||
      errorMessages.UNKNOWN_ERROR[this.currentLanguage];

    const suggestedAction = suggestedActions[errorCode as keyof typeof suggestedActions]?.[this.currentLanguage];

    const smsError: SMSError = {
      code: errorCode,
      message,
      originalError: error,
      isRetryable,
      suggestedAction
    };

    // Логирование ошибки
    console.error(`[SMSErrorHandler] ${context || 'SMS Error'}:`, {
      code: errorCode,
      message,
      isRetryable,
      originalError: error
    });

    return smsError;
  }

  /**
   * Получение локализованного сообщения об ошибке
   */
  getLocalizedMessage(errorCode: string, language?: Language): string {
    const lang = language || this.currentLanguage;
    return errorMessages[errorCode as keyof typeof errorMessages]?.[lang] ||
      errorMessages.UNKNOWN_ERROR[lang];
  }

  /**
   * Получение рекомендуемого действия для ошибки
   */
  getSuggestedAction(errorCode: string, language?: Language): string | undefined {
    const lang = language || this.currentLanguage;
    return suggestedActions[errorCode as keyof typeof suggestedActions]?.[lang];
  }

  /**
   * Форматирование ошибки для отображения пользователю
   */
  formatUserFriendlyError(error: SMSError): string {
    let message = error.message;

    if (error.suggestedAction) {
      message += `\n\n${error.suggestedAction}`;
    }

    return message;
  }

  /**
   * Проверка, является ли ошибка критической (требует вмешательства разработчика)
   */
  isCriticalError(errorCode: string): boolean {
    const criticalErrors = [
      'AUTHENTICATION_FAILED',
      'ESKIZ_INVALID_CREDENTIALS',
      'TWILIO_INVALID_CREDENTIALS',
      'INSUFFICIENT_BALANCE',
      'TWILIO_INSUFFICIENT_FUNDS'
    ];

    return criticalErrors.includes(errorCode);
  }
}

// Экспортируем синглтон
export const smsErrorHandler = new SMSErrorHandler();

// Утилитарные функции
export const handleSMSError = (error: any, context?: string): SMSError => {
  return smsErrorHandler.handleError(error, context);
};

export const getLocalizedSMSError = (errorCode: string, language?: Language): string => {
  return smsErrorHandler.getLocalizedMessage(errorCode, language);
};

export const setSMSErrorLanguage = (language: Language): void => {
  smsErrorHandler.setLanguage(language);
};
