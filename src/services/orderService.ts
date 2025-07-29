import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, CreateOrderRequest, CreateOrderResponse, OrdersState } from '../types';
import { authService } from './authService';
import { supabase, Database } from './supabaseClient';

// Используем общий ключ для всех заказов в системе (для fallback)
const GLOBAL_ORDERS_STORAGE_KEY = '@osonish_global:orders';

export class OrderService {
  private static instance: OrderService;
  private isSupabaseEnabled: boolean = false;

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  constructor() {
    this.checkSupabaseConnection();
  }

  /**
   * Проверка подключения к Supabase
   */
  private async checkSupabaseConnection(): Promise<void> {
    try {
      if (!supabase) {
        this.isSupabaseEnabled = false;
        console.log('[OrderService] ⚠️ Supabase клиент не инициализирован, используем локальное хранилище');
        return;
      }

      const { data, error } = await supabase.from('orders').select('count').limit(1);
      this.isSupabaseEnabled = !error;
      if (this.isSupabaseEnabled) {
        console.log('[OrderService] ✅ Supabase подключен успешно');
      } else {
        console.log('[OrderService] ⚠️ Supabase недоступен:', error?.message);
        console.log('[OrderService] Используем локальное хранилище');
      }
    } catch (error) {
      this.isSupabaseEnabled = false;
      console.log('[OrderService] ⚠️ Ошибка подключения к Supabase:', error);
      console.log('[OrderService] Используем локальное хранилище');
    }
  }

  /**
   * Создание нового заказа
   */
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      // Получаем текущего пользователя
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return {
          success: false,
          error: 'Пользователь не авторизован',
        };
      }

      if (this.isSupabaseEnabled) {
        return await this.createOrderSupabase(orderData, authState.user.id);
      } else {
        return await this.createOrderLocal(orderData, authState.user.id);
      }
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      return {
        success: false,
        error: 'Не удалось создать заказ',
      };
    }
  }

  /**
   * Создание заказа через Supabase
   */
  private async createOrderSupabase(orderData: CreateOrderRequest, userId: string): Promise<CreateOrderResponse> {
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase клиент не инициализирован',
      };
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        title: orderData.title,
        description: orderData.description,
        category: orderData.category,
        location: orderData.location,
        budget: orderData.budget,
        workers_needed: orderData.workersNeeded,
        service_date: orderData.serviceDate,
        photos: orderData.photos || [],
        customer_id: userId,
        status: 'active',
        applicants_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Ошибка создания заказа в Supabase:', error);
      return {
        success: false,
        error: 'Не удалось создать заказ в базе данных',
      };
    }

    const newOrder: Order = {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      budget: data.budget,
      workersNeeded: data.workers_needed,
      serviceDate: data.service_date,
      photos: data.photos,
      customerId: data.customer_id,
      status: data.status as 'active' | 'in_progress' | 'completed' | 'cancelled',
      applicantsCount: data.applicants_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log(`[OrderService] Создан заказ ${newOrder.id} в Supabase`);

    return {
      success: true,
      data: newOrder,
    };
  }

  /**
   * Создание заказа локально (fallback)
   */
  private async createOrderLocal(orderData: CreateOrderRequest, userId: string): Promise<CreateOrderResponse> {
    // Генерируем новый заказ
    const newOrder: Order = {
      id: this.generateOrderId(),
      ...orderData,
      customerId: userId,
      status: 'active',
      applicantsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Получаем все существующие заказы (глобальные)
    const existingOrders = await this.getAllOrders();

    // Добавляем новый заказ
    const updatedOrders = [newOrder, ...existingOrders];

    // Сохраняем в глобальное хранилище
    await this.saveGlobalOrders(updatedOrders);

    console.log(`[OrderService] Создан заказ ${newOrder.id} локально`);

    return {
      success: true,
      data: newOrder,
    };
  }

  /**
   * Получение всех активных заказов (для исполнителей)
   */
  async getAvailableOrders(): Promise<Order[]> {
    try {
      if (this.isSupabaseEnabled) {
        return await this.getAvailableOrdersSupabase();
      } else {
        return await this.getAvailableOrdersLocal();
      }
    } catch (error) {
      console.error('Ошибка получения доступных заказов:', error);
      return [];
    }
  }

  /**
   * Получение активных заказов из Supabase
   */
  private async getAvailableOrdersSupabase(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка загрузки заказов из Supabase:', error);
      return [];
    }

    const orders: Order[] = data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      location: item.location,
      budget: item.budget,
      workersNeeded: item.workers_needed,
      serviceDate: item.service_date,
      photos: item.photos || [],
      customerId: item.customer_id,
      status: item.status as 'active' | 'in_progress' | 'completed' | 'cancelled',
      applicantsCount: item.applicants_count,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    console.log(`[OrderService] Загружено ${orders.length} активных заказов из Supabase`);
    return orders;
  }

  /**
   * Получение активных заказов локально
   */
  private async getAvailableOrdersLocal(): Promise<Order[]> {
    const allOrders = await this.getAllOrders();
    console.log(`[OrderService] Всего заказов в хранилище: ${allOrders.length}`);

    if (allOrders.length > 0) {
      console.log('[OrderService] Первый заказ:', allOrders[0]);
      console.log('[OrderService] Статусы заказов:', allOrders.map(o => `${o.id}: ${o.status}`));
    }

    // Возвращаем только активные заказы
    const activeOrders = allOrders.filter(order => order.status === 'active');
    console.log(`[OrderService] Активных заказов: ${activeOrders.length}`);

    return activeOrders;
  }

  /**
   * Получение заказов конкретного пользователя (для заказчиков)
   */
  async getUserOrders(userId?: string): Promise<Order[]> {
    try {
      // Если userId не указан, берем текущего пользователя
      if (!userId) {
        const authState = authService.getAuthState();
        if (!authState.isAuthenticated || !authState.user) {
          return [];
        }
        userId = authState.user.id;
      }

      if (this.isSupabaseEnabled) {
        return await this.getUserOrdersSupabase(userId);
      } else {
        return await this.getUserOrdersLocal(userId);
      }
    } catch (error) {
      console.error('Ошибка получения заказов пользователя:', error);
      return [];
    }
  }

  /**
   * Получение заказов пользователя из Supabase
   */
  private async getUserOrdersSupabase(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка загрузки заказов пользователя из Supabase:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      location: item.location,
      budget: item.budget,
      workersNeeded: item.workers_needed,
      serviceDate: item.service_date,
      photos: item.photos || [],
      customerId: item.customer_id,
      status: item.status as 'active' | 'in_progress' | 'completed' | 'cancelled',
      applicantsCount: item.applicants_count,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  /**
   * Получение заказов пользователя локально
   */
  private async getUserOrdersLocal(userId: string): Promise<Order[]> {
    const allOrders = await this.getAllOrders();
    return allOrders.filter(order => order.customerId === userId);
  }

  /**
   * Получение активных заказов пользователя
   */
  async getUserActiveOrders(userId?: string): Promise<Order[]> {
    try {
      const userOrders = await this.getUserOrders(userId);
      return userOrders.filter(order => order.status === 'active');
    } catch (error) {
      console.error('Ошибка получения активных заказов:', error);
      return [];
    }
  }

  /**
   * Получение заказа по ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      if (this.isSupabaseEnabled) {
        return await this.getOrderByIdSupabase(orderId);
      } else {
        return await this.getOrderByIdLocal(orderId);
      }
    } catch (error) {
      console.error('Ошибка получения заказа:', error);
      return null;
    }
  }

  /**
   * Получение заказа из Supabase по ID
   */
  private async getOrderByIdSupabase(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Ошибка загрузки заказа из Supabase:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      budget: data.budget,
      workersNeeded: data.workers_needed,
      serviceDate: data.service_date,
      photos: data.photos || [],
      customerId: data.customer_id,
      status: data.status as 'active' | 'in_progress' | 'completed' | 'cancelled',
      applicantsCount: data.applicants_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Получение заказа из локального хранилища по ID
   */
  private async getOrderByIdLocal(orderId: string): Promise<Order | null> {
    const allOrders = await this.getAllOrders();
    return allOrders.find(order => order.id === orderId) || null;
  }

  /**
   * Обновление статуса заказа
   */
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
    try {
      if (this.isSupabaseEnabled) {
        return await this.updateOrderStatusSupabase(orderId, status);
      } else {
        return await this.updateOrderStatusLocal(orderId, status);
      }
    } catch (error) {
      console.error('Ошибка обновления заказа:', error);
      return false;
    }
  }

  /**
   * Обновление статуса в Supabase
   */
  private async updateOrderStatusSupabase(orderId: string, status: Order['status']): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      console.error('Ошибка обновления статуса в Supabase:', error);
      return false;
    }
    return true;
  }

  /**
   * Обновление статуса локально
   */
  private async updateOrderStatusLocal(orderId: string, status: Order['status']): Promise<boolean> {
    const allOrders = await this.getAllOrders();
    const orderIndex = allOrders.findIndex(order => order.id === orderId);

    if (orderIndex === -1) {
      return false;
    }

    allOrders[orderIndex].status = status;
    allOrders[orderIndex].updatedAt = new Date().toISOString();

    await this.saveGlobalOrders(allOrders);
    return true;
  }

  /**
   * Увеличение счетчика откликов на заказ
   */
  async incrementOrderApplicants(orderId: string): Promise<boolean> {
    try {
      if (this.isSupabaseEnabled) {
        return await this.incrementOrderApplicantsSupabase(orderId);
      } else {
        return await this.incrementOrderApplicantsLocal(orderId);
      }
    } catch (error) {
      console.error('Ошибка обновления счетчика откликов:', error);
      return false;
    }
  }

  /**
   * Увеличение счетчика откликов в Supabase
   */
  private async incrementOrderApplicantsSupabase(orderId: string): Promise<boolean> {
    if (!supabase) {
      return false;
    }

    const { error } = await supabase.rpc('increment_applicants_count', {
      order_id: orderId
    });

    if (error) {
      console.error('Ошибка увеличения счетчика в Supabase:', error);

      // Fallback: обычное обновление через отдельный запрос
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('applicants_count')
        .eq('id', orderId)
        .single();

      if (currentOrder) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            applicants_count: currentOrder.applicants_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        return !updateError;
      }

      return false;
    }

    return true;
  }

  /**
   * Увеличение счетчика откликов локально
   */
  private async incrementOrderApplicantsLocal(orderId: string): Promise<boolean> {
    const allOrders = await this.getAllOrders();
    const orderIndex = allOrders.findIndex(order => order.id === orderId);

    if (orderIndex === -1) {
      return false;
    }

    allOrders[orderIndex].applicantsCount += 1;
    allOrders[orderIndex].updatedAt = new Date().toISOString();

    await this.saveGlobalOrders(allOrders);
    return true;
  }

  /**
   * Удаление заказа (только для автора заказа)
   */
  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return false;
      }

      if (this.isSupabaseEnabled) {
        return await this.deleteOrderSupabase(orderId, authState.user.id);
      } else {
        return await this.deleteOrderLocal(orderId, authState.user.id);
      }
    } catch (error) {
      console.error('Ошибка удаления заказа:', error);
      return false;
    }
  }

  /**
   * Удаление заказа из Supabase
   */
  private async deleteOrderSupabase(orderId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
      .eq('customer_id', userId);

    if (error) {
      console.error('Ошибка удаления заказа из Supabase:', error);
      return false;
    }
    return true;
  }

  /**
   * Удаление заказа из локального хранилища
   */
  private async deleteOrderLocal(orderId: string, userId: string): Promise<boolean> {
    const allOrders = await this.getAllOrders();
    const order = allOrders.find(o => o.id === orderId);

    // Проверяем, что пользователь является автором заказа
    if (!order || order.customerId !== userId) {
      return false;
    }

    const filteredOrders = allOrders.filter(order => order.id !== orderId);
    await this.saveGlobalOrders(filteredOrders);
    return true;
  }

  /**
   * Получение статистики по заказам
   */
  async getOrdersStats() {
    try {
      const allOrders = await this.getAllOrders();
      const authState = authService.getAuthState();

      if (!authState.isAuthenticated || !authState.user) {
        return {
          total: 0,
          active: 0,
          completed: 0,
          userOrders: 0
        };
      }

      const userOrders = allOrders.filter(order => order.customerId === authState.user!.id);

      return {
        total: allOrders.length,
        active: allOrders.filter(order => order.status === 'active').length,
        completed: allOrders.filter(order => order.status === 'completed').length,
        userOrders: userOrders.length
      };
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      return {
        total: 0,
        active: 0,
        completed: 0,
        userOrders: 0
      };
    }
  }

  /**
   * Подписка на изменения заказов (real-time updates)
   */
  subscribeToOrderUpdates(callback: (orders: Order[]) => void): () => void {
    if (!this.isSupabaseEnabled) {
      console.log('[OrderService] Real-time обновления недоступны без Supabase');
      return () => { };
    }

    const subscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          console.log('[OrderService] Получено обновление заказов:', payload);
          // Перезагружаем активные заказы
          const updatedOrders = await this.getAvailableOrders();
          callback(updatedOrders);
        }
      )
      .subscribe();

    console.log('[OrderService] ✅ Подписка на real-time обновления заказов активна');

    // Возвращаем функцию для отписки
    return () => {
      supabase.removeChannel(subscription);
      console.log('[OrderService] Отписка от real-time обновлений');
    };
  }

  // Приватные методы

  /**
   * Получение всех заказов из глобального хранилища
   */
  private async getAllOrders(): Promise<Order[]> {
    try {
      console.log(`[OrderService] Читаем заказы из ключа: ${GLOBAL_ORDERS_STORAGE_KEY}`);
      const ordersData = await AsyncStorage.getItem(GLOBAL_ORDERS_STORAGE_KEY);

      if (!ordersData) {
        console.log('[OrderService] Данные заказов не найдены в хранилище');
        return [];
      }

      console.log('[OrderService] Сырые данные из хранилища:', ordersData.substring(0, 200) + '...');
      const parsedData: OrdersState = JSON.parse(ordersData);
      console.log(`[OrderService] Распарсено заказов: ${parsedData.orders.length}`);

      return parsedData.orders;
    } catch (error) {
      console.error('Ошибка чтения заказов из хранилища:', error);
      return [];
    }
  }

  /**
   * Сохранение заказов в глобальное хранилище
   */
  private async saveGlobalOrders(orders: Order[]): Promise<void> {
    const ordersState: OrdersState = {
      orders,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`[OrderService] Сохраняем ${orders.length} заказов в ключ: ${GLOBAL_ORDERS_STORAGE_KEY}`);
    await AsyncStorage.setItem(GLOBAL_ORDERS_STORAGE_KEY, JSON.stringify(ordersState));
    console.log('[OrderService] Заказы успешно сохранены');
  }

  /**
   * Генерация уникального ID для заказа
   */
  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Очистка всех заказов (для тестирования)
   */
  async clearAllOrders(): Promise<void> {
    try {
      if (this.isSupabaseEnabled) {
        const { error } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
          console.error('Ошибка очистки заказов в Supabase:', error);
        } else {
          console.log('[OrderService] Все заказы очищены в Supabase');
        }
      }

      // Также очищаем локальное хранилище
      await AsyncStorage.removeItem(GLOBAL_ORDERS_STORAGE_KEY);
      console.log('[OrderService] Все заказы очищены локально');
    } catch (error) {
      console.error('Ошибка очистки заказов:', error);
    }
  }

  /**
   * Получение статуса подключения к Supabase
   */
  getSupabaseStatus(): boolean {
    return this.isSupabaseEnabled;
  }

  /**
   * Получение статистики заказов
   */
  async getOrdersStats(): Promise<{ total: number; active: number; completed: number }> {
    try {
      const allOrders = await this.getAllOrders();
      const active = allOrders.filter(order => order.status === 'active').length;
      const completed = allOrders.filter(order => order.status === 'completed').length;

      return {
        total: allOrders.length,
        active,
        completed
      };
    } catch (error) {
      console.error('Ошибка получения статистики заказов:', error);
      return { total: 0, active: 0, completed: 0 };
    }
  }
}

export const orderService = OrderService.getInstance(); 