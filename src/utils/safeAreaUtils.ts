import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Утилиты для работы с безопасными зонами на Android и iOS
 */

/**
 * Получает высоту статус-бара на Android
 */
export const getAndroidStatusBarHeight = (): number => {
  if (Platform.OS === 'android') {
    try {
      return StatusBar.currentHeight || 24; // fallback 24px для Android
    } catch (error) {
      return 24; // стандартная высота статус-бара на Android
    }
  }
  return 0;
};

/**
 * Хук для получения безопасных отступов с учетом платформы
 * Применяет минимальные отступы только на Android
 */
export const usePlatformSafeAreaInsets = () => {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'android') {
    return {
      ...insets,
      // На Android добавляем дополнительную проверку для navigation bar
      bottom: Math.max(insets.bottom, 16), // минимум 16px для Android navigation bar
      top: Math.max(insets.top, getAndroidStatusBarHeight()),
    };
  }

  // На iOS используем нативные safe area insets без изменений
  return insets;
};

/**
 * Получает стили для контейнера с учетом безопасных зон
 */
export const getSafeAreaContainerStyle = (insets: ReturnType<typeof usePlatformSafeAreaInsets>) => ({
  paddingTop: insets.top,
  paddingBottom: insets.bottom,
  paddingLeft: insets.left,
  paddingRight: insets.right,
});

/**
 * Получает стили для нижней панели с учетом Android navigation bar
 * Применяет дополнительные отступы только на Android
 */
export const getBottomTabBarStyle = (insets: ReturnType<typeof usePlatformSafeAreaInsets>) => {
  if (Platform.OS === 'android') {
    const bottomPadding = Math.max(insets.bottom, 16);
    return {
      paddingBottom: bottomPadding,
      height: 70 + bottomPadding,
    };
  }

  // На iOS используем только системные safe area insets
  return {
    paddingBottom: insets.bottom,
    height: 70 + insets.bottom,
  };
};

/**
 * Получает стили для фиксированных элементов внизу экрана с дополнительным padding
 * Android: дополнительные отступы для navigation bar
 * iOS: минимальный отступ для комфорта использования
 */
export const getFixedBottomStyle = (insets: ReturnType<typeof usePlatformSafeAreaInsets>, additionalPadding: number = 8) => {
  if (Platform.OS === 'android') {
    return {
      paddingBottom: Math.max(insets.bottom, 16) + additionalPadding,
    };
  }

  // На iOS используем фиксированный отступ 16px
  return {
    paddingBottom: 16, // фиксированный отступ 16px на iOS
  };
};

/**
 * Получает стили для контента ScrollView с учетом платформы
 * Android: дополнительные отступы для navigation bar
 * iOS: минимальный отступ для комфорта прокрутки
 */
export const getScrollViewContentStyle = (insets: ReturnType<typeof usePlatformSafeAreaInsets>, additionalPadding: number = 24) => {
  if (Platform.OS === 'android') {
    return {
      paddingBottom: Math.max(insets.bottom, 16) + additionalPadding,
    };
  }

  // На iOS используем фиксированный отступ 16px для ScrollView контента
  return {
    paddingBottom: 16, // фиксированный отступ 16px на iOS
  };
};

/**
 * Получает стили для контейнеров, которые должны быть прижаты к самому краю экрана
 * Android: учитывает navigation bar, iOS: прижимается к краю
 */
export const getEdgeToEdgeBottomStyle = (insets: ReturnType<typeof usePlatformSafeAreaInsets>) => {
  if (Platform.OS === 'android') {
    return {
      paddingBottom: Math.max(insets.bottom, 16), // минимум для Android navigation bar
    };
  }

  // На iOS прижимаем к самому краю
  return {
    paddingBottom: 0, // контейнер до самого края на iOS
  };
};

/**
 * Получает стили для контейнеров с учетом safe area
 * Для экранов где контейнер должен учитывать safe area но без дополнительных отступов
 */
export const getContainerBottomStyle = (insets: ReturnType<typeof usePlatformSafeAreaInsets>) => {
  if (Platform.OS === 'android') {
    return {
      paddingBottom: Math.max(insets.bottom, 16), // минимум для Android navigation bar
    };
  }

  // На iOS учитываем safe area
  return {
    paddingBottom: insets.bottom, // контейнер с учетом safe area на iOS
  };
};
