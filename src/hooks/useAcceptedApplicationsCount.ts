import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Хук для получения количества принятых заявок исполнителя
 * @returns количество заявок со статусом "accepted" (В работе)
 */
export const useAcceptedApplicationsCount = () => {
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAcceptedCount = useCallback(async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        setAcceptedCount(0);
        setIsLoading(false);
        return;
      }

      const applications = await orderService.getWorkerApplications();

      // Подсчитываем заявки со статусом "accepted"
      const count = applications.filter(app => app.status === 'accepted').length;

      setAcceptedCount(count);
    } catch (error) {
      console.error('Ошибка при получении количества принятых заявок:', error);
      setAcceptedCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcceptedCount();

    // Обновляем счетчик при возвращении в приложение
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        fetchAcceptedCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Обновляем счетчик каждые 30 секунд
    const interval = setInterval(fetchAcceptedCount, 30000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [fetchAcceptedCount]);

  return { acceptedCount, isLoading, refresh: fetchAcceptedCount };
};

