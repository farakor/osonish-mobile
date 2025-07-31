import { Order, CreateOrderRequest, CreateOrderResponse, Applicant, CreateApplicantRequest } from '../types';
import { authService } from './authService';
import { supabase, Database } from './supabaseClient';

export class OrderService {
  private static instance: OrderService;

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  constructor() {
    this.init();
  }

  /**
   * Инициализация сервиса
   */
  private async init(): Promise<void> {
    if (!supabase) {
      console.error('[OrderService] ⚠️ Supabase клиент не инициализирован');
      throw new Error('Supabase недоступен. Сервис заказов не может работать.');
    }

    try {
      // Проверяем подключение к Supabase
      const { error } = await supabase.from('orders').select('count').limit(1);
      if (error) {
        console.error('[OrderService] ⚠️ Ошибка подключения к Supabase:', error.message);
        throw new Error('Не удается подключиться к базе данных');
      }

      console.log('[OrderService] ✅ Supabase подключен успешно');
    } catch (error) {
      console.error('[OrderService] ⚠️ Критическая ошибка инициализации:', error);
      throw error;
    }
  }

  /**
   * Создание нового заказа
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return {
          success: false,
          error: 'Пользователь не авторизован'
        };
      }

      const orderId = this.generateOrderId();
      const currentTime = new Date().toISOString();

      // Создаем заказ в Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          title: request.title,
          description: request.description,
          category: request.category,
          location: request.location,
          budget: request.budget,
          workers_needed: request.workersNeeded,
          service_date: request.serviceDate,
          photos: request.photos || [],
          customer_id: authState.user.id,
          status: 'active',
          applicants_count: 0,
          created_at: currentTime,
          updated_at: currentTime
        })
        .select()
        .single();

      if (error) {
        console.error('[OrderService] Ошибка создания заказа в Supabase:', error);
        return {
          success: false,
          error: 'Не удалось создать заказ'
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
        photos: data.photos || [],
        status: data.status as 'active' | 'in_progress' | 'completed' | 'cancelled',
        customerId: data.customer_id,
        applicantsCount: data.applicants_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      console.log('[OrderService] ✅ Заказ создан:', newOrder.title);

      return {
        success: true,
        data: newOrder
      };
    } catch (error) {
      console.error('[OrderService] Ошибка создания заказа:', error);
      return {
        success: false,
        error: 'Произошла ошибка при создании заказа'
      };
    }
  }

  /**
   * Получение всех заказов из Supabase
   */
  async getAllOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения заказов из Supabase:', error);
        return [];
      }

      const orders: Order[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        location: item.location,
        budget: item.budget,
        workersNeeded: item.workers_needed,
        serviceDate: item.service_date,
        photos: item.photos || [],
        status: item.status as 'active' | 'in_progress' | 'completed' | 'cancelled',
        customerId: item.customer_id,
        applicantsCount: item.applicants_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      console.log(`[OrderService] Загружено ${orders.length} заказов из Supabase`);
      return orders;
    } catch (error) {
      console.error('[OrderService] Ошибка получения заказов:', error);
      return [];
    }
  }

  /**
   * Получение заказов для заказчика
   */
  async getCustomerOrders(): Promise<Order[]> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        console.warn('[OrderService] Пользователь не авторизован');
        return [];
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', authState.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения заказов заказчика из Supabase:', error);
        return [];
      }

      const orders: Order[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        location: item.location,
        budget: item.budget,
        workersNeeded: item.workers_needed,
        serviceDate: item.service_date,
        photos: item.photos || [],
        status: item.status as 'active' | 'in_progress' | 'completed' | 'cancelled',
        customerId: item.customer_id,
        applicantsCount: item.applicants_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      console.log(`[OrderService] Загружено ${orders.length} заказов для заказчика`);
      return orders;
    } catch (error) {
      console.error('[OrderService] Ошибка получения заказов заказчика:', error);
      return [];
    }
  }

  /**
   * Получение активных заказов для исполнителей
   */
  async getActiveOrdersForWorkers(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения активных заказов из Supabase:', error);
        return [];
      }

      const orders: Order[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        location: item.location,
        budget: item.budget,
        workersNeeded: item.workers_needed,
        serviceDate: item.service_date,
        photos: item.photos || [],
        status: item.status as 'active' | 'in_progress' | 'completed' | 'cancelled',
        customerId: item.customer_id,
        applicantsCount: item.applicants_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      console.log(`[OrderService] Загружено ${orders.length} активных заказов`);
      return orders;
    } catch (error) {
      console.error('[OrderService] Ошибка получения активных заказов:', error);
      return [];
    }
  }

  /**
   * Получение активных заказов для текущего пользователя (заказчика)
   */
  async getUserActiveOrders(): Promise<Order[]> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        console.warn('[OrderService] Пользователь не авторизован');
        return [];
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', authState.user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения активных заказов пользователя из Supabase:', error);
        return [];
      }

      const orders: Order[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        location: item.location,
        budget: item.budget,
        workersNeeded: item.workers_needed,
        serviceDate: item.service_date,
        photos: item.photos || [],
        status: item.status as 'active' | 'in_progress' | 'completed' | 'cancelled',
        customerId: item.customer_id,
        applicantsCount: item.applicants_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      console.log(`[OrderService] Загружено ${orders.length} активных заказов для текущего пользователя`);
      return orders;
    } catch (error) {
      console.error('[OrderService] Ошибка получения активных заказов пользователя:', error);
      return [];
    }
  }

  /**
   * Получение заказа по ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !data) {
        console.log(`[OrderService] Заказ с ID ${orderId} не найден`);
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
        status: data.status as 'active' | 'in_progress' | 'completed' | 'cancelled',
        customerId: data.customer_id,
        applicantsCount: data.applicants_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error(`[OrderService] Ошибка получения заказа ${orderId}:`, error);
      return null;
    }
  }

  /**
   * Обновление статуса заказа
   */
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('[OrderService] Ошибка обновления статуса заказа:', error);
        return false;
      }

      console.log(`[OrderService] Статус заказа ${orderId} обновлен на ${status}`);
      return true;
    } catch (error) {
      console.error('[OrderService] Ошибка обновления статуса заказа:', error);
      return false;
    }
  }

  /**
   * Создание отклика на заказ
   */
  async createApplicant(request: CreateApplicantRequest): Promise<boolean> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        console.error('[OrderService] Пользователь не авторизован');
        return false;
      }

      const applicantId = this.generateApplicantId();
      const currentTime = new Date().toISOString();

      // Создаем отклик в Supabase
      const { error } = await supabase
        .from('applicants')
        .insert({
          id: applicantId,
          order_id: request.orderId,
          worker_id: authState.user.id,
          worker_name: `${authState.user.firstName} ${authState.user.lastName}`,
          worker_phone: authState.user.phone,
          rating: 4.5, // Default rating for new workers
          completed_jobs: 0, // Default for new workers
          message: request.message || '',
          proposed_price: request.proposedPrice,
          applied_at: currentTime,
          status: 'pending',
          created_at: currentTime,
          updated_at: currentTime
        });

      if (error) {
        console.error('[OrderService] Ошибка создания отклика в Supabase:', error);
        return false;
      }

      // Увеличиваем счетчик откликов
      await this.incrementApplicantsCount(request.orderId);

      console.log(`[OrderService] ✅ Отклик создан для заказа ${request.orderId}`);
      return true;
    } catch (error) {
      console.error('[OrderService] Ошибка создания отклика:', error);
      return false;
    }
  }

  /**
   * Проверка, отправлял ли пользователь отклик на заказ
   */
  async hasUserAppliedToOrder(orderId: string): Promise<boolean> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return false;
      }

      const { data, error } = await supabase
        .from('applicants')
        .select('id')
        .eq('order_id', orderId)
        .eq('worker_id', authState.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 - no rows found
        console.error('[OrderService] Ошибка проверки отклика:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('[OrderService] Ошибка проверки отклика:', error);
      return false;
    }
  }

  /**
   * Получение всех откликов текущего пользователя
   */
  async getUserApplications(): Promise<Set<string>> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return new Set();
      }

      const { data, error } = await supabase
        .from('applicants')
        .select('order_id')
        .eq('worker_id', authState.user.id);

      if (error) {
        console.error('[OrderService] Ошибка получения откликов пользователя:', error);
        return new Set();
      }

      return new Set(data?.map((item: any) => item.order_id) || []);
    } catch (error) {
      console.error('[OrderService] Ошибка получения откликов пользователя:', error);
      return new Set();
    }
  }

  /**
   * Получение откликов для заказа
   */
  async getApplicantsForOrder(orderId: string): Promise<Applicant[]> {
    try {
      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .eq('order_id', orderId)
        .order('applied_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения откликов из Supabase:', error);
        return [];
      }

      const applicants: Applicant[] = data.map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        workerId: item.worker_id,
        workerName: item.worker_name,
        workerPhone: item.worker_phone,
        rating: item.rating,
        completedJobs: item.completed_jobs,
        message: item.message,
        proposedPrice: item.proposed_price,
        appliedAt: item.applied_at,
        status: item.status as 'pending' | 'accepted' | 'rejected'
      }));

      console.log(`[OrderService] Загружено ${applicants.length} откликов для заказа ${orderId}`);
      return applicants;
    } catch (error) {
      console.error('[OrderService] Ошибка получения откликов:', error);
      return [];
    }
  }

  /**
   * Обновление статуса отклика
   */
  async updateApplicantStatus(applicantId: string, status: Applicant['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('applicants')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicantId);

      if (error) {
        console.error('[OrderService] Ошибка обновления статуса отклика:', error);
        return false;
      }

      console.log(`[OrderService] Статус отклика ${applicantId} обновлен на ${status}`);
      return true;
    } catch (error) {
      console.error('[OrderService] Ошибка обновления статуса отклика:', error);
      return false;
    }
  }



  /**
   * Получение статистики заказов
   */
  async getOrdersStats(): Promise<{ total: number; active: number; completed: number; cancelled: number }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status');

      if (error) {
        console.error('[OrderService] Ошибка получения статистики заказов:', error);
        return { total: 0, active: 0, completed: 0, cancelled: 0 };
      }

      const stats = {
        total: data.length,
        active: data.filter((order: any) => order.status === 'active').length,
        completed: data.filter((order: any) => order.status === 'completed').length,
        cancelled: data.filter((order: any) => order.status === 'cancelled').length
      };

      console.log('[OrderService] Статистика заказов:', stats);
      return stats;
    } catch (error) {
      console.error('[OrderService] Ошибка получения статистики заказов:', error);
      return { total: 0, active: 0, completed: 0, cancelled: 0 };
    }
  }

  /**
   * Увеличение счетчика откликов для заказа
   */
  private async incrementApplicantsCount(orderId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_applicants_count', {
        order_id: orderId
      });

      if (error) {
        console.error('[OrderService] Ошибка увеличения счетчика откликов:', error);
      }
    } catch (error) {
      console.error('[OrderService] Ошибка вызова функции увеличения счетчика:', error);
    }
  }

  /**
   * Генерация уникального ID для заказа
   */
  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Генерация уникального ID для отклика
   */
  private generateApplicantId(): string {
    return `applicant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Очистка всех заказов (для тестирования)
   */
  async clearAllOrders(): Promise<void> {
    try {
      const { error } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.error('[OrderService] Ошибка очистки заказов в Supabase:', error);
      } else {
        console.log('[OrderService] ✅ Все заказы очищены в Supabase');
      }
    } catch (error) {
      console.error('[OrderService] Ошибка очистки заказов:', error);
    }
  }

  /**
   * Очистка всех откликов (для тестирования)
   */
  async clearAllApplicants(): Promise<void> {
    try {
      const { error } = await supabase.from('applicants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.error('[OrderService] Ошибка очистки откликов в Supabase:', error);
      } else {
        console.log('[OrderService] ✅ Все отклики очищены в Supabase');
      }
    } catch (error) {
      console.error('[OrderService] Ошибка очистки откликов:', error);
    }
  }
}

// Экспортируем синглтон
export const orderService = OrderService.getInstance(); 