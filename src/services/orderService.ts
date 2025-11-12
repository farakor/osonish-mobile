import { Order, CreateOrderRequest, CreateOrderResponse, UpdateOrderRequest, UpdateOrderResponse, CancelOrderResponse, Applicant, CreateApplicantRequest, WorkerApplication, Review, CreateReviewRequest, WorkerRating, WorkerProfile } from '../types';
import { authService } from './authService';
import { notificationService } from './notificationService';
import { supabase, Database } from './supabaseClient';
import { getTranslatedNotification, getTranslatedNotificationsForUsers } from '../utils/notificationTranslations';

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

      // Запускаем проверку напоминаний
      this.startReminderChecker();
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

      // Валидация входных данных
      if (!request.title?.trim()) {
        return {
          success: false,
          error: 'Название заказа обязательно'
        };
      }

      if (request.title.length > 70) {
        return {
          success: false,
          error: 'Название заказа не должно превышать 70 символов'
        };
      }

      if (!request.description?.trim()) {
        return {
          success: false,
          error: 'Описание заказа обязательно'
        };
      }

      if (request.description.length > 500) {
        return {
          success: false,
          error: 'Описание заказа не должно превышать 500 символов'
        };
      }

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

      // Логируем роль создателя заказа для аналитики
      const createdByRole = authState.user.role;
      console.log('[OrderService] 👤 Роль создателя заказа:', createdByRole);

      // Создаем заказ в Supabase
      const orderData: any = {
        id: orderId,
        type: request.type || 'daily', // Тип заказа: daily или vacancy
        title: request.title,
        description: request.description,
        category: request.category || 'other',
        specialization_id: request.specializationId || null,
        location: request.location,
        latitude: request.latitude || null,
        longitude: request.longitude || null,
        budget: request.budget,
        workers_needed: request.workersNeeded,
        service_date: request.serviceDate,
        photos: request.photos || [],
        customer_id: authState.user.id,
        created_by_role: createdByRole, // НОВОЕ ПОЛЕ: Роль создателя
        status: 'new',
        applicants_count: 0,
        // Дополнительные удобства
        transport_paid: request.transportPaid || false,
        meal_included: request.mealIncluded || false,
        meal_paid: request.mealPaid || false,
        auto_completed: false,
        created_at: currentTime,
        updated_at: currentTime
      };

      // Добавляем поля для вакансий
      if (request.type === 'vacancy') {
        orderData.job_title = request.jobTitle;
        orderData.experience_level = request.experienceLevel;
        orderData.employment_type = request.employmentType;
        orderData.work_format = request.workFormat;
        orderData.work_schedule = request.workSchedule;
        orderData.city = request.city;
        orderData.salary_from = request.salaryFrom;
        orderData.salary_to = request.salaryTo;
        orderData.salary_period = request.salaryPeriod;
        orderData.salary_type = request.salaryType;
        orderData.payment_frequency = request.paymentFrequency;
        orderData.skills = request.skills || [];
        orderData.languages = request.languages || [];
      }

      let { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      // Fallback: если ошибка связана с отсутствием поля specialization_id, пробуем без него
      if (error && error.message?.includes('specialization_id')) {
        console.warn('[OrderService] ⚠️ Поле specialization_id не найдено, пробуем создать заказ без него...');
        console.warn('[OrderService] 📝 Необходимо выполнить миграцию: SQL/add_specialization_id_to_orders.sql');
        
        const fallbackResult = await supabase
          .from('orders')
          .insert({
            id: orderId,
            title: request.title,
            description: request.description,
            category: request.category || 'other',
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
            transport_paid: request.transportPaid || false,
            meal_included: request.mealIncluded || false,
            meal_paid: request.mealPaid || false,
            auto_completed: false,
            created_at: currentTime,
            updated_at: currentTime
          })
          .select()
          .single();
          
        data = fallbackResult.data;
        error = fallbackResult.error;
        
        if (!error) {
          console.warn('[OrderService] ✅ Заказ создан без specialization_id');
        }
      }

      if (error) {
        console.error('[OrderService] ❌ Ошибка создания заказа в Supabase:', error);
        console.error('[OrderService] 📋 Детали ошибки:', JSON.stringify(error, null, 2));
        return {
          success: false,
          error: 'Не удалось создать заказ'
        };
      }

      const newOrder: Order = {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category || 'other',
        specializationId: data.specialization_id || undefined,
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
        // Дополнительные удобства
        transportPaid: data.transport_paid || false,
        mealIncluded: data.meal_included || false,
        mealPaid: data.meal_paid || false,
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
   * Обновление заказа (кроме даты)
   */
  async updateOrder(request: UpdateOrderRequest): Promise<UpdateOrderResponse> {
    try {
      console.log('[OrderService] 🔨 Обновление заказа:', request.orderId);
      console.log('[OrderService] 🕒 Время обновления:', new Date().toISOString());

      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return {
          success: false,
          error: 'Пользователь не авторизован'
        };
      }

      // Проверяем, что заказ принадлежит текущему пользователю
      const { data: existingOrder, error: fetchError } = await supabase
        .from('orders')
        .select('customer_id, status, service_date')
        .eq('id', request.orderId)
        .single();

      if (fetchError || !existingOrder) {
        console.error('[OrderService] Заказ не найден:', fetchError);
        return {
          success: false,
          error: 'Заказ не найден'
        };
      }

      if (existingOrder.customer_id !== authState.user.id) {
        console.error('[OrderService] Заказ не принадлежит пользователю');
        return {
          success: false,
          error: 'У вас нет прав на редактирование этого заказа'
        };
      }

      // Проверяем, что заказ можно редактировать (только новые заказы и с откликами)
      if (!['new', 'response_received'].includes(existingOrder.status)) {
        console.error('[OrderService] Заказ нельзя редактировать в текущем статусе:', existingOrder.status);
        return {
          success: false,
          error: 'Заказ нельзя редактировать в текущем статусе'
        };
      }

      // Подготавливаем данные для обновления (исключаем service_date)
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (request.title !== undefined) updateData.title = request.title;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.category !== undefined) updateData.category = request.category || 'other';
      if (request.location !== undefined) updateData.location = request.location;
      if (request.latitude !== undefined) updateData.latitude = request.latitude;
      if (request.longitude !== undefined) updateData.longitude = request.longitude;
      if (request.budget !== undefined) updateData.budget = request.budget;
      if (request.workersNeeded !== undefined) updateData.workers_needed = request.workersNeeded;
      if (request.photos !== undefined) updateData.photos = request.photos;

      console.log('[OrderService] 📝 Обновляемые поля:', Object.keys(updateData));

      // Обновляем заказ в Supabase
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', request.orderId)
        .select()
        .single();

      if (error) {
        console.error('[OrderService] Ошибка обновления заказа в Supabase:', error);
        return {
          success: false,
          error: 'Не удалось обновить заказ'
        };
      }

      const updatedOrder: Order = {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category || 'other',
        specializationId: data.specialization_id || undefined,
        location: data.location,
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
        budget: data.budget,
        workersNeeded: data.workers_needed,
        serviceDate: data.service_date, // Дата остается неизменной
        photos: data.photos || [],
        status: data.status as 'new' | 'in_progress' | 'completed' | 'cancelled',
        customerId: data.customer_id,
        applicantsCount: data.applicants_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      console.log('[OrderService] ✅ Заказ обновлен:', updatedOrder.title);

      // Отправляем уведомления исполнителям, которые откликнулись на заказ, о его изменении
      this.sendOrderUpdatedNotifications(request.orderId).catch(error => {
        console.error('[OrderService] ❌ Ошибка отправки уведомлений об обновлении заказа:', error);
      });

      return {
        success: true,
        data: updatedOrder
      };
    } catch (error) {
      console.error('[OrderService] Ошибка обновления заказа:', error);
      return {
        success: false,
        error: 'Произошла ошибка при обновлении заказа'
      };
    }
  }

  /**
   * Отмена заказа с удалением откликов (освобождение исполнителей)
   */
  async cancelOrder(orderId: string): Promise<CancelOrderResponse> {
    try {
      console.log('[OrderService] ❌ Отмена заказа:', orderId);
      console.log('[OrderService] 🕒 Время отмены:', new Date().toISOString());

      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return {
          success: false,
          error: 'Пользователь не авторизован'
        };
      }

      // Проверяем, что заказ принадлежит текущему пользователю
      const { data: existingOrder, error: fetchError } = await supabase
        .from('orders')
        .select('customer_id, status, title')
        .eq('id', orderId)
        .single();

      if (fetchError || !existingOrder) {
        console.error('[OrderService] Заказ не найден:', fetchError);
        return {
          success: false,
          error: 'Заказ не найден'
        };
      }

      if (existingOrder.customer_id !== authState.user.id) {
        console.error('[OrderService] Заказ не принадлежит пользователю');
        return {
          success: false,
          error: 'У вас нет прав на отмену этого заказа'
        };
      }

      // Проверяем, что заказ можно отменить (только новые заказы и с откликами)
      if (!['new', 'response_received'].includes(existingOrder.status)) {
        console.error('[OrderService] Заказ нельзя отменить в текущем статусе:', existingOrder.status);
        return {
          success: false,
          error: 'Заказ нельзя отменить в текущем статусе'
        };
      }

      // Получаем всех исполнителей, которые откликнулись на заказ, для уведомлений
      const { data: applicants } = await supabase
        .from('applicants')
        .select('worker_id, worker_name')
        .eq('order_id', orderId)
        .in('status', ['pending', 'accepted']);

      console.log(`[OrderService] 📋 Найдено ${applicants?.length || 0} активных откликов для удаления`);

      // Удаляем все отклики на заказ (освобождаем исполнителей)
      const { error: deleteApplicantsError } = await supabase
        .from('applicants')
        .delete()
        .eq('order_id', orderId);

      if (deleteApplicantsError) {
        console.error('[OrderService] Ошибка удаления откликов:', deleteApplicantsError);
        return {
          success: false,
          error: 'Не удалось удалить отклики на заказ'
        };
      }

      console.log('[OrderService] ✅ Отклики удалены - исполнители освобождены');

      // Меняем статус заказа на 'cancelled' вместо удаления
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          applicants_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateOrderError) {
        console.error('[OrderService] Ошибка отмены заказа:', updateOrderError);
        return {
          success: false,
          error: 'Не удалось отменить заказ'
        };
      }

      console.log('[OrderService] ✅ Заказ отменен:', existingOrder.title);

      // Отправляем уведомления исполнителям об отмене заказа
      if (applicants && applicants.length > 0) {
        this.sendOrderCancelledNotifications(orderId, existingOrder.title, applicants).catch(error => {
          console.error('[OrderService] ❌ Ошибка отправки уведомлений об отмене заказа:', error);
        });
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('[OrderService] Ошибка отмены заказа:', error);
      return {
        success: false,
        error: 'Произошла ошибка при отмене заказа'
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
        category: item.category || 'other',
        specializationId: item.specialization_id || undefined,
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
        viewsCount: item.views_count || 0,
        // Дополнительные удобства
        transportPaid: item.transport_paid || false,
        mealIncluded: item.meal_included || false,
        mealPaid: item.meal_paid || false,
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
        .select(`
          *,
          customer:users!customer_id(city)
        `)
        .eq('customer_id', authState.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения заказов заказчика из Supabase:', error);
        return [];
      }

      // Получаем количество непринятых откликов для каждого заказа
      const ordersWithPendingCount = await Promise.all(
        data.map(async (item: any) => {
          // Подсчитываем непринятые отклики (status = 'pending')
          const { count: pendingCount } = await supabase
            .from('applicants')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', item.id)
            .eq('status', 'pending');

          console.log(`[OrderService] Заказ ${item.id}: applicants_count=${item.applicants_count}, pendingCount=${pendingCount}`);

          return {
            id: item.id,
            type: item.type || 'daily', // Добавляем тип заказа
            title: item.title,
            description: item.description,
            category: item.category || 'other',
            specializationId: item.specialization_id || undefined,
            location: item.location,
            latitude: item.latitude || undefined,
            longitude: item.longitude || undefined,
            budget: item.budget,
            workersNeeded: item.workers_needed,
            serviceDate: item.service_date,
            photos: item.photos || [],
            status: item.status as 'new' | 'response_received' | 'in_progress' | 'completed' | 'cancelled',
            customerId: item.customer_id,
            customerCity: item.customer?.city || undefined,
            applicantsCount: item.applicants_count,
            pendingApplicantsCount: pendingCount || 0,
            viewsCount: item.views_count || 0,
            // Дополнительные удобства
            transportPaid: item.transport_paid || false,
            mealIncluded: item.meal_included || false,
            mealPaid: item.meal_paid || false,
            // Поля для вакансий
            jobTitle: item.job_title,
            experienceLevel: item.experience_level,
            employmentType: item.employment_type,
            workFormat: item.work_format,
            workSchedule: item.work_schedule,
            city: item.city,
            salaryFrom: item.salary_from,
            salaryTo: item.salary_to,
            salaryPeriod: item.salary_period,
            salaryType: item.salary_type,
            paymentFrequency: item.payment_frequency,
            skills: item.skills || [],
            languages: item.languages || [],
            createdAt: item.created_at,
            updatedAt: item.updated_at
          };
        })
      );

      console.log(`[OrderService] Загружено ${ordersWithPendingCount.length} заказов для заказчика`);
      return ordersWithPendingCount;
    } catch (error) {
      console.error('[OrderService] Ошибка получения заказов заказчика:', error);
      return [];
    }
  }

  /**
   * НОВЫЙ МЕТОД: Получение заказов, созданных текущим пользователем
   * Этот метод используется для отображения заказов в разделе "Мои заказы" у исполнителей
   * Возвращает заказы, где текущий пользователь является заказчиком (customer_id = current user)
   */
  async getMyCreatedOrders(): Promise<Order[]> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        console.warn('[OrderService] getMyCreatedOrders: Пользователь не авторизован');
        return [];
      }

      console.log('[OrderService] 📋 Загрузка заказов, созданных пользователем:', authState.user.id);
      console.log('[OrderService] 👤 Роль пользователя:', authState.user.role);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', authState.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения созданных заказов из Supabase:', error);
        return [];
      }

      // Получаем количество непринятых откликов для каждого заказа
      const ordersWithPendingCount = await Promise.all(
        data.map(async (item: any) => {
          // Подсчитываем непринятые отклики (status = 'pending')
          const { count: pendingCount } = await supabase
            .from('applicants')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', item.id)
            .eq('status', 'pending');

          return {
            id: item.id,
            type: item.type || 'daily', // Добавляем тип заказа
            title: item.title,
            description: item.description,
            category: item.category || 'other',
            specializationId: item.specialization_id || undefined,
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
            pendingApplicantsCount: pendingCount || 0,
            viewsCount: item.views_count || 0,
            // Дополнительные удобства
            transportPaid: item.transport_paid || false,
            mealIncluded: item.meal_included || false,
            mealPaid: item.meal_paid || false,
            // Поля для вакансий
            jobTitle: item.job_title,
            experienceLevel: item.experience_level,
            employmentType: item.employment_type,
            workFormat: item.work_format,
            workSchedule: item.work_schedule,
            city: item.city,
            salaryFrom: item.salary_from,
            salaryTo: item.salary_to,
            salaryPeriod: item.salary_period,
            salaryType: item.salary_type,
            paymentFrequency: item.payment_frequency,
            skills: item.skills || [],
            languages: item.languages || [],
            createdAt: item.created_at,
            updatedAt: item.updated_at
          };
        })
      );

      console.log(`[OrderService] ✅ Загружено ${ordersWithPendingCount.length} заказов, созданных пользователем (роль: ${authState.user.role})`);
      return ordersWithPendingCount;
    } catch (error) {
      console.error('[OrderService] Ошибка получения созданных заказов:', error);
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
        .select(`
          *,
          customer:users!customer_id(city)
        `)
        .in('status', ['new', 'response_received'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения новых заказов из Supabase:', error);
        return [];
      }

      const orders: Order[] = data.map((item: any) => ({
        id: item.id,
        type: item.type || 'daily', // Добавляем тип заказа
        title: item.title,
        description: item.description,
        category: item.category || 'other',
        specializationId: item.specialization_id || undefined,
        location: item.location,
        latitude: item.latitude || undefined,
        longitude: item.longitude || undefined,
        budget: item.budget,
        workersNeeded: item.workers_needed,
        serviceDate: item.service_date,
        photos: item.photos || [],
        status: item.status as 'new' | 'response_received' | 'in_progress' | 'completed' | 'cancelled',
        customerId: item.customer_id,
        customerCity: item.customer?.city || undefined,
        applicantsCount: item.applicants_count,
        viewsCount: item.views_count || 0,
        // Дополнительные удобства
        transportPaid: item.transport_paid || false,
        mealIncluded: item.meal_included || false,
        mealPaid: item.meal_paid || false,
        // Поля для вакансий
        jobTitle: item.job_title,
        experienceLevel: item.experience_level,
        employmentType: item.employment_type,
        workFormat: item.work_format,
        workSchedule: item.work_schedule,
        city: item.city,
        salaryFrom: item.salary_from,
        salaryTo: item.salary_to,
        salaryPeriod: item.salary_period,
        salaryType: item.salary_type,
        paymentFrequency: item.payment_frequency,
        skills: item.skills || [],
        languages: item.languages || [],
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
   * Получение занятых дат исполнителя (даты с принятыми заказами)
   */
  async getWorkerBusyDates(workerId?: string): Promise<Set<string>> {
    try {
      const authState = authService.getAuthState();
      const targetWorkerId = workerId || authState.user?.id;

      if (!targetWorkerId) {
        console.warn('[OrderService] ID исполнителя не указан');
        return new Set();
      }

      // Получаем все принятые отклики исполнителя
      const { data, error } = await supabase
        .from('applicants')
        .select(`
          id,
          orders!inner(service_date)
        `)
        .eq('worker_id', targetWorkerId)
        .eq('status', 'accepted');

      if (error) {
        console.error('[OrderService] Ошибка получения занятых дат исполнителя:', error);
        return new Set();
      }

      // Извлекаем даты и преобразуем в Set для быстрого поиска
      const busyDates = new Set<string>();
      data?.forEach((item: any) => {
        const serviceDate = item.orders.service_date;
        if (serviceDate) {
          // Извлекаем только дату без времени (YYYY-MM-DD)
          const dateOnly = serviceDate.split('T')[0];
          busyDates.add(dateOnly);
        }
      });

      console.log(`[OrderService] Найдено ${busyDates.size} занятых дат для исполнителя ${targetWorkerId}`);
      return busyDates;
    } catch (error) {
      console.error('[OrderService] Ошибка получения занятых дат исполнителя:', error);
      return new Set();
    }
  }

  /**
   * Получение доступных заказов для исполнителя
   * Показывает все заказы, которые еще не набрали нужное количество исполнителей
   * и исключает заказы на даты, когда исполнитель уже занят
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

      // Получаем занятые даты исполнителя
      const busyDates = await this.getWorkerBusyDates(authState.user.id);

      // Фильтруем заказы, исключая те, которые приходятся на занятые даты
      const filteredOrders = allAvailableOrders.filter(order => {
        const orderDate = order.serviceDate.split('T')[0]; // Извлекаем только дату
        const isDateBusy = busyDates.has(orderDate);

        if (isDateBusy) {
          console.log(`[OrderService] 📅 Заказ ${order.id} исключен - дата ${orderDate} уже занята`);
        }

        return !isDateBusy;
      });

      console.log(`[OrderService] Загружено ${allAvailableOrders.length} доступных заказов`);
      console.log(`[OrderService] Исключено ${allAvailableOrders.length - filteredOrders.length} заказов на занятые даты`);
      console.log(`[OrderService] Показываем ${filteredOrders.length} заказов`);

      return filteredOrders;
    } catch (error) {
      console.error('[OrderService] Ошибка получения доступных заказов:', error);
      return [];
    }
  }

  /**
   * Получение всех доступных заказов (для гостевого режима и главного экрана)
   * Не требует авторизации, показывает все новые заказы
   */
  async getAvailableOrders(): Promise<Order[]> {
    try {
      console.log('[OrderService] Загружаем доступные заказы для главного экрана');
      const orders = await this.getNewOrdersForWorkers();
      console.log(`[OrderService] Загружено ${orders.length} доступных заказов`);
      return orders;
    } catch (error) {
      console.error('[OrderService] Ошибка получения доступных заказов:', error);
      return [];
    }
  }

  /**
   * Получение активных заказов для текущего пользователя (заказчика)
   * Включает все заказы кроме завершенных и отмененных
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
        .not('status', 'in', '(completed,cancelled)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OrderService] Ошибка получения новых заказов пользователя из Supabase:', error);
        return [];
      }

      const orders: Order[] = data.map((item: any) => ({
        id: item.id,
        type: item.type || 'daily', // Добавляем тип заказа
        title: item.title,
        description: item.description,
        category: item.category || 'other',
        specializationId: item.specialization_id || undefined,
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
        viewsCount: item.views_count || 0,
        // Дополнительные удобства
        transportPaid: item.transport_paid || false,
        mealIncluded: item.meal_included || false,
        mealPaid: item.meal_paid || false,
        // Поля для вакансий
        jobTitle: item.job_title,
        experienceLevel: item.experience_level,
        employmentType: item.employment_type,
        workFormat: item.work_format,
        workSchedule: item.work_schedule,
        city: item.city,
        salaryFrom: item.salary_from,
        salaryTo: item.salary_to,
        salaryPeriod: item.salary_period,
        salaryType: item.salary_type,
        paymentFrequency: item.payment_frequency,
        skills: item.skills || [],
        languages: item.languages || [],
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
        type: data.type || 'daily', // Добавляем тип заказа
        title: data.title,
        description: data.description,
        category: data.category || 'other',
        specializationId: data.specialization_id || undefined,
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
        viewsCount: data.views_count || 0,
        // Дополнительные удобства
        transportPaid: data.transport_paid || false,
        mealIncluded: data.meal_included || false,
        mealPaid: data.meal_paid || false,
        // Поля для вакансий
        jobTitle: data.job_title,
        experienceLevel: data.experience_level,
        employmentType: data.employment_type,
        workFormat: data.work_format,
        workSchedule: data.work_schedule,
        city: data.city,
        salaryFrom: data.salary_from,
        salaryTo: data.salary_to,
        salaryPeriod: data.salary_period,
        salaryType: data.salary_type,
        paymentFrequency: data.payment_frequency,
        skills: data.skills || [],
        languages: data.languages || [],
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
   * Получение статуса заявки пользователя на конкретный заказ
   */
  async getUserApplicationStatus(orderId: string): Promise<{ hasApplied: boolean; status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled' }> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return { hasApplied: false };
      }

      const { data, error } = await supabase
        .from('applicants')
        .select('status, orders!inner(status)')
        .eq('order_id', orderId)
        .eq('worker_id', authState.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 - no rows found
        console.error('[OrderService] Ошибка получения статуса заявки:', error);
        return { hasApplied: false };
      }

      if (!data) {
        return { hasApplied: false };
      }

      // Определяем статус заявки с учетом статуса заказа
      let applicationStatus = data.status;
      if (data.status === 'accepted' && data.orders.status === 'completed') {
        applicationStatus = 'completed';
      }

      return {
        hasApplied: true,
        status: applicationStatus as 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
      };
    } catch (error) {
      console.error('[OrderService] Ошибка получения статуса заявки:', error);
      return { hasApplied: false };
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
            type,
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
        } else if (order.status === 'cancelled') {
          // Если заказ отменен, то заявка тоже считается отмененной
          applicationStatus = 'cancelled';
        }

        return {
          id: item.id,
          orderId: order.id,
          orderType: order.type || 'daily', // Добавляем тип заказа
          orderTitle: order.title,
          orderCategory: order.category || 'other',
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
        const applicantIds = remainingApplicants?.map((a: any) => `${a.id} (${a.status})`) || [];
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

      // Скрываем отмененные отклики
      if (applicant.status === 'cancelled') {
        console.log(`[OrderService] 🚫 Скрываем отмененный отклик: ${applicant.workerName}`);
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
      console.log(`[OrderService] 🔍 Все отклики для заказа ${orderId}:`, allApplicants.map(a => `${a.id} (${a.status})`));

      const filteredApplicants = this.filterApplicantsForCustomer(allApplicants);
      console.log(`[OrderService] 🔍 Отфильтрованные отклики:`, filteredApplicants.map(a => `${a.id} (${a.status})`));

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

          // Планируем напоминание заказчику о завершении работы
          this.scheduleCompleteWorkReminder(order.customerId, orderId, order.serviceDate).catch(error => {
            console.error('[OrderService] ❌ Ошибка планирования напоминания о завершении работы:', error);
          });

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

      const conflictingApplicationIds = data?.map((item: any) => item.id) || [];
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
      const affectedOrderIds = [...new Set(pendingApplications.map((app: any) => app.order_id))];

      // Отклоняем все найденные отклики
      const applicationIds = pendingApplications.map((app: any) => app.id);
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
        await this.checkAndRevertOrderStatus(orderId as string);
        await this.updateActiveApplicantsCount(orderId as string);
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

        // Планируем напоминание за день до работы
        this.scheduleWorkReminder(workerId, applicantData.order_id, serviceDate).catch(error => {
          console.error('[OrderService] ❌ Ошибка планирования напоминания о работе:', error);
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
      console.log('\n🔥🔥🔥 [OrderService] НАЧАЛО ОТПРАВКИ УВЕДОМЛЕНИЙ О НОВОМ ЗАКАЗЕ 🔥🔥🔥');
      console.log('[OrderService] 📤 Заказ ID:', order.id);
      console.log('[OrderService] 📝 Заголовок заказа:', order.title);
      console.log('[OrderService] 💰 Бюджет:', order.budget);
      console.log('[OrderService] 📍 Локация:', order.location);
      console.log('[OrderService] 🕒 Время вызова:', new Date().toISOString());
      console.log('[OrderService] 📊 Статус заказа:', order.status);

      // 🔧 ДЕДУПЛИКАЦИЯ: Проверяем, не отправляли ли уже уведомления для этого заказа
      console.log('[OrderService] 🔍 Проверяем дедупликацию...');
      console.log('[OrderService] 📋 Текущий кэш уведомленных заказов:', Array.from(this.notifiedOrders));

      if (this.notifiedOrders.has(order.id)) {
        console.log('[OrderService] ⚠️ ДЕДУПЛИКАЦИЯ: Уведомления для заказа', order.id, 'уже отправлены, пропускаем');
        return;
      }

      // Помечаем заказ как уведомленный
      this.notifiedOrders.add(order.id);
      console.log('[OrderService] ✅ Заказ', order.id, 'добавлен в список уведомленных');
      console.log('[OrderService] 📋 Обновленный кэш:', Array.from(this.notifiedOrders));

      // Получаем всех исполнителей из базы данных
      console.log('[OrderService] 🔍 Получаем список исполнителей из Supabase...');
      const startTime = Date.now();

      const { data: workers, error } = await supabase
        .from('users')
        .select('id, role, preferred_language, created_at')
        .eq('role', 'worker');

      const queryTime = Date.now() - startTime;
      console.log(`[OrderService] ⏱️ Запрос к БД выполнен за ${queryTime}мс`);

      if (error) {
        console.error('[OrderService] ❌ КРИТИЧЕСКАЯ ОШИБКА получения списка исполнителей:', error);
        console.error('[OrderService] 🔍 Детали ошибки:', JSON.stringify(error, null, 2));
        return;
      }

      console.log('[OrderService] 📊 Результат запроса к БД:');
      console.log('[OrderService] 📊 Количество найденных записей:', workers?.length || 0);

      if (workers && workers.length > 0) {
        console.log('[OrderService] 👥 Первые 3 исполнителя:');
        workers.slice(0, 3).forEach((worker: any, index: number) => {
          console.log(`[OrderService]   ${index + 1}. ID: ${worker.id}, Язык: ${worker.preferred_language || 'не указан'}`);
        });
      }

      if (!workers || workers.length === 0) {
        console.log('[OrderService] ⚠️ ПРОБЛЕМА: Нет исполнителей для уведомления');
        console.log('[OrderService] 🔍 Проверьте, есть ли пользователи с role="worker" в таблице users');
        return;
      }

      const workerIds = workers.map((worker: any) => worker.id);
      console.log(`[OrderService] 👥 Найдено ${workerIds.length} исполнителей`);
      console.log('[OrderService] 📋 ID исполнителей:', workerIds);

      // Получаем переведенные уведомления для всех исполнителей
      const notificationParams = {
        title: order.title,
        budget: order.budget,
        location: order.location
      };

      console.log('[OrderService] 🌐 Параметры для перевода:', notificationParams);
      console.log('[OrderService] 🔄 Получаем переводы уведомлений...');

      const translationStartTime = Date.now();
      const translatedNotifications = await getTranslatedNotificationsForUsers(
        workerIds,
        'new_order',
        notificationParams
      );
      const translationTime = Date.now() - translationStartTime;

      console.log(`[OrderService] ⏱️ Переводы получены за ${translationTime}мс`);
      console.log(`[OrderService] 📝 Получено переводов: ${translatedNotifications.size} из ${workerIds.length} запрошенных`);

      if (translatedNotifications.size === 0) {
        console.log('[OrderService] ❌ ПРОБЛЕМА: Не получено ни одного перевода!');
        return;
      }

      // Показываем примеры переводов
      console.log('[OrderService] 📝 Примеры переводов:');
      let exampleCount = 0;
      for (const [userId, notification] of translatedNotifications) {
        if (exampleCount < 3) {
          console.log(`[OrderService]   ${userId}: "${notification.title}" - "${notification.body}"`);
          exampleCount++;
        }
      }

      const data = {
        orderId: order.id,
        orderTitle: order.title,
        orderBudget: order.budget,
        orderLocation: order.location,
        type: 'new_order'
      };

      console.log('[OrderService] 📦 Данные для уведомления:', data);

      // 🚀 ОПТИМИЗИРОВАННАЯ ОТПРАВКА: Группируем по языкам и отправляем параллельно
      console.log('[OrderService] 📤 НАЧИНАЕМ ОПТИМИЗИРОВАННУЮ ОТПРАВКУ УВЕДОМЛЕНИЙ...');

      // Группируем пользователей по языкам для пакетной отправки
      const usersByLanguage = new Map<string, {
        userIds: string[],
        title: string,
        body: string
      }>();

      for (const workerId of workerIds) {
        const notification = translatedNotifications.get(workerId);
        if (notification) {
          const key = `${notification.title}|${notification.body}`;
          if (!usersByLanguage.has(key)) {
            usersByLanguage.set(key, {
              userIds: [],
              title: notification.title,
              body: notification.body
            });
          }
          usersByLanguage.get(key)!.userIds.push(workerId);
        }
      }

      console.log(`[OrderService] 🌐 Сгруппировано по языкам: ${usersByLanguage.size} групп`);
      usersByLanguage.forEach((group, key) => {
        console.log(`[OrderService] 📋 Группа "${group.title}": ${group.userIds.length} пользователей`);
      });

      // ⚠️ ОТПРАВКА УВЕДОМЛЕНИЙ ОТКЛЮЧЕНА - ИСПОЛЬЗУЕТСЯ СЕРВЕРНАЯ СИСТЕМА
      // Уведомления теперь отправляются автоматически через database triggers + CRON
      // См. SQL/create_notification_triggers.sql и osonish-admin/src/app/api/cron/
      console.log(`[OrderService] 🔕 Отправка уведомлений из мобильного приложения отключена`);
      console.log(`[OrderService] 🖥️ Уведомления будут отправлены автоматически с сервера`);
      
      // Заглушка для совместимости с кодом ниже
      const batchStartTime = Date.now();
      const batchPromises = Array.from(usersByLanguage.values()).map(async (group) => {
        console.log(`[OrderService] 📝 Пропускаем отправку для ${group.userIds.length} пользователей (серверная система)`);
        return { sent: 0, failed: 0 }; // Возвращаем 0, т.к. отправка на сервере
      });

      // Ждем завершения всех пакетов
      const batchResults = await Promise.allSettled(batchPromises);
      const batchTime = Date.now() - batchStartTime;

      // Подсчитываем итоги
      let sentCount = 0;
      let failedCount = 0;

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          sentCount += result.value.sent;
          failedCount += result.value.failed;
        } else {
          console.error(`[OrderService] ❌ Пакет ${index + 1} завершился с ошибкой:`, result.reason);
          // Считаем всех пользователей в этом пакете как неудачные
          const groupSize = Array.from(usersByLanguage.values())[index]?.userIds.length || 0;
          failedCount += groupSize;
        }
      });

      console.log(`[OrderService] ⚡ Пакетная отправка завершена за ${batchTime}мс`);

      console.log('\n🔥🔥🔥 [OrderService] ИТОГИ ОТПРАВКИ УВЕДОМЛЕНИЙ 🔥🔥🔥');
      console.log(`[OrderService] ✅ Успешно отправлено: ${sentCount}`);
      console.log(`[OrderService] ❌ Не удалось отправить: ${failedCount}`);
      console.log(`[OrderService] 📊 Общий процент успеха: ${Math.round((sentCount / workerIds.length) * 100)}%`);
      console.log(`[OrderService] 🕒 Время завершения: ${new Date().toISOString()}`);

    } catch (error) {
      console.error('\n🚨🚨🚨 [OrderService] КРИТИЧЕСКАЯ ОШИБКА ОТПРАВКИ УВЕДОМЛЕНИЙ 🚨🚨🚨');
      console.error('[OrderService] ❌ Ошибка:', error);
      console.error('[OrderService] 📊 Stack trace:', error instanceof Error ? error.stack : 'Нет stack trace');

      // В случае ошибки убираем заказ из кэша чтобы можно было повторить попытку
      this.notifiedOrders.delete(order.id);
      console.log('[OrderService] 🔄 Заказ удален из кэша для повторной попытки');
    }
  }

  /**
   * Очистка кэша уведомленных заказов (для отладки или перезапуска)
   */
  public clearNotificationCache(): void {
    console.log('[OrderService] 🧹 Очищаем кэш уведомленных заказов');
    console.log('[OrderService] 📋 Кэш до очистки:', Array.from(this.notifiedOrders));
    this.notifiedOrders.clear();
    console.log('[OrderService] ✅ Кэш очищен');
  }

  /**
   * Тестовая функция для проверки уведомлений о новых заказах
   */
  public async testNewOrderNotifications(orderId?: string): Promise<void> {
    try {
      console.log('\n🧪 [OrderService] ТЕСТИРОВАНИЕ УВЕДОМЛЕНИЙ О НОВЫХ ЗАКАЗАХ');

      // Если передан ID заказа, используем его, иначе создаем тестовый заказ
      let testOrder: Order;

      if (orderId) {
        console.log('[OrderService] 🔍 Получаем заказ по ID:', orderId);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error || !data) {
          console.error('[OrderService] ❌ Заказ не найден:', error);
          return;
        }

        testOrder = {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category || 'other',
          specializationId: data.specialization_id || undefined,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          budget: data.budget,
          workersNeeded: data.workers_needed,
          serviceDate: data.service_date,
          photos: data.photos || [],
          status: data.status,
          customerId: data.customer_id,
          applicantsCount: data.applicants_count,
          transportPaid: data.transport_paid || false,
          mealIncluded: data.meal_included || false,
          mealPaid: data.meal_paid || false,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      } else {
        // Создаем тестовый заказ
        testOrder = {
          id: 'test-order-' + Date.now(),
          title: 'Тестовый заказ для проверки уведомлений',
          description: 'Это тестовый заказ для отладки системы уведомлений',
          category: 'cleaning',
          specializationId: undefined,
          location: 'Ташкент, Узбекистан',
          budget: 50000,
          workersNeeded: 1,
          serviceDate: new Date().toISOString(),
          photos: [],
          status: 'new',
          customerId: 'test-customer',
          applicantsCount: 0,
          transportPaid: false,
          mealIncluded: false,
          mealPaid: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      console.log('[OrderService] 📋 Тестовый заказ:', testOrder);

      // Очищаем кэш для повторного тестирования
      this.clearNotificationCache();

      // Запускаем отправку уведомлений
      await this.sendNewOrderNotifications(testOrder);

      console.log('\n✅ [OrderService] ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');

    } catch (error) {
      console.error('\n🚨 [OrderService] ОШИБКА ТЕСТИРОВАНИЯ:', error);
    }
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

      // Получаем переведенное уведомление для заказчика
      const notificationParams = {
        workerName: `${worker.firstName} ${worker.lastName}`,
        orderTitle: orderData.title
      };

      const notification = await getTranslatedNotification(
        orderData.customer_id,
        'new_application',
        notificationParams
      );

      const data = {
        orderId: orderData.id,
        orderTitle: orderData.title,
        workerId: worker.id,
        workerName: `${worker.firstName} ${worker.lastName}`,
        type: 'new_application'
      };

      // Отправляем уведомление заказчику
      // ⚠️ ОТКЛЮЧЕНО - используется серверная система (database triggers)
      // const sent = await notificationService.sendNotificationToUser(
      //   orderData.customer_id,
      //   notification.title,
      //   notification.body,
      //   data,
      //   'new_application'
      // );

      console.log('[OrderService] 🔕 Уведомление будет отправлено автоматически с сервера');
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

      // Получаем переведенное уведомление для исполнителя
      const notificationParams = {
        orderTitle: order.title,
        budget: order.budget
      };

      const notification = await getTranslatedNotification(
        applicantData.worker_id,
        'worker_selected',
        notificationParams
      );

      const data = {
        orderId: order.id,
        orderTitle: order.title,
        orderBudget: order.budget,
        orderLocation: order.location,
        applicantId: applicantData.id,
        type: 'worker_selected'
      };

      // Отправляем уведомление исполнителю
      // ⚠️ ОТКЛЮЧЕНО - используется серверная система (database triggers)
      // const sent = await notificationService.sendNotificationToUser(
      //   applicantData.worker_id,
      //   notification.title,
      //   notification.body,
      //   data,
      //   'order_update'
      // );

      console.log('[OrderService] 🔕 Уведомление будет отправлено автоматически с сервера');
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка отправки уведомления о выборе исполнителя:', error);
    }
  }

  /**
   * Планирование напоминания исполнителю за день до работы
   */
  private async scheduleWorkReminder(workerId: string, orderId: string, serviceDate: string): Promise<void> {
    try {
      console.log('[OrderService] 📅 Планируем напоминание о работе для исполнителя:', workerId);
      console.log('[OrderService] 📅 Заказ:', orderId, 'Дата работы:', serviceDate);

      // Получаем данные заказа для уведомления
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, title, location')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        console.error('[OrderService] ❌ Ошибка получения данных заказа для напоминания:', orderError);
        return;
      }

      // Вычисляем дату напоминания (за день до работы)
      const workDate = new Date(serviceDate);
      const reminderDate = new Date(workDate);
      reminderDate.setDate(workDate.getDate() - 1);

      // Устанавливаем время напоминания на 18:00 (6 PM) предыдущего дня
      reminderDate.setHours(18, 0, 0, 0);

      console.log('[OrderService] ⏰ Дата напоминания:', reminderDate.toISOString());

      // Проверяем, что дата напоминания в будущем
      const now = new Date();
      if (reminderDate <= now) {
        console.log('[OrderService] ⚠️ Дата напоминания уже прошла, пропускаем планирование');
        return;
      }

      // Сохраняем запланированное напоминание в базу данных
      const { error: insertError } = await supabase
        .from('scheduled_reminders')
        .insert({
          user_id: workerId,
          order_id: orderId,
          reminder_date: reminderDate.toISOString(),
          reminder_type: 'work_reminder',
          is_sent: false,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('[OrderService] ❌ Ошибка сохранения запланированного напоминания:', insertError);
        return;
      }

      console.log('[OrderService] ✅ Напоминание о работе запланировано на:', reminderDate.toISOString());

      // Если напоминание нужно отправить в ближайшие 5 минут, отправляем сразу
      const timeDiff = reminderDate.getTime() - now.getTime();
      if (timeDiff <= 5 * 60 * 1000) { // 5 минут в миллисекундах
        console.log('[OrderService] 🚀 Напоминание нужно отправить очень скоро, отправляем сразу');
        await this.sendWorkReminder(workerId, orderData);

        // Отмечаем как отправленное
        await supabase
          .from('scheduled_reminders')
          .update({ is_sent: true, sent_at: new Date().toISOString() })
          .eq('user_id', workerId)
          .eq('order_id', orderId)
          .eq('reminder_type', 'work_reminder');
      }

    } catch (error) {
      console.error('[OrderService] ❌ Ошибка планирования напоминания о работе:', error);
    }
  }

  /**
   * Отправка напоминания исполнителю о предстоящей работе
   */
  private async sendWorkReminder(workerId: string, orderData: any): Promise<void> {
    try {
      console.log('[OrderService] 📤 Отправляем напоминание о работе исполнителю:', workerId);

      // Получаем переведенное уведомление для исполнителя
      const notificationParams = {
        orderTitle: orderData.title,
        location: orderData.location
      };

      const notification = await getTranslatedNotification(
        workerId,
        'work_reminder',
        notificationParams
      );

      const data = {
        orderId: orderData.id,
        orderTitle: orderData.title,
        orderLocation: orderData.location,
        type: 'work_reminder'
      };

      // Отправляем уведомление исполнителю
      // ⚠️ ОТКЛЮЧЕНО - используется серверная система (scheduled_reminders + CRON)
      // const sent = await notificationService.sendNotificationToUser(
      //   workerId,
      //   notification.title,
      //   notification.body,
      //   data,
      //   'work_reminder'
      // );

      console.log('[OrderService] 🔕 Напоминание будет отправлено автоматически с сервера');
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка отправки напоминания о работе:', error);
    }
  }

  /**
   * Планирование напоминания заказчику о завершении работы
   */
  private async scheduleCompleteWorkReminder(customerId: string, orderId: string, serviceDate: string): Promise<void> {
    try {
      console.log('[OrderService] 📅 Планируем напоминание о завершении работы для заказчика:', customerId);
      console.log('[OrderService] 📅 Заказ:', orderId, 'Дата работы:', serviceDate);

      // Получаем данные заказа для уведомления
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, title, location')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        console.error('[OrderService] ❌ Ошибка получения данных заказа для напоминания о завершении:', orderError);
        return;
      }

      // Вычисляем дату напоминания о завершении
      // Напоминание отправляем на следующий день после serviceDate
      const workDate = new Date(serviceDate);
      const reminderDate = new Date(workDate);
      reminderDate.setDate(workDate.getDate() + 1); // На следующий день после работы

      // Устанавливаем время напоминания на 19:00 (7 PM)
      reminderDate.setHours(19, 0, 0, 0);

      console.log('[OrderService] ⏰ Дата напоминания о завершении:', reminderDate.toISOString());

      // Проверяем, что дата напоминания в будущем
      const now = new Date();
      if (reminderDate <= now) {
        console.log('[OrderService] ⚠️ Дата напоминания о завершении уже прошла, пропускаем планирование');
        return;
      }

      // Сохраняем запланированное напоминание в базу данных
      const { error: insertError } = await supabase
        .from('scheduled_reminders')
        .insert({
          user_id: customerId, // ID заказчика
          order_id: orderId,
          reminder_date: reminderDate.toISOString(),
          reminder_type: 'complete_work_reminder',
          is_sent: false,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('[OrderService] ❌ Ошибка сохранения запланированного напоминания о завершении:', insertError);
        return;
      }

      console.log('[OrderService] ✅ Напоминание о завершении работы запланировано на:', reminderDate.toISOString());

      // Если напоминание нужно отправить в ближайшие 5 минут, отправляем сразу
      const timeDiff = reminderDate.getTime() - now.getTime();
      if (timeDiff <= 5 * 60 * 1000) { // 5 минут в миллисекундах
        console.log('[OrderService] 🚀 Напоминание о завершении нужно отправить очень скоро, отправляем сразу');
        await this.sendCompleteWorkReminder(customerId, orderData);

        // Отмечаем как отправленное
        await supabase
          .from('scheduled_reminders')
          .update({ is_sent: true, sent_at: new Date().toISOString() })
          .eq('user_id', customerId)
          .eq('order_id', orderId)
          .eq('reminder_type', 'complete_work_reminder');
      }

    } catch (error) {
      console.error('[OrderService] ❌ Ошибка планирования напоминания о завершении работы:', error);
    }
  }

  /**
   * Отправка напоминания заказчику о завершении работы
   */
  private async sendCompleteWorkReminder(customerId: string, orderData: any): Promise<void> {
    try {
      console.log('[OrderService] 📤 Отправляем напоминание о завершении работы заказчику:', customerId);

      // Получаем переведенное уведомление для заказчика
      const notificationParams = {
        orderTitle: orderData.title
      };

      const notification = await getTranslatedNotification(
        customerId,
        'complete_work_reminder',
        notificationParams
      );

      const data = {
        orderId: orderData.id,
        orderTitle: orderData.title,
        type: 'complete_work_reminder'
      };

      // Отправляем уведомление заказчику
      // ⚠️ ОТКЛЮЧЕНО - используется серверная система (scheduled_reminders + CRON)
      // const sent = await notificationService.sendNotificationToUser(
      //   customerId,
      //   notification.title,
      //   notification.body,
      //   data,
      //   'complete_work_reminder'
      // );

      console.log('[OrderService] 🔕 Напоминание будет отправлено автоматически с сервера');
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка отправки напоминания о завершении работы:', error);
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

      const workerIds = acceptedApplicants.map((applicant: any) => applicant.worker_id);

      // Получаем переведенные уведомления для всех исполнителей
      const notificationParams = {
        orderTitle: orderData.title
      };

      const translatedNotifications = await getTranslatedNotificationsForUsers(
        workerIds,
        'order_completed',
        notificationParams
      );

      const data = {
        orderId: orderData.id,
        orderTitle: orderData.title,
        orderBudget: orderData.budget,
        type: 'order_completed'
      };

      // ⚠️ ОТКЛЮЧЕНО - используется серверная система (database triggers)
      // Отправляем уведомления каждому пользователю на его языке
      // let sentCount = 0;
      // for (const workerId of workerIds) {
      //   const notification = translatedNotifications.get(workerId);
      //   if (notification) {
      //     const sent = await notificationService.sendNotificationToUser(
      //       workerId,
      //       notification.title,
      //       notification.body,
      //       data,
      //       'order_completed'
      //     );
      //     if (sent) sentCount++;
      //   }
      // }

      console.log(`[OrderService] 🔕 Уведомления о завершении будут отправлены автоматически с сервера`);
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка отправки уведомлений о завершении заказа:', error);
    }
  }

  /**
   * Отправка уведомлений об обновлении заказа
   */
  private async sendOrderUpdatedNotifications(orderId: string): Promise<void> {
    try {
      console.log('[OrderService] 📤 Отправляем уведомления об обновлении заказа...');

      // Получаем данные заказа
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, title, budget, location')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        console.error('[OrderService] ❌ Ошибка получения данных заказа:', orderError);
        return;
      }

      // Получаем исполнителей, которые откликнулись на заказ
      const { data: applicants, error: applicantsError } = await supabase
        .from('applicants')
        .select('worker_id')
        .eq('order_id', orderId)
        .in('status', ['pending', 'accepted']);

      if (applicantsError) {
        console.error('[OrderService] ❌ Ошибка получения откликов:', applicantsError);
        return;
      }

      if (!applicants || applicants.length === 0) {
        console.log('[OrderService] ⚠️ Нет исполнителей для уведомления об обновлении');
        return;
      }

      const workerIds = applicants.map((applicant: any) => applicant.worker_id);

      // Получаем переведенные уведомления для всех исполнителей
      const notificationParams = {
        orderTitle: orderData.title
      };

      const translatedNotifications = await getTranslatedNotificationsForUsers(
        workerIds,
        'order_updated',
        notificationParams
      );

      const data = {
        orderId: orderData.id,
        orderTitle: orderData.title,
        orderBudget: orderData.budget,
        orderLocation: orderData.location,
        type: 'order_updated'
      };

      // ⚠️ ОТКЛЮЧЕНО - используется серверная система (database triggers)
      // Отправляем уведомления каждому пользователю на его языке
      // let sentCount = 0;
      // for (const workerId of workerIds) {
      //   const notification = translatedNotifications.get(workerId);
      //   if (notification) {
      //     const sent = await notificationService.sendNotificationToUser(
      //       workerId,
      //       notification.title,
      //       notification.body,
      //       data,
      //       'order_update'
      //     );
      //     if (sent) sentCount++;
      //   }
      // }

      console.log(`[OrderService] 🔕 Уведомления об обновлении будут отправлены автоматически с сервера`);
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка отправки уведомлений об обновлении заказа:', error);
    }
  }

  /**
   * Отправка уведомлений об отмене заказа
   */
  private async sendOrderCancelledNotifications(orderId: string, orderTitle: string, applicants: any[]): Promise<void> {
    try {
      console.log('[OrderService] 📤 Отправляем уведомления об отмене заказа...');

      const workerIds = applicants.map((applicant: any) => applicant.worker_id);

      // Получаем переведенные уведомления для всех исполнителей
      const notificationParams = {
        orderTitle: orderTitle
      };

      const translatedNotifications = await getTranslatedNotificationsForUsers(
        workerIds,
        'order_cancelled',
        notificationParams
      );

      const data = {
        orderId: orderId,
        orderTitle: orderTitle,
        type: 'order_cancelled'
      };

      // ⚠️ ОТКЛЮЧЕНО - используется серверная система (database triggers)
      // Отправляем уведомления каждому пользователю на его языке
      // let sentCount = 0;
      // for (const workerId of workerIds) {
      //   const notification = translatedNotifications.get(workerId);
      //   if (notification) {
      //     const sent = await notificationService.sendNotificationToUser(
      //       workerId,
      //       notification.title,
      //       notification.body,
      //       data,
      //       'order_cancelled'
      //     );
      //     if (sent) sentCount++;
      //   }
      // }

      console.log(`[OrderService] 🔕 Уведомления об отмене будут отправлены автоматически с сервера`);
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка отправки уведомлений об отмене заказа:', error);
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
        const customerIds = [...new Set(reviewsData.map((review: any) => review.customer_id))];
        const orderIds = [...new Set(reviewsData.map((review: any) => review.order_id))];

        // Загружаем информацию о заказчиках
        let customersMap = new Map();
        if (customerIds.length > 0) {
          const { data: customers } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .in('id', customerIds);

          if (customers) {
            customers.forEach((customer: any) => {
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
            orders.forEach((order: any) => {
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
          reviews.map((review: any) => ({
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
        reviews,
        workerType: userData.worker_type,
        // Поля для job_seeker
        education: userData.education,
        skills: userData.skills,
        workExperience: userData.work_experience,
        specializations: userData.specializations,
      };

      console.log(`[OrderService] ✅ Профиль исполнителя загружен: ${workerProfile.firstName} ${workerProfile.lastName}`);
      console.log(`[OrderService] 📊 Статистика: ${completedJobs} работ, ${workerProfile.totalReviews} отзывов, рейтинг ${workerProfile.averageRating}`);

      return workerProfile;
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка получения профиля исполнителя:', error);
      return null;
    }
  }

  /**
   * Проверка и отправка запланированных напоминаний
   * Этот метод должен вызываться периодически (например, каждые 15 минут)
   */
  async checkAndSendScheduledReminders(): Promise<void> {
    try {
      console.log('[OrderService] 🔍 Проверяем запланированные напоминания...');

      // Проверяем доступность Supabase
      if (!supabase) {
        console.error('[OrderService] ❌ Supabase клиент недоступен');
        return;
      }

      // ВРЕМЕННАЯ ПРОВЕРКА: проверяем существование таблицы scheduled_reminders
      const { error: tableCheckError } = await supabase
        .from('scheduled_reminders')
        .select('id')
        .limit(1);

      if (tableCheckError?.message?.includes('relation "scheduled_reminders" does not exist')) {
        console.warn('[OrderService] ⚠️ Таблица scheduled_reminders не существует. Пропускаем проверку напоминаний.');
        console.warn('[OrderService] 💡 Выполните SQL скрипт: osonish-admin/SQL/scheduled_reminders_table.sql');
        return;
      }

      const now = new Date();
      const checkTime = new Date(now.getTime() + 15 * 60 * 1000); // Проверяем на 15 минут вперед

      // Получаем все неотправленные напоминания, которые нужно отправить в ближайшие 15 минут
      const { data: reminders, error } = await supabase
        .from('scheduled_reminders')
        .select(`
          id,
          user_id,
          order_id,
          reminder_date,
          reminder_type
        `)
        .eq('is_sent', false)
        .in('reminder_type', ['work_reminder', 'complete_work_reminder'])
        .lte('reminder_date', checkTime.toISOString())
        .gte('reminder_date', now.toISOString());

      if (error) {
        console.error('[OrderService] ❌ Ошибка получения запланированных напоминаний:', error);

        // Детальная диагностика ошибки
        if (error.message?.includes('relation "scheduled_reminders" does not exist')) {
          console.error('[OrderService] 💡 Таблица scheduled_reminders не существует в базе данных');
          console.error('[OrderService] 💡 Выполните SQL скрипт: osonish-admin/SQL/create_reminders_table_simple.sql');
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          console.error('[OrderService] 💡 Проблема с сетевым подключением. Проверьте интернет.');
        } else if (error.message?.includes('JWT') || error.message?.includes('session')) {
          console.error('[OrderService] 💡 Проблема с аутентификацией Supabase');
        } else if (error.message?.includes('policy')) {
          console.error('[OrderService] 💡 Проблема с RLS политиками для таблицы scheduled_reminders');
        }

        return;
      }

      if (!reminders || reminders.length === 0) {
        console.log('[OrderService] ℹ️ Нет запланированных напоминаний для отправки');
        return;
      }

      console.log(`[OrderService] 📋 Найдено ${reminders.length} напоминаний для отправки`);

      // Отправляем каждое напоминание
      for (const reminder of reminders) {
        try {
          const recipientType = reminder.reminder_type === 'work_reminder' ? 'исполнителю' : 'заказчику';
          console.log(`[OrderService] 📤 Отправляем напоминание ${reminder.id} ${recipientType} ${reminder.user_id}`);

          // Получаем данные заказа (для тестовых заказов создаем фиктивные данные)
          let orderData;
          if (reminder.order_id.startsWith('test-order-')) {
            // Для тестовых заказов создаем фиктивные данные
            orderData = {
              id: reminder.order_id,
              title: 'Тестовый заказ для проверки уведомлений',
              location: 'Тестовый адрес, г. Ташкент'
            };
          } else {
            // Для реальных заказов получаем данные из базы
            const { data, error: orderError } = await supabase
              .from('orders')
              .select('id, title, location')
              .eq('id', reminder.order_id)
              .single();

            if (orderError || !data) {
              console.error(`[OrderService] ❌ Ошибка получения данных заказа ${reminder.order_id}:`, orderError);
              continue;
            }
            orderData = data;
          }

          // Выбираем правильный метод отправки в зависимости от типа напоминания
          if (reminder.reminder_type === 'work_reminder') {
            await this.sendWorkReminder(reminder.user_id, orderData);
          } else if (reminder.reminder_type === 'complete_work_reminder') {
            await this.sendCompleteWorkReminder(reminder.user_id, orderData);
          }

          // Отмечаем напоминание как отправленное
          const { error: updateError } = await supabase
            .from('scheduled_reminders')
            .update({
              is_sent: true,
              sent_at: new Date().toISOString()
            })
            .eq('id', reminder.id);

          if (updateError) {
            console.error(`[OrderService] ❌ Ошибка обновления статуса напоминания ${reminder.id}:`, updateError);
          } else {
            console.log(`[OrderService] ✅ Напоминание ${reminder.id} отправлено и отмечено как выполненное`);
          }

        } catch (reminderError) {
          console.error(`[OrderService] ❌ Ошибка отправки напоминания ${reminder.id}:`, reminderError);
        }
      }

      console.log('[OrderService] ✅ Проверка запланированных напоминаний завершена');

    } catch (error) {
      console.error('[OrderService] ❌ Ошибка проверки запланированных напоминаний:', error);
    }
  }

  /**
   * Запуск периодической проверки напоминаний
   * Вызывается при инициализации сервиса
   */
  private startReminderChecker(): void {
    // Проверяем напоминания каждые 15 минут
    const checkInterval = 15 * 60 * 1000; // 15 минут

    setInterval(() => {
      this.checkAndSendScheduledReminders().catch(error => {
        console.error('[OrderService] ❌ Ошибка в периодической проверке напоминаний:', error);
      });
    }, checkInterval);

    // Также запускаем первую проверку через 1 минуту после старта
    setTimeout(() => {
      this.checkAndSendScheduledReminders().catch(error => {
        console.error('[OrderService] ❌ Ошибка в первоначальной проверке напоминаний:', error);
      });
    }, 60 * 1000); // 1 минута

    console.log(`[OrderService] ⏰ Периодическая проверка напоминаний запущена (каждые ${checkInterval / 60000} минут)`);
  }


  /**
   * Тестовая функция для отправки напоминания о работе
   * Используется для проверки работы системы напоминаний
   */
  async testWorkReminder(workerId: string, orderTitle: string = 'Тестовый заказ', location: string = 'Тестовый адрес'): Promise<boolean> {
    try {
      console.log('[OrderService] 🧪 Тестируем отправку напоминания о работе...');

      const testOrderData = {
        id: 'test-order-id',
        title: orderTitle,
        location: location
      };

      await this.sendWorkReminder(workerId, testOrderData);

      console.log('[OrderService] ✅ Тестовое напоминание о работе отправлено');
      return true;
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка тестирования напоминания о работе:', error);
      return false;
    }
  }

  /**
   * Тестовая функция для отправки напоминания о завершении работы
   * Используется для проверки работы системы напоминаний
   */
  async testCompleteWorkReminder(customerId: string, orderTitle: string = 'Тестовый заказ'): Promise<boolean> {
    try {
      console.log('[OrderService] 🧪 Тестируем отправку напоминания о завершении работы...');

      const testOrderData = {
        id: 'test-order-id',
        title: orderTitle
      };

      await this.sendCompleteWorkReminder(customerId, testOrderData);

      console.log('[OrderService] ✅ Тестовое напоминание о завершении работы отправлено');
      return true;
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка тестирования напоминания о завершении работы:', error);
      return false;
    }
  }

  // ==================== ЛОГИРОВАНИЕ ЗВОНКОВ ====================

  /**
   * Логирует попытку звонка между пользователями
   */
  async logCallAttempt(callData: {
    orderId: string;
    callerId: string;
    receiverId: string;
    callerType: 'customer' | 'worker';
    receiverType: 'customer' | 'worker';
    phoneNumber: string;
    callSource: 'order_details' | 'applicants_list' | 'job_details';
  }): Promise<boolean> {
    try {
      console.log('[OrderService] 🔍 logCallAttempt начал выполнение с данными:', callData);

      // Проверяем доступность Supabase
      if (!supabase) {
        console.error('[OrderService] ❌ Supabase не инициализирован');
        return false;
      }

      console.log('[OrderService] 📋 Получаем информацию о заказе:', callData.orderId);

      // Получаем информацию о заказе для дополнительного контекста
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('status, created_at')
        .eq('id', callData.orderId)
        .single();

      if (orderError) {
        console.error('[OrderService] ❌ Ошибка получения данных заказа для логирования звонка:', orderError);
        return false;
      }

      console.log('[OrderService] 📋 Информация о заказе получена:', orderData);

      // Вычисляем количество дней с момента создания заказа
      const orderCreatedAt = new Date(orderData.created_at);
      const now = new Date();
      const daysSinceOrderCreated = Math.floor((now.getTime() - orderCreatedAt.getTime()) / (1000 * 60 * 60 * 24));

      const logEntry = {
        order_id: callData.orderId,
        caller_id: callData.callerId,
        receiver_id: callData.receiverId,
        caller_type: callData.callerType,
        receiver_type: callData.receiverType,
        phone_number: callData.phoneNumber,
        call_source: callData.callSource,
        order_status: orderData.status,
        days_since_order_created: daysSinceOrderCreated,
        call_initiated_at: new Date().toISOString()
      };

      console.log('[OrderService] 📝 Подготовлены данные для вставки в call_logs:', logEntry);

      // Создаем запись в таблице call_logs
      const { error: insertError } = await supabase
        .from('call_logs')
        .insert(logEntry);

      if (insertError) {
        console.error('[OrderService] ❌ Ошибка вставки в call_logs:', insertError);
        return false;
      }

      console.log('[OrderService] ✅ Звонок успешно залогирован в базу данных');
      return true;

    } catch (error) {
      console.error('[OrderService] ❌ Ошибка логирования звонка:', error);
      return false;
    }
  }

  /**
   * Логирует звонок без контекста заказа (например, из профиля профессионального мастера)
   */
  async logCallAttemptWithoutOrder(callData: {
    callerId: string;
    receiverId: string;
    callerType: 'customer' | 'worker';
    receiverType: 'customer' | 'worker';
    phoneNumber: string;
    callSource: 'professional_profile' | 'worker_profile' | 'other';
  }): Promise<boolean> {
    try {
      console.log('[OrderService] 🔍 logCallAttemptWithoutOrder начал выполнение с данными:', callData);

      // Проверяем доступность Supabase
      if (!supabase) {
        console.error('[OrderService] ❌ Supabase не инициализирован');
        return false;
      }

      const logEntry = {
        order_id: null, // Нет контекста заказа
        caller_id: callData.callerId,
        receiver_id: callData.receiverId,
        caller_type: callData.callerType,
        receiver_type: callData.receiverType,
        phone_number: callData.phoneNumber,
        call_source: callData.callSource,
        order_status: null, // Нет статуса заказа
        days_since_order_created: null, // Нет даты создания заказа
        call_initiated_at: new Date().toISOString()
      };

      console.log('[OrderService] 📝 Подготовлены данные для вставки в call_logs:', logEntry);

      // Создаем запись в таблице call_logs
      const { error: insertError } = await supabase
        .from('call_logs')
        .insert(logEntry);

      if (insertError) {
        console.error('[OrderService] ❌ Ошибка вставки в call_logs:', insertError);
        return false;
      }

      console.log('[OrderService] ✅ Звонок успешно залогирован в базу данных (без контекста заказа)');
      return true;

    } catch (error) {
      console.error('[OrderService] ❌ Ошибка логирования звонка:', error);
      return false;
    }
  }

  /**
   * Получает статистику звонков по заказу
   */
  async getCallStatsByOrder(orderId: string): Promise<{
    totalCalls: number;
    customerCalls: number;
    workerCalls: number;
    callsByDay: Array<{ date: string; count: number }>;
  } | null> {
    try {
      console.log('[OrderService] 📊 Получаем статистику звонков для заказа:', orderId);

      const { data: callLogs, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('order_id', orderId)
        .order('call_initiated_at', { ascending: true });

      if (error) {
        console.error('[OrderService] ❌ Ошибка получения статистики звонков:', error);
        return null;
      }

      const totalCalls = callLogs.length;
      const customerCalls = callLogs.filter((log: any) => log.caller_type === 'customer').length;
      const workerCalls = callLogs.filter((log: any) => log.caller_type === 'worker').length;

      // Группируем звонки по дням
      const callsByDay = callLogs.reduce((acc: { [key: string]: number }, log: any) => {
        const date = new Date(log.call_initiated_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const callsByDayArray = Object.entries(callsByDay).map(([date, count]) => ({
        date,
        count: count as number
      }));

      return {
        totalCalls,
        customerCalls,
        workerCalls,
        callsByDay: callsByDayArray
      };

    } catch (error) {
      console.error('[OrderService] ❌ Ошибка получения статистики звонков:', error);
      return null;
    }
  }

  /**
   * Получает общую статистику звонков для аналитики
   */
  async getCallAnalytics(dateFrom?: string, dateTo?: string): Promise<{
    totalCalls: number;
    callsByType: { customer: number; worker: number };
    callsBySource: { [key: string]: number };
    callsByOrderStatus: { [key: string]: number };
    avgCallsPerOrder: number;
    peakHours: Array<{ hour: number; count: number }>;
  } | null> {
    try {
      console.log('[OrderService] 📈 Получаем общую аналитику звонков');

      let query = supabase
        .from('call_logs')
        .select('*');

      if (dateFrom) {
        query = query.gte('call_initiated_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('call_initiated_at', dateTo);
      }

      const { data: callLogs, error } = await query;

      if (error) {
        console.error('[OrderService] ❌ Ошибка получения аналитики звонков:', error);
        return null;
      }

      const totalCalls = callLogs.length;

      // Статистика по типу звонящего
      const callsByType = {
        customer: callLogs.filter((log: any) => log.caller_type === 'customer').length,
        worker: callLogs.filter((log: any) => log.caller_type === 'worker').length
      };

      // Статистика по источнику звонка
      const callsBySource = callLogs.reduce((acc: { [key: string]: number }, log: any) => {
        acc[log.call_source] = (acc[log.call_source] || 0) + 1;
        return acc;
      }, {});

      // Статистика по статусу заказа
      const callsByOrderStatus = callLogs.reduce((acc: { [key: string]: number }, log: any) => {
        acc[log.order_status] = (acc[log.order_status] || 0) + 1;
        return acc;
      }, {});

      // Среднее количество звонков на заказ
      const uniqueOrders = new Set(callLogs.map((log: any) => log.order_id));
      const avgCallsPerOrder = uniqueOrders.size > 0 ? totalCalls / uniqueOrders.size : 0;

      // Пиковые часы звонков
      const callsByHour = callLogs.reduce((acc: { [key: number]: number }, log: any) => {
        const hour = new Date(log.call_initiated_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      const peakHours = Object.entries(callsByHour)
        .map(([hour, count]) => ({ hour: parseInt(hour), count: count as number }))
        .sort((a, b) => (b.count as number) - (a.count as number));

      return {
        totalCalls,
        callsByType,
        callsBySource,
        callsByOrderStatus,
        avgCallsPerOrder: Math.round(avgCallsPerOrder * 100) / 100,
        peakHours
      };

    } catch (error) {
      console.error('[OrderService] ❌ Ошибка получения аналитики звонков:', error);
      return null;
    }
  }

  /**
   * Автоматически обновляет статусы заказов в 20:00 GMT+5 в день выполнения:
   * - Заказы со статусом "В работе" (in_progress) завершаются автоматически
   * - Заказы со статусом "Новый" (new) и "Отклик получен" (response_received) отменяются автоматически
   */
  async autoCompleteOrders(): Promise<void> {
    try {
      console.log('[OrderService] 🔄 Проверка заказов для автоматического обновления статусов...');

      // Получаем текущее время
      const now = new Date();

      // Конвертируем в GMT+5 (Узбекистан)
      const gmtPlus5Offset = 5 * 60; // 5 часов в минутах
      const localOffset = now.getTimezoneOffset(); // смещение локального времени в минутах
      const gmtPlus5Time = new Date(now.getTime() + (gmtPlus5Offset + localOffset) * 60 * 1000);

      console.log(`[OrderService] 🕐 Текущее время GMT+5: ${gmtPlus5Time.toLocaleString()}`);

      // Проверяем, что время >= 20:00
      const currentHour = gmtPlus5Time.getHours();
      if (currentHour < 20) {
        console.log(`[OrderService] ⏰ Еще не время для автоматического обновления статусов (текущий час: ${currentHour})`);
        return;
      }

      // Получаем сегодняшнюю дату в формате YYYY-MM-DD для GMT+5
      const todayGMTPlus5 = gmtPlus5Time.toISOString().split('T')[0];
      console.log(`[OrderService] 📅 Ищем заказы на дату: ${todayGMTPlus5}`);

      // 1. Ищем заказы со статусом 'in_progress' на сегодняшнюю дату для автозавершения
      const startOfDay = `${todayGMTPlus5}T00:00:00.000Z`;
      const endOfDay = `${todayGMTPlus5}T23:59:59.999Z`;

      const { data: ordersToComplete, error: completeError } = await supabase
        .from('orders')
        .select('id, customer_id, title')
        .eq('status', 'in_progress')
        .gte('service_date', startOfDay)
        .lte('service_date', endOfDay);

      if (completeError) {
        console.error('[OrderService] ❌ Ошибка получения заказов для автозавершения:', completeError);
      } else {
        if (ordersToComplete && ordersToComplete.length > 0) {
          console.log(`[OrderService] 📋 Найдено ${ordersToComplete.length} заказов "В работе" для автозавершения`);

          // Завершаем каждый заказ
          for (const order of ordersToComplete) {
            try {
              console.log(`[OrderService] 🔄 Автозавершение заказа: ${order.id}`);

              // Обновляем статус заказа на 'completed' и помечаем как автозавершенный
              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  status: 'completed',
                  auto_completed: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

              if (updateError) {
                console.error(`[OrderService] ❌ Ошибка обновления заказа ${order.id}:`, updateError);
                continue;
              }

              // Обновляем статус принятых откликов на 'completed'
              const { error: applicantsError } = await supabase
                .from('applicants')
                .update({
                  status: 'completed',
                  updated_at: new Date().toISOString()
                })
                .eq('order_id', order.id)
                .eq('status', 'accepted');

              if (applicantsError) {
                console.error(`[OrderService] ❌ Ошибка обновления откликов для заказа ${order.id}:`, applicantsError);
              }

              // Отправляем уведомление о завершении заказа
              await this.sendOrderCompletedNotifications(order.id);

              // Добавляем запись о необходимости оценки
              await this.addPendingRating(order.customer_id, order.id);

              console.log(`[OrderService] ✅ Заказ ${order.id} автоматически завершен`);

            } catch (orderError) {
              console.error(`[OrderService] ❌ Ошибка при автозавершении заказа ${order.id}:`, orderError);
            }
          }
        } else {
          console.log('[OrderService] ✅ Нет заказов "В работе" для автозавершения');
        }
      }

      // 2. Ищем заказы со статусом 'new' и 'response_received' на сегодняшнюю дату для автоотмены
      const { data: ordersToCancel, error: cancelError } = await supabase
        .from('orders')
        .select('id, customer_id, title, status')
        .in('status', ['new', 'response_received'])
        .gte('service_date', startOfDay)
        .lte('service_date', endOfDay);

      if (cancelError) {
        console.error('[OrderService] ❌ Ошибка получения заказов для автоотмены:', cancelError);
      } else {
        if (ordersToCancel && ordersToCancel.length > 0) {
          console.log(`[OrderService] 📋 Найдено ${ordersToCancel.length} заказов "Новый"/"Отклик получен" для автоотмены`);

          // Отменяем каждый заказ
          for (const order of ordersToCancel) {
            try {
              console.log(`[OrderService] 🔄 Автоотмена заказа: ${order.id} (статус: ${order.status})`);

              // Обновляем статус заказа на 'cancelled' и помечаем как автоотмененный
              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  status: 'cancelled',
                  auto_cancelled: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

              if (updateError) {
                console.error(`[OrderService] ❌ Ошибка обновления заказа ${order.id}:`, updateError);
                continue;
              }

              // Отменяем все ожидающие отклики
              const { error: applicantsError } = await supabase
                .from('applicants')
                .update({
                  status: 'cancelled',
                  updated_at: new Date().toISOString()
                })
                .eq('order_id', order.id)
                .eq('status', 'pending');

              if (applicantsError) {
                console.error(`[OrderService] ❌ Ошибка отмены откликов для заказа ${order.id}:`, applicantsError);
              }

              // Получаем отклики для отправки уведомлений
              const { data: applicants } = await supabase
                .from('applicants')
                .select('worker_id')
                .eq('order_id', order.id)
                .eq('status', 'pending');

              // Отправляем уведомление об отмене заказа
              if (applicants && applicants.length > 0) {
                await this.sendOrderCancelledNotifications(order.id, order.title, applicants);
              }

              console.log(`[OrderService] ✅ Заказ ${order.id} автоматически отменен`);

            } catch (orderError) {
              console.error(`[OrderService] ❌ Ошибка при автоотмене заказа ${order.id}:`, orderError);
            }
          }
        } else {
          console.log('[OrderService] ✅ Нет заказов "Новый"/"Отклик получен" для автоотмены');
        }
      }

      console.log('[OrderService] ✅ Автоматическое обновление статусов заказов завершено');

    } catch (error) {
      console.error('[OrderService] ❌ Ошибка автоматического обновления статусов заказов:', error);
    }
  }

  /**
   * ТЕСТОВАЯ версия автообновления заказов БЕЗ проверки времени
   * Обрабатывает ВСЕ заказы на сегодняшнюю дату (не только тестовые)
   * Используется только для тестирования в режиме разработки
   */
  async autoCompleteOrdersForTesting(): Promise<void> {
    try {
      console.log('[OrderService] 🧪 ТЕСТ: Принудительное обновление статусов заказов (без проверки времени)...');

      // Получаем сегодняшнюю дату без проверки времени
      const today = new Date().toISOString().split('T')[0];
      console.log(`[OrderService] 📅 ТЕСТ: Ищем заказы на дату: ${today}`);

      // Отладочная информация - показываем все заказы пользователя на сегодня
      const authState = authService.getAuthState();
      if (authState.isAuthenticated && authState.user) {
        // Ищем заказы по дате с учетом времени (используем диапазон дат)
        const startOfDay = `${today}T00:00:00.000Z`;
        const endOfDay = `${today}T23:59:59.999Z`;

        const { data: allTodayOrders, error: debugError } = await supabase
          .from('orders')
          .select('id, title, status, service_date, customer_id')
          .eq('customer_id', authState.user.id)
          .gte('service_date', startOfDay)
          .lte('service_date', endOfDay);

        if (!debugError && allTodayOrders) {
          console.log(`[OrderService] 🔍 ОТЛАДКА: Найдено ${allTodayOrders.length} заказов пользователя на сегодня:`);
          allTodayOrders.forEach((order: any) => {
            console.log(`  - ${order.id}: "${order.title}" (статус: ${order.status})`);
          });
        }
      }

      // 1. Ищем заказы со статусом 'in_progress' на сегодняшнюю дату для автозавершения
      const startOfDay = `${today}T00:00:00.000Z`;
      const endOfDay = `${today}T23:59:59.999Z`;

      const { data: ordersToComplete, error: completeError } = await supabase
        .from('orders')
        .select('id, customer_id, title')
        .eq('status', 'in_progress')
        .gte('service_date', startOfDay)
        .lte('service_date', endOfDay);

      if (completeError) {
        console.error('[OrderService] ❌ ТЕСТ: Ошибка получения заказов для автозавершения:', completeError);
      } else {
        if (ordersToComplete && ordersToComplete.length > 0) {
          console.log(`[OrderService] 📋 ТЕСТ: Найдено ${ordersToComplete.length} заказов "В работе" для автозавершения`);

          // Завершаем каждый заказ
          for (const order of ordersToComplete) {
            try {
              console.log(`[OrderService] 🔄 ТЕСТ: Автозавершение заказа: ${order.id}`);

              // Обновляем статус заказа на 'completed' и помечаем как автозавершенный
              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  status: 'completed',
                  auto_completed: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

              if (updateError) {
                console.error(`[OrderService] ❌ ТЕСТ: Ошибка обновления заказа ${order.id}:`, updateError);
                continue;
              }

              // Обновляем статус принятых откликов на 'completed'
              const { error: applicantsError } = await supabase
                .from('applicants')
                .update({
                  status: 'completed',
                  updated_at: new Date().toISOString()
                })
                .eq('order_id', order.id)
                .eq('status', 'accepted');

              if (applicantsError) {
                console.error(`[OrderService] ❌ ТЕСТ: Ошибка обновления откликов для заказа ${order.id}:`, applicantsError);
              }

              // Отправляем уведомление о завершении заказа
              await this.sendOrderCompletedNotifications(order.id);

              // Добавляем запись о необходимости оценки
              await this.addPendingRating(order.customer_id, order.id);

              console.log(`[OrderService] ✅ ТЕСТ: Заказ ${order.id} автоматически завершен`);

            } catch (orderError) {
              console.error(`[OrderService] ❌ ТЕСТ: Ошибка при автозавершении заказа ${order.id}:`, orderError);
            }
          }
        } else {
          console.log('[OrderService] ✅ ТЕСТ: Нет заказов "В работе" для автозавершения');
        }
      }

      // 2. Ищем заказы со статусом 'new' и 'response_received' на сегодняшнюю дату для автоотмены
      const { data: ordersToCancel, error: cancelError } = await supabase
        .from('orders')
        .select('id, customer_id, title, status')
        .in('status', ['new', 'response_received'])
        .gte('service_date', startOfDay)
        .lte('service_date', endOfDay);

      if (cancelError) {
        console.error('[OrderService] ❌ ТЕСТ: Ошибка получения заказов для автоотмены:', cancelError);
      } else {
        if (ordersToCancel && ordersToCancel.length > 0) {
          console.log(`[OrderService] 📋 ТЕСТ: Найдено ${ordersToCancel.length} заказов "Новый"/"Отклик получен" для автоотмены`);

          // Отменяем каждый заказ
          for (const order of ordersToCancel) {
            try {
              console.log(`[OrderService] 🔄 ТЕСТ: Автоотмена заказа: ${order.id} (статус: ${order.status})`);

              // Обновляем статус заказа на 'cancelled' и помечаем как автоотмененный
              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  status: 'cancelled',
                  auto_cancelled: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

              if (updateError) {
                console.error(`[OrderService] ❌ ТЕСТ: Ошибка обновления заказа ${order.id}:`, updateError);
                continue;
              }

              // Отменяем все ожидающие отклики
              const { error: applicantsError } = await supabase
                .from('applicants')
                .update({
                  status: 'cancelled',
                  updated_at: new Date().toISOString()
                })
                .eq('order_id', order.id)
                .eq('status', 'pending');

              if (applicantsError) {
                console.error(`[OrderService] ❌ ТЕСТ: Ошибка отмены откликов для заказа ${order.id}:`, applicantsError);
              }

              // Получаем отклики для отправки уведомлений
              const { data: applicants } = await supabase
                .from('applicants')
                .select('worker_id')
                .eq('order_id', order.id)
                .eq('status', 'pending');

              // Отправляем уведомление об отмене заказа
              if (applicants && applicants.length > 0) {
                await this.sendOrderCancelledNotifications(order.id, order.title, applicants);
              }

              console.log(`[OrderService] ✅ ТЕСТ: Заказ ${order.id} автоматически отменен`);

            } catch (orderError) {
              console.error(`[OrderService] ❌ ТЕСТ: Ошибка при автоотмене заказа ${order.id}:`, orderError);
            }
          }
        } else {
          console.log('[OrderService] ✅ ТЕСТ: Нет заказов "Новый"/"Отклик получен" для автоотмены');
        }
      }

      console.log('[OrderService] ✅ ТЕСТ: Принудительное автоматическое обновление статусов заказов завершено');

    } catch (error) {
      console.error('[OrderService] ❌ ТЕСТ: Ошибка принудительного автоматического обновления статусов заказов:', error);
    }
  }

  /**
   * ТЕСТОВАЯ версия автообновления ТОЛЬКО тестовых заказов БЕЗ проверки времени
   * Обрабатывает только заказы с префиксом "🧪 ТЕСТ:"
   * Используется для безопасного тестирования без влияния на реальные заказы
   */
  async autoCompleteTestOrdersOnly(): Promise<void> {
    try {
      console.log('[OrderService] 🧪 ТЕСТ: Принудительное обновление ТОЛЬКО тестовых заказов (без проверки времени)...');

      // Получаем сегодняшнюю дату без проверки времени
      const today = new Date().toISOString().split('T')[0];
      console.log(`[OrderService] 📅 ТЕСТ: Ищем ТОЛЬКО тестовые заказы на дату: ${today}`);

      // 1. Ищем ТОЛЬКО тестовые заказы со статусом 'in_progress' на сегодняшнюю дату для автозавершения
      const { data: ordersToComplete, error: completeError } = await supabase
        .from('orders')
        .select('id, customer_id, title')
        .eq('status', 'in_progress')
        .eq('service_date', today)
        .like('title', '🧪 ТЕСТ:%');

      if (completeError) {
        console.error('[OrderService] ❌ ТЕСТ: Ошибка получения тестовых заказов для автозавершения:', completeError);
      } else {
        if (ordersToComplete && ordersToComplete.length > 0) {
          console.log(`[OrderService] 📋 ТЕСТ: Найдено ${ordersToComplete.length} ТЕСТОВЫХ заказов "В работе" для автозавершения`);

          // Завершаем каждый заказ
          for (const order of ordersToComplete) {
            try {
              console.log(`[OrderService] 🔄 ТЕСТ: Автозавершение тестового заказа: ${order.id}`);

              // Обновляем статус заказа на 'completed' и помечаем как автозавершенный
              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  status: 'completed',
                  auto_completed: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

              if (updateError) {
                console.error(`[OrderService] ❌ ТЕСТ: Ошибка обновления тестового заказа ${order.id}:`, updateError);
                continue;
              }

              // Обновляем статус принятых откликов на 'completed'
              const { error: applicantsError } = await supabase
                .from('applicants')
                .update({
                  status: 'completed',
                  updated_at: new Date().toISOString()
                })
                .eq('order_id', order.id)
                .eq('status', 'accepted');

              if (applicantsError) {
                console.error(`[OrderService] ❌ ТЕСТ: Ошибка обновления откликов для тестового заказа ${order.id}:`, applicantsError);
              }

              // Отправляем уведомление о завершении заказа
              await this.sendOrderCompletedNotifications(order.id);

              // Добавляем запись о необходимости оценки
              await this.addPendingRating(order.customer_id, order.id);

              console.log(`[OrderService] ✅ ТЕСТ: Тестовый заказ ${order.id} автоматически завершен`);

            } catch (orderError) {
              console.error(`[OrderService] ❌ ТЕСТ: Ошибка при автозавершении тестового заказа ${order.id}:`, orderError);
            }
          }
        } else {
          console.log('[OrderService] ✅ ТЕСТ: Нет ТЕСТОВЫХ заказов "В работе" для автозавершения');
        }
      }

      // 2. Ищем ТОЛЬКО тестовые заказы со статусом 'new' и 'response_received' на сегодняшнюю дату для автоотмены
      const { data: ordersToCancel, error: cancelError } = await supabase
        .from('orders')
        .select('id, customer_id, title, status')
        .in('status', ['new', 'response_received'])
        .eq('service_date', today)
        .like('title', '🧪 ТЕСТ:%');

      if (cancelError) {
        console.error('[OrderService] ❌ ТЕСТ: Ошибка получения тестовых заказов для автоотмены:', cancelError);
      } else {
        if (ordersToCancel && ordersToCancel.length > 0) {
          console.log(`[OrderService] 📋 ТЕСТ: Найдено ${ordersToCancel.length} ТЕСТОВЫХ заказов "Новый"/"Отклик получен" для автоотмены`);

          // Отменяем каждый заказ
          for (const order of ordersToCancel) {
            try {
              console.log(`[OrderService] 🔄 ТЕСТ: Автоотмена тестового заказа: ${order.id} (статус: ${order.status})`);

              // Обновляем статус заказа на 'cancelled' и помечаем как автоотмененный
              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  status: 'cancelled',
                  auto_cancelled: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

              if (updateError) {
                console.error(`[OrderService] ❌ ТЕСТ: Ошибка обновления тестового заказа ${order.id}:`, updateError);
                continue;
              }

              // Отменяем все ожидающие отклики
              const { error: applicantsError } = await supabase
                .from('applicants')
                .update({
                  status: 'cancelled',
                  updated_at: new Date().toISOString()
                })
                .eq('order_id', order.id)
                .eq('status', 'pending');

              if (applicantsError) {
                console.error(`[OrderService] ❌ ТЕСТ: Ошибка отмены откликов для тестового заказа ${order.id}:`, applicantsError);
              }

              // Получаем отклики для отправки уведомлений
              const { data: applicants } = await supabase
                .from('applicants')
                .select('worker_id')
                .eq('order_id', order.id)
                .eq('status', 'pending');

              // Отправляем уведомление об отмене заказа
              if (applicants && applicants.length > 0) {
                await this.sendOrderCancelledNotifications(order.id, order.title, applicants);
              }

              console.log(`[OrderService] ✅ ТЕСТ: Тестовый заказ ${order.id} автоматически отменен`);

            } catch (orderError) {
              console.error(`[OrderService] ❌ ТЕСТ: Ошибка при автоотмене тестового заказа ${order.id}:`, orderError);
            }
          }
        } else {
          console.log('[OrderService] ✅ ТЕСТ: Нет ТЕСТОВЫХ заказов "Новый"/"Отклик получен" для автоотмены');
        }
      }

      console.log('[OrderService] ✅ ТЕСТ: Принудительное автоматическое обновление ТОЛЬКО тестовых заказов завершено');

    } catch (error) {
      console.error('[OrderService] ❌ ТЕСТ: Ошибка принудительного автоматического обновления тестовых заказов:', error);
    }
  }

  /**
   * Добавляет запись о необходимости оценки заказа заказчиком
   */
  private async addPendingRating(customerId: string, orderId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .rpc('add_pending_rating', {
          p_customer_id: customerId,
          p_order_id: orderId
        });

      if (error) {
        console.error('[OrderService] ❌ Ошибка добавления записи о необходимости оценки:', error);
      } else if (data) {
        console.log(`[OrderService] ✅ Добавлена запись о необходимости оценки для заказа ${orderId}`);
      }
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка добавления записи о необходимости оценки:', error);
    }
  }

  /**
   * Получает заказы, требующие оценки от заказчика
   */
  async getPendingRatingsForCustomer(customerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_pending_ratings_for_customer', {
          p_customer_id: customerId
        });

      if (error) {
        console.error('[OrderService] ❌ Ошибка получения заказов для оценки:', error);
        return [];
      }

      // data теперь содержит JSON массив
      const jsonData = Array.isArray(data) ? data : (data || []);

      // Преобразуем данные в нужный формат
      return jsonData.map((item: any) => ({
        order_id: item.order_id,
        orders: {
          id: item.order_id,
          title: item.order_title,
          description: item.order_description,
          service_date: item.service_date,
          location: item.location,
          budget: item.budget
        }
      }));
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка получения заказов для оценки:', error);
      return [];
    }
  }

  /**
   * Удаляет запись о необходимости оценки после того, как заказчик оценил заказ
   */
  async removePendingRating(customerId: string, orderId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .rpc('remove_pending_rating', {
          p_customer_id: customerId,
          p_order_id: orderId
        });

      if (error) {
        console.error('[OrderService] ❌ Ошибка удаления записи о необходимости оценки:', error);
      } else if (data) {
        console.log(`[OrderService] ✅ Удалена запись о необходимости оценки для заказа ${orderId}`);
      }
    } catch (error) {
      console.error('[OrderService] ❌ Ошибка удаления записи о необходимости оценки:', error);
    }
  }

  /**
   * Увеличить счетчик просмотров заказа
   */
  async incrementOrderViews(orderId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_order_views', {
        order_id_param: orderId
      });

      if (error) {
        console.error('[OrderService] Ошибка увеличения счетчика просмотров заказа:', error);
      } else {
        console.log(`[OrderService] Просмотр заказа ${orderId} зарегистрирован`);
      }
    } catch (error) {
      console.error('[OrderService] Ошибка в incrementOrderViews:', error);
    }
  }
}

// Экспортируем синглтон
export const orderService = OrderService.getInstance();