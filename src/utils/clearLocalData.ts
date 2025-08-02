import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

/**
 * Очистка только локальных данных и кешей
 * НЕ затрагивает данные в Supabase
 */
export async function clearLocalData(): Promise<void> {
  try {
    console.log('[ClearLocalData] 🧹 Начинаем очистку локальных данных...');

    // 1. Очищаем локальную авторизационную сессию (без очистки Supabase)
    authService.logout();
    console.log('[ClearLocalData] ✅ Локальная сессия авторизации очищена');

    // 2. Получаем все ключи из AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    console.log(`[ClearLocalData] 📋 Найдено ${allKeys.length} ключей в локальном хранилище`);

    // 3. Удаляем все ключи связанные с приложением
    const appKeys = allKeys.filter(key =>
      key.startsWith('@osonish_') ||
      key.startsWith('@temp_') ||
      key.includes('profile') ||
      key.includes('orders') ||
      key.includes('applicants') ||
      key.includes('session') ||
      key.includes('auth') ||
      key.includes('user')
    );

    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
      console.log(`[ClearLocalData] ✅ Удалено ${appKeys.length} ключей:`, appKeys);
    } else {
      console.log('[ClearLocalData] ℹ️ Локальных данных приложения не найдено');
    }

    // 4. Дополнительно очищаем возможные кеши
    const cacheKeys = [
      'lastOrdersUpdate',
      'lastUsersUpdate',
      'cachedOrders',
      'cachedUsers',
      'userApplications'
    ];

    for (const key of cacheKeys) {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        // Игнорируем ошибки для несуществующих ключей
      }
    }

    console.log('[ClearLocalData] 🎉 Очистка локальных данных завершена!');
    console.log('[ClearLocalData] 📝 Данные в Supabase остались нетронутыми');

    return;
  } catch (error) {
    console.error('[ClearLocalData] ❌ Ошибка при очистке локальных данных:', error);
    throw error;
  }
}

/**
 * Получение информации о локальных данных
 */
export async function getLocalDataInfo(): Promise<{
  totalKeys: number;
  appKeys: string[];
  storageSize: string;
}> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();

    const appKeys = allKeys.filter(key =>
      key.startsWith('@osonish_') ||
      key.startsWith('@temp_') ||
      key.includes('profile') ||
      key.includes('orders') ||
      key.includes('applicants') ||
      key.includes('session') ||
      key.includes('auth') ||
      key.includes('user')
    );

    // Приблизительный расчет размера
    let totalSize = 0;
    for (const key of appKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      } catch (error) {
        // Игнорируем ошибки
      }
    }

    const sizeInKB = (totalSize / 1024).toFixed(2);

    return {
      totalKeys: allKeys.length,
      appKeys,
      storageSize: `${sizeInKB} KB`
    };
  } catch (error) {
    console.error('[ClearLocalData] Ошибка получения информации:', error);
    return {
      totalKeys: 0,
      appKeys: [],
      storageSize: '0 KB'
    };
  }
}

// Глобальная функция для dev режима
if (__DEV__) {
  (global as any).clearLocalData = clearLocalData;
  (global as any).getLocalDataInfo = getLocalDataInfo;

  console.log('🧹 Команды для очистки локальных данных:');
  console.log('- clearLocalData() - очистить только локальные данные');
  console.log('- getLocalDataInfo() - показать информацию о локальных данных');
}