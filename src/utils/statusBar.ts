import { Platform, StatusBar, Dimensions } from 'react-native';

// Получаем высоту статус-бара для разных платформ
export const getStatusBarHeightSafe = (): number => {
  if (Platform.OS === 'ios') {
    // Для iOS используем стандартные значения в зависимости от размера экрана
    const { height, width } = Dimensions.get('window');
    const isIPhoneX = height >= 812 || width >= 812;
    return isIPhoneX ? 44 : 20;
  }

  // Для Android используем стандартную высоту StatusBar
  return StatusBar.currentHeight || 24;
};

// Получаем дополнительный безопасный отступ для комфортного расстояния
export const getSafeStatusBarPadding = (): number => {
  const statusBarHeight = getStatusBarHeightSafe();

  if (Platform.OS === 'ios') {
    // Для iOS добавляем дополнительный отступ
    const { height } = Dimensions.get('window');
    const isIPhoneX = height >= 812;
    return isIPhoneX ? 16 : 12; // Больше отступ для iPhone X+
  }

  // Для Android добавляем больший отступ для комфорта
  return Math.max(16, statusBarHeight * 0.5); // Минимум 16px или 50% от высоты статус-бара
};

// Проверяем, нужно ли добавлять отступ для статус-бара
export const needsStatusBarPadding = (): boolean => {
  return Platform.OS === 'android';
};

// Получаем безопасную высоту для header с учетом статус-бара
export const getSafeHeaderHeight = (baseHeight: number = 60): number => {
  const statusBarHeight = getStatusBarHeightSafe();
  const safePadding = getSafeStatusBarPadding();

  if (needsStatusBarPadding()) {
    return baseHeight + statusBarHeight + safePadding;
  }
  return baseHeight + safePadding; // Даже для iOS добавляем дополнительный отступ
};

// Получаем отступ сверху для контента под статус-баром
export const getStatusBarPadding = (): number => {
  return needsStatusBarPadding() ? getStatusBarHeightSafe() : 0;
};

// Стили для безопасной области
export const getSafeAreaStyles = () => {
  const statusBarHeight = getStatusBarHeightSafe();

  return {
    // Для контейнера, который должен начинаться под статус-баром
    safeContainer: {
      paddingTop: Platform.OS === 'android' ? statusBarHeight : 0,
    },

    // Для header, который должен включать статус-бар
    headerWithStatusBar: {
      paddingTop: Platform.OS === 'android' ? statusBarHeight + 16 : 16,
    },

    // Для модальных окон
    modalSafeArea: {
      paddingTop: Platform.OS === 'android' ? statusBarHeight + 8 : 8,
    },
  };
};

// Конфигурация StatusBar для разных экранов
export const getStatusBarConfig = (backgroundColor: string = '#679B00') => {
  return {
    barStyle: Platform.OS === 'ios' ? 'light-content' : 'dark-content',
    backgroundColor: Platform.OS === 'android' ? backgroundColor : undefined,
    translucent: Platform.OS === 'android',
  };
};
