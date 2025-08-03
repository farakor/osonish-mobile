import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';
import { Order, Applicant } from '../types';

interface OrdersContextData {
  // Состояние заказов
  orders: Order[];
  isLoading: boolean;

  // Функции для обновления данных
  refreshOrders: () => Promise<void>;
  updateOrderInCache: (orderId: string, updates: Partial<Order>) => void;
  addOrderToCache: (order: Order) => void;
  removeOrderFromCache: (orderId: string) => void;

  // Функции для работы с откликами
  updateApplicantInOrder: (orderId: string, applicantId: string, status: 'pending' | 'accepted' | 'rejected') => void;
}

const OrdersContext = createContext<OrdersContextData | undefined>(undefined);

interface OrdersProviderProps {
  children: ReactNode;
}

export const OrdersProvider: React.FC<OrdersProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Загрузка всех заказов пользователя
  const refreshOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const userOrders = await orderService.getCustomerOrders();
      setOrders(userOrders);
      console.log('[OrdersContext] Обновлено заказов:', userOrders.length);
    } catch (error) {
      console.error('[OrdersContext] Ошибка загрузки заказов:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Обновление конкретного заказа в кэше
  const updateOrderInCache = useCallback((orderId: string, updates: Partial<Order>) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, ...updates }
          : order
      )
    );
    console.log('[OrdersContext] Обновлен заказ в кэше:', orderId, updates);
  }, []);

  // Добавление нового заказа в кэш
  const addOrderToCache = useCallback((order: Order) => {
    setOrders(prevOrders => [order, ...prevOrders]);
    console.log('[OrdersContext] Добавлен заказ в кэш:', order.id);
  }, []);

  // Удаление заказа из кэша
  const removeOrderFromCache = useCallback((orderId: string) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    console.log('[OrdersContext] Удален заказ из кэша:', orderId);
  }, []);

  // Обновление статуса отклика в заказе
  const updateApplicantInOrder = useCallback((orderId: string, applicantId: string, status: 'pending' | 'accepted' | 'rejected') => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          // Имитируем обновление счетчика откликов
          let applicantsCount = order.applicantsCount || 0;
          if (status === 'accepted') {
            // При принятии отклика увеличиваем счетчик принятых
            applicantsCount = Math.max(applicantsCount, 1);
          }

          return {
            ...order,
            applicantsCount,
            // Если все исполнители выбраны, меняем статус на in_progress
            status: (order.workersNeeded && applicantsCount >= order.workersNeeded) ? 'in_progress' as const : order.status
          };
        }
        return order;
      })
    );
    console.log('[OrdersContext] Обновлен отклик в заказе:', orderId, applicantId, status);
  }, []);

  // Real-time обновления через Supabase
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    console.log('[OrdersContext] Подключаем global real-time обновления');

    // Подписка на изменения заказов пользователя
    const ordersSubscription = supabase
      .channel('global_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${authState.user.id}`
        },
        (payload: any) => {
          console.log('[OrdersContext] Global real-time изменение заказа:', payload);

          switch (payload.eventType) {
            case 'INSERT':
              // Новый заказ добавлен
              refreshOrders();
              break;
            case 'UPDATE':
              // Заказ обновлен
              if (payload.new) {
                updateOrderInCache(payload.new.id, payload.new);
              }
              break;
            case 'DELETE':
              // Заказ удален
              if (payload.old) {
                removeOrderFromCache(payload.old.id);
              }
              break;
          }
        }
      )
      .subscribe();

    // Подписка на изменения откликов
    const applicantsSubscription = supabase
      .channel('global_applicants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applicants'
        },
        (payload: any) => {
          console.log('[OrdersContext] Global real-time изменение отклика:', payload);

          // При изменении откликов обновляем соответствующий заказ
          if (payload.new?.order_id) {
            // Проверяем, принадлежит ли этот заказ текущему пользователю
            const order = orders.find(o => o.id === payload.new.order_id);
            if (order) {
              updateApplicantInOrder(
                payload.new.order_id,
                payload.new.id,
                payload.new.status
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[OrdersContext] Отключаем global real-time обновления');
      ordersSubscription.unsubscribe();
      applicantsSubscription.unsubscribe();
    };
  }, [orders, updateOrderInCache, removeOrderFromCache, updateApplicantInOrder, refreshOrders]);

  // Загружаем заказы при инициализации
  useEffect(() => {
    const authState = authService.getAuthState();
    if (authState.isAuthenticated && authState.user) {
      refreshOrders();
    }
  }, [refreshOrders]);

  const value = {
    orders,
    isLoading,
    refreshOrders,
    updateOrderInCache,
    addOrderToCache,
    removeOrderFromCache,
    updateApplicantInOrder
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
};

// Хук для использования контекста
export const useOrders = (): OrdersContextData => {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};

export default OrdersProvider;