import { authService } from '../services/authService';
import { orderService } from '../services/orderService';
import { clearLocalData, getLocalDataInfo } from './clearLocalData';

/**
 * Утилиты для тестирования приложения
 */
export class TestingHelpers {

  /**
   * Очистка всех данных для начала чистого тестирования (включая Supabase)
   */
  static async clearAllData(): Promise<void> {
    try {
      console.log('🧹 Очищаем все данные...');

      // Очищаем пользователей
      await authService.clearAllData();
      console.log('✅ Пользователи очищены');

      // Очищаем заказы
      await orderService.clearAllOrders();
      console.log('✅ Заказы очищены');

      console.log('🎉 Все данные очищены! Можно начинать тестирование заново.');
    } catch (error) {
      console.error('❌ Ошибка очистки данных:', error);
    }
  }

  /**
   * Очистка только локальных данных (НЕ затрагивает Supabase)
   */
  static async clearLocalDataOnly(): Promise<void> {
    try {
      console.log('🧹 Очищаем только локальные данные...');

      // Показываем информацию о данных перед очисткой
      const info = await getLocalDataInfo();
      console.log(`📊 Найдено ${info.appKeys.length} ключей приложения (${info.storageSize})`);

      // Очищаем локальные данные
      await clearLocalData();

      console.log('🎉 Локальные данные очищены! Supabase остался нетронутым.');
    } catch (error) {
      console.error('❌ Ошибка очистки локальных данных:', error);
    }
  }

  /**
   * Показать информацию о текущем пользователе
   */
  static showCurrentUser(): void {
    const authState = authService.getAuthState();
    if (authState.isAuthenticated && authState.user) {
      console.log('👤 Текущий пользователь:', {
        id: authState.user.id,
        name: `${authState.user.firstName} ${authState.user.lastName}`,
        phone: authState.user.phone,
        role: authState.user.role
      });
    } else {
      console.log('❌ Пользователь не авторизован');
    }
  }

  /**
   * Показать всех пользователей в системе
   */
  static showAllUsers(): void {
    const users = authService.getAllUsers();
    console.log(`👥 Всего пользователей в системе: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.phone}) - ${user.role}`);
    });
  }

  /**
   * Показать статистику заказов
   */
  static async showOrdersStats(): Promise<void> {
    try {
      const stats = await orderService.getOrdersStats();
      const allOrders = await orderService.getAvailableOrders();

      console.log('📊 Статистика заказов:', {
        'Всего заказов': stats.total,
        'Активных заказов': stats.active,
        'Завершенных заказов': stats.completed,
        'Заказов текущего пользователя': stats.userOrders
      });

      console.log('📋 Доступные заказы для исполнителей:', allOrders.length);
      allOrders.forEach((order, index) => {
        console.log(`${index + 1}. "${order.title}" - ${order.budget} сум (${order.category || 'other'})`);
      });
    } catch (error) {
      console.error('❌ Ошибка получения статистики:', error);
    }
  }


  /**
   * Быстрое переключение между ролями для тестирования
   */
  static async switchToTestUser(role: 'customer' | 'worker'): Promise<void> {
    try {
      const users = authService.getAllUsers();
      const targetUser = users.find(user => user.role === role);

      if (!targetUser) {
        console.log(`❌ Пользователь с ролью "${role}" не найден`);
        console.log('💡 Создайте пользователей через регистрацию или используйте clearAllData()');
        return;
      }

      // Здесь можно добавить логику переключения пользователя
      // Но пока что просто показываем информацию
      console.log(`🔄 Найден ${role}:`, {
        name: `${targetUser.firstName} ${targetUser.lastName}`,
        phone: targetUser.phone
      });
      console.log('💡 Используйте кнопку "Выйти" в профиле и войдите под этим номером');
    } catch (error) {
      console.error('❌ Ошибка переключения пользователя:', error);
    }
  }
}

// Экспортируем для удобства использования в консоли
export const clearAllData = TestingHelpers.clearAllData;
export const clearLocalDataOnly = TestingHelpers.clearLocalDataOnly;
export const showCurrentUser = TestingHelpers.showCurrentUser;
export const showAllUsers = TestingHelpers.showAllUsers;
export const showOrdersStats = TestingHelpers.showOrdersStats;
export const switchToTestUser = TestingHelpers.switchToTestUser;


// Делаем доступными глобально для удобства тестирования
if (__DEV__) {
  (global as any).clearAllData = clearAllData;
  (global as any).clearLocalDataOnly = clearLocalDataOnly;
  (global as any).showCurrentUser = showCurrentUser;
  (global as any).showAllUsers = showAllUsers;
  (global as any).showOrdersStats = showOrdersStats;
  (global as any).switchToTestUser = switchToTestUser;


  console.log('🧪 Команды для тестирования:');
  console.log('- clearAllData() - очистить все данные (включая Supabase)');
  console.log('- clearLocalDataOnly() - очистить только локальные данные');
  console.log('- showCurrentUser() - показать текущего пользователя');
  console.log('- showAllUsers() - показать всех пользователей');
  console.log('- showOrdersStats() - показать статистику заказов');
  console.log('- switchToTestUser("customer") - найти заказчика');
  console.log('- switchToTestUser("worker") - найти исполнителя');

} 