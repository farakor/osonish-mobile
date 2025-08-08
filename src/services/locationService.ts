import * as Location from 'expo-location';
import { API_CONFIG } from '../config/api';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface LocationPermissionResult {
  granted: boolean;
  error?: string;
}

export interface ReverseGeocodeResult {
  address: string;
  region?: string;
  city?: string;
  country?: string;
}

export class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationCoords | null = null;
  private permissionGranted: boolean = false;



  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Запрос разрешения на использование геолокации
   */
  async requestLocationPermission(): Promise<LocationPermissionResult> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.log('[LocationService] ❌ Разрешение на геолокацию не получено');
        return {
          granted: false,
          error: 'Для определения местоположения необходимо разрешение'
        };
      }

      this.permissionGranted = true;
      console.log('[LocationService] ✅ Разрешение на геолокацию получено');
      return { granted: true };
    } catch (error) {
      console.error('[LocationService] Ошибка при запросе разрешения:', error);
      return {
        granted: false,
        error: 'Ошибка при запросе разрешения на геолокацию'
      };
    }
  }

  /**
   * Получение текущего местоположения пользователя
   */
  async getCurrentLocation(): Promise<LocationCoords | null> {
    try {
      if (!this.permissionGranted) {
        const permission = await this.requestLocationPermission();
        if (!permission.granted) {
          return null;
        }
      }

      console.log('[LocationService] 🔄 Получаем текущее местоположение...');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 100
      });

      const coords: LocationCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      this.currentLocation = coords;
      console.log('[LocationService] ✅ Местоположение получено:', coords);

      return coords;
    } catch (error) {
      console.error('[LocationService] Ошибка получения местоположения:', error);
      return null;
    }
  }

  /**
   * Получение кэшированного местоположения
   */
  getCachedLocation(): LocationCoords | null {
    return this.currentLocation;
  }

  /**
   * Обратное геокодирование - получение адреса по координатам
   * Использует Yandex Geocoder API для более точных результатов в Узбекистане
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    try {
      console.log('[LocationService] 🔄 Обратное геокодирование:', { latitude, longitude });

      // Сначала пробуем Yandex Geocoder API
      const yandexResult = await this.reverseGeocodeYandex(latitude, longitude);
      if (yandexResult) {
        console.log('[LocationService] ✅ Адрес получен через Yandex:', yandexResult.address);
        return yandexResult;
      }

      // Fallback на Expo Location если Yandex недоступен
      console.log('[LocationService] ⚠️ Yandex недоступен, используем Expo Location');
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (results.length > 0) {
        const result = results[0];
        const address = this.formatAddress(result);

        const geocodeResult: ReverseGeocodeResult = {
          address,
          region: result.region || undefined,
          city: result.city || undefined,
          country: result.country || undefined
        };

        console.log('[LocationService] ✅ Адрес получен через Expo:', address);
        return geocodeResult;
      }

      return null;
    } catch (error) {
      console.error('[LocationService] Ошибка обратного геокодирования:', error);
      return null;
    }
  }

  /**
   * Прямое геокодирование - получение координат по адресу
   */
  async geocodeAddress(address: string): Promise<LocationCoords | null> {
    try {
      console.log('[LocationService] 🔄 Геокодирование адреса:', address);

      const results = await Location.geocodeAsync(address);

      if (results.length > 0) {
        const result = results[0];
        const coords: LocationCoords = {
          latitude: result.latitude,
          longitude: result.longitude
        };

        console.log('[LocationService] ✅ Координаты получены:', coords);
        return coords;
      }

      return null;
    } catch (error) {
      console.error('[LocationService] Ошибка геокодирования:', error);
      return null;
    }
  }

  /**
   * Расчет расстояния между двумя точками в километрах
   * Использует формулу гаверсинусов для учета кривизны Земли
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Радиус Земли в километрах

    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Округляем до 1 знака после запятой
  }

  /**
   * Форматирование расстояния для отображения
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      // Показываем в метрах для расстояний меньше 1 км
      const meters = Math.round(distanceKm * 1000);
      // Для очень маленьких расстояний показываем минимум 10м
      return `${Math.max(meters, 10)} м`;
    } else if (distanceKm < 10) {
      // Округляем до одного знака после запятой для расстояний от 1 до 10 км
      return `${Math.round(distanceKm * 10) / 10} км`;
    } else {
      // Округляем до целого числа для больших расстояний
      return `${Math.round(distanceKm)} км`;
    }
  }

  /**
   * Проверка находится ли точка в заданном радиусе
   */
  isWithinRadius(
    centerLat: number,
    centerLon: number,
    pointLat: number,
    pointLon: number,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(centerLat, centerLon, pointLat, pointLon);
    return distance <= radiusKm;
  }

  // Приватные методы

  /**
   * Обратное геокодирование через Yandex Geocoder API
   */
  private async reverseGeocodeYandex(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    try {
      // Проверяем наличие API ключа
      if (!API_CONFIG.YANDEX_GEOCODER_API_KEY || API_CONFIG.YANDEX_GEOCODER_API_KEY === 'YOUR_YANDEX_API_KEY_HERE') {
        console.log('[LocationService] ⚠️ Yandex API ключ не установлен. Установите ключ в src/config/api.ts');
        return null;
      }

      // Yandex Geocoder API endpoint с API ключом
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${API_CONFIG.YANDEX_GEOCODER_API_KEY}&geocode=${longitude},${latitude}&format=json&results=1&lang=ru_RU`;

      console.log('[LocationService] 🔄 Запрос к Yandex Geocoder (с API ключом):', url.replace(API_CONFIG.YANDEX_GEOCODER_API_KEY, 'API_KEY_HIDDEN'));

      // Создаем AbortController для таймаута
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log('[LocationService] ⚠️ Yandex API вернул ошибку:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('[LocationService] 📥 Ответ Yandex API получен');

      // Парсим ответ Yandex API
      const geoObjectCollection = data?.response?.GeoObjectCollection;
      const geoObjects = geoObjectCollection?.featureMember;

      if (geoObjects && geoObjects.length > 0) {
        const geoObject = geoObjects[0].GeoObject;
        const metaData = geoObject.metaDataProperty.GeocoderMetaData;

        // Получаем полный адрес - пробуем разные варианты
        const fullAddress = metaData.text || metaData.AddressDetails?.Country?.AddressLine || geoObject.name || 'Неизвестный адрес';

        console.log('[LocationService] 📍 Извлеченный адрес:', fullAddress);

        // Парсим компоненты адреса
        const addressComponents = metaData.Address?.Components || [];
        let city = '';
        let region = '';
        let country = '';

        addressComponents.forEach((component: any) => {
          switch (component.kind) {
            case 'locality':
              city = component.name;
              break;
            case 'province':
              region = component.name;
              break;
            case 'country':
              country = component.name;
              break;
          }
        });

        const result: ReverseGeocodeResult = {
          address: fullAddress,
          city: city || undefined,
          region: region || undefined,
          country: country || undefined
        };

        console.log('[LocationService] ✅ Yandex геокодирование успешно:', result);
        return result;
      }

      console.log('[LocationService] ⚠️ Yandex API не вернул результатов');
      return null;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[LocationService] ⏰ Yandex API таймаут (5 сек)');
      } else {
        console.error('[LocationService] ❌ Ошибка Yandex геокодирования:', error);
      }
      return null;
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private formatAddress(result: Location.LocationGeocodedAddress): string {
    const parts: string[] = [];

    if (result.street) {
      parts.push(result.street);
    }
    if (result.name && result.name !== result.street) {
      parts.push(result.name);
    }
    if (result.district) {
      parts.push(result.district);
    }
    if (result.city) {
      parts.push(result.city);
    }

    return parts.length > 0 ? parts.join(', ') : 'Неизвестный адрес';
  }
}

export const locationService = LocationService.getInstance();