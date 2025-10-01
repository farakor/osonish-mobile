import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { orderService } from '../services/orderService';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';

export interface TestOrder {
  id: string;
  title: string;
  status: string;
  service_date: string;
  auto_completed?: boolean;
  auto_cancelled?: boolean;
}

export const useAutoOrderTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testOrders, setTestOrders] = useState<TestOrder[]>([]);

  /**
   * Создает тестовые заказы на сегодня
   */
  const createTestOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Получаем ID текущего пользователя через authService
      const authState = authService.getAuthState();
      console.log('🧪 [TEST] Auth state:', {
        isAuthenticated: authState.isAuthenticated,
        hasUser: !!authState.user,
        userId: authState.user?.id
      });

      if (!authState.isAuthenticated || !authState.user) {
        Alert.alert('Ошибка', 'Пользователь не авторизован. Войдите в приложение.');
        return;
      }

      const user = authState.user;
      console.log('🧪 [TEST] Creating test orders for user:', user.id);

      const testOrdersData = [
        {
          title: '🧪 ТЕСТ: Новый заказ (будет отменен)',
          description: 'Тестовый заказ для проверки автоотмены',
          category: 'Тестирование',
          location: 'Тестовая локация',
          budget: 100000,
          workers_needed: 1,
          service_date: today,
          status: 'new',
          customer_id: user.id,
        },
        {
          title: '🧪 ТЕСТ: Заказ с откликом (будет отменен)',
          description: 'Тестовый заказ для проверки автоотмены',
          category: 'Тестирование',
          location: 'Тестовая локация',
          budget: 150000,
          workers_needed: 1,
          service_date: today,
          status: 'response_received',
          customer_id: user.id,
        },
        {
          title: '🧪 ТЕСТ: Заказ в работе (будет завершен)',
          description: 'Тестовый заказ для проверки автозавершения',
          category: 'Тестирование',
          location: 'Тестовая локация',
          budget: 200000,
          workers_needed: 1,
          service_date: today,
          status: 'in_progress',
          customer_id: user.id,
        },
      ];

      const createdOrders: TestOrder[] = [];

      for (const orderData of testOrdersData) {
        const { data, error } = await supabase
          .from('orders')
          .insert(orderData)
          .select('id, title, status, service_date')
          .single();

        if (error) {
          console.error('🧪 [TEST] Ошибка создания заказа:', error);
          Alert.alert('Ошибка', `Не удалось создать заказ: ${orderData.title}\n\nОшибка: ${error.message}`);
        } else {
          console.log('🧪 [TEST] Заказ создан успешно:', data.id);
          createdOrders.push(data);
        }
      }

      setTestOrders(createdOrders);
      Alert.alert('Успех', `Создано ${createdOrders.length} тестовых заказов`);

    } catch (error) {
      console.error('Ошибка создания тестовых заказов:', error);
      Alert.alert('Ошибка', 'Не удалось создать тестовые заказы');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Принудительно запускает автообновление (игнорирует время)
   * @param allOrders - если true, обрабатывает ВСЕ заказы, если false - только тестовые
   */
  const runAutoUpdate = useCallback(async (allOrders: boolean = false) => {
    setIsLoading(true);
    try {
      if (allOrders) {
        console.log('🧪 ТЕСТ: Запуск автообновления ВСЕХ заказов БЕЗ проверки времени...');
        await orderService.autoCompleteOrdersForTesting();
        Alert.alert('Успех', 'Автообновление ВСЕХ заказов выполнено! Проверьте результаты.');
      } else {
        console.log('🧪 ТЕСТ: Запуск автообновления ТОЛЬКО тестовых заказов БЕЗ проверки времени...');
        await orderService.autoCompleteTestOrdersOnly();
        Alert.alert('Успех', 'Автообновление тестовых заказов выполнено! Проверьте результаты.');
      }

    } catch (error) {
      console.error('🧪 ТЕСТ: Ошибка автообновления:', error);
      Alert.alert('Ошибка', 'Не удалось выполнить автообновление');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Проверяет результаты автообновления
   */
  const checkResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: results, error } = await supabase
        .from('orders')
        .select('id, title, status, auto_completed, auto_cancelled, updated_at')
        .eq('service_date', today)
        .like('title', '🧪 ТЕСТ:%')
        .order('updated_at', { ascending: false });

      if (error) {
        Alert.alert('Ошибка', 'Не удалось получить результаты');
        return;
      }

      setTestOrders(results || []);

      const completed = results?.filter(o => o.auto_completed).length || 0;
      const cancelled = results?.filter(o => o.auto_cancelled).length || 0;

      Alert.alert(
        'Результаты',
        `Автозавершено: ${completed}\nАвтоотменено: ${cancelled}\n\nПодробности в списке ниже`
      );

    } catch (error) {
      console.error('Ошибка проверки результатов:', error);
      Alert.alert('Ошибка', 'Не удалось проверить результаты');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Очищает тестовые заказы
   */
  const cleanupTestOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .like('title', '🧪 ТЕСТ:%');

      if (error) {
        Alert.alert('Ошибка', 'Не удалось очистить тестовые заказы');
      } else {
        setTestOrders([]);
        Alert.alert('Успех', 'Тестовые заказы очищены');
      }

    } catch (error) {
      console.error('Ошибка очистки:', error);
      Alert.alert('Ошибка', 'Не удалось очистить тестовые заказы');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    testOrders,
    createTestOrders,
    runAutoUpdate,
    checkResults,
    cleanupTestOrders,
  };
};
