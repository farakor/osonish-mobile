import { Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Утилиты для работы с Edge-to-Edge режимом в Android 15+
 * Заменяет устаревшие API StatusBar для совместимости
 */

export interface EdgeToEdgeInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Хук для получения безопасных отступов с поддержкой Edge-to-Edge
 */
export const useEdgeToEdgeInsets = (): EdgeToEdgeInsets => {
  const insets = useSafeAreaInsets();

  return {
    top: Math.max(insets.top, Platform.OS === 'android' ? 24 : 44), // минимальная высота статус-бара
    bottom: Math.max(insets.bottom, 0),
    left: Math.max(insets.left, 0),
    right: Math.max(insets.right, 0),
  };
};

/**
 * Получить высоту статус-бара с учетом Edge-to-Edge
 */
export const getStatusBarHeight = (): number => {
  if (Platform.OS === 'ios') {
    return 44; // стандартная высота для iOS
  }

  // Для Android используем безопасные отступы вместо устаревшего StatusBar.currentHeight
  const { height } = Dimensions.get('window');
  const screenHeight = Dimensions.get('screen').height;

  // Приблизительная высота статус-бара для Android
  const systemUIHeight = screenHeight - height;
  if (systemUIHeight > 0) {
    // Статус-бар обычно составляет около 24-48px
    return Math.min(systemUIHeight, 48);
  }

  return 24; // fallback для старых устройств
};

/**
 * Получить высоту навигационной панели с учетом Edge-to-Edge
 */
export const getNavigationBarHeight = (): number => {
  if (Platform.OS === 'ios') {
    return 0; // iOS не имеет навигационной панели
  }

  const { height } = Dimensions.get('window');
  const screenHeight = Dimensions.get('screen').height;

  // Разница между высотой экрана и окна включает статус-бар и навигационную панель
  const totalSystemUI = screenHeight - height;
  const statusBarHeight = getStatusBarHeight();

  return Math.max(0, totalSystemUI - statusBarHeight);
};

/**
 * Стили для контейнеров с поддержкой Edge-to-Edge
 */
export const createEdgeToEdgeStyles = (insets: EdgeToEdgeInsets) => ({
  container: {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  },

  headerContainer: {
    paddingTop: insets.top,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  },

  contentContainer: {
    paddingLeft: insets.left,
    paddingRight: insets.right,
  },

  bottomContainer: {
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  },
});

/**
 * Проверить, поддерживается ли Edge-to-Edge на текущем устройстве
 */
export const isEdgeToEdgeSupported = (): boolean => {
  if (Platform.OS === 'ios') {
    return true; // iOS всегда поддерживает безопасные области
  }

  // Для Android проверяем версию API
  return Platform.Version >= 28; // Android 9.0+
};

/**
 * Получить конфигурацию статус-бара для Edge-to-Edge
 */
export const getEdgeToEdgeStatusBarConfig = () => ({
  barStyle: 'dark-content' as const,
  backgroundColor: 'transparent',
  translucent: true,
});
