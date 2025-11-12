import { supabase } from './supabaseClient';
import { authService } from './authService';
import {
  VacancyApplication,
  CreateVacancyApplicationRequest,
  CreateVacancyRequest,
  UpdateVacancyApplicationStatusRequest,
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
   * Получить все вакансии
   */
  async getVacancies(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
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
        .select('*')
        .eq('id', vacancyId)
        .eq('type', 'vacancy')
        .single();

      if (error) {
        console.error('[VacancyService] Ошибка получения вакансии:', error);
        return null;
      }

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
      customerCity: data.customer_city,
      applicantsCount: data.applicants_count || 0,
      pendingApplicantsCount: data.pending_applicants_count || 0,
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
}

export const vacancyService = VacancyService.getInstance();

