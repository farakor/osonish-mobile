import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { vacancyService } from '../services/vacancyService';
import { authService } from '../services/authService';

export interface VacancyApplicationsStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}

/**
 * Хук для получения статистики откликов соискателя на вакансии
 */
export const useVacancyApplicationsStats = () => {
  const [stats, setStats] = useState<VacancyApplicationsStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        setStats({ total: 0, pending: 0, accepted: 0, rejected: 0 });
        setIsLoading(false);
        return;
      }

      // Проверяем, что пользователь - job_seeker
      const workerType = (authState.user as any)?.workerType;
      if (workerType !== 'job_seeker') {
        setStats({ total: 0, pending: 0, accepted: 0, rejected: 0 });
        setIsLoading(false);
        return;
      }

      const applications = await vacancyService.getMyVacancyApplications();

      const newStats: VacancyApplicationsStats = {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        accepted: applications.filter(app => app.status === 'accepted').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
      };

      setStats(newStats);
    } catch (error) {
      console.error('[useVacancyApplicationsStats] Ошибка получения статистики:', error);
      setStats({ total: 0, pending: 0, accepted: 0, rejected: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Обновляем при возвращении в приложение
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        fetchStats();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Обновляем каждые 60 секунд
    const interval = setInterval(fetchStats, 60000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    refresh: fetchStats,
  };
};

