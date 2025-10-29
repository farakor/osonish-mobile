import i18n from '../i18n';

// Список городов Узбекистана (в виде идентификаторов)
export const UZBEKISTAN_CITIES = [
  'tashkent',
  'samarkand',
  'bukhara',
  'andijan',
  'jizzakh',
  'karshi',
  'navoi',
  'namangan',
  'termez',
  'sirdarya',
  'chirchik',
  'fergana',
  'urgench',
  'nukus',
] as const;

export type CityId = typeof UZBEKISTAN_CITIES[number];

/**
 * Получить переведенное название города
 */
export const getCityName = (cityId: string | undefined): string => {
  if (!cityId) return '';
  
  const normalizedId = cityId.toLowerCase();
  
  // Проверяем, есть ли перевод для этого города
  const translationKey = `cities.${normalizedId}`;
  const translation = i18n.t(translationKey);
  
  // Если перевод не найден, возвращаем исходное значение с большой буквы
  if (translation === translationKey) {
    return cityId.charAt(0).toUpperCase() + cityId.slice(1);
  }
  
  return translation;
};

/**
 * Получить список всех городов с переводами
 */
export const getAllCities = (): Array<{ id: string; name: string }> => {
  return UZBEKISTAN_CITIES.map(cityId => ({
    id: cityId,
    name: getCityName(cityId),
  }));
};

/**
 * Проверить, является ли строка валидным идентификатором города
 */
export const isValidCityId = (cityId: string): boolean => {
  return UZBEKISTAN_CITIES.includes(cityId.toLowerCase() as CityId);
};

