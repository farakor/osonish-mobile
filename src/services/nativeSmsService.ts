import { Platform, NativeModules, DeviceEventEmitter } from 'react-native';

export interface NativeSmsConfig {
  /**
   * Хэш приложения для SMS Retriever API
   */
  appHash?: string;
  /**
   * Таймаут ожидания SMS (в миллисекундах)
   */
  timeout?: number;
}

class NativeSmsService {
  private isListening = false;
  private listeners: Map<string, (code: string) => void> = new Map();

  /**
   * Запускает Google SMS Retriever API (без разрешений!)
   */
  async startSmsRetriever(config: NativeSmsConfig = {}): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('Native SMS: iOS использует встроенное автозаполнение');
      return true;
    }

    if (this.isListening) {
      console.log('Native SMS: SMS Retriever уже запущен');
      return true;
    }

    try {
      const { SmsRetrieverModule } = NativeModules;

      if (!SmsRetrieverModule) {
        console.warn('Native SMS: SMS Retriever модуль недоступен, используем fallback');
        return this.startFallbackMode();
      }

      // Подписываемся на события SMS Retriever
      DeviceEventEmitter.addListener('onSmsReceived', this.handleSmsReceived.bind(this));
      DeviceEventEmitter.addListener('onSmsTimeout', this.handleSmsTimeout.bind(this));

      // Запускаем SMS Retriever
      const result = await SmsRetrieverModule.startSmsRetriever(config.timeout || 300000); // 5 минут

      if (result.success) {
        this.isListening = true;
        console.log('Native SMS: SMS Retriever запущен успешно');
        console.log('Native SMS: App Hash:', result.appHash);
        return true;
      } else {
        console.error('Native SMS: Ошибка запуска SMS Retriever:', result.error);
        return this.startFallbackMode();
      }
    } catch (error) {
      console.error('Native SMS: Исключение при запуске SMS Retriever:', error);
      return this.startFallbackMode();
    }
  }

  /**
   * Fallback режим - использует стандартные Android autofill hints
   */
  private async startFallbackMode(): Promise<boolean> {
    console.log('Native SMS: Используется fallback режим с autofill hints');
    this.isListening = true;
    return true;
  }

  /**
   * Останавливает SMS Retriever
   */
  stopSmsRetriever(): void {
    if (!this.isListening) {
      return;
    }

    try {
      const { SmsRetrieverModule } = NativeModules;

      if (SmsRetrieverModule) {
        SmsRetrieverModule.stopSmsRetriever();
      }

      DeviceEventEmitter.removeAllListeners('onSmsReceived');
      DeviceEventEmitter.removeAllListeners('onSmsTimeout');

      this.isListening = false;
      console.log('Native SMS: SMS Retriever остановлен');
    } catch (error) {
      console.error('Native SMS: Ошибка при остановке SMS Retriever:', error);
    }
  }

  /**
   * Получает хэш приложения для SMS Retriever
   */
  async getAppHash(): Promise<string | null> {
    if (Platform.OS !== 'android') {
      return null;
    }

    try {
      const { SmsRetrieverModule } = NativeModules;

      if (!SmsRetrieverModule) {
        return null;
      }

      const result = await SmsRetrieverModule.getAppHash();
      return result.appHash || null;
    } catch (error) {
      console.error('Native SMS: Ошибка получения app hash:', error);
      return null;
    }
  }

  /**
   * Добавляет слушатель для SMS кодов
   */
  addListener(id: string, callback: (code: string) => void): void {
    this.listeners.set(id, callback);
  }

  /**
   * Удаляет слушатель
   */
  removeListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Очищает все слушатели
   */
  clearListeners(): void {
    this.listeners.clear();
  }

  /**
   * Обрабатывает полученное SMS
   */
  private handleSmsReceived(event: { message: string }): void {
    try {
      console.log('Native SMS: Получено SMS через Retriever:', event.message);

      const code = this.extractCodeFromMessage(event.message);
      if (code) {
        console.log('Native SMS: Извлечен код:', code);

        // Уведомляем всех слушателей
        this.listeners.forEach((callback) => {
          try {
            callback(code);
          } catch (error) {
            console.error('Native SMS: Ошибка в callback:', error);
          }
        });
      }
    } catch (error) {
      console.error('Native SMS: Ошибка обработки SMS:', error);
    }
  }

  /**
   * Обрабатывает таймаут SMS Retriever
   */
  private handleSmsTimeout(): void {
    console.log('Native SMS: Таймаут ожидания SMS');
    this.stopSmsRetriever();
  }

  /**
   * Извлекает код из SMS сообщения
   */
  private extractCodeFromMessage(message: string): string | null {
    try {
      // Паттерны для извлечения кода
      const patterns = [
        // Цифровые коды (4-8 цифр)
        /\b(\d{4,8})\b/g,
        // Коды после двоеточия
        /:\s*(\d{4,8})/g,
        // Коды после "код"
        /код[:\s]*(\d{4,8})/gi,
        // Коды в скобках
        /\((\d{4,8})\)/g,
      ];

      for (const pattern of patterns) {
        const matches = message.matchAll(pattern);

        for (const match of matches) {
          const code = match[1];

          // Проверяем длину кода (обычно 4-8 цифр)
          if (code.length >= 4 && code.length <= 8) {
            return code;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Native SMS: Ошибка извлечения кода:', error);
      return null;
    }
  }

  /**
   * Проверяет статус сервиса
   */
  getStatus() {
    return {
      isListening: this.isListening,
      listenersCount: this.listeners.size,
      platform: Platform.OS,
      hasNativeModule: !!NativeModules.SmsRetrieverModule,
    };
  }

  /**
   * Проверяет поддержку SMS Retriever
   */
  isSupported(): boolean {
    return Platform.OS === 'android';
  }
}

// Экспортируем singleton
export const nativeSmsService = new NativeSmsService();

// Хук для использования в компонентах
export const useNativeSms = () => {
  return {
    startSmsRetriever: nativeSmsService.startSmsRetriever.bind(nativeSmsService),
    stopSmsRetriever: nativeSmsService.stopSmsRetriever.bind(nativeSmsService),
    getAppHash: nativeSmsService.getAppHash.bind(nativeSmsService),
    addListener: nativeSmsService.addListener.bind(nativeSmsService),
    removeListener: nativeSmsService.removeListener.bind(nativeSmsService),
    isSupported: nativeSmsService.isSupported.bind(nativeSmsService),
    getStatus: nativeSmsService.getStatus.bind(nativeSmsService),
  };
};
