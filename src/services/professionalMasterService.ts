import { supabase } from './supabaseClient';
import { User, Specialization } from '../types';

export interface ProfessionalMaster extends User {
  workerType: 'professional';
  aboutMe: string;
  specializations: Specialization[];
  workPhotos: string[];
  averageRating: number;
  totalReviews: number;
  completedJobs: number;
}

export interface GetMastersParams {
  specializationId?: string;
  city?: string;
  limit?: number;
  offset?: number;
}

class ProfessionalMasterService {
  /**
   * Получить список профессиональных мастеров
   */
  async getMasters(params: GetMastersParams = {}): Promise<ProfessionalMaster[]> {
    try {
      const {
        specializationId,
        city,
        limit = 20,
        offset = 0,
      } = params;

      // Загружаем профессиональных мастеров (фильтрацию делаем на клиенте)
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', 'worker')
        .eq('worker_type', 'professional');

      // Фильтр по городу
      if (city) {
        query = query.eq('city', city);
      }

      // Загружаем больше данных если нужна фильтрация по специализации
      const fetchLimit = specializationId ? 100 : limit;

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + fetchLimit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Ошибка получения мастеров:', error);
        return [];
      }

      if (!data) return [];

      // ВАЖНО: Фильтруем мастеров с валидными данными
      let filteredData = data.filter(user => {
        const hasSpecializations = user.specializations &&
          Array.isArray(user.specializations) &&
          user.specializations.length > 0;
        const hasWorkPhotos = user.work_photos &&
          Array.isArray(user.work_photos) &&
          user.work_photos.length > 0;
        return hasSpecializations && hasWorkPhotos;
      });

      // Фильтруем по специализации (если указана)
      if (specializationId) {
        filteredData = filteredData.filter(user => {
          const specializations = user.specializations || [];
          return specializations.some((spec: any) => spec.id === specializationId);
        });
      }

      // Ограничиваем до нужного количества
      filteredData = filteredData.slice(0, limit);

      // Получаем рейтинги и статистику для каждого мастера
      const mastersWithStats = await Promise.all(
        filteredData.map(async (user) => {
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
            averageRating: stats.averageRating,
            totalReviews: stats.totalReviews,
            completedJobs: stats.completedJobs,
          } as ProfessionalMaster;
        })
      );

      return mastersWithStats;
    } catch (error) {
      console.error('Ошибка в getMasters:', error);
      return [];
    }
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
        .eq('worker_type', 'professional')
        .single();

      if (error || !data) {
        console.error('Ошибка получения мастера:', error);
        return null;
      }

      const stats = await this.getMasterStats(masterId);

      return {
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
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews,
        completedJobs: stats.completedJobs,
      } as ProfessionalMaster;
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
  async getRandomMasters(city?: string, limit: number = 10): Promise<ProfessionalMaster[]> {
    try {
      // DEBUG: Проверяем всех профессиональных мастеров без фильтров
      const { data: allProfessionals } = await supabase
        .from('users')
        .select('id, first_name, last_name, city, worker_type, specializations, work_photos')
        .eq('role', 'worker')
        .eq('worker_type', 'professional');

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
        .eq('worker_type', 'professional')
        .not('specializations', 'is', null)
        .not('work_photos', 'is', null);

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

      // ВАЖНО: Фильтруем мастеров с валидными данными на клиенте
      const validMasters = data.filter(user => {
        const hasSpecializations = user.specializations &&
          Array.isArray(user.specializations) &&
          user.specializations.length > 0;
        const hasWorkPhotos = user.work_photos &&
          Array.isArray(user.work_photos) &&
          user.work_photos.length > 0;

        if (!hasSpecializations || !hasWorkPhotos) {
          console.log(`[ProfessionalMasterService] Пропущен мастер ${user.first_name} ${user.last_name}:`, {
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
        .eq('worker_type', 'professional')
        .not('specializations', 'is', null)
        .not('work_photos', 'is', null);

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
}

export const professionalMasterService = new ProfessionalMasterService();

