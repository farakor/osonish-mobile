import { useState, useEffect, useCallback, useRef } from 'react';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../services/supabaseClient';

/**
 * Хук для получения количества непросмотренных откликов для заказчика
 * @returns количество непросмотренных откликов по всем заказам/вакансиям
 */
export const useUnreadApplicantsCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const previousCount = useRef(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user || authState.user.role !== 'customer') {
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }

      // Получаем общее количество непросмотренных откликов через функцию БД
      const { data, error } = await supabase
        .rpc('get_customer_unread_applicants_count', {
          p_customer_id: authState.user.id
        });

      if (error) {
        console.error('[useUnreadApplicantsCount] Ошибка при получении количества непросмотренных откликов:', error);
        setUnreadCount(0);
      } else {
        const count = data || 0;
        previousCount.current = count;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('[useUnreadApplicantsCount] Ошибка при получении количества непросмотренных откликов:', error);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    // Обновляем счетчик при возвращении в приложение
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        fetchUnreadCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Обновляем счетчик каждые 30 секунд
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  // Real-time подписка на изменения в таблицах applicants и vacancy_applications
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user || authState.user.role !== 'customer') {
      return;
    }

    console.log('[useUnreadApplicantsCount] Подключаем real-time обновления для откликов');

    // Подписка на изменения в таблице applicants (для daily заказов)
    const applicantsChannel = supabase
      .channel('unread_applicants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applicants'
        },
        (payload) => {
          console.log('[useUnreadApplicantsCount] Real-time изменение в applicants:', payload);
          fetchUnreadCount();
        }
      )
      .subscribe();

    // Подписка на изменения в таблице vacancy_applications (для вакансий)
    const vacancyApplicationsChannel = supabase
      .channel('unread_vacancy_applications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vacancy_applications'
        },
        (payload) => {
          console.log('[useUnreadApplicantsCount] Real-time изменение в vacancy_applications:', payload);
          fetchUnreadCount();
        }
      )
      .subscribe();

    // Подписка на изменения в таблице orders (когда обновляется applicants_last_viewed_at)
    const ordersChannel = supabase
      .channel('unread_orders_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${authState.user.id}`
        },
        (payload) => {
          console.log('[useUnreadApplicantsCount] Real-time изменение в orders:', payload);
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      console.log('[useUnreadApplicantsCount] Отключаем real-time обновления для откликов');
      applicantsChannel.unsubscribe();
      vacancyApplicationsChannel.unsubscribe();
      ordersChannel.unsubscribe();
    };
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    isLoading,
    refresh: fetchUnreadCount
  };
};

