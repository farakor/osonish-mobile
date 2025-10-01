/**
 * Утилита для тестирования автоматического обновления статусов заказов
 * Этот файл используется только для разработки и тестирования
 */

import { orderService } from '../services/orderService';
import { supabase } from '../services/supabaseClient';

/**
 * Создает тестовые заказы для проверки автоматического обновления статусов
 */
export async function createTestOrdersForAutoUpdate(): Promise<void> {
  try {
    console.log('🧪 Создание тестовых заказов для проверки автоматического обновления...');

    // Получаем сегодняшнюю дату
    const today = new Date().toISOString().split('T')[0];

    // Создаем тестовые заказы с разными статусами
    const testOrders = [
      {
        title: 'Тестовый заказ - Новый (для автоотмены)',
        description: 'Этот заказ должен быть автоматически отменен в 20:00',
        category: 'Тестирование',
        location: 'Тестовая локация',
        budget: 100000,
        workers_needed: 1,
        service_date: today,
        status: 'new',
        customer_id: 'test-customer-id' // Замените на реальный ID пользователя
      },
      {
        title: 'Тестовый заказ - Отклик получен (для автоотмены)',
        description: 'Этот заказ должен быть автоматически отменен в 20:00',
        category: 'Тестирование',
        location: 'Тестовая локация',
        budget: 150000,
        workers_needed: 1,
        service_date: today,
        status: 'response_received',
        customer_id: 'test-customer-id' // Замените на реальный ID пользователя
      },
      {
        title: 'Тестовый заказ - В работе (для автозавершения)',
        description: 'Этот заказ должен быть автоматически завершен в 20:00',
        category: 'Тестирование',
        location: 'Тестовая локация',
        budget: 200000,
        workers_needed: 1,
        service_date: today,
        status: 'in_progress',
        customer_id: 'test-customer-id' // Замените на реальный ID пользователя
      }
    ];

    for (const order of testOrders) {
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();

      if (error) {
        console.error('❌ Ошибка создания тестового заказа:', error);
      } else {
        console.log(`✅ Создан тестовый заказ: ${data.id} - ${data.title}`);
      }
    }

    console.log('🧪 Тестовые заказы созданы успешно!');
  } catch (error) {
    console.error('❌ Ошибка создания тестовых заказов:', error);
  }
}

/**
 * Принудительно запускает автоматическое обновление статусов заказов
 * (игнорирует проверку времени)
 */
export async function forceAutoOrderUpdate(): Promise<void> {
  try {
    console.log('🔄 Принудительный запуск автоматического обновления статусов...');

    // Временно изменяем функцию, чтобы игнорировать проверку времени
    const originalAutoComplete = orderService.autoCompleteOrders;

    // Создаем модифицированную версию функции без проверки времени
    const testAutoComplete = async function (this: typeof orderService): Promise<void> {
      try {
        console.log('[TEST] 🔄 ТЕСТОВЫЙ режим: Проверка заказов для автоматического обновления статусов...');

        // Получаем сегодняшнюю дату
        const today = new Date().toISOString().split('T')[0];
        console.log(`[TEST] 📅 Ищем заказы на дату: ${today}`);

        // 1. Ищем заказы со статусом 'in_progress' на сегодняшнюю дату для автозавершения
        const { data: ordersToComplete, error: completeError } = await supabase
          .from('orders')
          .select('id, customer_id, title')
          .eq('status', 'in_progress')
          .eq('service_date', today);

        if (completeError) {
          console.error('[TEST] ❌ Ошибка получения заказов для автозавершения:', completeError);
        } else {
          if (ordersToComplete && ordersToComplete.length > 0) {
            console.log(`[TEST] 📋 Найдено ${ordersToComplete.length} заказов "В работе" для автозавершения`);

            for (const order of ordersToComplete) {
              console.log(`[TEST] 🔄 Автозавершение заказа: ${order.id}`);

              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  status: 'completed',
                  auto_completed: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

              if (updateError) {
                console.error(`[TEST] ❌ Ошибка обновления заказа ${order.id}:`, updateError);
              } else {
                console.log(`[TEST] ✅ Заказ ${order.id} автоматически завершен`);
              }
            }
          } else {
            console.log('[TEST] ✅ Нет заказов "В работе" для автозавершения');
          }
        }

        // 2. Ищем заказы со статусом 'new' и 'response_received' на сегодняшнюю дату для автоотмены
        const { data: ordersToCancel, error: cancelError } = await supabase
          .from('orders')
          .select('id, customer_id, title, status')
          .in('status', ['new', 'response_received'])
          .eq('service_date', today);

        if (cancelError) {
          console.error('[TEST] ❌ Ошибка получения заказов для автоотмены:', cancelError);
        } else {
          if (ordersToCancel && ordersToCancel.length > 0) {
            console.log(`[TEST] 📋 Найдено ${ordersToCancel.length} заказов "Новый"/"Отклик получен" для автоотмены`);

            for (const order of ordersToCancel) {
              console.log(`[TEST] 🔄 Автоотмена заказа: ${order.id} (статус: ${order.status})`);

              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  status: 'cancelled',
                  auto_cancelled: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

              if (updateError) {
                console.error(`[TEST] ❌ Ошибка обновления заказа ${order.id}:`, updateError);
              } else {
                console.log(`[TEST] ✅ Заказ ${order.id} автоматически отменен`);
              }
            }
          } else {
            console.log('[TEST] ✅ Нет заказов "Новый"/"Отклик получен" для автоотмены');
          }
        }

        console.log('[TEST] ✅ ТЕСТОВОЕ автоматическое обновление статусов заказов завершено');

      } catch (error) {
        console.error('[TEST] ❌ Ошибка тестового автоматического обновления статусов заказов:', error);
      }
    };

    // Запускаем тестовую версию
    await testAutoComplete.call(orderService);

    console.log('✅ Принудительное обновление статусов завершено!');
  } catch (error) {
    console.error('❌ Ошибка принудительного обновления статусов:', error);
  }
}

/**
 * Очищает тестовые заказы
 */
export async function cleanupTestOrders(): Promise<void> {
  try {
    console.log('🧹 Очистка тестовых заказов...');

    const { error } = await supabase
      .from('orders')
      .delete()
      .like('title', 'Тестовый заказ%');

    if (error) {
      console.error('❌ Ошибка очистки тестовых заказов:', error);
    } else {
      console.log('✅ Тестовые заказы очищены успешно!');
    }
  } catch (error) {
    console.error('❌ Ошибка очистки тестовых заказов:', error);
  }
}

/**
 * Проверяет результаты автоматического обновления статусов
 */
export async function checkAutoUpdateResults(): Promise<void> {
  try {
    console.log('🔍 Проверка результатов автоматического обновления...');

    const today = new Date().toISOString().split('T')[0];

    // Проверяем автоматически завершенные заказы
    const { data: completedOrders, error: completedError } = await supabase
      .from('orders')
      .select('id, title, status, auto_completed')
      .eq('service_date', today)
      .eq('auto_completed', true);

    if (completedError) {
      console.error('❌ Ошибка получения автозавершенных заказов:', completedError);
    } else {
      console.log(`✅ Найдено ${completedOrders?.length || 0} автоматически завершенных заказов:`);
      completedOrders?.forEach(order => {
        console.log(`  - ${order.id}: ${order.title} (${order.status})`);
      });
    }

    // Проверяем автоматически отмененные заказы
    const { data: cancelledOrders, error: cancelledError } = await supabase
      .from('orders')
      .select('id, title, status, auto_cancelled')
      .eq('service_date', today)
      .eq('auto_cancelled', true);

    if (cancelledError) {
      console.error('❌ Ошибка получения автоотмененных заказов:', cancelledError);
    } else {
      console.log(`✅ Найдено ${cancelledOrders?.length || 0} автоматически отмененных заказов:`);
      cancelledOrders?.forEach(order => {
        console.log(`  - ${order.id}: ${order.title} (${order.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка проверки результатов:', error);
  }
}
