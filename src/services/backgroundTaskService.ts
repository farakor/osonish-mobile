import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { orderService } from './orderService';

// Имя фоновой задачи
const AUTO_COMPLETE_ORDERS_TASK = 'AUTO_COMPLETE_ORDERS_TASK';

/**
 * Сервис для управления фоновыми задачами
 */
class BackgroundTaskService {
  private static instance: BackgroundTaskService;
  private isRegistered = false;

  static getInstance(): BackgroundTaskService {
    if (!BackgroundTaskService.instance) {
      BackgroundTaskService.instance = new BackgroundTaskService();
    }
    return BackgroundTaskService.instance;
  }

  /**
   * Регистрирует фоновую задачу для автозавершения заказов
   */
  async registerBackgroundFetch(): Promise<void> {
    try {
      if (this.isRegistered) {
        console.log('[BackgroundTask] ✅ Фоновая задача уже зарегистрирована');
        return;
      }

      // Определяем задачу
      TaskManager.defineTask(AUTO_COMPLETE_ORDERS_TASK, async () => {
        try {
          console.log('[BackgroundTask] 🔄 Выполнение фоновой задачи автозавершения заказов');

          // Вызываем функцию автозавершения заказов
          await orderService.autoCompleteOrders();

          console.log('[BackgroundTask] ✅ Фоновая задача выполнена успешно');
          return BackgroundTask.BackgroundTaskResult.NewData;
        } catch (error) {
          console.error('[BackgroundTask] ❌ Ошибка выполнения фоновой задачи:', error);
          return BackgroundTask.BackgroundTaskResult.Failed;
        }
      });

      // Регистрируем задачу
      await BackgroundTask.registerTaskAsync(AUTO_COMPLETE_ORDERS_TASK, {
        minimumInterval: 15 * 60 * 1000, // 15 минут
        stopOnTerminate: false,
        startOnBoot: true,
      });

      this.isRegistered = true;
      console.log('[BackgroundTask] ✅ Фоновая задача зарегистрирована успешно');

    } catch (error) {
      console.error('[BackgroundTask] ❌ Ошибка регистрации фоновой задачи:', error);
      throw error;
    }
  }

  /**
   * Отменяет регистрацию фоновой задачи
   */
  async unregisterBackgroundFetch(): Promise<void> {
    try {
      if (!this.isRegistered) {
        console.log('[BackgroundTask] ℹ️ Фоновая задача не была зарегистрирована');
        return;
      }

      await BackgroundTask.unregisterTaskAsync(AUTO_COMPLETE_ORDERS_TASK);
      this.isRegistered = false;
      console.log('[BackgroundTask] ✅ Фоновая задача отменена');

    } catch (error) {
      console.error('[BackgroundTask] ❌ Ошибка отмены фоновой задачи:', error);
    }
  }

  /**
   * Проверяет статус фоновой задачи
   */
  async getBackgroundFetchStatus(): Promise<string> {
    try {
      const status = await BackgroundTask.getStatusAsync();
      console.log('[BackgroundTask] 📊 Статус фоновых задач:', status);
      return status;
    } catch (error) {
      console.error('[BackgroundTask] ❌ Ошибка получения статуса:', error);
      return 'unknown';
    }
  }

  /**
   * Проверяет, зарегистрирована ли задача
   */
  isTaskRegistered(): boolean {
    return this.isRegistered;
  }
}

// Экспортируем синглтон
export const backgroundTaskService = BackgroundTaskService.getInstance();
