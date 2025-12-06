import { useQueries } from '@tanstack/react-query';
import { queryKeys } from '../../config/queryClient';
import { orderService } from '../../services/orderService';
import { notificationService } from '../../services/notificationService';
import { professionalMasterService } from '../../services/professionalMasterService';

/**
 * Параллельная загрузка данных для главного экрана клиента
 * Загружает все доступные заказы и данные о своих заказах для отображения бейджей
 */
export const useCustomerHomeData = (userId: string) => {
  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.orders.availableOrders(),
        queryFn: () => orderService.getAvailableOrders(),
        staleTime: 1 * 60 * 1000,
      },
      {
        queryKey: queryKeys.orders.customerOrders(),
        queryFn: () => orderService.getCustomerOrders(),
        staleTime: 1 * 60 * 1000,
        enabled: !!userId,
      },
      {
        queryKey: queryKeys.notifications.unreadCount(userId),
        queryFn: () => notificationService.getUnreadCount(userId),
        staleTime: 30 * 1000,
        enabled: !!userId,
      },
    ],
  });

  // Объединяем данные: берем все доступные заказы и обогащаем данными о своих заказах
  const allOrders = results[0].data || [];
  const myOrders = results[1].data || [];
  
  console.log(`[useCustomerHomeData] Всего заказов: ${allOrders.length}, Моих заказов: ${myOrders.length}`);
  
  // Создаем Map для быстрого поиска своих заказов
  const myOrdersMap = new Map(myOrders.map(order => [order.id, order]));
  
  // Обогащаем все заказы данными о количестве откликов для своих заказов
  const enrichedOrders = allOrders.map(order => {
    const myOrder = myOrdersMap.get(order.id);
    if (myOrder) {
      // Это мой заказ - используем данные с правильным количеством откликов
      console.log(`[useCustomerHomeData] Мой заказ ${order.id}: applicantsCount=${myOrder.applicantsCount}, pendingApplicantsCount=${myOrder.pendingApplicantsCount}, unreadApplicantsCount=${myOrder.unreadApplicantsCount}`);
      return {
        ...order,
        applicantsCount: myOrder.applicantsCount,
        pendingApplicantsCount: myOrder.pendingApplicantsCount,
        unreadApplicantsCount: myOrder.unreadApplicantsCount,
        applicantsLastViewedAt: myOrder.applicantsLastViewedAt,
      };
    }
    return order;
  });

  return {
    orders: enrichedOrders,
    isLoadingOrders: results[0].isLoading,
    ordersError: results[0].error,
    
    unreadCount: results[2].data || 0,
    isLoadingUnreadCount: results[2].isLoading,
    unreadCountError: results[2].error,
    
    // Общий статус загрузки
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
    
    // Функции обновления
    refetchOrders: results[0].refetch,
    refetchUnreadCount: results[2].refetch,
    refetchAll: () => {
      results[0].refetch();
      results[1].refetch();
      results[2].refetch();
    },
  };
};

/**
 * Параметры для хука useWorkerHomeData
 */
interface WorkerHomeDataParams {
  userId: string;
  workerType?: 'daily_worker' | 'professional' | 'job_seeker';
  userCity?: string;
}

/**
 * Параллельная загрузка данных для экрана мастера
 * Загружает доступные заказы и уведомления одновременно
 * 
 * Правила отображения по типу работника:
 * - daily_worker: только заказы (не вакансии), только по своему городу
 * - job_seeker: все заказы и вакансии по всем городам
 * - professional: все заказы и вакансии по всем городам
 */
export const useWorkerHomeData = (params: WorkerHomeDataParams | string) => {
  // Поддержка старого формата вызова (только userId)
  const { userId, workerType, userCity } = typeof params === 'string' 
    ? { userId: params, workerType: undefined, userCity: undefined } 
    : params;

  const results = useQueries({
    queries: [
      {
        // Добавляем workerType и userCity в queryKey для корректного кеширования
        queryKey: [...queryKeys.orders.availableOrders(), workerType || 'all', userCity || 'all'],
        queryFn: () => {
          // Если указан тип работника, используем новый метод с фильтрацией
          if (workerType) {
            return orderService.getOrdersForWorkerType(workerType, userCity);
          }
          // Иначе возвращаем все заказы (обратная совместимость)
          return orderService.getAvailableOrders();
        },
        staleTime: 1 * 60 * 1000,
      },
      {
        queryKey: queryKeys.notifications.unreadCount(userId),
        queryFn: () => notificationService.getUnreadCount(userId),
        staleTime: 30 * 1000,
        enabled: !!userId,
      },
    ],
  });

  return {
    orders: results[0].data || [],
    isLoadingOrders: results[0].isLoading,
    ordersError: results[0].error,
    
    unreadCount: results[1].data || 0,
    isLoadingUnreadCount: results[1].isLoading,
    unreadCountError: results[1].error,
    
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
    
    refetchOrders: results[0].refetch,
    refetchUnreadCount: results[1].refetch,
    refetchAll: () => {
      results[0].refetch();
      results[1].refetch();
    },
  };
};

/**
 * Параллельная загрузка деталей заказа и заявок
 * Загружает все данные о заказе одновременно
 */
export const useOrderDetailsData = (orderId: string) => {
  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.orders.detail(orderId),
        queryFn: () => orderService.getOrderById(orderId),
        staleTime: 3 * 60 * 1000,
        enabled: !!orderId,
      },
      {
        queryKey: queryKeys.applicants.byOrder(orderId),
        queryFn: () => orderService.getApplicants(orderId),
        staleTime: 2 * 60 * 1000,
        enabled: !!orderId,
      },
    ],
  });

  return {
    order: results[0].data,
    isLoadingOrder: results[0].isLoading,
    orderError: results[0].error,
    
    applicants: results[1].data || [],
    isLoadingApplicants: results[1].isLoading,
    applicantsError: results[1].error,
    
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
    
    refetchOrder: results[0].refetch,
    refetchApplicants: results[1].refetch,
    refetchAll: () => {
      results[0].refetch();
      results[1].refetch();
    },
  };
};

/**
 * Параллельная загрузка деталей мастера и его отзывов
 */
export const useMasterDetailsData = (masterId: string) => {
  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.masters.detail(masterId),
        queryFn: () => professionalMasterService.getProfessionalMasterById(masterId),
        staleTime: 5 * 60 * 1000,
        enabled: !!masterId,
      },
      {
        queryKey: queryKeys.masters.reviews(masterId),
        queryFn: () => professionalMasterService.getMasterReviews(masterId),
        staleTime: 10 * 60 * 1000,
        enabled: !!masterId,
      },
    ],
  });

  return {
    master: results[0].data,
    isLoadingMaster: results[0].isLoading,
    masterError: results[0].error,
    
    reviews: results[1].data || [],
    isLoadingReviews: results[1].isLoading,
    reviewsError: results[1].error,
    
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
    
    refetchMaster: results[0].refetch,
    refetchReviews: results[1].refetch,
    refetchAll: () => {
      results[0].refetch();
      results[1].refetch();
    },
  };
};

