/**
 * Тестовый скрипт для проверки управления конфликтами откликов
 * Использование: импортировать и вызвать в DevScreen или через консоль
 */

import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { Alert } from 'react-native';

interface TestUser {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'worker';
}

export class ConflictManagementTester {
  private customerA: TestUser | null = null;
  private customerB: TestUser | null = null;
  private workerIvan: TestUser | null = null;
  private orderA: string | null = null;
  private orderB: string | null = null;
  private testDate: string;

  constructor() {
    // Устанавливаем тестовую дату на завтра в формате ISO с временем
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // Устанавливаем время 10:00
    this.testDate = tomorrow.toISOString();
  }

  /**
   * Запуск полного теста
   */
  async runFullTest(): Promise<void> {
    try {
      console.log('🧪 [TEST] Начинаем тестирование управления конфликтами откликов');

      // Шаг 1: Создаем тестовых пользователей
      await this.createTestUsers();

      // Шаг 2: Создаем заказы
      await this.createTestOrders();

      // Шаг 3: Исполнитель откликается на оба заказа
      await this.workerApplyToBothOrders();

      // Шаг 4: Заказчик Б выбирает исполнителя
      await this.customerBSelectsWorker();

      // Шаг 5: Проверяем результаты
      await this.verifyResults();

      console.log('✅ [TEST] Тест успешно завершен!');
      Alert.alert('Тест завершен', 'Управление конфликтами работает корректно!');
    } catch (error) {
      console.error('❌ [TEST] Ошибка тестирования:', error);
      Alert.alert('Ошибка теста', String(error));
    } finally {
      // Очистка тестовых данных
      await this.cleanupTestData();
    }
  }

  /**
   * Создание тестовых пользователей
   */
  private async createTestUsers(): Promise<void> {
    console.log('📝 [TEST] Создаем тестовых пользователей...');

    // Здесь используем существующих пользователей или создаем новых
    // Для демонстрации используем фиктивные ID
    this.customerA = {
      id: 'test-customer-a-' + Date.now(),
      phone: '+998901234567',
      firstName: 'Заказчик',
      lastName: 'А',
      role: 'customer'
    };

    this.customerB = {
      id: 'test-customer-b-' + Date.now(),
      phone: '+998901234568',
      firstName: 'Заказчик',
      lastName: 'Б',
      role: 'customer'
    };

    this.workerIvan = {
      id: 'test-worker-ivan-' + Date.now(),
      phone: '+998901234569',
      firstName: 'Иван',
      lastName: 'Исполнитель',
      role: 'worker'
    };

    console.log('✅ [TEST] Пользователи созданы');
  }

  /**
   * Создание тестовых заказов
   */
  private async createTestOrders(): Promise<void> {
    console.log('📝 [TEST] Создаем тестовые заказы...');

    if (!this.customerA || !this.customerB) {
      throw new Error('Пользователи не созданы');
    }

    // Создаем заказ от заказчика А
    const { data: orderAData, error: orderAError } = await supabase
      .from('orders')
      .insert({
        title: 'Тестовый заказ А - Уборка квартиры',
        description: 'Требуется уборка двухкомнатной квартиры',
        category: 'Уборка',
        location: 'Ташкент, Чиланзар',
        budget: 200000,
        workers_needed: 1,
        service_date: this.testDate,
        customer_id: this.customerA.id,
        status: 'new',
        applicants_count: 0
      })
      .select()
      .single();

    if (orderAError) throw orderAError;
    this.orderA = orderAData.id;
    console.log('✅ [TEST] Заказ А создан:', this.orderA);

    // Создаем заказ от заказчика Б с другим временем, но той же датой
    const orderBDate = new Date(this.testDate);
    orderBDate.setHours(14, 30, 0, 0); // Устанавливаем время 14:30

    const { data: orderBData, error: orderBError } = await supabase
      .from('orders')
      .insert({
        title: 'Тестовый заказ Б - Ремонт сантехники',
        description: 'Требуется заменить смеситель в ванной',
        category: 'Ремонт техники',
        location: 'Ташкент, Юнусабад',
        budget: 150000,
        workers_needed: 1,
        service_date: orderBDate.toISOString(),
        customer_id: this.customerB.id,
        status: 'new',
        applicants_count: 0
      })
      .select()
      .single();

    if (orderBError) throw orderBError;
    this.orderB = orderBData.id;
    console.log('✅ [TEST] Заказ Б создан:', this.orderB);
  }

  /**
   * Исполнитель откликается на оба заказа
   */
  private async workerApplyToBothOrders(): Promise<void> {
    console.log('📝 [TEST] Исполнитель откликается на оба заказа...');

    if (!this.workerIvan || !this.orderA || !this.orderB) {
      throw new Error('Недостаточно данных для откликов');
    }

    // Отклик на заказ А
    const applicantA = await orderService.createApplicant({
      orderId: this.orderA,
      workerId: this.workerIvan.id,
      message: 'Готов выполнить уборку качественно',
      proposedPrice: 200000
    });

    if (!applicantA) throw new Error('Не удалось создать отклик на заказ А');
    console.log('✅ [TEST] Отклик на заказ А создан');

    // Отклик на заказ Б
    const applicantB = await orderService.createApplicant({
      orderId: this.orderB,
      workerId: this.workerIvan.id,
      message: 'Опытный сантехник, выполню быстро',
      proposedPrice: 150000
    });

    if (!applicantB) throw new Error('Не удалось создать отклик на заказ Б');
    console.log('✅ [TEST] Отклик на заказ Б создан');

    // Проверяем статусы заказов
    await this.checkOrderStatuses('После откликов');
  }

  /**
   * Заказчик Б выбирает исполнителя
   */
  private async customerBSelectsWorker(): Promise<void> {
    console.log('📝 [TEST] Заказчик Б выбирает исполнителя Ивана...');

    if (!this.workerIvan || !this.orderB) {
      throw new Error('Недостаточно данных для выбора исполнителя');
    }

    // Получаем отклик Ивана на заказ Б
    const { data: applicantData, error } = await supabase
      .from('applicants')
      .select('id')
      .eq('order_id', this.orderB)
      .eq('worker_id', this.workerIvan.id)
      .single();

    if (error || !applicantData) {
      throw new Error('Не найден отклик на заказ Б');
    }

    // Принимаем отклик
    const success = await orderService.updateApplicantStatus(applicantData.id, 'accepted');

    if (!success) {
      throw new Error('Не удалось принять отклик');
    }

    console.log('✅ [TEST] Исполнитель Иван выбран для заказа Б');

    // Даем время на обработку автоматических изменений
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Проверка результатов
   */
  private async verifyResults(): Promise<void> {
    console.log('🔍 [TEST] Проверяем результаты...');

    if (!this.workerIvan || !this.orderA || !this.orderB) {
      throw new Error('Недостаточно данных для проверки');
    }

    // Проверяем статус отклика на заказ А (должен быть rejected)
    const { data: applicantA, error: errorA } = await supabase
      .from('applicants')
      .select('status')
      .eq('order_id', this.orderA)
      .eq('worker_id', this.workerIvan.id)
      .single();

    if (errorA || !applicantA) {
      throw new Error('Не найден отклик на заказ А');
    }

    if (applicantA.status !== 'rejected') {
      throw new Error(`Отклик на заказ А должен быть rejected, но статус: ${applicantA.status}`);
    }
    console.log('✅ [TEST] Отклик на заказ А автоматически отклонен');

    // Проверяем статус отклика на заказ Б (должен быть accepted)
    const { data: applicantB, error: errorB } = await supabase
      .from('applicants')
      .select('status')
      .eq('order_id', this.orderB)
      .eq('worker_id', this.workerIvan.id)
      .single();

    if (errorB || !applicantB) {
      throw new Error('Не найден отклик на заказ Б');
    }

    if (applicantB.status !== 'accepted') {
      throw new Error(`Отклик на заказ Б должен быть accepted, но статус: ${applicantB.status}`);
    }
    console.log('✅ [TEST] Отклик на заказ Б принят');

    // Проверяем статусы заказов
    await this.checkOrderStatuses('После выбора исполнителя');

    // Проверяем статус заказа А (должен быть new если нет других откликов)
    const { data: orderA, error: orderAError } = await supabase
      .from('orders')
      .select('status, applicants_count')
      .eq('id', this.orderA)
      .single();

    if (orderAError || !orderA) {
      throw new Error('Не найден заказ А');
    }

    if (orderA.applicants_count === 0 && orderA.status !== 'new') {
      throw new Error(`Заказ А должен иметь статус new, но статус: ${orderA.status}`);
    }
    console.log('✅ [TEST] Статус заказа А корректный:', orderA.status);

    // Проверяем статус заказа Б (должен быть in_progress)
    const { data: orderB, error: orderBError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', this.orderB)
      .single();

    if (orderBError || !orderB) {
      throw new Error('Не найден заказ Б');
    }

    if (orderB.status !== 'in_progress') {
      throw new Error(`Заказ Б должен иметь статус in_progress, но статус: ${orderB.status}`);
    }
    console.log('✅ [TEST] Статус заказа Б корректный:', orderB.status);
  }

  /**
   * Проверка статусов заказов
   */
  private async checkOrderStatuses(stage: string): Promise<void> {
    if (!this.orderA || !this.orderB) return;

    const { data: orders } = await supabase
      .from('orders')
      .select('id, status, applicants_count')
      .in('id', [this.orderA, this.orderB]);

    console.log(`📊 [TEST] Статусы заказов (${stage}):`);
    orders?.forEach(order => {
      const orderName = order.id === this.orderA ? 'А' : 'Б';
      console.log(`   Заказ ${orderName}: статус=${order.status}, откликов=${order.applicants_count}`);
    });
  }

  /**
   * Очистка тестовых данных
   */
  private async cleanupTestData(): Promise<void> {
    console.log('🧹 [TEST] Очищаем тестовые данные...');

    try {
      // Удаляем тестовые заказы (это также удалит связанные отклики через CASCADE)
      if (this.orderA) {
        await supabase.from('orders').delete().eq('id', this.orderA);
      }
      if (this.orderB) {
        await supabase.from('orders').delete().eq('id', this.orderB);
      }

      console.log('✅ [TEST] Тестовые данные очищены');
    } catch (error) {
      console.error('⚠️ [TEST] Ошибка очистки тестовых данных:', error);
    }
  }

  /**
   * Быстрый тест с текущим пользователем
   */
  async runQuickTest(): Promise<void> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      Alert.alert('Ошибка', 'Необходимо войти в систему');
      return;
    }

    console.log('🚀 [TEST] Запуск быстрого теста с текущим пользователем');

    // Используем текущего пользователя как одного из заказчиков
    this.customerA = {
      id: authState.user.id,
      phone: authState.user.phone,
      firstName: authState.user.firstName,
      lastName: authState.user.lastName,
      role: authState.user.role
    };

    // Продолжаем с остальными шагами
    await this.runFullTest();
  }
}

// Экспортируем функцию для простого вызова
export const testConflictManagement = async (): Promise<void> => {
  const tester = new ConflictManagementTester();
  await tester.runQuickTest();
};

// Экспортируем полный тест
export const runFullConflictTest = async (): Promise<void> => {
  const tester = new ConflictManagementTester();
  await tester.runFullTest();
};

// Простая функция для быстрого тестирования логики дат
export const testDateComparison = async (): Promise<void> => {
  console.log('🧪 [TEST] Тестируем сравнение дат...');

  const date1 = '2024-01-15T10:00:00.000Z';
  const date2 = '2024-01-15T14:30:00.000Z';
  const date3 = '2024-01-16T10:00:00.000Z';

  const extractDate = (dateString: string) => dateString.split('T')[0];

  console.log(`Дата 1: ${date1} -> ${extractDate(date1)}`);
  console.log(`Дата 2: ${date2} -> ${extractDate(date2)}`);
  console.log(`Дата 3: ${date3} -> ${extractDate(date3)}`);

  console.log(`Дата 1 === Дата 2: ${extractDate(date1) === extractDate(date2)}`);
  console.log(`Дата 1 === Дата 3: ${extractDate(date1) === extractDate(date3)}`);

  Alert.alert('Тест дат', 'Проверьте консоль для результатов');
};
