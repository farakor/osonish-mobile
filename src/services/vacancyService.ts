import { supabase } from './supabaseClient';
import { authService } from './authService';
import {
  VacancyApplication,
  CreateVacancyApplicationRequest,
  CreateVacancyRequest,
  UpdateVacancyApplicationStatusRequest,
  UpdateVacancyRequest,
  UpdateVacancyResponse,
  VacancyApplicationStatus,
  Order,
  CreateOrderResponse,
} from '../types';

export class VacancyService {
  private static instance: VacancyService;

  static getInstance(): VacancyService {
    if (!VacancyService.instance) {
      VacancyService.instance = new VacancyService();
    }
    return VacancyService.instance;
  }

  /**
   * Генерация уникального ID для вакансии
   */
  private generateVacancyId(): string {
    return `vacancy_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Создать вакансию
   */
  async createVacancy(request: CreateVacancyRequest): Promise<CreateOrderResponse> {
    try {
      console.log('[VacancyService] 🔨 Создание вакансии:', request.jobTitle);

      // Валидация входных данных
      if (!request.jobTitle?.trim()) {
        return {
          success: false,
          error: 'Название вакансии обязательно'
        };
      }

      if (!request.description?.trim()) {
        return {
          success: false,
          error: 'Описание вакансии обязательно'
        };
      }

      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return {
          success: false,
          error: 'Пользователь не авторизован'
        };
      }

      // Проверяем, что только заказчики могут создавать вакансии
      if (authState.user.role !== 'customer') {
        return {
          success: false,
          error: 'Только заказчики могут создавать вакансии'
        };
      }

      const vacancyId = this.generateVacancyId();
      console.log('[VacancyService] 🆔 Сгенерированный ID вакансии:', vacancyId);
      const currentTime = new Date().toISOString();

      // Создаем вакансию в Supabase
      const vacancyData: any = {
        id: vacancyId,
        type: 'vacancy',
        title: request.jobTitle, // Используем jobTitle как title для совместимости
        job_title: request.jobTitle,
        description: request.description,
        category: 'vacancy', // Обязательное поле для таблицы orders
        specialization_id: request.specializationId,
        location: request.location,
        latitude: request.latitude || null,
        longitude: request.longitude || null,
        city: request.city,
        // Поля, обязательные для таблицы orders (но не используемые в вакансиях)
        budget: 0, // Для вакансий не используется, указываем salary
        workers_needed: 1, // Для вакансий обычно 1 позиция
        service_date: new Date().toISOString(), // Дата размещения вакансии
        photos: [], // Для вакансий обычно не используются фото
        // Поля вакансии
        experience_level: request.experienceLevel,
        employment_type: request.employmentType,
        work_format: request.workFormat,
        work_schedule: request.workSchedule,
        salary_from: request.salaryFrom || null,
        salary_to: request.salaryTo || null,
        salary_period: request.salaryPeriod,
        salary_type: request.salaryType,
        payment_frequency: request.paymentFrequency,
        skills: request.skills || [],
        languages: request.languages || [],
        // Системные поля
        customer_id: authState.user.id,
        created_by_role: authState.user.role,
        status: 'new',
        applicants_count: 0,
        transport_paid: false,
        meal_included: false,
        meal_paid: false,
        auto_completed: false,
        created_at: currentTime,
        updated_at: currentTime
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(vacancyData)
        .select()
        .single();

      if (error) {
        console.error('[VacancyService] ❌ Ошибка создания вакансии в Supabase:', error);
        console.error('[VacancyService] 📋 Детали ошибки:', JSON.stringify(error, null, 2));
        return {
          success: false,
          error: 'Не удалось создать вакансию'
        };
      }

      console.log('[VacancyService] ✅ Вакансия успешно создана:', data);
      return {
        success: true,
        orderId: vacancyId
      };

    } catch (error) {
      console.error('[VacancyService] ❌ Ошибка при создании вакансии:', error);
      return {
        success: false,
        error: 'Произошла ошибка при создании вакансии'
      };
    }
  }

  /**
   * Обновление вакансии
   */
  async updateVacancy(request: UpdateVacancyRequest): Promise<UpdateVacancyResponse> {
    try {
      console.log('[VacancyService] 🔨 Обновление вакансии:', request.vacancyId);
      console.log('[VacancyService] 🕒 Время обновления:', new Date().toISOString());

      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return {
          success: false,
          error: 'Пользователь не авторизован'
        };
      }

      // Проверяем, что вакансия принадлежит текущему пользователю
      const { data: existingVacancy, error: fetchError } = await supabase
        .from('orders')
        .select('customer_id, status, type')
        .eq('id', request.vacancyId)
        .eq('type', 'vacancy')
        .single();

      if (fetchError || !existingVacancy) {
        console.error('[VacancyService] Вакансия не найдена:', fetchError);
        return {
          success: false,
          error: 'Вакансия не найдена'
        };
      }

      if (existingVacancy.customer_id !== authState.user.id) {
        console.error('[VacancyService] Вакансия не принадлежит пользователю');
        return {
          success: false,
          error: 'У вас нет прав на редактирование этой вакансии'
        };
      }

      // Проверяем, что вакансию можно редактировать (только новые вакансии)
      if (existingVacancy.status !== 'new') {
        console.error('[VacancyService] Вакансию нельзя редактировать в текущем статусе:', existingVacancy.status);
        return {
          success: false,
          error: 'Вакансию нельзя редактировать в текущем статусе'
        };
      }

      // Подготавливаем данные для обновления
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (request.jobTitle !== undefined) {
        updateData.job_title = request.jobTitle;
        updateData.title = request.jobTitle; // Синхронизируем с title
      }
      if (request.description !== undefined) {
        updateData.description = request.description;
      }
      if (request.specializationId !== undefined) {
        updateData.specialization_id = request.specializationId;
      }
      if (request.location !== undefined) {
        updateData.location = request.location;
      }
      if (request.latitude !== undefined) {
        updateData.latitude = request.latitude;
      }
      if (request.longitude !== undefined) {
        updateData.longitude = request.longitude;
      }
      if (request.city !== undefined) {
        updateData.city = request.city;
      }
      if (request.experienceLevel !== undefined) {
        updateData.experience_level = request.experienceLevel;
      }
      if (request.employmentType !== undefined) {
        updateData.employment_type = request.employmentType;
      }
      if (request.workFormat !== undefined) {
        updateData.work_format = request.workFormat;
      }
      if (request.workSchedule !== undefined) {
        updateData.work_schedule = request.workSchedule;
      }
      if (request.salaryFrom !== undefined) {
        updateData.salary_from = request.salaryFrom;
      }
      if (request.salaryTo !== undefined) {
        updateData.salary_to = request.salaryTo;
      }
      if (request.salaryPeriod !== undefined) {
        updateData.salary_period = request.salaryPeriod;
      }
      if (request.salaryType !== undefined) {
        updateData.salary_type = request.salaryType;
      }
      if (request.paymentFrequency !== undefined) {
        updateData.payment_frequency = request.paymentFrequency;
      }
      if (request.skills !== undefined) {
        updateData.skills = request.skills;
      }
      if (request.languages !== undefined) {
        updateData.languages = request.languages;
      }

      console.log('[VacancyService] 📝 Данные для обновления:', updateData);

      // Обновляем вакансию в базе данных
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', request.vacancyId)
        .select()
        .single();

      if (error) {
        console.error('[VacancyService] ❌ Ошибка обновления вакансии:', error);
        return {
          success: false,
          error: 'Не удалось обновить вакансию'
        };
      }

      console.log('[VacancyService] ✅ Вакансия успешно обновлена');
      return {
        success: true,
        data: this.mapOrderFromDatabase(data)
      };

    } catch (error) {
      console.error('[VacancyService] ❌ Критическая ошибка обновления вакансии:', error);
      return {
        success: false,
        error: 'Произошла ошибка при обновлении вакансии'
      };
    }
  }

  /**
   * Получить все вакансии
   */
  async getVacancies(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!customer_id(city, user_type, company_name)
        `)
        .eq('type', 'vacancy')
        .eq('status', 'new')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[VacancyService] Ошибка получения вакансий:', error);
        throw error;
      }

      return this.mapOrdersFromDatabase(data || []);
    } catch (error) {
      console.error('[VacancyService] Ошибка получения вакансий:', error);
      throw error;
    }
  }

  /**
   * Получить вакансию по ID
   */
  async getVacancyById(vacancyId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!customer_id(city, user_type, company_name)
        `)
        .eq('id', vacancyId)
        .eq('type', 'vacancy')
        .single();

      if (error) {
        console.error('[VacancyService] Ошибка получения вакансии:', error);
        return null;
      }

      // Получаем количество непросмотренных откликов из view
      const { data: unreadData } = await supabase
        .from('order_unread_applicants_count')
        .select('unread_count')
        .eq('order_id', vacancyId)
        .single();

      // Добавляем unread_count в data
      data.unread_applicants_count = unreadData ? [{ unread_count: unreadData.unread_count }] : [];

      return this.mapOrderFromDatabase(data);
    } catch (error) {
      console.error('[VacancyService] Ошибка получения вакансии:', error);
      return null;
    }
  }

  /**
   * Откликнуться на вакансию
   */
  async applyToVacancy(request: CreateVacancyApplicationRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return {
          success: false,
          error: 'Пользователь не авторизован',
        };
      }

      // Получаем информацию о вакансии
      const vacancy = await this.getVacancyById(request.vacancyId);
      
      // Проверяем, не является ли пользователь автором вакансии
      if (vacancy && vacancy.customerId === authState.user.id) {
        return {
          success: false,
          error: 'Вы не можете откликнуться на свою собственную вакансию',
        };
      }

      // Проверяем, не откликался ли уже пользователь
      const { data: existingApplication } = await supabase
        .from('vacancy_applications')
        .select('id')
        .eq('vacancy_id', request.vacancyId)
        .eq('applicant_id', authState.user.id)
        .single();

      if (existingApplication) {
        return {
          success: false,
          error: 'Вы уже откликнулись на эту вакансию',
        };
      }

      const { error } = await supabase
        .from('vacancy_applications')
        .insert({
          vacancy_id: request.vacancyId,
          applicant_id: authState.user.id,
          cover_letter: request.coverLetter,
          status: 'pending',
        });

      if (error) {
        console.error('[VacancyService] Ошибка отклика на вакансию:', error);
        return {
          success: false,
          error: 'Не удалось отправить отклик',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('[VacancyService] Ошибка отклика на вакансию:', error);
      return {
        success: false,
        error: 'Произошла ошибка при отправке отклика',
      };
    }
  }

  /**
   * Получить отклики на вакансию (для работодателя)
   */
  async getVacancyApplications(vacancyId: string): Promise<VacancyApplication[]> {
    try {
      const { data, error } = await supabase
        .from('vacancy_applications')
        .select(`
          *,
          users:applicant_id (
            id,
            first_name,
            last_name,
            phone,
            profile_image,
            education,
            skills,
            work_experience,
            willing_to_relocate,
            desired_salary
          )
        `)
        .eq('vacancy_id', vacancyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[VacancyService] Ошибка получения откликов:', error);
        throw error;
      }

      return (data || []).map((app: any) => ({
        id: app.id,
        vacancyId: app.vacancy_id,
        applicantId: app.applicant_id,
        applicantName: `${app.users?.first_name || ''} ${app.users?.last_name || ''}`.trim(),
        applicantPhone: app.users?.phone || '',
        applicantAvatar: app.users?.profile_image,
        coverLetter: app.cover_letter,
        status: app.status,
        appliedAt: app.created_at,
        updatedAt: app.updated_at,
        applicantEducation: app.users?.education,
        applicantSkills: app.users?.skills,
        applicantWorkExperience: app.users?.work_experience,
        applicantWillingToRelocate: app.users?.willing_to_relocate,
        applicantDesiredSalary: app.users?.desired_salary,
      }));
    } catch (error) {
      console.error('[VacancyService] Ошибка получения откликов:', error);
      return [];
    }
  }

  /**
   * Получить мои отклики на вакансии (для соискателя)
   */
  async getMyVacancyApplications(): Promise<VacancyApplication[]> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return [];
      }

      const { data, error } = await supabase
        .from('vacancy_applications')
        .select(`
          *,
          orders:vacancy_id (
            id,
            job_title,
            city,
            salary_from,
            salary_to,
            salary_period
          )
        `)
        .eq('applicant_id', authState.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[VacancyService] Ошибка получения моих откликов:', error);
        throw error;
      }

      return (data || []).map((app: any) => ({
        id: app.id,
        vacancyId: app.vacancy_id,
        applicantId: app.applicant_id,
        applicantName: '',
        applicantPhone: '',
        coverLetter: app.cover_letter,
        status: app.status,
        appliedAt: app.created_at,
        updatedAt: app.updated_at,
      }));
    } catch (error) {
      console.error('[VacancyService] Ошибка получения моих откликов:', error);
      return [];
    }
  }

  /**
   * Обновить статус отклика на вакансию
   */
  async updateVacancyApplicationStatus(
    request: UpdateVacancyApplicationStatusRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('vacancy_applications')
        .update({ status: request.status })
        .eq('id', request.applicationId);

      if (error) {
        console.error('[VacancyService] Ошибка обновления статуса отклика:', error);
        return {
          success: false,
          error: 'Не удалось обновить статус отклика',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('[VacancyService] Ошибка обновления статуса отклика:', error);
      return {
        success: false,
        error: 'Произошла ошибка при обновлении статуса',
      };
    }
  }

  /**
   * Проверить, откликался ли пользователь на вакансию
   */
  async hasAppliedToVacancy(vacancyId: string): Promise<boolean> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return false;
      }

      const { data, error } = await supabase
        .from('vacancy_applications')
        .select('id')
        .eq('vacancy_id', vacancyId)
        .eq('applicant_id', authState.user.id)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Маппинг заказа из базы данных
   */
  private mapOrderFromDatabase(data: any): Order {
    return {
      id: data.id,
      type: data.type || 'daily',
      title: data.title,
      description: data.description,
      category: data.category,
      specializationId: data.specialization_id,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      budget: data.budget,
      workersNeeded: data.workers_needed,
      serviceDate: data.service_date,
      photos: data.photos || [],
      status: data.status,
      customerId: data.customer_id,
      customerCity: data.customer_city || data.customer?.city,
      customerUserType: data.customer?.user_type as 'individual' | 'company' || undefined,
      customerCompanyName: data.customer?.company_name || undefined,
      applicantsCount: data.applicants_count || 0,
      pendingApplicantsCount: data.pending_applicants_count || 0,
      unreadApplicantsCount: data.unread_applicants_count?.[0]?.unread_count || 0,
      applicantsLastViewedAt: data.applicants_last_viewed_at,
      viewsCount: data.views_count || 0,
      transportPaid: data.transport_paid,
      mealIncluded: data.meal_included,
      mealPaid: data.meal_paid,
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
      updatedAt: data.updated_at,
    };
  }

  /**
   * Маппинг массива заказов из базы данных
   */
  private mapOrdersFromDatabase(data: any[]): Order[] {
    return data.map((item) => this.mapOrderFromDatabase(item));
  }

  /**
   * Увеличить счетчик просмотров вакансии
   */
  async incrementVacancyViews(vacancyId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_order_views', {
        order_id_param: vacancyId
      });

      if (error) {
        console.error('[VacancyService] Ошибка увеличения счетчика просмотров вакансии:', error);
      } else {
        console.log(`[VacancyService] Просмотр вакансии ${vacancyId} зарегистрирован`);
      }
    } catch (error) {
      console.error('[VacancyService] Ошибка в incrementVacancyViews:', error);
    }
  }

  /**
   * Завершить (закрыть) вакансию
   */
  async closeVacancy(vacancyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return {
          success: false,
          error: 'Пользователь не авторизован'
        };
      }

      // Проверяем, что вакансия принадлежит текущему пользователю
      const { data: existingVacancy, error: fetchError } = await supabase
        .from('orders')
        .select('customer_id, status, type')
        .eq('id', vacancyId)
        .eq('type', 'vacancy')
        .single();

      if (fetchError || !existingVacancy) {
        console.error('[VacancyService] Вакансия не найдена:', fetchError);
        return {
          success: false,
          error: 'Вакансия не найдена'
        };
      }

      if (existingVacancy.customer_id !== authState.user.id) {
        return {
          success: false,
          error: 'У вас нет прав на завершение этой вакансии'
        };
      }

      // Проверяем, что вакансия еще не завершена
      if (existingVacancy.status === 'completed' || existingVacancy.status === 'cancelled') {
        return {
          success: false,
          error: 'Вакансия уже завершена'
        };
      }

      // Обновляем статус вакансии на "completed"
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', vacancyId)
        .eq('type', 'vacancy');

      if (updateError) {
        console.error('[VacancyService] ❌ Ошибка завершения вакансии:', updateError);
        return {
          success: false,
          error: 'Не удалось завершить вакансию'
        };
      }

      console.log('[VacancyService] ✅ Вакансия успешно завершена');
      return {
        success: true
      };

    } catch (error) {
      console.error('[VacancyService] ❌ Критическая ошибка завершения вакансии:', error);
      return {
        success: false,
        error: 'Произошла ошибка при завершении вакансии'
      };
    }
  }

  /**
   * Отметить отклики вакансии как просмотренные
   */
  async markVacancyApplicantsAsViewed(vacancyId: string): Promise<void> {
    try {
      console.log('[VacancyService] 👁️ Отметка откликов вакансии как просмотренных:', vacancyId);

      const { error } = await supabase
        .rpc('mark_applicants_as_viewed', {
          p_order_id: vacancyId
        });

      if (error) {
        console.error('[VacancyService] Ошибка при отметке откликов как просмотренных:', error);
        throw error;
      }

      console.log('[VacancyService] ✅ Отклики вакансии отмечены как просмотренные');
    } catch (error) {
      console.error('[VacancyService] Ошибка при отметке откликов вакансии как просмотренных:', error);
      throw error;
    }
  }
}

export const vacancyService = VacancyService.getInstance();

