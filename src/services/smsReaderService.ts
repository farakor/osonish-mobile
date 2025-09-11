import { Platform, PermissionsAndroid, DeviceEventEmitter, NativeModules } from 'react-native';

export interface SmsMessage {
  body: string;
  address: string;
  timestamp: number;
}

export interface SmsReaderConfig {
  senderFilter?: string[];
  codeLength?: number;
  timeout?: number;
}

class SmsReaderService {
  private listeners: Map<string, (code: string) => void> = new Map();
  private isListening = false;
  private config: SmsReaderConfig = {
    codeLength: 6,
    timeout: 60000, // 1 минута
  };

  /**
   * Запрашивает разрешения для чтения SMS на Android
   */
  async requestSmsPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS не требует разрешений для автозаполнения
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        {
          title: 'Разрешение на чтение SMS',
          message: 'Приложению нужен доступ к SMS для автоматического ввода кода верификации',
          buttonNeutral: 'Спросить позже',
          buttonNegative: 'Отмена',
          buttonPositive: 'Разрешить',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.warn('Ошибка при запросе разрешения SMS:', error);
      return false;
    }
  }

  /**
   * Проверяет, есть ли разрешение на чтение SMS
   */
  async hasSmsPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
      );
      return hasPermission;
    } catch (error) {
      console.warn('Ошибка при проверке разрешения SMS:', error);
      return false;
    }
  }

  /**
   * Начинает прослушивание входящих SMS
   */
  async startListening(config?: Partial<SmsReaderConfig>): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('SMS Reader: iOS использует встроенное автозаполнение');
      return true;
    }

    // Обновляем конфигурацию
    this.config = { ...this.config, ...config };

    // Проверяем разрешения
    const hasPermission = await this.hasSmsPermission();
    if (!hasPermission) {
      const granted = await this.requestSmsPermission();
      if (!granted) {
        console.warn('SMS Reader: Разрешение не предоставлено');
        return false;
      }
    }

    if (this.isListening) {
      console.log('SMS Reader: Уже прослушивает SMS');
      return true;
    }

    try {
      // Подписываемся на события входящих SMS
      DeviceEventEmitter.addListener('onSMSReceived', this.handleSmsReceived.bind(this));

      // Запускаем нативный модуль если доступен
      const { SmsReaderModule } = NativeModules;
      if (SmsReaderModule) {
        SmsReaderModule.startListening();
      } else {
        console.warn('SMS Reader: Нативный модуль недоступен, используется только встроенное автозаполнение');
      }

      this.isListening = true;
      console.log('SMS Reader: Начато прослушивание SMS');
      return true;
    } catch (error) {
      console.error('SMS Reader: Ошибка при запуске прослушивания:', error);
      return false;
    }
  }

  /**
   * Останавливает прослушивание SMS
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    try {
      DeviceEventEmitter.removeAllListeners('onSMSReceived');

      // Останавливаем нативный модуль если доступен
      const { SmsReaderModule } = NativeModules;
      if (SmsReaderModule) {
        SmsReaderModule.stopListening();
      }

      this.isListening = false;
      console.log('SMS Reader: Прослушивание SMS остановлено');
    } catch (error) {
      console.error('SMS Reader: Ошибка при остановке прослушивания:', error);
    }
  }

  /**
   * Регистрирует слушатель для получения SMS кодов
   */
  addCodeListener(id: string, callback: (code: string) => void): void {
    this.listeners.set(id, callback);
  }

  /**
   * Удаляет слушатель
   */
  removeCodeListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Очищает все слушатели
   */
  clearAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Обрабатывает входящие SMS
   */
  private handleSmsReceived(message: SmsMessage): void {
    try {
      console.log('SMS Reader: Получено SMS от', message.address);

      const code = this.extractCodeFromSms(message.body);
      if (code) {
        console.log('SMS Reader: Извлечен код:', code);

        // Уведомляем всех слушателей
        this.listeners.forEach((callback) => {
          try {
            callback(code);
          } catch (error) {
            console.error('SMS Reader: Ошибка в callback слушателя:', error);
          }
        });
      }
    } catch (error) {
      console.error('SMS Reader: Ошибка при обработке SMS:', error);
    }
  }

  /**
   * Извлекает код верификации из текста SMS
   */
  private extractCodeFromSms(smsBody: string): string | null {
    try {
      // Паттерны для поиска кодов
      const patterns = [
        // Цифровые коды (4-8 цифр)
        /\b(\d{4,8})\b/g,
        // Коды с разделителями
        /\b(\d{2,4}[-\s]\d{2,4})\b/g,
        // Коды в скобках
        /\((\d{4,8})\)/g,
        // Коды после двоеточия
        /:\s*(\d{4,8})/g,
        // Коды после "код"
        /код[:\s]*(\d{4,8})/gi,
        // Коды после "code"
        /code[:\s]*(\d{4,8})/gi,
      ];

      const expectedLength = this.config.codeLength || 6;

      for (const pattern of patterns) {
        const matches = smsBody.matchAll(pattern);

        for (const match of matches) {
          const code = match[1].replace(/[-\s]/g, ''); // Убираем разделители

          // Проверяем длину кода
          if (code.length === expectedLength) {
            return code;
          }
        }
      }

      // Если не нашли точное совпадение, ищем любой код нужной длины
      const anyCodePattern = new RegExp(`\\b(\\d{${expectedLength}})\\b`);
      const match = smsBody.match(anyCodePattern);

      return match ? match[1] : null;
    } catch (error) {
      console.error('SMS Reader: Ошибка при извлечении кода:', error);
      return null;
    }
  }

  /**
   * Получает последние SMS сообщения (для ручного поиска кода)
   */
  async getRecentSms(limit: number = 10): Promise<SmsMessage[]> {
    if (Platform.OS !== 'android') {
      return [];
    }

    try {
      // Здесь можно добавить нативный модуль для чтения SMS из базы данных
      // Пока возвращаем пустой массив
      return [];
    } catch (error) {
      console.error('SMS Reader: Ошибка при получении SMS:', error);
      return [];
    }
  }

  /**
   * Проверяет, поддерживается ли SMS Reader на устройстве
   */
  isSupported(): boolean {
    return Platform.OS === 'android';
  }

  /**
   * Получает статус сервиса
   */
  getStatus() {
    return {
      isListening: this.isListening,
      listenersCount: this.listeners.size,
      platform: Platform.OS,
      config: this.config,
    };
  }
}

// Экспортируем singleton instance
export const smsReaderService = new SmsReaderService();

// Хук для использования в компонентах
export const useSmsReader = () => {
  return {
    startListening: smsReaderService.startListening.bind(smsReaderService),
    stopListening: smsReaderService.stopListening.bind(smsReaderService),
    addCodeListener: smsReaderService.addCodeListener.bind(smsReaderService),
    removeCodeListener: smsReaderService.removeCodeListener.bind(smsReaderService),
    requestPermission: smsReaderService.requestSmsPermission.bind(smsReaderService),
    hasPermission: smsReaderService.hasSmsPermission.bind(smsReaderService),
    isSupported: smsReaderService.isSupported.bind(smsReaderService),
    getStatus: smsReaderService.getStatus.bind(smsReaderService),
  };
};
