// API конфигурация для внешних сервисов

export const API_CONFIG = {
  // Yandex Geocoder API
  // Получить ключ можно на: https://developer.tech.yandex.ru/
  // Документация: https://yandex.ru/dev/geocode/
  YANDEX_GEOCODER_API_KEY: '445ec733-779c-4724-9843-4c3f805eb96b',

  // Другие API ключи можно добавить здесь
  // GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_KEY',
  // MAPBOX_API_KEY: 'YOUR_MAPBOX_KEY',
};

// Проверка наличия необходимых API ключей
export const checkApiKeys = () => {
  const missingKeys: string[] = [];

  if (!API_CONFIG.YANDEX_GEOCODER_API_KEY || API_CONFIG.YANDEX_GEOCODER_API_KEY === 'YOUR_YANDEX_API_KEY_HERE') {
    missingKeys.push('YANDEX_GEOCODER_API_KEY');
  }

  if (missingKeys.length > 0) {
    console.warn('⚠️ Отсутствуют API ключи:', missingKeys.join(', '));
    console.warn('📝 Инструкции по получению ключей см. в файле src/config/api.ts');
  }

  return missingKeys.length === 0;
};
