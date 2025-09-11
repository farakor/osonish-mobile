import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useSmsReader } from '../services/smsReaderService';

export interface SmsAutoFillConfig {
  /**
   * Ожидаемая длина SMS кода
   */
  codeLength?: number;

  /**
   * Таймаут ожидания SMS (в миллисекундах)
   */
  timeout?: number;

  /**
   * Фильтр отправителей SMS (необязательно)
   */
  senderFilter?: string[];

  /**
   * Автоматически запускать прослушивание при монтировании
   */
  autoStart?: boolean;

  /**
   * Автоматически останавливать прослушивание при размонтировании
   */
  autoStop?: boolean;
}

export interface SmsAutoFillResult {
  /**
   * Запустить прослушивание SMS
   */
  startListening: () => Promise<boolean>;

  /**
   * Остановить прослушивание SMS
   */
  stopListening: () => void;

  /**
   * Запросить разрешение на чтение SMS
   */
  requestPermission: () => Promise<boolean>;

  /**
   * Проверить, есть ли разрешение
   */
  hasPermission: () => Promise<boolean>;

  /**
   * Поддерживается ли автозаполнение на устройстве
   */
  isSupported: boolean;

  /**
   * Статус прослушивания
   */
  isListening: boolean;
}

/**
 * Хук для автоматического заполнения SMS кодов
 * 
 * @param onCodeReceived - Callback, вызываемый при получении кода
 * @param config - Конфигурация автозаполнения
 * @returns Объект с методами управления автозаполнением
 */
export const useSmsAutoFill = (
  onCodeReceived: (code: string) => void,
  config: SmsAutoFillConfig = {}
): SmsAutoFillResult => {
  const {
    codeLength = 6,
    timeout = 60000,
    senderFilter,
    autoStart = true,
    autoStop = true,
  } = config;

  const smsReader = useSmsReader();
  const listenerIdRef = useRef<string>();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isListeningRef = useRef(false);

  // Генерируем уникальный ID для слушателя
  useEffect(() => {
    listenerIdRef.current = `sms-autofill-${Date.now()}-${Math.random()}`;
  }, []);

  // Обработчик получения кода
  const handleCodeReceived = useCallback((code: string) => {
    try {
      console.log('SMS AutoFill: Получен код:', code);

      // Очищаем таймаут
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }

      // Вызываем callback
      onCodeReceived(code);

      // Автоматически останавливаем прослушивание после получения кода
      if (autoStop) {
        stopListening();
      }
    } catch (error) {
      console.error('SMS AutoFill: Ошибка при обработке кода:', error);
    }
  }, [onCodeReceived, autoStop]);

  // Запуск прослушивания
  const startListening = useCallback(async (): Promise<boolean> => {
    try {
      console.log('SMS AutoFill: Запуск прослушивания...');

      // Проверяем поддержку
      if (!smsReader.isSupported()) {
        console.log('SMS AutoFill: Платформа не поддерживается, используется встроенное автозаполнение');
        return true;
      }

      // Если уже прослушиваем, не запускаем повторно
      if (isListeningRef.current) {
        console.log('SMS AutoFill: Уже прослушивает');
        return true;
      }

      // Запускаем SMS Reader
      const started = await smsReader.startListening({
        codeLength,
        timeout,
        senderFilter,
      });

      if (!started) {
        console.warn('SMS AutoFill: Не удалось запустить SMS Reader');
        return false;
      }

      // Регистрируем слушатель
      if (listenerIdRef.current) {
        smsReader.addCodeListener(listenerIdRef.current, handleCodeReceived);
      }

      // Устанавливаем таймаут
      if (timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          console.log('SMS AutoFill: Таймаут ожидания SMS');
          stopListening();
        }, timeout);
      }

      isListeningRef.current = true;
      console.log('SMS AutoFill: Прослушивание запущено');
      return true;
    } catch (error) {
      console.error('SMS AutoFill: Ошибка при запуске прослушивания:', error);
      return false;
    }
  }, [smsReader, codeLength, timeout, senderFilter, handleCodeReceived]);

  // Остановка прослушивания
  const stopListening = useCallback(() => {
    try {
      console.log('SMS AutoFill: Остановка прослушивания...');

      // Очищаем таймаут
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }

      // Удаляем слушатель
      if (listenerIdRef.current) {
        smsReader.removeCodeListener(listenerIdRef.current);
      }

      isListeningRef.current = false;
      console.log('SMS AutoFill: Прослушивание остановлено');
    } catch (error) {
      console.error('SMS AutoFill: Ошибка при остановке прослушивания:', error);
    }
  }, [smsReader]);

  // Автоматический запуск при монтировании
  useEffect(() => {
    if (autoStart && Platform.OS === 'android') {
      startListening();
    }

    // Cleanup при размонтировании
    return () => {
      if (autoStop) {
        stopListening();
      }
    };
  }, [autoStart, autoStop, startListening, stopListening]);

  // Cleanup при изменении callback'а
  useEffect(() => {
    if (isListeningRef.current && listenerIdRef.current) {
      // Обновляем слушатель с новым callback'ом
      smsReader.removeCodeListener(listenerIdRef.current);
      smsReader.addCodeListener(listenerIdRef.current, handleCodeReceived);
    }
  }, [handleCodeReceived, smsReader]);

  return {
    startListening,
    stopListening,
    requestPermission: smsReader.requestPermission,
    hasPermission: smsReader.hasPermission,
    isSupported: smsReader.isSupported(),
    isListening: isListeningRef.current,
  };
};

/**
 * Хук для простого использования SMS автозаполнения
 * Автоматически запускается и останавливается
 */
export const useSimpleSmsAutoFill = (
  onCodeReceived: (code: string) => void,
  codeLength: number = 6
) => {
  return useSmsAutoFill(onCodeReceived, {
    codeLength,
    autoStart: true,
    autoStop: true,
    timeout: 60000,
  });
};
