import { Order, CreateOrderRequest, CreateOrderResponse, Applicant, CreateApplicantRequest, WorkerApplication, Review, CreateReviewRequest, WorkerRating } from '../types';
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
          latitude: request.latitude || null,
          longitude: request.longitude || null,
          budget: request.budget,
          workers_needed: request.workersNeeded,
          service_date: request.serviceDate,
          photos: request.photos || [],
          customer_id: authState.user.id,
          status: 'new',
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
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
        budget: data.budget,
        workersNeeded: data.workers_needed,
        serviceDate: data.service_date,
        photos: data.photos || [],
        status: data.status as 'new' | 'in_progress' | 'completed' | 'cancelled',
        customerId: data.customer_id,
        applicantsCount: data.applicants_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      console.log('[OrderService] ✅ Заказ создан:', newOrder.title);
      console.log('[OrderService] 📷 Медиа файлов в заказе:', newOrder.photos?.length || 0);
      if (newOrder.photos && newOrder.photos.length > 0) {
        console.log('[OrderService] 📄 URL-ы медиа в заказе:');
        newOrder.photos.forEach((url, index) => {
          console.log(`  ${index + 1}. ${url}`);
        });
      }

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
        latitude: item.latitude || undefined,
        longitude: item.longitude || undefined,
        budget: item.budget,
        workersNeeded: item.workers_needed,
        serviceDate: item.service_date,
        photos: item.photos || [],
        status: item.status as 'new' | 'in_progress' | 'completed' | 'cancelled',
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
        latitude: item.latitude || undefined,
        longitude: item.longitude || undefined,
        budget: item.budget,
        workersNeeded: item.workers_needed,
        serviceDate: item.service_date,
        photos: item.photos || [],
        status: item.status as 'new' | 'in_progress' | 'completed' | 'cancelled',
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
   * Получение новых заказов для исполнителей
   */
  async getNewOrdersForWorkers(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'new')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения новых заказов из Supabase:', error);
        return [];
      }

      const orders: Order[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        location: item.location,
        latitude: item.latitude || undefined,
        longitude: item.longitude || undefined,
        budget: item.budget,
        workersNeeded: item.workers_needed,
        serviceDate: item.service_date,
        photos: item.photos || [],
        status: item.status as 'new' | 'in_progress' | 'completed' | 'cancelled',
        customerId: item.customer_id,
        applicantsCount: item.applicants_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      console.log(`[OrderService] Загружено ${orders.length} новых заказов`);
      return orders;
    } catch (error) {
      console.error('[OrderService] Ошибка получения новых заказов:', error);
      return [];
    }
  }

  /**
   * Получение доступных заказов для исполнителя (исключая те, на которые уже отправлен отклик)
   */
  async getAvailableOrdersForWorker(): Promise<Order[]> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        console.warn('[OrderService] Пользователь не авторизован');
        return [];
      }

      // Получаем новые заказы и отклики пользователя параллельно
      const [allNewOrders, userApplications] = await Promise.all([
        this.getNewOrdersForWorkers(),
        this.getUserApplications()
      ]);

      // Фильтруем заказы, исключая те на которые уже есть отклик
      const availableOrders = allNewOrders.filter(order =>
        !userApplications.has(order.id)
      );

      console.log(`[OrderService] Из ${allNewOrders.length} новых заказов доступно ${availableOrders.length} (исключено ${userApplications.size} с откликами)`);
      return availableOrders;
    } catch (error) {
      console.error('[OrderService] Ошибка получения доступных заказов:', error);
      return [];
    }
  }

  /**
   * Получение новых заказов для текущего пользователя (заказчика)
   */
  async getUserNewOrders(): Promise<Order[]> {
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
        .eq('status', 'new')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения новых заказов пользователя из Supabase:', error);
        return [];
      }

      const orders: Order[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        location: item.location,
        latitude: item.latitude || undefined,
        longitude: item.longitude || undefined,
        budget: item.budget,
        workersNeeded: item.workers_needed,
        serviceDate: item.service_date,
        photos: item.photos || [],
        status: item.status as 'new' | 'in_progress' | 'completed' | 'cancelled',
        customerId: item.customer_id,
        applicantsCount: item.applicants_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      console.log(`[OrderService] Загружено ${orders.length} новых заказов для текущего пользователя`);
      return orders;
    } catch (error) {
      console.error('[OrderService] Ошибка получения новых заказов пользователя:', error);
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
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
        budget: data.budget,
        workersNeeded: data.workers_needed,
        serviceDate: data.service_date,
        photos: data.photos || [],
        status: data.status as 'new' | 'in_progress' | 'completed' | 'cancelled',
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
   * Получение детальных заявок исполнителя с информацией о заказах
   */
  async getWorkerApplications(): Promise<WorkerApplication[]> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        console.warn('[OrderService] Пользователь не авторизован');
        return [];
      }

      // Получаем заявки исполнителя с присоединенной информацией о заказах
      const { data, error } = await supabase
        .from('applicants')
        .select(`
          *,
          orders!inner (
            id,
            title,
            description,
            category,
            location,
            latitude,
            longitude,
            budget,
            service_date,
            status,
            customer_id
          )
        `)
        .eq('worker_id', authState.user.id)
        .order('applied_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения заявок исполнителя из Supabase:', error);
        return [];
      }

      // Получаем уникальные ID заказчиков
      const customerIds = [...new Set(data.map((item: any) => item.orders.customer_id))];

      // Получаем информацию о заказчиках
      const { data: customers, error: customersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, phone')
        .in('id', customerIds);

      if (customersError) {
        console.warn('[OrderService] Не удалось загрузить информацию о заказчиках:', customersError);
      }

      // Создаем мапу заказчиков для быстрого поиска
      const customersMap = new Map();
      customers?.forEach((customer: any) => {
        customersMap.set(customer.id, customer);
      });

      const applications: WorkerApplication[] = data.map((item: any) => {
        const order = item.orders;
        const customer = customersMap.get(order.customer_id);

        // Определяем статус заявки с учетом статуса заказа
        let applicationStatus = item.status;
        if (item.status === 'accepted' && order.status === 'completed') {
          applicationStatus = 'completed';
        }

        return {
          id: item.id,
          orderId: order.id,
          orderTitle: order.title,
          orderCategory: order.category,
          orderDescription: order.description,
          orderLocation: order.location,
          orderLatitude: order.latitude,
          orderLongitude: order.longitude,
          orderBudget: order.budget,
          orderServiceDate: order.service_date,
          orderStatus: order.status,
          customerName: customer ? `${customer.first_name} ${customer.last_name}` : 'Заказчик',
          customerPhone: customer?.phone || '',
          rating: item.rating,
          completedJobs: item.completed_jobs,
          message: item.message,
          proposedPrice: item.proposed_price,
          appliedAt: item.applied_at,
          status: applicationStatus
        };
      });

      console.log(`[OrderService] Загружено ${applications.length} заявок исполнителя`);
      return applications;
    } catch (error) {
      console.error('[OrderService] Ошибка получения заявок исполнителя:', error);
      return [];
    }
  }

  /**
   * Отмена заявки исполнителя
   */
  async cancelWorkerApplication(applicationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('applicants')
        .delete()
        .eq('id', applicationId);

      if (error) {
        console.error('[OrderService] Ошибка отмены заявки:', error);
        return false;
      }

      console.log(`[OrderService] ✅ Заявка ${applicationId} отменена`);
      return true;
    } catch (error) {
      console.error('[OrderService] Ошибка отмены заявки:', error);
      return false;
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
        status: item.status as 'pending' | 'accepted' | 'rejected' | 'completed'
      }));

      console.log(`[OrderService] Загружено ${applicants.length} откликов для заказа ${orderId}`);
      return applicants;
    } catch (error) {
      console.error('[OrderService] Ошибка получения откликов:', error);
      return [];
    }
  }

  /**
   * Проверка и автоматическое обновление статуса заказа при достижении нужного количества исполнителей
   */
  async checkAndUpdateOrderStatus(orderId: string): Promise<boolean> {
    try {
      // Получаем информацию о заказе
      const order = await this.getOrderById(orderId);
      if (!order) {
        console.error('[OrderService] Заказ не найден для обновления статуса');
        return false;
      }

      // Проверяем только заказы со статусом 'new'
      if (order.status !== 'new') {
        console.log(`[OrderService] Заказ ${orderId} уже имеет статус ${order.status}, пропускаем обновление`);
        return true;
      }

      // Получаем всех принятых исполнителей для этого заказа
      const applicants = await this.getApplicantsForOrder(orderId);
      const acceptedApplicants = applicants.filter(applicant => applicant.status === 'accepted');

      console.log(`[OrderService] Заказ ${orderId}: принято ${acceptedApplicants.length} из ${order.workersNeeded} исполнителей`);

      // Если принято достаточно исполнителей, меняем статус на 'in_progress'
      if (acceptedApplicants.length >= order.workersNeeded) {
        const statusUpdated = await this.updateOrderStatus(orderId, 'in_progress');
        if (statusUpdated) {
          console.log(`[OrderService] ✅ Статус заказа ${orderId} изменен на 'in_progress' - набрано ${acceptedApplicants.length} исполнителей`);
          return true;
        } else {
          console.error(`[OrderService] ❌ Не удалось обновить статус заказа ${orderId}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[OrderService] Ошибка при проверке и обновлении статуса заказа:', error);
      return false;
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
  async getOrdersStats(): Promise<{ total: number; new: number; inProgress: number; completed: number; cancelled: number }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status');

      if (error) {
        console.error('[OrderService] Ошибка получения статистики заказов:', error);
        return { total: 0, new: 0, inProgress: 0, completed: 0, cancelled: 0 };
      }

      const stats = {
        total: data.length,
        new: data.filter((order: any) => order.status === 'new').length,
        inProgress: data.filter((order: any) => order.status === 'in_progress').length,
        completed: data.filter((order: any) => order.status === 'completed').length,
        cancelled: data.filter((order: any) => order.status === 'cancelled').length
      };

      console.log('[OrderService] Статистика заказов:', stats);
      return stats;
    } catch (error) {
      console.error('[OrderService] Ошибка получения статистики заказов:', error);
      return { total: 0, new: 0, inProgress: 0, completed: 0, cancelled: 0 };
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

  /**
   * Завершить заказ заказчиком
   */
  async completeOrder(orderId: string): Promise<boolean> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        console.error('[OrderService] Пользователь не авторизован');
        return false;
      }

      // Проверяем, что заказ принадлежит текущему пользователю
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('customer_id, status')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        console.error('[OrderService] Заказ не найден:', orderError);
        return false;
      }

      if (orderData.customer_id !== authState.user.id) {
        console.error('[OrderService] Заказ не принадлежит пользователю');
        return false;
      }

      if (orderData.status !== 'in_progress') {
        console.error('[OrderService] Заказ не в процессе выполнения');
        return false;
      }

      // Обновляем статус заказа на 'completed' для заказчика
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('[OrderService] Ошибка обновления статуса заказа:', updateError);
        return false;
      }

      // Обновляем статус всех принятых откликов на 'completed'
      const { error: applicantsError } = await supabase
        .from('applicants')
        .update({ status: 'completed' })
        .eq('order_id', orderId)
        .eq('status', 'accepted');

      if (applicantsError) {
        console.error('[OrderService] Ошибка обновления статуса откликов:', applicantsError);
        // Не возвращаем false, так как основная операция прошла успешно
      }

      console.log('[OrderService] ✅ Заказ успешно завершен');
      return true;
    } catch (error) {
      console.error('[OrderService] Ошибка завершения заказа:', error);
      return false;
    }
  }

  /**
   * Получить принятых исполнителей для заказа
   */
  async getAcceptedWorkersForOrder(orderId: string): Promise<Applicant[]> {
    try {
      const { data, error } = await supabase
        .from('applicants')
        .select(`
          *,
          worker:worker_id (
            first_name,
            last_name,
            phone,
            profile_image
          )
        `)
        .eq('order_id', orderId)
        .eq('status', 'accepted');

      if (error) {
        console.error('[OrderService] Ошибка получения принятых исполнителей:', error);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        workerId: item.worker_id,
        workerName: `${item.worker.first_name} ${item.worker.last_name}`,
        workerPhone: item.worker.phone,
        rating: item.rating,
        completedJobs: item.completed_jobs,
        avatar: item.worker.profile_image,
        message: item.message,
        proposedPrice: item.proposed_price,
        appliedAt: item.applied_at,
        status: item.status as 'pending' | 'accepted' | 'rejected' | 'completed'
      }));
    } catch (error) {
      console.error('[OrderService] Ошибка получения принятых исполнителей:', error);
      return [];
    }
  }

  /**
   * Создать отзыв
   */
  async createReview(request: CreateReviewRequest): Promise<boolean> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        console.error('[OrderService] Пользователь не авторизован');
        return false;
      }

      // Проверяем, что пользователь - заказчик данного заказа
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('id', request.orderId)
        .single();

      if (orderError || !orderData || orderData.customer_id !== authState.user.id) {
        console.error('[OrderService] Заказ не найден или не принадлежит пользователю');
        return false;
      }

      // Проверяем, что отзыв еще не оставлен
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', request.orderId)
        .eq('worker_id', request.workerId)
        .single();

      if (existingReview) {
        console.error('[OrderService] Отзыв уже существует');
        return false;
      }

      // Создаем отзыв
      const reviewData = {
        order_id: request.orderId,
        customer_id: authState.user.id, // Supabase автоматически приведет к TEXT если нужно
        worker_id: request.workerId,
        rating: request.rating,
        comment: request.comment || null,
        created_at: new Date().toISOString()
      };

      console.log('[OrderService] Создаем отзыв с данными:', reviewData);

      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select();

      if (error) {
        console.error('[OrderService] Ошибка создания отзыва:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return false;
      }

      console.log('[OrderService] ✅ Отзыв создан:', data);

      console.log('[OrderService] ✅ Отзыв успешно создан');
      return true;
    } catch (error) {
      console.error('[OrderService] Ошибка создания отзыва:', error);
      return false;
    }
  }

  /**
   * Получить отзывы о работнике
   */
  async getWorkerReviews(workerId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          order:order_id (title),
          customer:customer_id (first_name, last_name)
        `)
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения отзывов:', error);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        customerId: item.customer_id,
        workerId: item.worker_id,
        rating: item.rating,
        comment: item.comment,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('[OrderService] Ошибка получения отзывов:', error);
      return [];
    }
  }

  /**
   * Получить рейтинг работника
   */
  async getWorkerRating(workerId: string): Promise<WorkerRating | null> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('worker_id', workerId);

      if (error) {
        console.error('[OrderService] Ошибка получения рейтинга:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          workerId,
          averageRating: 0,
          totalReviews: 0
        };
      }

      const totalReviews = data.length;
      const sumRating = data.reduce((sum: number, review: any) => sum + review.rating, 0);
      const averageRating = Math.round((sumRating / totalReviews) * 10) / 10; // Округляем до 1 знака

      return {
        workerId,
        averageRating,
        totalReviews
      };
    } catch (error) {
      console.error('[OrderService] Ошибка получения рейтинга:', error);
      return null;
    }
  }

  /**
   * Получить общий заработок исполнителя с принятых и завершенных заказов
   */
  async getWorkerEarnings(workerId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('applicants')
        .select(`
          proposed_price,
          order:order_id (budget)
        `)
        .eq('worker_id', workerId)
        .in('status', ['accepted', 'completed']); // Считаем деньги с принятых и завершенных заказов

      if (error) {
        console.error('[OrderService] Ошибка получения заработка:', error);
        return 0;
      }

      if (!data) return 0;

      return data.reduce((total: number, applicant: any) => {
        // Используем предложенную цену исполнителя, если есть, иначе бюджет заказа
        const price = applicant.proposed_price || applicant.order?.budget || 0;
        return total + price;
      }, 0);
    } catch (error) {
      console.error('[OrderService] Ошибка получения заработка:', error);
      return 0;
    }
  }
}

// Экспортируем синглтон
export const orderService = OrderService.getInstance();