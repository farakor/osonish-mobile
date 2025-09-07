import { Platform } from 'react-native';

/**
 * Стили для отключения теней и elevation эффектов
 * Используется для элементов, которые не должны иметь тени
 */
export const noElevationStyles = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

/**
 * Стили для добавления легкой тени (elevation)
 * Используется для кнопок и карточек
 */
export const lightElevationStyles = {
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
  }),
};

/**
 * Стили для добавления средней тени (elevation)
 * Используется для модальных окон и важных элементов
 */
export const mediumElevationStyles = {
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
  }),
};

/**
 * Стили для добавления сильной тени (elevation)
 * Используется для floating action buttons и важных элементов
 */
export const strongElevationStyles = {
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    android: {
      elevation: 12,
    },
  }),
};

/**
 * Стили для кнопок с мягкими тенями
 * Специально оптимизированы для Android чтобы избежать острых углов
 */
export const softButtonElevationStyles = {
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    android: {
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
  }),
};

/**
 * Стили для кнопок с рамкой на Android и тенью на iOS
 * Используется для элементов, где нужна четкая граница на Android
 */
export const borderButtonStyles = {
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    android: {
      borderWidth: 1,
      borderColor: '#E5E5E7',
    },
  }),
};

/**
 * Стили для кнопок ролей - чистый elevation на Android без дополнительных теней
 * Специально для исправления проблемы с внутренними тенями на Android
 */
export const roleCardElevationStyles = {
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),
};

/**
 * Стили для выбранных кнопок ролей - чистый elevation на Android
 */
export const roleCardSelectedElevationStyles = {
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
  }),
};


