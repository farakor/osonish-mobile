import { useMemo } from 'react';
import {
  getAdaptivePadding,
  getAdaptiveFontSizes,
  isSmallScreen,
  isVerySmallScreen,
  getAdaptiveHeight,
  getAdaptiveCardStyles,
  getAdaptiveButtonStyles,
  screenDimensions,
  getSafeAreaPadding
} from '../utils/responsive';
import { getStatusBarConfig } from '../utils/statusBar';
import { getExtraSafeAreaPadding, getContextualSafeAreaPadding, createSafeHeaderStyle } from '../utils/safeAreaHelpers';

export const useAdaptiveStyles = () => {
  const adaptiveStyles = useMemo(() => {
    const isSmall = isSmallScreen();
    const isVerySmall = isVerySmallScreen();
    const padding = getAdaptivePadding();
    const fontSize = getAdaptiveFontSizes();
    const cardStyles = getAdaptiveCardStyles();
    const buttonStyles = getAdaptiveButtonStyles();
    const safeAreaPadding = getSafeAreaPadding();
    const extraSafeAreaPadding = getExtraSafeAreaPadding();
    const statusBarConfig = getStatusBarConfig();

    return {
      // Основные флаги
      isSmallScreen: isSmall,
      isVerySmallScreen: isVerySmall,
      screenWidth: screenDimensions.width,
      screenHeight: screenDimensions.height,

      // Адаптивные размеры
      padding,
      fontSize,

      // Готовые стили компонентов
      card: cardStyles,
      button: buttonStyles,

      // Утилиты
      getHeight: getAdaptiveHeight,

      // Специфичные стили для разных размеров экранов
      container: {
        paddingHorizontal: padding.lg,
        paddingVertical: padding.md,
      },

      header: {
        paddingHorizontal: padding.lg,
        paddingTop: safeAreaPadding.headerTop,
        paddingBottom: padding.md,
      },

      // Конфигурация статус-бара
      statusBar: statusBarConfig,

      // Безопасные отступы
      safeArea: safeAreaPadding,

      // Увеличенные безопасные отступы для максимального комфорта
      extraSafeArea: extraSafeAreaPadding,

      // Утилиты для создания безопасных стилей
      createSafeHeader: createSafeHeaderStyle,
      getContextualPadding: getContextualSafeAreaPadding,

      input: {
        minHeight: getAdaptiveHeight(48),
        paddingHorizontal: padding.md,
        paddingVertical: padding.sm,
        borderRadius: isSmall ? 8 : 12,
        fontSize: fontSize.md,
      },

      modal: {
        borderRadius: isSmall ? 12 : 16,
        padding: padding.lg,
        margin: padding.lg,
      },

      icon: {
        small: isSmall ? 16 : 20,
        medium: isSmall ? 20 : 24,
        large: isSmall ? 24 : 28,
      },

      shadow: {
        shadowRadius: isSmall ? 4 : 8,
        elevation: isSmall ? 2 : 4,
      },

      // Адаптивные отступы для списков
      list: {
        paddingHorizontal: 0,
        paddingTop: padding.lg,
        contentContainerStyle: {
          paddingBottom: padding.xl,
        },
      },

      // Адаптивные стили для категорий
      categoryChip: {
        paddingHorizontal: padding.md,
        paddingVertical: padding.sm,
        borderRadius: isSmall ? 16 : 20,
        marginRight: padding.sm,
      },
    };
  }, []);

  return adaptiveStyles;
};
