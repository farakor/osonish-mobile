/**
 * Утилиты для отладки заказов
 */

import { Alert } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';

/**
 * Показывает все заказы пользователя для отладки
 */
export async function debugUserOrders(): Promise<void> {
  try {
    console.log('🔍 [DEBUG] Получаем все заказы пользователя для отладки...');

    // Проверяем авторизацию
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      Alert.alert('Ошибка', 'Пользователь не авторизован');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    console.log('🔍 [DEBUG] Сегодняшняя дата:', today);
    console.log('🔍 [DEBUG] ID пользователя:', authState.user.id);

    // Получаем ВСЕ заказы пользователя
    const { data: allOrders, error: allError } = await supabase
      .from('orders')
      .select('id, title, status, service_date, created_at, customer_id')
      .eq('customer_id', authState.user.id)
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('🔍 [DEBUG] Ошибка получения всех заказов:', allError);
      Alert.alert('Ошибка', `Не удалось получить заказы: ${allError.message}`);
      return;
    }

    console.log(`🔍 [DEBUG] Всего заказов пользователя: ${allOrders?.length || 0}`);

    if (allOrders && allOrders.length > 0) {
      console.log('🔍 [DEBUG] Список всех заказов:');
      allOrders.forEach((order, index) => {
        console.log(`  ${index + 1}. ID: ${order.id}`);
        console.log(`     Название: "${order.title}"`);
        console.log(`     Статус: ${order.status}`);
        console.log(`     Дата службы: ${order.service_date}`);
        console.log(`     Создан: ${order.created_at}`);
        console.log('     ---');
      });
    }

    // Получаем заказы на сегодня
    const { data: todayOrders, error: todayError } = await supabase
      .from('orders')
      .select('id, title, status, service_date')
      .eq('customer_id', authState.user.id)
      .eq('service_date', today);

    if (todayError) {
      console.error('🔍 [DEBUG] Ошибка получения заказов на сегодня:', todayError);
    } else {
      console.log(`🔍 [DEBUG] Заказов на сегодня (${today}): ${todayOrders?.length || 0}`);

      if (todayOrders && todayOrders.length > 0) {
        console.log('🔍 [DEBUG] Заказы на сегодня:');
        todayOrders.forEach((order, index) => {
          console.log(`  ${index + 1}. "${order.title}" - статус: ${order.status}`);
        });
      }
    }

    // Показываем результат пользователю
    const totalCount = allOrders?.length || 0;
    const todayCount = todayOrders?.length || 0;

    Alert.alert(
      'Отладка заказов',
      `Всего заказов: ${totalCount}\n` +
      `Заказов на сегодня: ${todayCount}\n\n` +
      `Подробности в логах консоли`
    );

  } catch (error) {
    console.error('🔍 [DEBUG] Ошибка отладки заказов:', error);
    Alert.alert('Ошибка', `Ошибка отладки: ${error}`);
  }
}

/**
 * Показывает заказы по статусам для отладки
 */
export async function debugOrdersByStatus(): Promise<void> {
  try {
    console.log('🔍 [DEBUG] Анализируем заказы по статусам...');

    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      Alert.alert('Ошибка', 'Пользователь не авторизован');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Получаем заказы по каждому статусу
    const statuses = ['new', 'response_received', 'in_progress', 'completed', 'cancelled'];

    for (const status of statuses) {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, title, service_date')
        .eq('customer_id', authState.user.id)
        .eq('status', status)
        .eq('service_date', today);

      if (!error) {
        console.log(`🔍 [DEBUG] Статус "${status}" на сегодня: ${orders?.length || 0} заказов`);
        if (orders && orders.length > 0) {
          orders.forEach(order => {
            console.log(`  - ${order.id}: "${order.title}"`);
          });
        }
      }
    }

  } catch (error) {
    console.error('🔍 [DEBUG] Ошибка анализа по статусам:', error);
  }
}
