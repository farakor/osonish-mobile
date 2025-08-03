import * as Location from 'expo-location';

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
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    try {
      console.log('[LocationService] 🔄 Обратное геокодирование:', { latitude, longitude });

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

        console.log('[LocationService] ✅ Адрес получен:', address);
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
    if (distanceKm < 0.1) {
      return 'рядом';
    } else if (distanceKm < 1) {
      const meters = Math.round(distanceKm * 1000);
      return `${meters} м`;
    } else if (distanceKm < 10) {
      return `${distanceKm} км`;
    } else {
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