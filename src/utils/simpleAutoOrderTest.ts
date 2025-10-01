/**
 * Упрощенная утилита для тестирования автообновления заказов
 * Использует существующие сервисы приложения
 */

import { Alert } from 'react-native';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

/**
 * Создает тестовые заказы НАПРЯМУЮ в базе данных (минуя кэш orderService)
 */
export async function createTestOrdersSimple(): Promise<boolean> {
  try {
    console.log('🧪 [SIMPLE TEST] Начинаем создание тестовых заказов...');

    // Проверяем авторизацию
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      Alert.alert('Ошибка', 'Пользователь не авторизован. Войдите в приложение.');
      return false;
    }

    console.log('🧪 [SIMPLE TEST] Пользователь авторизован:', authState.user.id);

    const today = new Date().toISOString().split('T')[0];
    const user = authState.user;

    // Создаем тестовые заказы НАПРЯМУЮ через Supabase (не через orderService)
    const testOrdersData = [
      {
        title: '🧪 ТЕСТ: Новый заказ (будет отменен)',
        description: 'Тестовый заказ для проверки автоотмены в 20:00',
        category: 'Тестирование',
        location: 'Тестовая локация',
        budget: 100000,
        workers_needed: 1,
        service_date: serviceDateWithTime,
        status: 'new',
        customer_id: user.id,
        photos: [],
        transport_paid: false,
        meal_included: false,
        meal_paid: false,
        applicants_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        title: '🧪 ТЕСТ: Заказ с откликом (будет отменен)',
        description: 'Тестовый заказ для проверки автоотмены в 20:00',
        category: 'Тестирование',
        location: 'Тестовая локация',
        budget: 150000,
        workers_needed: 1,
        service_date: serviceDateWithTime,
        status: 'response_received',
        customer_id: user.id,
        photos: [],
        transport_paid: false,
        meal_included: false,
        meal_paid: false,
        applicants_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        title: '🧪 ТЕСТ: Заказ в работе (будет завершен)',
        description: 'Тестовый заказ для проверки автозавершения в 20:00',
        category: 'Тестирование',
        location: 'Тестовая локация',
        budget: 200000,
        workers_needed: 1,
        service_date: serviceDateWithTime,
        status: 'in_progress',
        customer_id: user.id,
        photos: [],
        transport_paid: false,
        meal_included: false,
        meal_paid: false,
        applicants_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let createdCount = 0;
    for (const orderData of testOrdersData) {
      try {
        console.log('🧪 [SIMPLE TEST] Создаем заказ НАПРЯМУЮ в БД:', orderData.title);

        // Создаем заказ напрямую через Supabase
        const { data, error } = await supabase
          .from('orders')
          .insert(orderData)
          .select('id, title, status, service_date')
          .single();

        if (error) {
          console.error('🧪 [SIMPLE TEST] Ошибка создания заказа в БД:', error);
          Alert.alert('Ошибка', `Не удалось создать заказ: ${orderData.title}\n\nОшибка: ${error.message}`);
        } else {
          console.log('🧪 [SIMPLE TEST] Заказ создан НАПРЯМУЮ в БД:', data.id, 'со статусом:', data.status);
          createdCount++;
        }
      } catch (error) {
        console.error('🧪 [SIMPLE TEST] Ошибка создания заказа:', error);
      }
    }

    if (createdCount > 0) {
      Alert.alert('Успех', `Создано ${createdCount} тестовых заказов`);
      return true;
    } else {
      Alert.alert('Ошибка', 'Не удалось создать ни одного заказа');
      return false;
    }

  } catch (error) {
    console.error('🧪 [SIMPLE TEST] Общая ошибка:', error);
    Alert.alert('Ошибка', `Не удалось создать тестовые заказы: ${error}`);
    return false;
  }
}

/**
 * Создает "реальные" заказы пользователя НАПРЯМУЮ в БД (без префикса ТЕСТ)
 * Для проверки обработки обычных заказов пользователя
 */
export async function createRealUserOrdersForTesting(): Promise<boolean> {
  try {
    console.log('🧪 [REAL TEST] Начинаем создание реальных заказов пользователя...');

    // Проверяем авторизацию
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      Alert.alert('Ошибка', 'Пользователь не авторизован. Войдите в приложение.');
      return false;
    }

    console.log('🧪 [REAL TEST] Пользователь авторизован:', authState.user.id);

    // Используем дату с временем как в реальных заказах пользователя
    const today = new Date();
    today.setHours(4, 0, 0, 0); // Устанавливаем время 04:00 как в реальных заказах
    const serviceDateWithTime = today.toISOString(); // Формат: 2025-09-30T04:00:00.000Z

    console.log(`🧪 [REAL TEST] Создаем заказы с датой: ${serviceDateWithTime}`);

    const user = authState.user;

    // Создаем "реальные" заказы пользователя НАПРЯМУЮ через Supabase
    const realOrdersData = [
      {
        title: 'Ремонт квартиры',
        description: 'Нужно отремонтировать ванную комнату',
        category: 'Ремонт',
        location: 'Ташкент, Мирзо-Улугбекский район',
        budget: 500000,
        workers_needed: 2,
        service_date: serviceDateWithTime,
        status: 'new',
        customer_id: user.id,
        photos: [],
        transport_paid: false,
        meal_included: false,
        meal_paid: false,
        applicants_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        title: 'Уборка дома',
        description: 'Генеральная уборка трехкомнатной квартиры',
        category: 'Уборка',
        location: 'Ташкент, Юнусабадский район',
        budget: 200000,
        workers_needed: 1,
        service_date: serviceDateWithTime,
        status: 'response_received',
        customer_id: user.id,
        photos: [],
        transport_paid: true,
        meal_included: false,
        meal_paid: false,
        applicants_count: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        title: 'Доставка мебели',
        description: 'Перевозка дивана и шкафа на новую квартиру',
        category: 'Доставка',
        location: 'Ташкент, Сергелийский район',
        budget: 150000,
        workers_needed: 2,
        service_date: serviceDateWithTime,
        status: 'in_progress',
        customer_id: user.id,
        photos: [],
        transport_paid: false,
        meal_included: true,
        meal_paid: false,
        applicants_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let createdCount = 0;
    for (const orderData of realOrdersData) {
      try {
        console.log('🧪 [REAL TEST] Создаем реальный заказ НАПРЯМУЮ в БД:', orderData.title);

        // Создаем заказ напрямую через Supabase
        const { data, error } = await supabase
          .from('orders')
          .insert(orderData)
          .select('id, title, status, service_date')
          .single();

        if (error) {
          console.error('🧪 [REAL TEST] Ошибка создания реального заказа в БД:', error);
          Alert.alert('Ошибка', `Не удалось создать заказ: ${orderData.title}\n\nОшибка: ${error.message}`);
        } else {
          console.log('🧪 [REAL TEST] Реальный заказ создан НАПРЯМУЮ в БД:', data.id, 'со статусом:', data.status);
          createdCount++;
        }
      } catch (error) {
        console.error('🧪 [REAL TEST] Ошибка создания реального заказа:', error);
      }
    }

    if (createdCount > 0) {
      Alert.alert('Успех', `Создано ${createdCount} реальных заказов пользователя`);
      return true;
    } else {
      Alert.alert('Ошибка', 'Не удалось создать ни одного реального заказа');
      return false;
    }

  } catch (error) {
    console.error('🧪 [REAL TEST] Общая ошибка:', error);
    Alert.alert('Ошибка', `Не удалось создать реальные заказы: ${error}`);
    return false;
  }
}

/**
 * Запускает тестовое автообновление БЕЗ проверки времени
 * @param allOrders - если true, обрабатывает ВСЕ заказы, если false - только тестовые
 */
export async function runTestAutoUpdate(allOrders: boolean = false): Promise<boolean> {
  try {
    if (allOrders) {
      console.log('🧪 [SIMPLE TEST] Запускаем автообновление ВСЕХ заказов БЕЗ проверки времени...');
      // Используем функцию для ВСЕХ заказов
      await orderService.autoCompleteOrdersForTesting();
      Alert.alert('Успех', 'Автообновление ВСЕХ заказов выполнено! Проверьте логи в консоли.');
    } else {
      console.log('🧪 [SIMPLE TEST] Запускаем автообновление ТОЛЬКО тестовых заказов БЕЗ проверки времени...');
      // Используем функцию только для тестовых заказов
      await orderService.autoCompleteTestOrdersOnly();
      Alert.alert('Успех', 'Автообновление тестовых заказов выполнено! Проверьте логи в консоли.');
    }

    return true;

  } catch (error) {
    console.error('🧪 [SIMPLE TEST] Ошибка автообновления:', error);
    Alert.alert('Ошибка', `Не удалось выполнить автообновление: ${error}`);
    return false;
  }
}

/**
 * Очищает тестовые заказы
 */
export async function cleanupTestOrdersSimple(): Promise<boolean> {
  try {
    console.log('🧪 [SIMPLE TEST] Очищаем тестовые заказы...');

    // Получаем заказы пользователя
    const orders = await orderService.getUserNewOrders();
    const testOrders = orders.filter(order => order.title.includes('🧪 ТЕСТ:'));

    console.log('🧪 [SIMPLE TEST] Найдено тестовых заказов для удаления:', testOrders.length);

    let deletedCount = 0;
    for (const order of testOrders) {
      try {
        const success = await orderService.deleteOrder(order.id);
        if (success) {
          deletedCount++;
          console.log('🧪 [SIMPLE TEST] Заказ удален:', order.id);
        }
      } catch (error) {
        console.error('🧪 [SIMPLE TEST] Ошибка удаления заказа:', order.id, error);
      }
    }

    Alert.alert('Успех', `Удалено ${deletedCount} тестовых заказов`);
    return true;

  } catch (error) {
    console.error('🧪 [SIMPLE TEST] Ошибка очистки:', error);
    Alert.alert('Ошибка', `Не удалось очистить тестовые заказы: ${error}`);
    return false;
  }
}

/**
 * Проверяет результаты автообновления
 */
export async function checkTestResults(): Promise<void> {
  try {
    console.log('🧪 [SIMPLE TEST] Проверяем результаты...');

    // Получаем все заказы пользователя
    const allOrders = await orderService.getCustomerOrders();
    const testOrders = allOrders.filter(order => order.title.includes('🧪 ТЕСТ:'));

    console.log('🧪 [SIMPLE TEST] Найдено тестовых заказов:', testOrders.length);

    let completedCount = 0;
    let cancelledCount = 0;

    testOrders.forEach(order => {
      console.log(`🧪 [SIMPLE TEST] Заказ ${order.id}: ${order.status}`);
      if (order.status === 'completed') completedCount++;
      if (order.status === 'cancelled') cancelledCount++;
    });

    Alert.alert(
      'Результаты тестирования',
      `Всего тестовых заказов: ${testOrders.length}\n` +
      `Завершено: ${completedCount}\n` +
      `Отменено: ${cancelledCount}\n\n` +
      `Подробности в логах консоли`
    );

  } catch (error) {
    console.error('🧪 [SIMPLE TEST] Ошибка проверки результатов:', error);
    Alert.alert('Ошибка', `Не удалось проверить результаты: ${error}`);
  }
}
