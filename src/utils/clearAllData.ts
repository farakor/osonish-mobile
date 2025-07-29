import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';

/**
 * Полная очистка всех пользовательских данных из приложения
 * Удаляет:
 * - Всех пользователей и состояние авторизации
 * - Все заявки/заказы
 * - Временные данные профиля
 * - Любые другие данные приложения
 */
export async function clearAllUserData(): Promise<void> {
  try {
    console.log('[ClearData] Начинаем полную очистку данных...');

    // 1. Сначала очищаем заказы (чтобы не было ошибок внешних ключей)
    await orderService.clearAllOrders();
    console.log('[ClearData] ✅ Заказы очищены');

    // 2. Затем очищаем данные авторизации и пользователей
    await authService.clearAllData();
    console.log('[ClearData] ✅ Данные пользователей очищены');

    // 3. Очищаем временные данные профиля
    await AsyncStorage.removeItem('@temp_profile_data');
    console.log('[ClearData] ✅ Временные данные профиля очищены');

    // 4. Дополнительная очистка всех ключей, связанных с приложением
    // Получаем все ключи из AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    const osonishKeys = allKeys.filter(key =>
      key.startsWith('@osonish') ||
      key.startsWith('@temp_profile') ||
      key.includes('osonish')
    );

    if (osonishKeys.length > 0) {
      await AsyncStorage.multiRemove(osonishKeys);
      console.log(`[ClearData] ✅ Удалены дополнительные ключи: ${osonishKeys.join(', ')}`);
    }

    console.log('[ClearData] 🎉 Полная очистка данных завершена успешно!');
  } catch (error) {
    console.error('[ClearData] ❌ Ошибка при очистке данных:', error);
    throw error;
  }
}

/**
 * Получение статистики о данных перед очисткой
 */
export async function getDataStats(): Promise<{
  users: number;
  orders: number;
  storageKeys: string[];
}> {
  try {
    // Получаем количество пользователей
    const users = authService.getAllUsers();

    // Получаем статистику заказов
    const orderStats = await orderService.getOrdersStats();

    // Получаем все ключи хранилища, связанные с приложением
    const allKeys = await AsyncStorage.getAllKeys();
    const osonishKeys = allKeys.filter(key =>
      key.startsWith('@osonish') ||
      key.startsWith('@temp_profile') ||
      key.includes('osonish')
    );

    return {
      users: users.length,
      orders: orderStats.total,
      storageKeys: osonishKeys
    };
  } catch (error) {
    console.error('[ClearData] Ошибка получения статистики:', error);
    return {
      users: 0,
      orders: 0,
      storageKeys: []
    };
  }
} 