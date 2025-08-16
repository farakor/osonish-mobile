import { Order, CreateOrderRequest, CreateOrderResponse, Applicant, CreateApplicantRequest, WorkerApplication, Review, CreateReviewRequest, WorkerRating, WorkerProfile } from '../types';
import { authService } from './authService';
import { notificationService } from './notificationService';
import { supabase, Database } from './supabaseClient';

export class OrderService {
  private static instance: OrderService;
  private notifiedOrders: Set<string> = new Set(); // Дедупликация уведомлений по orderId

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
      console.log('[OrderService] 🔨 Создание заказа:', request.title);
      console.log('[OrderService] 🕒 Время создания:', new Date().toISOString());

      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return {
          success: false,
          error: 'Пользователь не авторизован'
        };
      }

      const orderId = this.generateOrderId();
      console.log('[OrderService] 🆔 Сгенерированный ID заказа:', orderId);
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

      // Отправляем уведомления всем исполнителям о новом заказе
      console.log('[OrderService] 🚀 Инициируем отправку уведомлений для заказа:', newOrder.id);
      this.sendNewOrderNotifications(newOrder).catch(error => {
        console.error('[OrderService] ❌ Ошибка отправки уведомлений о новом заказе:', error);
      });

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
        status: item.status as 'new' | 'response_received' | 'in_progress' | 'completed' | 'cancelled',
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
        status: item.status as 'new' | 'response_received' | 'in_progress' | 'completed' | 'cancelled',
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
        .in('status', ['new', 'response_received'])
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
        status: item.status as 'new' | 'response_received' | 'in_progress' | 'completed' | 'cancelled',
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
   * Получение доступных заказов для исполнителя
   * Показывает все заказы, которые еще не набрали нужное количество исполнителей
   */
  async getAvailableOrdersForWorker(): Promise<Order[]> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        console.warn('[OrderService] Пользователь не авторизован');
        return [];
      }

      // Получаем все заказы, которые еще принимают отклики
      const allAvailableOrders = await this.getNewOrdersForWorkers();

      console.log(`[OrderService] Загружено ${allAvailableOrders.length} доступных заказов`);
      return allAvailableOrders;
    } catch (error) {
      console.error('[OrderService] Ошибка получения доступных заказов:', error);
      return [];
    }
  }

  /**
   * Получение активных заказов для текущего пользователя (заказчика)
   * Включает все заказы кроме завершенных
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
        .neq('status', 'completed')
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
        status: item.status as 'new' | 'response_received' | 'in_progress' | 'completed' | 'cancelled',
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

      // Получаем информацию о заказе для проверки даты
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('service_date')
        .eq('id', request.orderId)
        .single();

      if (orderError || !orderData) {
        console.error('[OrderService] Ошибка получения данных заказа:', orderError);
        return false;
      }

      // Проверяем, нет ли у исполнителя уже принятых заказов на эту дату
      const conflictingApplications = await this.checkWorkerDateConflicts(authState.user.id, orderData.service_date);
      if (conflictingApplications.length > 0) {
        console.log(`[OrderService] ⚠️ Исполнитель уже занят на эту дату. Конфликтующих заказов: ${conflictingApplications.length}`);
        // Можно вернуть false или показать предупреждение, но разрешить создание отклика
        // Пока разрешаем создание отклика, но логируем предупреждение
      }

      const applicantId = this.generateApplicantId();
      const currentTime = new Date().toISOString();

      // Получаем реальные данные о работнике (рейтинг и количество работ)
      const [workerRating, completedJobsCount] = await Promise.all([
        this.getWorkerRating(authState.user.id),
        this.getWorkerCompletedJobsCount(authState.user.id)
      ]);

      // Создаем отклик в Supabase
      const { error } = await supabase
        .from('applicants')
        .insert({
          id: applicantId,
          order_id: request.orderId,
          worker_id: authState.user.id,
          worker_name: `${authState.user.firstName} ${authState.user.lastName}`,
          worker_phone: authState.user.phone,
          rating: workerRating?.averageRating || null, // Реальный рейтинг или null
          completed_jobs: completedJobsCount, // Реальное количество завершенных работ
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

      // Проверяем, первый ли это отклик для заказа
      const applicantsCount = await this.getApplicantsCount(request.orderId);
      if (applicantsCount === 1) {
        // Если это первый отклик, меняем статус заказа на 'response_received'
        await this.updateOrderStatus(request.orderId, 'response_received');
        console.log(`[OrderService] ✅ Статус заказа ${request.orderId} изменен на 'response_received' - получен первый отклик`);
      }

      // Отправляем уведомление заказчику о новом отклике
      this.sendNewApplicationNotification(request.orderId, authState.user).catch(error => {
        console.error('[OrderService] ❌ Ошибка отправки уведомления о новом отклике:', error);
      });

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

      // Получаем актуальные данные о рейтинге и количестве работ
      const [workerRating, completedJobsCount] = await Promise.all([
        this.getWorkerRating(authState.user.id),
        this.getWorkerCompletedJobsCount(authState.user.id)
      ]);

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
          customerPhone: '', // Номер телефона заказчика больше не передается исполнителю
          rating: workerRating?.averageRating || null, // Реальный рейтинг
          completedJobs: completedJobsCount, // Реальное количество работ
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
      console.log(`[OrderService] 🔄 Начинаем отмену заявки ${applicationId}`);

      // Сначала получаем информацию об отклике, чтобы знать orderId
      const { data: applicant, error: getError } = await supabase
        .from('applicants')
        .select('order_id, status, worker_name')
        .eq('id', applicationId)
        .single();

      if (getError || !applicant) {
        console.error('[OrderService] ❌ Ошибка получения информации об отклике:', getError);
        return false;
      }

      console.log(`[OrderService] 📋 Найден отклик: статус "${applicant.status}", заказ ${applicant.order_id}`);

      // Проверяем, что отклик можно отменить (только pending)
      if (applicant.status !== 'pending') {
        console.error(`[OrderService] ❌ Нельзя отменить отклик со статусом: ${applicant.status}`);
        return false;
      }

      const orderId = applicant.order_id;

      // Помечаем отклик как отмененный
      console.log(`[OrderService] 🔄 Помечаем отклик как отмененный...`);
      const { error } = await supabase
        .from('applicants')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) {
        console.error('[OrderService] ❌ Ошибка отмены отклика:', error);
        return false;
      }

      console.log(`[OrderService] ✅ Отклик ${applicationId} помечен как отмененный`);

      // Прямой подсчет активных откликов из базы данных
      console.log(`[OrderService] 🔄 Подсчитываем активные отклики напрямую из базы данных...`);
      const { data: remainingApplicants, error: countError } = await supabase
        .from('applicants')
        .select('id, status')
        .eq('order_id', orderId)
        .in('status', ['pending', 'accepted']);

      if (countError) {
        console.error('[OrderService] ❌ Ошибка подсчета активных откликов:', countError);
      } else {
        const activeCount = remainingApplicants?.length || 0;
        const applicantIds = remainingApplicants?.map(a => `${a.id} (${a.status})`) || [];
        console.log(`[OrderService] 📊 Найдено активных откликов в базе: ${activeCount}`);
        console.log(`[OrderService] 📋 ID активных откликов:`, applicantIds);

        // Обновляем счетчик в заказе
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            applicants_count: activeCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('[OrderService] ❌ Ошибка обновления счетчика:', updateError);
        } else {
          console.log(`[OrderService] ✅ Счетчик откликов обновлен: ${activeCount}`);
        }

        // Если нет активных откликов, меняем статус заказа на 'new'
        if (activeCount === 0) {
          console.log(`[OrderService] 🔄 Возвращаем статус заказа на 'new'...`);
          await this.updateOrderStatus(orderId, 'new');
          console.log(`[OrderService] ✅ Статус заказа ${orderId} изменен обратно на 'new' - нет активных откликов`);
        }
      }

      console.log(`[OrderService] 🎉 Отмена заявки ${applicationId} завершена успешно`);
      return true;
    } catch (error) {
      console.error('[OrderService] ❌ Критическая ошибка отмены заявки:', error);
      return false;
    }
  }

  /**
   * Проверка доступности исполнителя на определенную дату
   */
  async isWorkerAvailableOnDate(workerId: string, serviceDate: string): Promise<boolean> {
    try {
      const conflictingApplications = await this.checkWorkerDateConflicts(workerId, serviceDate);
      return conflictingApplications.length === 0;
    } catch (error) {
      console.error('[OrderService] Ошибка проверки доступности исполнителя:', error);
      return true; // В случае ошибки считаем исполнителя доступным
    }
  }

  /**
   * Фильтрация откликов для показа заказчику
   * Скрывает отклоненные и недоступных исполнителей
   */
  filterApplicantsForCustomer(applicants: Applicant[]): Applicant[] {
    return applicants.filter(applicant => {
      // Показываем только активные отклики (pending или accepted)
      if (applicant.status === 'rejected') {
        console.log(`[OrderService] 🚫 Скрываем отклоненный отклик: ${applicant.workerName}`);
        return false;
      }

      // Если отклик pending, проверяем доступность исполнителя
      if (applicant.status === 'pending' && !applicant.isAvailable) {
        console.log(`[OrderService] ⚠️ Скрываем недоступного исполнителя: ${applicant.workerName}`);
        return false;
      }

      return true;
    });
  }

  /**
   * Получение откликов для заказа
   */
  async getApplicantsForOrder(orderId: string): Promise<Applicant[]> {
    try {
      // Сначала получаем информацию о заказе для получения даты
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('service_date')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        console.error('[OrderService] Ошибка получения данных заказа:', orderError);
        return [];
      }

      const serviceDate = orderData.service_date;

      const { data, error } = await supabase
        .from('applicants')
        .select(`
          *,
          worker:worker_id (
            id,
            first_name,
            last_name,
            phone,
            profile_image
          )
        `)
        .eq('order_id', orderId)
        .order('applied_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения откликов из Supabase:', error);
        return [];
      }

      // Для каждого исполнителя получаем актуальные данные о рейтинге, количестве работ и доступности
      const applicantsWithRealData = await Promise.all(
        data.map(async (item: any) => {
          const [workerRating, completedJobsCount, isAvailable] = await Promise.all([
            this.getWorkerRating(item.worker_id),
            this.getWorkerCompletedJobsCount(item.worker_id),
            this.isWorkerAvailableOnDate(item.worker_id, serviceDate)
          ]);

          const worker = item.worker;
          const workerName = worker ? `${worker.first_name} ${worker.last_name}` : item.worker_name;
          const workerPhone = worker?.phone || item.worker_phone;
          const workerAvatar = worker?.profile_image || null;

          return {
            id: item.id,
            orderId: item.order_id,
            workerId: item.worker_id,
            workerName: workerName,
            workerPhone: workerPhone,
            avatar: workerAvatar,
            rating: workerRating?.averageRating || null, // Реальный рейтинг
            completedJobs: completedJobsCount, // Реальное количество работ
            message: item.message,
            proposedPrice: item.proposed_price,
            appliedAt: item.applied_at,
            status: item.status as 'pending' | 'accepted' | 'rejected' | 'completed',
            isAvailable: isAvailable // Добавляем информацию о доступности
          };
        })
      );

      console.log(`[OrderService] Загружено ${applicantsWithRealData.length} откликов для заказа ${orderId} с актуальными данными`);
      return applicantsWithRealData;
    } catch (error) {
      console.error('[OrderService] Ошибка получения откликов:', error);
      return [];
    }
  }

  /**
   * Получение отфильтрованных откликов для заказчика
   * Возвращает только активные и доступные отклики
   */
  async getFilteredApplicantsForOrder(orderId: string): Promise<Applicant[]> {
    try {
      const allApplicants = await this.getApplicantsForOrder(orderId);
      const filteredApplicants = this.filterApplicantsForCustomer(allApplicants);

      console.log(`[OrderService] Отфильтровано ${filteredApplicants.length} из ${allApplicants.length} откликов для заказа ${orderId}`);
      return filteredApplicants;
    } catch (error) {
      console.error('[OrderService] Ошибка получения отфильтрованных откликов:', error);
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

      // Проверяем только заказы со статусами 'new' и 'response_received'
      if (order.status !== 'new' && order.status !== 'response_received') {
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
   * Проверка конфликтов дат для исполнителя
   */
  private async checkWorkerDateConflicts(workerId: string, serviceDate: string): Promise<string[]> {
    try {
      console.log(`[OrderService] 🔍 Проверяем конфликты дат для исполнителя ${workerId} на дату ${serviceDate}`);

      // Извлекаем только дату без времени для сравнения
      const targetDate = serviceDate.split('T')[0]; // Получаем только YYYY-MM-DD часть
      console.log(`[OrderService] 📅 Проверяем конфликты на дату: ${targetDate}`);

      // Получаем все принятые отклики исполнителя на ту же дату
      const { data, error } = await supabase
        .from('applicants')
        .select(`
          id,
          order_id,
          orders!inner(service_date)
        `)
        .eq('worker_id', workerId)
        .eq('status', 'accepted')
        .gte('orders.service_date', `${targetDate}T00:00:00.000Z`)
        .lt('orders.service_date', `${targetDate}T23:59:59.999Z`);

      if (error) {
        console.error('[OrderService] Ошибка проверки конфликтов дат:', error);
        return [];
      }

      const conflictingApplicationIds = data?.map(item => item.id) || [];
      console.log(`[OrderService] 📅 Найдено ${conflictingApplicationIds.length} конфликтующих откликов`);

      return conflictingApplicationIds;
    } catch (error) {
      console.error('[OrderService] Ошибка проверки конфликтов дат:', error);
      return [];
    }
  }

  /**
   * Проверка и возврат статуса заказа если нет активных откликов
   */
  private async checkAndRevertOrderStatus(orderId: string): Promise<void> {
    try {
      console.log(`[OrderService] 🔄 Проверяем необходимость возврата статуса заказа ${orderId}`);

      // Получаем информацию о заказе
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        console.error('[OrderService] Ошибка получения данных заказа:', orderError);
        return;
      }

      // Проверяем только заказы со статусом 'response_received'
      if (orderData.status !== 'response_received') {
        console.log(`[OrderService] Заказ ${orderId} имеет статус ${orderData.status}, пропускаем проверку`);
        return;
      }

      // Проверяем, есть ли еще активные (pending или accepted) отклики
      const { data: activeApplicants, error: applicantsError } = await supabase
        .from('applicants')
        .select('id')
        .eq('order_id', orderId)
        .in('status', ['pending', 'accepted']);

      if (applicantsError) {
        console.error('[OrderService] Ошибка проверки активных откликов:', applicantsError);
        return;
      }

      // Если нет активных откликов, возвращаем статус на 'new'
      if (!activeApplicants || activeApplicants.length === 0) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'new',
            applicants_count: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('[OrderService] Ошибка возврата статуса заказа:', updateError);
          return;
        }

        console.log(`[OrderService] ✅ Статус заказа ${orderId} возвращен на 'new' (нет активных откликов)`);
      } else {
        console.log(`[OrderService] Заказ ${orderId} имеет ${activeApplicants.length} активных откликов, статус не меняется`);
      }
    } catch (error) {
      console.error('[OrderService] Ошибка проверки и возврата статуса заказа:', error);
    }
  }

  /**
   * Отклонение других откликов исполнителя на ту же дату
   */
  private async rejectWorkerOtherApplicationsOnSameDate(workerId: string, serviceDate: string, excludeApplicationId: string): Promise<void> {
    try {
      console.log(`[OrderService] 🚫 Отклоняем другие отклики исполнителя ${workerId} на дату ${serviceDate}`);

      // Извлекаем только дату без времени для сравнения
      const targetDate = serviceDate.split('T')[0]; // Получаем только YYYY-MM-DD часть
      console.log(`[OrderService] 📅 Ищем конфликты на дату: ${targetDate}`);

      // Получаем все pending отклики исполнителя на ту же дату (кроме текущего)
      const { data: pendingApplications, error: fetchError } = await supabase
        .from('applicants')
        .select(`
          id,
          order_id,
          orders!inner(service_date)
        `)
        .eq('worker_id', workerId)
        .eq('status', 'pending')
        .gte('orders.service_date', `${targetDate}T00:00:00.000Z`)
        .lt('orders.service_date', `${targetDate}T23:59:59.999Z`)
        .neq('id', excludeApplicationId);

      if (fetchError) {
        console.error('[OrderService] Ошибка получения pending откликов:', fetchError);
        return;
      }

      if (!pendingApplications || pendingApplications.length === 0) {
        console.log('[OrderService] ✅ Нет других pending откликов для отклонения');
        return;
      }

      // Собираем уникальные order_id, которые будут затронуты
      const affectedOrderIds = [...new Set(pendingApplications.map(app => app.order_id))];

      // Отклоняем все найденные отклики
      const applicationIds = pendingApplications.map(app => app.id);
      const { error: updateError } = await supabase
        .from('applicants')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .in('id', applicationIds);

      if (updateError) {
        console.error('[OrderService] Ошибка отклонения других откликов:', updateError);
        return;
      }

      console.log(`[OrderService] ✅ Отклонено ${applicationIds.length} других откликов исполнителя на ту же дату`);

      // Проверяем статус каждого затронутого заказа и обновляем счетчики
      for (const orderId of affectedOrderIds) {
        await this.checkAndRevertOrderStatus(orderId);
        await this.updateActiveApplicantsCount(orderId);
      }
    } catch (error) {
      console.error('[OrderService] Ошибка отклонения других откликов:', error);
    }
  }

  /**
 * Обновление статуса отклика с проверкой конфликтов
 */
  async updateApplicantStatus(applicantId: string, status: Applicant['status']): Promise<boolean> {
    try {
      // Если принимаем исполнителя, используем более надежную проверку
      if (status === 'accepted') {
        console.log(`[OrderService] 🔄 Начинаем процесс принятия исполнителя для отклика ${applicantId}`);

        // Получаем информацию об отклике и заказе
        const { data: applicantData, error: applicantError } = await supabase
          .from('applicants')
          .select(`
            id,
            worker_id,
            order_id,
            status,
            orders!inner(service_date)
          `)
          .eq('id', applicantId)
          .single();

        if (applicantError || !applicantData) {
          console.error('[OrderService] Ошибка получения данных отклика:', applicantError);
          return false;
        }

        // Проверяем, что отклик еще pending
        if (applicantData.status !== 'pending') {
          console.log(`[OrderService] ⚠️ Отклик ${applicantId} уже имеет статус ${applicantData.status}`);
          return false;
        }

        const workerId = applicantData.worker_id;
        const serviceDate = applicantData.orders.service_date;

        console.log(`[OrderService] 🔍 Проверяем доступность исполнителя ${workerId} на дату ${serviceDate}`);

        // Делаем атомарную проверку и обновление
        // Сначала пытаемся обновить статус с условием, что он все еще pending
        const { data: updateResult, error: updateError } = await supabase
          .from('applicants')
          .update({
            status: 'accepted',
            updated_at: new Date().toISOString()
          })
          .eq('id', applicantId)
          .eq('status', 'pending') // Обновляем только если статус все еще pending
          .select();

        if (updateError) {
          console.error('[OrderService] Ошибка обновления статуса отклика:', updateError);
          return false;
        }

        if (!updateResult || updateResult.length === 0) {
          console.log(`[OrderService] ⚠️ Не удалось обновить отклик ${applicantId} - возможно, он уже был изменен`);
          return false;
        }

        console.log(`[OrderService] ✅ Исполнитель успешно принят для отклика ${applicantId}`);

        // Теперь проверяем, есть ли у исполнителя другие принятые заказы на ту же дату
        const targetDate = serviceDate.split('T')[0]; // Получаем только YYYY-MM-DD часть
        console.log(`[OrderService] 📅 Проверяем конфликты принятых заказов на дату: ${targetDate}`);

        const { data: conflictingData, error: conflictError } = await supabase
          .from('applicants')
          .select(`
            id,
            order_id,
            orders!inner(service_date)
          `)
          .eq('worker_id', workerId)
          .eq('status', 'accepted')
          .gte('orders.service_date', `${targetDate}T00:00:00.000Z`)
          .lt('orders.service_date', `${targetDate}T23:59:59.999Z`)
          .neq('id', applicantId);

        if (conflictError) {
          console.error('[OrderService] Ошибка проверки конфликтов:', conflictError);
        } else if (conflictingData && conflictingData.length > 0) {
          console.log(`[OrderService] ⚠️ Найдены конфликтующие принятые заказы: ${conflictingData.length}`);

          // Если есть конфликты, отклоняем текущий отклик
          await supabase
            .from('applicants')
            .update({
              status: 'rejected',
              updated_at: new Date().toISOString()
            })
            .eq('id', applicantId);

          console.log(`[OrderService] 🚫 Отклик ${applicantId} отклонен из-за конфликта дат`);
          return false;
        }

        // Отклоняем другие pending отклики исполнителя на ту же дату
        await this.rejectWorkerOtherApplicationsOnSameDate(workerId, serviceDate, applicantId);

        // Отправляем уведомление исполнителю
        this.sendWorkerSelectedNotification(applicantId).catch(error => {
          console.error('[OrderService] ❌ Ошибка отправки уведомления о выборе исполнителя:', error);
        });

        return true;
      } else {
        // Для других статусов используем обычное обновление
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

        // Если отклик отклонен, проверяем необходимость возврата статуса заказа
        if (status === 'rejected') {
          // Получаем order_id для этого отклика
          const { data: applicantData, error: fetchError } = await supabase
            .from('applicants')
            .select('order_id')
            .eq('id', applicantId)
            .single();

          if (!fetchError && applicantData) {
            await this.checkAndRevertOrderStatus(applicantData.order_id);
            await this.updateActiveApplicantsCount(applicantData.order_id);
          }
        }

        return true;
      }
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
   * Получение количества откликов для заказа
   */
  private async getApplicantsCount(orderId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('applicants_count')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('[OrderService] Ошибка получения счетчика откликов:', error);
        return 0;
      }

      return data?.applicants_count || 0;
    } catch (error) {
      console.error('[OrderService] Ошибка получения счетчика откликов:', error);
      return 0;
    }
  }

  /**
   * Обновление счетчика активных откликов для заказа
   * Считает только pending и accepted отклики от доступных исполнителей
   */
  async updateActiveApplicantsCount(orderId: string): Promise<void> {
    try {
      console.log(`[OrderService] 🔄 Обновляем счетчик активных откликов для заказа ${orderId}`);

      // Получаем отфильтрованные отклики
      const filteredApplicants = await this.getFilteredApplicantsForOrder(orderId);
      const activeCount = filteredApplicants.length;

      // Обновляем счетчик в базе данных
      const { error } = await supabase
        .from('orders')
        .update({
          applicants_count: activeCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('[OrderService] Ошибка обновления счетчика активных откликов:', error);
        return;
      }

      console.log(`[OrderService] ✅ Счетчик активных откликов обновлен: ${activeCount} для заказа ${orderId}`);
    } catch (error) {
      console.error('[OrderService] Ошибка обновления счетчика активных откликов:', error);
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

      // Отправляем уведомления принятым исполнителям о завершении заказа
      this.sendOrderCompletedNotifications(orderId).catch(error => {
        console.error('[OrderService] ❌ Ошибка отправки уведомлений о завершении заказа:', error);
      });

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

      // Для каждого исполнителя получаем актуальные данные
      const workersWithRealData = await Promise.all(
        data.map(async (item: any) => {
          const [workerRating, completedJobsCount] = await Promise.all([
            this.getWorkerRating(item.worker_id),
            this.getWorkerCompletedJobsCount(item.worker_id)
          ]);

          return {
            id: item.id,
            orderId: item.order_id,
            workerId: item.worker_id,
            workerName: `${item.worker.first_name} ${item.worker.last_name}`,
            workerPhone: item.worker.phone,
            rating: workerRating?.averageRating || null, // Реальный рейтинг
            completedJobs: completedJobsCount, // Реальное количество работ
            avatar: item.worker.profile_image,
            message: item.message,
            proposedPrice: item.proposed_price,
            appliedAt: item.applied_at,
            status: item.status as 'pending' | 'accepted' | 'rejected' | 'completed'
          };
        })
      );

      return workersWithRealData;
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

      console.log('[OrderService] 📝 Создаем отзыв с данными:', {
        ...reviewData,
        comment: reviewData.comment ? `"${reviewData.comment}"` : 'NULL (без комментария)'
      });

      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select();

      if (error) {
        console.error('[OrderService] ❌ Ошибка создания отзыва:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return false;
      }

      console.log('[OrderService] ✅ Отзыв создан в Supabase:', {
        id: data[0]?.id,
        orderId: data[0]?.order_id,
        workerId: data[0]?.worker_id,
        rating: data[0]?.rating,
        comment: data[0]?.comment ? `"${data[0].comment}"` : 'NULL (без комментария)',
        createdAt: data[0]?.created_at
      });

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
   * Получить количество завершенных работ исполнителя
   */
  async getWorkerCompletedJobsCount(workerId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('applicants')
        .select('id')
        .eq('worker_id', workerId)
        .eq('status', 'completed');

      if (error) {
        console.error('[OrderService] Ошибка получения количества завершенных работ:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('[OrderService] Ошибка получения количества завершенных работ:', error);
      return 0;
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

  /**
   * Отправка уведомлений всем исполнителям о новом заказе
   */
  private async sendNewOrderNotifications(order: Order): Promise<void> {
    try {
      console.log('[OrderService] 📤 Отправляем уведомления о новом заказе:', order.id);
      console.log('[OrderService] 🕒 Время вызова:', new Date().toISOString());

      // 🔧 ДЕДУПЛИКАЦИЯ: Проверяем, не отправляли ли уже уведомления для этого заказа
      if (this.notifiedOrders.has(order.id)) {
        console.log('[OrderService] ⚠️ Уведомления для заказа', order.id, 'уже отправлены, пропускаем');
        return;
      }

      // Помечаем заказ как уведомленный
      this.notifiedOrders.add(order.id);
      console.log('[OrderService] ✅ Заказ', order.id, 'добавлен в список уведомленных');

      // Получаем всех исполнителей из базы данных
      const { data: workers, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'worker');

      if (error) {
        console.error('[OrderService] ❌ Ошибка получения списка исполнителей:', error);
        return;
      }

      if (!workers || workers.length === 0) {
        console.log('[OrderService] ⚠️ Нет исполнителей для уведомления');
        return;
      }

      const workerIds = workers.map(worker => worker.id);
      const title = 'Новый заказ!';
      const body = `${order.title} - ${order.budget} сом в ${order.location}`;
      const data = {
        orderId: order.id,
        orderTitle: order.title,
        orderBudget: order.budget,
        orderLocation: order.location,
        type: 'new_order'
      };

      // Отправляем уведомления
      const sentCount = await notificationService.sendNotificationToUsers(
        workerIds,
        title,
        body,
        data,
        'new_order'
      );

      console.log(`[OrderService] ✅ Отправлено ${sentCount} уведомлений о новом заказе`);
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка отправки уведомлений о новом заказе:', error);
      // В случае ошибки убираем заказ из кэша чтобы можно было повторить попытку
      this.notifiedOrders.delete(order.id);
    }
  }

  /**
   * Очистка кэша уведомленных заказов (для отладки или перезапуска)
   */
  public clearNotificationCache(): void {
    console.log('[OrderService] 🧹 Очищаем кэш уведомленных заказов');
    this.notifiedOrders.clear();
  }

  /**
   * Получение списка уведомленных заказов (для отладки)
   */
  public getNotifiedOrders(): string[] {
    return Array.from(this.notifiedOrders);
  }

  /**
   * Отправка уведомления заказчику о новом отклике
   */
  private async sendNewApplicationNotification(orderId: string, worker: any): Promise<void> {
    try {
      console.log('[OrderService] 📤 Отправляем уведомление о новом отклике...');

      // Получаем данные заказа и заказчика
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, title, customer_id')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        console.error('[OrderService] ❌ Ошибка получения данных заказа:', orderError);
        return;
      }

      const title = 'Новый отклик на ваш заказ!';
      const body = `${worker.firstName} ${worker.lastName} откликнулся на "${orderData.title}"`;
      const data = {
        orderId: orderData.id,
        orderTitle: orderData.title,
        workerId: worker.id,
        workerName: `${worker.firstName} ${worker.lastName}`,
        type: 'new_application'
      };

      // Отправляем уведомление заказчику
      const sent = await notificationService.sendNotificationToUser(
        orderData.customer_id,
        title,
        body,
        data,
        'new_application'
      );

      if (sent) {
        console.log('[OrderService] ✅ Уведомление о новом отклике отправлено заказчику');
      }
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка отправки уведомления о новом отклике:', error);
    }
  }

  /**
   * Отправка уведомления исполнителю о выборе
   */
  private async sendWorkerSelectedNotification(applicantId: string): Promise<void> {
    try {
      console.log('[OrderService] 📤 Отправляем уведомление о выборе исполнителя...');

      // Получаем данные отклика, заказа и исполнителя
      const { data: applicantData, error: applicantError } = await supabase
        .from('applicants')
        .select(`
          id,
          worker_id,
          order_id,
          orders!inner(id, title, budget, location, customer_id)
        `)
        .eq('id', applicantId)
        .single();

      if (applicantError || !applicantData) {
        console.error('[OrderService] ❌ Ошибка получения данных отклика:', applicantError);
        return;
      }

      const order = applicantData.orders;
      const title = 'Вас выбрали для выполнения заказа!';
      const body = `Поздравляем! Вас выбрали для заказа "${order.title}" за ${order.budget} сом`;
      const data = {
        orderId: order.id,
        orderTitle: order.title,
        orderBudget: order.budget,
        orderLocation: order.location,
        applicantId: applicantData.id,
        type: 'worker_selected'
      };

      // Отправляем уведомление исполнителю
      const sent = await notificationService.sendNotificationToUser(
        applicantData.worker_id,
        title,
        body,
        data,
        'order_update'
      );

      if (sent) {
        console.log('[OrderService] ✅ Уведомление о выборе отправлено исполнителю');
      }
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка отправки уведомления о выборе исполнителя:', error);
    }
  }



  /**
   * Отправка уведомлений о завершении заказа
   */
  private async sendOrderCompletedNotifications(orderId: string): Promise<void> {
    try {
      console.log('[OrderService] 📤 Отправляем уведомления о завершении заказа...');

      // Получаем данные заказа и принятых исполнителей
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, title, budget')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        console.error('[OrderService] ❌ Ошибка получения данных заказа:', orderError);
        return;
      }

      // Получаем принятых исполнителей
      const { data: acceptedApplicants, error: applicantsError } = await supabase
        .from('applicants')
        .select('worker_id')
        .eq('order_id', orderId)
        .eq('status', 'completed');

      if (applicantsError) {
        console.error('[OrderService] ❌ Ошибка получения принятых исполнителей:', applicantsError);
        return;
      }

      if (!acceptedApplicants || acceptedApplicants.length === 0) {
        console.log('[OrderService] ⚠️ Нет принятых исполнителей для уведомления');
        return;
      }

      const workerIds = acceptedApplicants.map(applicant => applicant.worker_id);
      const title = 'Заказ завершен!';
      const body = `Заказ "${orderData.title}" успешно завершен. Спасибо за отличную работу!`;
      const data = {
        orderId: orderData.id,
        orderTitle: orderData.title,
        orderBudget: orderData.budget,
        type: 'order_completed'
      };

      // Отправляем уведомления
      const sentCount = await notificationService.sendNotificationToUsers(
        workerIds,
        title,
        body,
        data,
        'order_completed'
      );

      console.log(`[OrderService] ✅ Отправлено ${sentCount} уведомлений о завершении заказа`);
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка отправки уведомлений о завершении заказа:', error);
    }
  }

  /**
   * Получить полный профиль исполнителя с отзывами
   */
  async getWorkerProfile(workerId: string): Promise<WorkerProfile | null> {
    try {
      console.log(`[OrderService] 📋 Загружаем профиль исполнителя ${workerId}...`);
      console.log(`[OrderService] 🔍 Будем искать отзывы для worker_id: ${workerId}`);

      // Получаем основную информацию о пользователе
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', workerId)
        .eq('role', 'worker')
        .single();

      if (userError || !userData) {
        console.error('[OrderService] ❌ Исполнитель не найден:', userError);
        return null;
      }

      // Получаем рейтинг и количество отзывов
      const workerRating = await this.getWorkerRating(workerId);

      // Получаем количество завершенных работ
      const completedJobs = await this.getWorkerCompletedJobsCount(workerId);

      // Получаем отзывы для исполнителя (сначала основные данные)
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false });

      let reviews: Review[] = [];
      if (!reviewsError && reviewsData && reviewsData.length > 0) {
        console.log(`[OrderService] 📋 Загружено ${reviewsData.length} отзывов из Supabase`);

        // Получаем уникальные ID заказчиков и заказов для дополнительной информации
        const customerIds = [...new Set(reviewsData.map(review => review.customer_id))];
        const orderIds = [...new Set(reviewsData.map(review => review.order_id))];

        // Загружаем информацию о заказчиках
        let customersMap = new Map();
        if (customerIds.length > 0) {
          const { data: customers } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .in('id', customerIds);

          if (customers) {
            customers.forEach(customer => {
              customersMap.set(customer.id, `${customer.first_name} ${customer.last_name}`);
            });
          }
        }

        // Загружаем информацию о заказах
        let ordersMap = new Map();
        if (orderIds.length > 0) {
          const { data: orders } = await supabase
            .from('orders')
            .select('id, title')
            .in('id', orderIds);

          if (orders) {
            orders.forEach(order => {
              ordersMap.set(order.id, order.title);
            });
          }
        }

        reviews = reviewsData.map((item: any) => ({
          id: item.id,
          orderId: item.order_id,
          customerId: item.customer_id,
          workerId: item.worker_id,
          customerName: customersMap.get(item.customer_id) || 'Заказчик',
          rating: item.rating,
          comment: item.comment,
          createdAt: item.created_at,
          orderTitle: ordersMap.get(item.order_id)
        }));

        console.log(`[OrderService] 📋 Обработанные отзывы:`,
          reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment ? `"${review.comment}"` : 'NULL (без комментария)',
            customerName: review.customerName,
            orderTitle: review.orderTitle || 'Без названия'
          }))
        );
      } else {
        console.log(`[OrderService] ⚠️ Нет отзывов для исполнителя ${workerId}`,
          reviewsError ? `Ошибка: ${reviewsError.message}` : 'Данных нет');
      }

      const workerProfile: WorkerProfile = {
        id: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        phone: userData.phone,
        profileImage: userData.profile_image,
        averageRating: workerRating?.averageRating || 0,
        totalReviews: workerRating?.totalReviews || 0,
        completedJobs,
        joinedAt: userData.created_at,
        reviews
      };

      console.log(`[OrderService] ✅ Профиль исполнителя загружен: ${workerProfile.firstName} ${workerProfile.lastName}`);
      console.log(`[OrderService] 📊 Статистика: ${completedJobs} работ, ${workerProfile.totalReviews} отзывов, рейтинг ${workerProfile.averageRating}`);

      return workerProfile;
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка получения профиля исполнителя:', error);
      return null;
    }
  }
}

// Экспортируем синглтон
export const orderService = OrderService.getInstance();