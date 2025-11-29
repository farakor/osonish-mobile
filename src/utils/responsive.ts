import { Dimensions, PixelRatio } from 'react-native';
import { getStatusBarHeightSafe, needsStatusBarPadding, getSafeStatusBarPadding } from './statusBar';

// Получаем размеры экрана
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Базовые размеры для дизайна (iPhone 11/12 - 390x844)
const baseWidth = 390;
const baseHeight = 844;

// Типы экранов
export const SCREEN_TYPES = {
  SMALL: 'small',      // < 360px ширина (маленькие Android)
  MEDIUM: 'medium',    // 360-400px ширина (обычные телефоны)
  LARGE: 'large',      // > 400px ширина (большие телефоны)
} as const;

// Определяем тип экрана
export const getScreenType = () => {
  if (screenWidth < 360) return SCREEN_TYPES.SMALL;
  if (screenWidth <= 400) return SCREEN_TYPES.MEDIUM;
  return SCREEN_TYPES.LARGE;
};

// Адаптивные функции
export const wp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((screenWidth * percentage) / 100);
};

export const hp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((screenHeight * percentage) / 100);
};

// Масштабирование на основе ширины экрана
export const scale = (size: number): number => {
  const ratio = screenWidth / baseWidth;
  return PixelRatio.roundToNearestPixel(size * ratio);
};

// Вертикальное масштабирование
export const verticalScale = (size: number): number => {
  const ratio = screenHeight / baseHeight;
  return PixelRatio.roundToNearestPixel(size * ratio);
};

// Умеренное масштабирование (не такое агрессивное)
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// Адаптивные отступы для маленьких экранов
export const getAdaptivePadding = () => {
  const screenType = getScreenType();

  switch (screenType) {
    case SCREEN_TYPES.SMALL:
      return {
        xs: 2,
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        xxl: 20,
      };
    case SCREEN_TYPES.MEDIUM:
      return {
        xs: 3,
        sm: 6,
        md: 12,
        lg: 18,
        xl: 24,
        xxl: 30,
      };
    default: // LARGE
      return {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 40,
      };
  }
};

// Адаптивные размеры шрифтов
export const getAdaptiveFontSizes = () => {
  const screenType = getScreenType();

  switch (screenType) {
    case SCREEN_TYPES.SMALL:
      return {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 20,
        xxxl: 24,
      };
    case SCREEN_TYPES.MEDIUM:
      return {
        xs: 11,
        sm: 13,
        md: 15,
        lg: 17,
        xl: 19,
        xxl: 22,
        xxxl: 28,
      };
    default: // LARGE
      return {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 32,
      };
  }
};

// Проверка на маленький экран
export const isSmallScreen = (): boolean => {
  return getScreenType() === SCREEN_TYPES.SMALL;
};

// Проверка на очень маленький экран (< 320px)
export const isVerySmallScreen = (): boolean => {
  return screenWidth < 320;
};

// Адаптивная ширина карточек
export const getCardWidth = (marginHorizontal: number = 24): number => {
  return screenWidth - (marginHorizontal * 2);
};

// Адаптивная высота для компонентов
export const getAdaptiveHeight = (baseHeight: number): number => {
  const screenType = getScreenType();

  switch (screenType) {
    case SCREEN_TYPES.SMALL:
      return Math.max(baseHeight * 0.8, baseHeight - 8); // Уменьшаем на 20% или минимум на 8px
    case SCREEN_TYPES.MEDIUM:
      return Math.max(baseHeight * 0.9, baseHeight - 4); // Уменьшаем на 10% или минимум на 4px
    default:
      return baseHeight;
  }
};

// Экспорт размеров экрана
export const screenDimensions = {
  width: screenWidth,
  height: screenHeight,
  isSmall: isSmallScreen(),
  isVerySmall: isVerySmallScreen(),
  type: getScreenType(),
};

// Адаптивные стили для кнопок
export const getAdaptiveButtonStyles = () => {
  const screenType = getScreenType();
  const padding = getAdaptivePadding();

  return {
    minHeight: getAdaptiveHeight(48),
    paddingHorizontal: padding.lg,
    paddingVertical: padding.sm,
    borderRadius: screenType === SCREEN_TYPES.SMALL ? 8 : 12,
  };
};

// Адаптивные стили для карточек
export const getAdaptiveCardStyles = () => {
  const screenType = getScreenType();
  const padding = getAdaptivePadding();

  return {
    padding: padding.lg,
    marginHorizontal: padding.lg,
    marginBottom: padding.lg,
    borderRadius: screenType === SCREEN_TYPES.SMALL ? 8 : 12,
  };
};

// Получаем безопасные отступы с учетом статус-бара
export const getSafeAreaPadding = () => {
  const statusBarHeight = getStatusBarHeightSafe();
  const safePadding = getSafeStatusBarPadding();
  const padding = getAdaptivePadding();

  return {
    // Для header, который должен учитывать статус-бар + дополнительный безопасный отступ
    headerTop: needsStatusBarPadding()
      ? statusBarHeight + safePadding + padding.md
      : safePadding + padding.lg,

    // Для обычного контента под header
    contentTop: padding.lg,

    // Для модальных окон с увеличенным отступом
    modalTop: needsStatusBarPadding()
      ? statusBarHeight + safePadding + padding.sm
      : safePadding + padding.md,
  };
};
