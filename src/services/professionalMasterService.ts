import { supabase } from './supabaseClient';
import { User, Specialization } from '../types';

export interface ProfessionalMaster extends User {
  workerType: 'professional' | 'daily_worker' | 'job_seeker';
  aboutMe?: string;
  specializations: Specialization[];
  workPhotos?: string[];
  averageRating: number;
  totalReviews: number;
  completedJobs: number;
  // Дополнительные поля для резюме
  gender?: 'male' | 'female';
  employmentTypes?: string[];
  workSchedules?: string[];
  willingToTravel?: boolean;
}

export interface GetMastersParams {
  specializationId?: string;
  city?: string;
  limit?: number;
  offset?: number;
  includeDailyWorkers?: boolean;
  includeJobSeekers?: boolean;
}

export interface GetMastersResult {
  masters: ProfessionalMaster[];
  totalCount: number;
  hasMore: boolean;
}

class ProfessionalMasterService {
  /**
   * Вспомогательная функция для парсинга данных пользователя
   */
  private parseUserData(user: any): any {
    // Парсим специализации, если они пришли как строка JSON
    let parsedSpecializations = user.specializations;
    if (typeof user.specializations === 'string') {
      try {
        parsedSpecializations = JSON.parse(user.specializations);
      } catch (e) {
        parsedSpecializations = [];
      }
    }

    // Парсим work_experience если это строка
    let parsedWorkExperience = user.work_experience || [];
    if (typeof user.work_experience === 'string') {
      try {
        parsedWorkExperience = JSON.parse(user.work_experience);
      } catch (error) {
        parsedWorkExperience = [];
      }
    }

    // Парсим education если это строка
    let parsedEducation = user.education || [];
    if (typeof user.education === 'string') {
      try {
        parsedEducation = JSON.parse(user.education);
      } catch (error) {
        parsedEducation = [];
      }
    }

    // Парсим skills если это строка
    let parsedSkills = user.skills || [];
    if (typeof user.skills === 'string') {
      try {
        parsedSkills = JSON.parse(user.skills);
      } catch (error) {
        parsedSkills = [];
      }
    }

    return {
      ...user,
      specializations: parsedSpecializations,
      work_experience: parsedWorkExperience,
      education: parsedEducation,
      skills: parsedSkills,
    };
  }

  /**
   * Преобразование данных пользователя в ProfessionalMaster
   */
  private async transformToMaster(user: any): Promise<ProfessionalMaster> {
    const stats = await this.getMasterStats(user.id);
    
    return {
      ...user,
      firstName: user.first_name,
      lastName: user.last_name,
      middleName: user.middle_name,
      birthDate: user.birth_date,
      profileImage: user.profile_image,
      preferredLanguage: user.preferred_language,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      workerType: user.worker_type,
      aboutMe: user.about_me,
      specializations: user.specializations || [],
      workPhotos: user.work_photos || [],
      profileViewsCount: user.profile_views_count || 0,
      education: user.education || [],
      skills: user.skills || [],
      workExperience: user.work_experience || [],
      willingToRelocate: user.willing_to_relocate,
      desiredSalary: user.desired_salary,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      completedJobs: stats.completedJobs,
    } as ProfessionalMaster;
  }

  /**
   * Получить список профессиональных мастеров с пагинацией (новый метод)
   * Фильтрация по специализации происходит на клиенте после парсинга данных
   */
  async getMastersWithPagination(params: GetMastersParams = {}): Promise<GetMastersResult> {
    try {
      const {
        specializationId,
        city,
        limit = 20,
        offset = 0,
        includeDailyWorkers = true,
        includeJobSeekers = true,
      } = params;

      console.log('[ProfessionalMasterService] getMastersWithPagination - Параметры:', { 
        specializationId, city, limit, offset, includeDailyWorkers, includeJobSeekers 
      });

      // Определяем типы работников для выборки
      const workerTypes: string[] = [];
      
      // Professional всегда включаем
      workerTypes.push('professional');
      if (includeDailyWorkers) workerTypes.push('daily_worker');
      if (includeJobSeekers) workerTypes.push('job_seeker');

      // Получаем все данные без фильтрации по специализации на уровне БД
      // (фильтрация по специализации будет на клиенте после парсинга JSON)
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', 'worker')
        .in('worker_type', workerTypes)
        .not('specializations', 'is', null);

      // Фильтр по городу
      if (city) {
        query = query.eq('city', city);
      }

      // Сортировка
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('[ProfessionalMasterService] Ошибка получения мастеров:', error);
        return { masters: [], totalCount: 0, hasMore: false };
      }

      if (!data || data.length === 0) {
        console.log('[ProfessionalMasterService] Нет данных');
        return { masters: [], totalCount: 0, hasMore: false };
      }

      console.log('[ProfessionalMasterService] Получено из БД:', data.length, 'пользователей');

      // Парсим данные пользователей
      const parsedData = data.map(user => this.parseUserData(user));

      // Валидация и фильтрация данных на клиенте
      let validData = parsedData.filter(user => {
        const hasSpecializations = user.specializations &&
          Array.isArray(user.specializations) &&
          user.specializations.length > 0;

        if (!hasSpecializations) return false;

        // Для daily_worker и job_seeker фотографии работ не обязательны
        if (user.worker_type === 'daily_worker' || user.worker_type === 'job_seeker') {
          return true;
        }

        // Для professional требуем фотографии работ
        const hasWorkPhotos = user.work_photos &&
          Array.isArray(user.work_photos) &&
          user.work_photos.length > 0;
        
        return hasWorkPhotos;
      });

      // Фильтрация по специализации на клиенте (после парсинга JSON)
      if (specializationId) {
        validData = validData.filter(user => {
          return user.specializations.some((spec: Specialization) => spec.id === specializationId);
        });
      }

      console.log('[ProfessionalMasterService] После валидации и фильтрации:', validData.length, 'мастеров');

      // Применяем пагинацию на клиенте
      const totalCount = validData.length;
      const paginatedData = validData.slice(offset, offset + limit);

      // Преобразуем в ProfessionalMaster со статистикой
      const masters = await Promise.all(
        paginatedData.map(user => this.transformToMaster(user))
      );

      const hasMore = (offset + paginatedData.length) < totalCount;

      return {
        masters,
        totalCount,
        hasMore,
      };
    } catch (error) {
      console.error('[ProfessionalMasterService] Ошибка в getMastersWithPagination:', error);
      return { masters: [], totalCount: 0, hasMore: false };
    }
  }

  /**
   * Получить список профессиональных мастеров (устаревший метод для обратной совместимости)
   */
  async getMasters(params: GetMastersParams = {}): Promise<ProfessionalMaster[]> {
    const result = await this.getMastersWithPagination(params);
    return result.masters;
  }

  /**
   * Получить профессионального мастера по ID
   */
  async getMasterById(masterId: string): Promise<ProfessionalMaster | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', masterId)
        .in('worker_type', ['professional', 'daily_worker', 'job_seeker'])
        .single();

      if (error || !data) {
        console.error('Ошибка получения мастера:', error);
        return null;
      }

      console.log('[ProfessionalMasterService] Сырые данные из БД:', {
        id: data.id,
        worker_type: data.worker_type,
        education: data.education,
        work_experience: data.work_experience,
        skills: data.skills,
        willing_to_relocate: data.willing_to_relocate,
        desired_salary: data.desired_salary,
      });

      const stats = await this.getMasterStats(masterId);

      // Парсим work_experience если это строка
      let parsedWorkExperience = data.work_experience || [];
      if (typeof data.work_experience === 'string') {
        try {
          parsedWorkExperience = JSON.parse(data.work_experience);
          console.log('[ProfessionalMasterService] work_experience распарсен из строки:', parsedWorkExperience);
        } catch (error) {
          console.error('[ProfessionalMasterService] Ошибка парсинга work_experience:', error);
          parsedWorkExperience = [];
        }
      }

      // Парсим education если это строка
      let parsedEducation = data.education || [];
      if (typeof data.education === 'string') {
        try {
          parsedEducation = JSON.parse(data.education);
          console.log('[ProfessionalMasterService] education распарсен из строки:', parsedEducation);
        } catch (error) {
          console.error('[ProfessionalMasterService] Ошибка парсинга education:', error);
          parsedEducation = [];
        }
      }

      // Парсим skills если это строка
      let parsedSkills = data.skills || [];
      if (typeof data.skills === 'string') {
        try {
          parsedSkills = JSON.parse(data.skills);
          console.log('[ProfessionalMasterService] skills распарсен из строки:', parsedSkills);
        } catch (error) {
          console.error('[ProfessionalMasterService] Ошибка парсинга skills:', error);
          parsedSkills = [];
        }
      }

      const result = {
        ...data,
        firstName: data.first_name,
        lastName: data.last_name,
        middleName: data.middle_name,
        birthDate: data.birth_date,
        profileImage: data.profile_image,
        preferredLanguage: data.preferred_language,
        isVerified: data.is_verified,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        workerType: data.worker_type,
        aboutMe: data.about_me,
        specializations: data.specializations || [],
        workPhotos: data.work_photos || [],
        profileViewsCount: data.profile_views_count || 0,
        // Поля для job_seeker
        education: parsedEducation,
        skills: parsedSkills,
        workExperience: parsedWorkExperience,
        willingToRelocate: data.willing_to_relocate,
        desiredSalary: data.desired_salary,
        // Дополнительные поля для резюме
        gender: data.gender,
        employmentTypes: data.employment_types || [],
        workSchedules: data.work_schedules || [],
        willingToTravel: data.willing_to_travel,
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews,
        completedJobs: stats.completedJobs,
      } as ProfessionalMaster;

      console.log('[ProfessionalMasterService] Обработанные данные:', {
        id: result.id,
        workerType: result.workerType,
        education: result.education,
        workExperience: result.workExperience,
        skills: result.skills,
      });

      return result;
    } catch (error) {
      console.error('Ошибка в getMasterById:', error);
      return null;
    }
  }

  /**
   * Получить статистику мастера (рейтинг, отзывы, завершенные работы)
   */
  async getMasterStats(masterId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    completedJobs: number;
  }> {
    try {
      // Получаем средний рейтинг и количество отзывов
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('worker_id', masterId);

      let averageRating = 0;
      let totalReviews = 0;

      if (!reviewsError && reviewsData && reviewsData.length > 0) {
        totalReviews = reviewsData.length;
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        averageRating = totalRating / totalReviews;
      }

      // Получаем количество завершенных работ
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('worker_id', masterId)
        .eq('status', 'completed');

      const completedJobs = applicationsData?.length || 0;

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        completedJobs,
      };
    } catch (error) {
      console.error('Ошибка получения статистики мастера:', error);
      return {
        averageRating: 0,
        totalReviews: 0,
        completedJobs: 0,
      };
    }
  }

  /**
   * Получить рандомный список мастеров из разных специализаций
   */
  async getRandomMasters(city?: string, limit: number = 10, includeDailyWorkers: boolean = false, includeJobSeekers: boolean = true): Promise<ProfessionalMaster[]> {
    try {
      // Определяем типы работников для выборки
      const workerTypes: string[] = ['professional'];
      if (includeDailyWorkers) workerTypes.push('daily_worker');
      if (includeJobSeekers) workerTypes.push('job_seeker');
      
      // DEBUG: Проверяем всех профессиональных мастеров и работников на день без фильтров
      const { data: allProfessionals } = await supabase
        .from('users')
        .select('id, first_name, last_name, city, worker_type, specializations, work_photos')
        .eq('role', 'worker')
        .in('worker_type', workerTypes);

      console.log('[ProfessionalMasterService] DEBUG - Всего профмастеров в БД:', allProfessionals?.length || 0);
      if (allProfessionals && allProfessionals.length > 0) {
        allProfessionals.forEach((master, index) => {
          console.log(`[ProfessionalMasterService] Мастер ${index + 1}:`, {
            name: `${master.first_name} ${master.last_name}`,
            city: master.city,
            hasSpecializations: !!master.specializations,
            hasWorkPhotos: !!master.work_photos,
            specializationsValue: master.specializations,
            workPhotosValue: master.work_photos,
          });
        });
      }

      let query = supabase
        .from('users')
        .select('*')
        .eq('role', 'worker')
        .in('worker_type', workerTypes)
        .not('specializations', 'is', null);

      if (city) {
        query = query.eq('city', city);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.error('Ошибка получения рандомных мастеров:', error);
        return [];
      }

      console.log('[ProfessionalMasterService] getRandomMasters - Всего найдено:', data.length);
      console.log('[ProfessionalMasterService] Фильтры - город:', city, 'лимит:', limit);

      // Парсим специализации, если они пришли как строка JSON
      const normalizedData = data.map(user => {
        let parsedSpecializations = user.specializations;
        if (typeof user.specializations === 'string') {
          try {
            parsedSpecializations = JSON.parse(user.specializations);
          } catch (e) {
            console.error(`[ProfessionalMasterService] Ошибка парсинга специализаций для ${user.id}:`, e);
            parsedSpecializations = [];
          }
        }
        return { ...user, specializations: parsedSpecializations };
      });

      // ВАЖНО: Фильтруем мастеров с валидными данными на клиенте
      const validMasters = normalizedData.filter(user => {
        const hasSpecializations = user.specializations &&
          Array.isArray(user.specializations) &&
          user.specializations.length > 0;

        // Для daily_worker и job_seeker фотографии работ не обязательны
        if ((user.worker_type === 'daily_worker' && includeDailyWorkers) ||
            (user.worker_type === 'job_seeker' && includeJobSeekers)) {
          if (!hasSpecializations) {
            console.log(`[ProfessionalMasterService] Пропущен ${user.worker_type} ${user.first_name} ${user.last_name}:`, {
              hasSpecializations,
              specializationsValue: user.specializations,
            });
          }
          return hasSpecializations;
        }

        // Для professional требуем фотографии работ
        const hasWorkPhotos = user.work_photos &&
          Array.isArray(user.work_photos) &&
          user.work_photos.length > 0;

        if (!hasSpecializations || !hasWorkPhotos) {
          console.log(`[ProfessionalMasterService] Пропущен professional ${user.first_name} ${user.last_name}:`, {
            hasSpecializations,
            specializationsValue: user.specializations,
            hasWorkPhotos,
            workPhotosValue: user.work_photos,
          });
        }

        return hasSpecializations && hasWorkPhotos;
      });

      console.log('[ProfessionalMasterService] После фильтрации осталось:', validMasters.length);

      if (validMasters.length > 0) {
        console.log('[ProfessionalMasterService] Пример валидных данных:', {
          id: validMasters[0].id,
          name: `${validMasters[0].first_name} ${validMasters[0].last_name}`,
          specializations: validMasters[0].specializations,
          work_photos: validMasters[0].work_photos,
          city: validMasters[0].city,
        });
      }

      // Перемешиваем массив валидных мастеров
      const shuffled = validMasters.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, limit);

      // Получаем статистику для каждого мастера
      const mastersWithStats = await Promise.all(
        selected.map(async (user) => {
          const stats = await this.getMasterStats(user.id);
          return {
            ...user,
            firstName: user.first_name,
            lastName: user.last_name,
            middleName: user.middle_name,
            birthDate: user.birth_date,
            profileImage: user.profile_image,
            preferredLanguage: user.preferred_language,
            isVerified: user.is_verified,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            workerType: user.worker_type,
            aboutMe: user.about_me,
            specializations: user.specializations || [],
            workPhotos: user.work_photos || [],
            profileViewsCount: user.profile_views_count || 0,
            averageRating: stats.averageRating,
            totalReviews: stats.totalReviews,
            completedJobs: stats.completedJobs,
          } as ProfessionalMaster;
        })
      );

      return mastersWithStats;
    } catch (error) {
      console.error('Ошибка в getRandomMasters:', error);
      return [];
    }
  }

  /**
   * Поиск мастеров по имени или специализации
   */
  async searchMasters(query: string, city?: string): Promise<ProfessionalMaster[]> {
    try {
      let supabaseQuery = supabase
        .from('users')
        .select('*')
        .eq('role', 'worker')
        .in('worker_type', ['professional', 'daily_worker', 'job_seeker'])
        .not('specializations', 'is', null);

      if (city) {
        supabaseQuery = supabaseQuery.eq('city', city);
      }

      // Поиск по имени или фамилии
      supabaseQuery = supabaseQuery.or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%`
      );

      const { data, error } = await supabaseQuery;

      if (error || !data) {
        console.error('Ошибка поиска мастеров:', error);
        return [];
      }

      // Получаем статистику для каждого мастера
      const mastersWithStats = await Promise.all(
        data.map(async (user) => {
          const stats = await this.getMasterStats(user.id);
          
          // Парсим специализации, если они пришли как строка JSON
          let parsedSpecializations = user.specializations;
          if (typeof user.specializations === 'string') {
            try {
              parsedSpecializations = JSON.parse(user.specializations);
            } catch (e) {
              parsedSpecializations = [];
            }
          }
          
          return {
            ...user,
            firstName: user.first_name,
            lastName: user.last_name,
            middleName: user.middle_name,
            birthDate: user.birth_date,
            profileImage: user.profile_image,
            preferredLanguage: user.preferred_language,
            isVerified: user.is_verified,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            workerType: user.worker_type,
            aboutMe: user.about_me,
            specializations: parsedSpecializations || [],
            workPhotos: user.work_photos || [],
            profileViewsCount: user.profile_views_count || 0,
            averageRating: stats.averageRating,
            totalReviews: stats.totalReviews,
            completedJobs: stats.completedJobs,
          } as ProfessionalMaster;
        })
      );

      return mastersWithStats;
    } catch (error) {
      console.error('Ошибка в searchMasters:', error);
      return [];
    }
  }

  /**
   * Увеличить счетчик просмотров профиля мастера
   */
  async incrementProfileViews(masterId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_profile_views', {
        user_id_param: masterId
      });

      if (error) {
        console.error('Ошибка увеличения счетчика просмотров профиля:', error);
      } else {
        console.log(`[ProfessionalMasterService] Просмотр профиля мастера ${masterId} зарегистрирован`);
      }
    } catch (error) {
      console.error('Ошибка в incrementProfileViews:', error);
    }
  }

  /**
   * Получить отзывы о профессиональном мастере
   */
  async getMasterReviews(masterId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          order:order_id (title),
          customer:customer_id (first_name, last_name)
        `)
        .eq('worker_id', masterId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ProfessionalMasterService] Ошибка получения отзывов:', error);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        customerId: item.customer_id,
        workerId: item.worker_id,
        customerName: item.customer
          ? `${item.customer.first_name} ${item.customer.last_name}`
          : 'Пользователь',
        rating: item.rating,
        comment: item.comment,
        createdAt: item.created_at,
        orderTitle: item.order?.title || null,
      }));
    } catch (error) {
      console.error('[ProfessionalMasterService] Ошибка получения отзывов:', error);
      return [];
    }
  }
}

export const professionalMasterService = new ProfessionalMasterService();

