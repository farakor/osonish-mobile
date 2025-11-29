import { Platform } from 'react-native';
import { getSafeAreaPadding } from './responsive';
import { getStatusBarHeightSafe, getSafeStatusBarPadding } from './statusBar';
import { getAdaptivePadding } from './responsive';

// Получаем увеличенные безопасные отступы для максимального комфорта
export const getExtraSafeAreaPadding = () => {
  const baseSafePadding = getSafeAreaPadding();
  const adaptivePadding = getAdaptivePadding();

  return {
    // Для header с дополнительным комфортным отступом
    headerTop: baseSafePadding.headerTop + adaptivePadding.sm,

    // Для контента с увеличенным отступом
    contentTop: baseSafePadding.contentTop + adaptivePadding.xs,

    // Для модальных окон с большим отступом
    modalTop: baseSafePadding.modalTop + adaptivePadding.sm,

    // Для экранов с критически важным контентом
    criticalTop: baseSafePadding.headerTop + adaptivePadding.md,
  };
};

// Получаем минимальные безопасные отступы (для компактных экранов)
export const getMinimalSafeAreaPadding = () => {
  const statusBarHeight = getStatusBarHeightSafe();
  const safePadding = getSafeStatusBarPadding();
  const adaptivePadding = getAdaptivePadding();

  return {
    // Минимальный отступ для header
    headerTop: Platform.OS === 'android'
      ? statusBarHeight + Math.max(safePadding, adaptivePadding.sm)
      : Math.max(safePadding, adaptivePadding.sm),

    // Минимальный отступ для контента
    contentTop: adaptivePadding.sm,

    // Минимальный отступ для модальных окон
    modalTop: Platform.OS === 'android'
      ? statusBarHeight + adaptivePadding.xs
      : adaptivePadding.xs,
  };
};

// Получаем отступы в зависимости от типа экрана
export const getContextualSafeAreaPadding = (context: 'default' | 'compact' | 'comfortable' | 'critical') => {
  switch (context) {
    case 'compact':
      return getMinimalSafeAreaPadding();
    case 'comfortable':
      return getExtraSafeAreaPadding();
    case 'critical':
      const extraSafe = getExtraSafeAreaPadding();
      return {
        ...extraSafe,
        headerTop: extraSafe.criticalTop,
      };
    default:
      return getSafeAreaPadding();
  }
};

// Утилита для быстрого получения стиля header с безопасными отступами
export const createSafeHeaderStyle = (
  backgroundColor: string = '#679B00',
  context: 'default' | 'compact' | 'comfortable' | 'critical' = 'comfortable'
) => {
  const padding = getContextualSafeAreaPadding(context);
  const adaptivePadding = getAdaptivePadding();

  return {
    backgroundColor,
    paddingTop: padding.headerTop,
    paddingHorizontal: adaptivePadding.lg,
    paddingBottom: adaptivePadding.md,
  };
};
