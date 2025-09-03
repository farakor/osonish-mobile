import { Platform, StatusBar, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Утилиты для работы с безопасными зонами на Android и iOS
 */

const { height: screenHeight } = Dimensions.get('window');

/**
 * Определяет, является ли экран маленьким (1080p и меньше)
 * Для таких экранов нужен дополнительный отступ от navigation bar
 */
export const isSmallScreen = (): boolean => {
  return Platform.OS === 'android' && screenHeight <= 1080;
};

/**
 * Определяет, используется ли прозрачный navigation bar
 * С прозрачным navigation bar контент может отображаться под ним
 */
export const hasTransparentNavigationBar = (): boolean => {
  return Platform.OS === 'android';
};

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
 * Применяет минимальные отступы только на Android, учитывает прозрачный navigation bar
 */
export const usePlatformSafeAreaInsets = () => {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'android') {
    // С прозрачным navigation bar используем реальные insets от системы
    // но добавляем минимальный отступ для комфорта использования
    const minBottomInset = hasTransparentNavigationBar() ? 8 : 16;

    return {
      ...insets,
      // На Android с прозрачным navigation bar используем системные insets + минимальный отступ
      bottom: Math.max(insets.bottom, minBottomInset),
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
 * Применяет дополнительные отступы только на Android и белый фон
 */
export const getBottomTabBarStyle = (insets: ReturnType<typeof usePlatformSafeAreaInsets>) => {
  if (Platform.OS === 'android') {
    const bottomPadding = Math.max(insets.bottom, 16);
    return {
      paddingBottom: bottomPadding,
      height: 70 + bottomPadding,
      // Обеспечиваем белый фон под навигацией на Android
      backgroundColor: '#ffffff',
      borderBottomWidth: 0,
      shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0, };
  }

  // На iOS используем только системные safe area insets
  return {
    paddingBottom: insets.bottom,
    height: 70 + insets.bottom,
  };
};

/**
 * Получает стили для фиксированных элементов внизу экрана с дополнительным padding
 * Android: учитывает прозрачный navigation bar + дополнительный отступ для маленьких экранов
 * iOS: минимальный отступ для комфорта использования
 */
export const getFixedBottomStyle = (insets: ReturnType<typeof usePlatformSafeAreaInsets>, additionalPadding: number = 8) => {
  if (Platform.OS === 'android') {
    // С прозрачным navigation bar используем системные insets
    const baseBottomPadding = hasTransparentNavigationBar() ? insets.bottom : Math.max(insets.bottom, 16);
    const smallScreenExtraPadding = isSmallScreen() ? 16 : 0; // дополнительные 16px для маленьких экранов
    return {
      paddingBottom: baseBottomPadding + additionalPadding + smallScreenExtraPadding,
    };
  }

  // На iOS используем фиксированный отступ 16px
  return {
    paddingBottom: 16, // фиксированный отступ 16px на iOS
  };
};

/**
 * Получает стили для контента ScrollView с учетом платформы
 * Android: дополнительные отступы для navigation bar + tab bar
 * iOS: минимальный отступ для комфорта прокрутки
 */
export const getScrollViewContentStyle = (insets: ReturnType<typeof usePlatformSafeAreaInsets>, additionalPadding: number = 24) => {
  if (Platform.OS === 'android') {
    // На Android добавляем больше отступа для tab bar (70px) + navigation bar + дополнительный отступ
    const tabBarHeight = 70; // высота tab bar
    const navigationBarPadding = Math.max(insets.bottom, 16);
    return {
      paddingBottom: tabBarHeight + navigationBarPadding + additionalPadding,
    };
  }

  // На iOS используем фиксированный отступ 16px для ScrollView контента
  return {
    paddingBottom: 16, // фиксированный отступ 16px на iOS
  };
};

/**
 * Получает стили для контейнеров, которые должны быть прижаты к самому краю экрана
 * Android: учитывает прозрачный navigation bar + дополнительный отступ для маленьких экранов, iOS: прижимается к краю
 */
export const getEdgeToEdgeBottomStyle = (insets: ReturnType<typeof usePlatformSafeAreaInsets>) => {
  if (Platform.OS === 'android') {
    // С прозрачным navigation bar используем системные insets для правильного позиционирования
    const baseBottomPadding = hasTransparentNavigationBar() ? insets.bottom : Math.max(insets.bottom, 16);
    const smallScreenExtraPadding = isSmallScreen() ? 16 : 0; // дополнительные 16px для маленьких экранов
    return {
      paddingBottom: baseBottomPadding + smallScreenExtraPadding, // системные insets + дополнительный отступ
    };
  }

  // На iOS прижимаем к самому краю
  return {
    paddingBottom: 0, // контейнер до самого края на iOS
  };
};

/**
 * Получает стили для контейнеров с учетом safe area
 * Для экранов где контейнер должен учитывать safe area + дополнительный отступ для маленьких экранов
 */
export const getContainerBottomStyle = (insets: ReturnType<typeof usePlatformSafeAreaInsets>) => {
  if (Platform.OS === 'android') {
    // С прозрачным navigation bar используем системные insets
    const baseBottomPadding = hasTransparentNavigationBar() ? insets.bottom : Math.max(insets.bottom, 16);
    const smallScreenExtraPadding = isSmallScreen() ? 16 : 0; // дополнительные 16px для маленьких экранов
    return {
      paddingBottom: baseBottomPadding + smallScreenExtraPadding, // системные insets + дополнительный отступ
    };
  }

  // На iOS учитываем safe area
  return {
    paddingBottom: insets.bottom, // контейнер с учетом safe area на iOS
  };
};

/**
 * Получает стили для ScrollView контента на экранах с tab navigation
 * Специально для экранов поддержки и других экранов в tab navigator
 */
export const getTabScreenScrollViewContentStyle = (insets: ReturnType<typeof usePlatformSafeAreaInsets>, additionalPadding: number = 32) => {
  if (Platform.OS === 'android') {
    // На Android добавляем отступ для tab bar + navigation bar + дополнительный отступ
    const tabBarHeight = 70; // высота tab bar
    const navigationBarPadding = Math.max(insets.bottom, 16);
    return {
      paddingBottom: tabBarHeight + navigationBarPadding + additionalPadding,
    };
  }

  // На iOS используем отступ с учетом safe area + tab bar
  return {
    paddingBottom: Math.max(insets.bottom, 16) + 70 + additionalPadding, // safe area + tab bar + дополнительный отступ
  };
};

/**
 * Получает стили для SafeAreaView с белым фоном на Android
 * Обеспечивает белый фон под navigation bar на Android
 */
export const getSafeAreaViewWithWhiteBackground = (insets: ReturnType<typeof usePlatformSafeAreaInsets>) => {
  if (Platform.OS === 'android') {
    return {
      flex: 1,
      backgroundColor: '#F8F9FA', // основной фон
      // Добавляем белую область внизу для navigation bar
      paddingBottom: 0, // убираем padding, используем отдельный View
    };
  }

  // На iOS стандартный SafeAreaView
  return {
    flex: 1,
    backgroundColor: '#F8F9FA',
  };
};

/**
 * Получает стили для белого фона под navigation bar на Android
 */
export const getAndroidNavigationBarBackground = (insets: ReturnType<typeof usePlatformSafeAreaInsets>) => {
  if (Platform.OS === 'android') {
    const navigationBarHeight = Math.max(insets.bottom, 16);
    return {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: navigationBarHeight,
      backgroundColor: '#ffffff',
      zIndex: 1000,
    };
  }

  // На iOS не нужно
  return {
    display: 'none' as const,
  };
};
