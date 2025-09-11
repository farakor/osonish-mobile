import { Platform, Keyboard } from 'react-native';

/**
 * Утилиты для стабильной работы с клавиатурой на Android
 * Решает проблемы с миганием кнопок в production билдах
 */

export interface KeyboardConfig {
  /**
   * Использовать ли KeyboardAvoidingView для iOS
   * @default true
   */
  useKeyboardAvoidingViewIOS?: boolean;

  /**
   * Использовать ли KeyboardAvoidingView для Android
   * @default false - рекомендуется false для production билдов
   */
  useKeyboardAvoidingViewAndroid?: boolean;

  /**
   * Автоматически скрывать клавиатуру при навигации
   * @default true
   */
  dismissOnNavigation?: boolean;

  /**
   * Задержка перед скрытием клавиатуры (мс)
   * @default 0
   */
  dismissDelay?: number;
}

const defaultConfig: Required<KeyboardConfig> = {
  useKeyboardAvoidingViewIOS: true,
  useKeyboardAvoidingViewAndroid: false,
  dismissOnNavigation: true,
  dismissDelay: 0,
};

/**
 * Безопасное скрытие клавиатуры с поддержкой задержки
 */
export const dismissKeyboard = (delay: number = 0): void => {
  if (delay > 0) {
    setTimeout(() => {
      Keyboard.dismiss();
    }, delay);
  } else {
    Keyboard.dismiss();
  }
};

/**
 * Определяет, нужно ли использовать KeyboardAvoidingView для текущей платформы
 */
export const shouldUseKeyboardAvoidingView = (config: KeyboardConfig = {}): boolean => {
  const finalConfig = { ...defaultConfig, ...config };

  if (Platform.OS === 'ios') {
    return finalConfig.useKeyboardAvoidingViewIOS;
  } else {
    return finalConfig.useKeyboardAvoidingViewAndroid;
  }
};

/**
 * Получает правильное поведение для KeyboardAvoidingView
 */
export const getKeyboardAvoidingBehavior = (): 'height' | 'position' | 'padding' => {
  return Platform.OS === 'ios' ? 'padding' : 'height';
};

/**
 * Получает правильный offset для KeyboardAvoidingView
 */
export const getKeyboardVerticalOffset = (): number => {
  return Platform.OS === 'ios' ? 0 : 20;
};

/**
 * Хук для обработки состояния клавиатуры
 */
export const createKeyboardListeners = (
  onShow: () => void,
  onHide: () => void
) => {
  let keyboardDidShowListener: any;
  let keyboardDidHideListener: any;

  const setup = () => {
    if (Platform.OS === 'android') {
      keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', onShow);
      keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', onHide);
    }
  };

  const cleanup = () => {
    keyboardDidShowListener?.remove();
    keyboardDidHideListener?.remove();
  };

  return { setup, cleanup };
};

/**
 * Создает обработчик навигации с автоматическим скрытием клавиатуры
 */
export const createNavigationHandler = (
  originalHandler: () => void,
  config: KeyboardConfig = {}
) => {
  const finalConfig = { ...defaultConfig, ...config };

  return () => {
    if (finalConfig.dismissOnNavigation && Platform.OS === 'android') {
      dismissKeyboard(finalConfig.dismissDelay);
    }

    // Небольшая задержка для Android чтобы клавиатура успела скрыться
    if (Platform.OS === 'android' && finalConfig.dismissOnNavigation) {
      setTimeout(originalHandler, finalConfig.dismissDelay + 50);
    } else {
      originalHandler();
    }
  };
};

/**
 * Стили для контейнеров с учетом состояния клавиатуры
 */
export const getKeyboardAwareStyles = (keyboardVisible: boolean) => ({
  navigation: {
    ...(Platform.OS === 'android' && keyboardVisible && {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
    }),
  },
  content: {
    ...(Platform.OS === 'android' && keyboardVisible && {
      paddingBottom: 80,
    }),
  },
});
