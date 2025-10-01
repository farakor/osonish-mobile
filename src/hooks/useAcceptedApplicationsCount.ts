import { useState, useEffect, useCallback, useRef } from 'react';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOOLTIP_DISMISSED_KEY = 'accepted_applications_tooltip_dismissed';

/**
 * Хук для получения количества принятых заявок исполнителя
 * @returns количество заявок со статусом "accepted" (В работе)
 */
export const useAcceptedApplicationsCount = () => {
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTooltipDismissed, setIsTooltipDismissed] = useState(false);
  const previousCount = useRef(0);

  // Проверяем, был ли tooltip закрыт
  useEffect(() => {
    const checkTooltipDismissed = async () => {
      try {
        const dismissed = await AsyncStorage.getItem(TOOLTIP_DISMISSED_KEY);
        if (dismissed) {
          setIsTooltipDismissed(true);
        }
      } catch (error) {
        console.error('Ошибка при проверке статуса tooltip:', error);
      }
    };
    checkTooltipDismissed();
  }, []);

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

      // Проверяем, увеличился ли счетчик
      if (count > previousCount.current && !isTooltipDismissed) {
        setShowTooltip(true);
      }

      previousCount.current = count;
      setAcceptedCount(count);
    } catch (error) {
      console.error('Ошибка при получении количества принятых заявок:', error);
      setAcceptedCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [isTooltipDismissed]);

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

  const dismissTooltip = useCallback(async () => {
    setShowTooltip(false);
    setIsTooltipDismissed(true);
    try {
      await AsyncStorage.setItem(TOOLTIP_DISMISSED_KEY, 'true');
    } catch (error) {
      console.error('Ошибка при сохранении статуса tooltip:', error);
    }
  }, []);

  const resetTooltip = useCallback(async () => {
    setIsTooltipDismissed(false);
    try {
      await AsyncStorage.removeItem(TOOLTIP_DISMISSED_KEY);
    } catch (error) {
      console.error('Ошибка при сбросе статуса tooltip:', error);
    }
  }, []);

  return {
    acceptedCount,
    isLoading,
    showTooltip,
    dismissTooltip,
    resetTooltip,
    refresh: fetchAcceptedCount
  };
};

