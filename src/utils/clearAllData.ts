import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';

/**
 * Полная очистка всех пользовательских данных из приложения
 * Удаляет:
 * - Всех пользователей и состояние авторизации из Supabase
 * - Все заявки/заказы из Supabase
 * - Временные данные профиля из локального хранилища
 * - Сессионные данные
 */
export async function clearAllUserData(): Promise<void> {
  try {
    console.log('[ClearData] Начинаем полную очистку данных...');

    // 1. Сначала очищаем заказы в Supabase
    await orderService.clearAllOrders();
    console.log('[ClearData] ✅ Заказы очищены в Supabase');

    // 2. Очищаем отклики исполнителей в Supabase
    await orderService.clearAllApplicants();
    console.log('[ClearData] ✅ Отклики очищены в Supabase');

    // 3. Затем очищаем данные пользователей в Supabase и локальную сессию
    await authService.clearAllData();
    console.log('[ClearData] ✅ Данные пользователей очищены в Supabase');

    // 4. Очищаем временные данные профиля (оставляем только временные данные)
    await AsyncStorage.removeItem('@temp_profile_data');
    console.log('[ClearData] ✅ Временные данные профиля очищены');

    // 5. Очищаем только ключи приложения, связанные с временными данными
    // Сессионные данные уже очищены через authService.clearAllData()
    const allKeys = await AsyncStorage.getAllKeys();
    const tempKeys = allKeys.filter(key =>
      key.startsWith('@temp_') ||
      key.startsWith('@osonish_temp') ||
      key.includes('temp_profile')
    );

    if (tempKeys.length > 0) {
      await AsyncStorage.multiRemove(tempKeys);
      console.log(`[ClearData] ✅ Удалены временные ключи: ${tempKeys.join(', ')}`);
    }

    console.log('[ClearData] 🎉 Полная очистка данных завершена успешно!');
    console.log('[ClearData] 📋 Все данные теперь хранятся только в Supabase');
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
  supabaseOnly: boolean;
}> {
  try {
    // Получаем статистику заказов из Supabase
    const orderStats = await orderService.getOrdersStats();

    // Получаем пользователей из Supabase
    const users = await authService.getAllUsersFromSupabase();

    // Получаем только временные ключи из локального хранилища
    const allKeys = await AsyncStorage.getAllKeys();
    const tempKeys = allKeys.filter(key =>
      key.startsWith('@temp_') ||
      key.startsWith('@osonish_temp') ||
      key.startsWith('@osonish_session') ||
      key.includes('temp_profile')
    );

    return {
      users: users.length,
      orders: orderStats.total,
      storageKeys: tempKeys,
      supabaseOnly: true // Указываем, что используем только Supabase
    };
  } catch (error) {
    console.error('[ClearData] Ошибка получения статистики:', error);
    return {
      users: 0,
      orders: 0,
      storageKeys: [],
      supabaseOnly: true
    };
  }
} 