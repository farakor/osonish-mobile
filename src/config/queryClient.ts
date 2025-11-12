import { QueryClient } from '@tanstack/react-query';

// Создаем QueryClient с оптимальными настройками
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Кэш данных 5 минут
      staleTime: 5 * 60 * 1000,
      // Хранить кэш 10 минут
      cacheTime: 10 * 60 * 1000,
      // Не перезагружать при возврате в приложение
      refetchOnWindowFocus: false,
      // Не перезагружать при переподключении сети
      refetchOnReconnect: false,
      // Повторить запрос при ошибке
      retry: 1,
      // Пауза перед повтором
      retryDelay: 1000,
    },
    mutations: {
      // Повторить mutation при ошибке
      retry: 1,
    },
  },
});

// Query Keys для удобного использования
export const queryKeys = {
  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    myOrders: () => [...queryKeys.orders.all, 'my'] as const,
    customerOrders: () => [...queryKeys.orders.all, 'customer'] as const,
    availableOrders: () => [...queryKeys.orders.all, 'available'] as const,
  },
  
  // Applicants
  applicants: {
    all: ['applicants'] as const,
    byOrder: (orderId: string) => [...queryKeys.applicants.all, 'order', orderId] as const,
    filteredByOrder: (orderId: string) => [...queryKeys.applicants.all, 'filtered', orderId] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (userId: string) => [...queryKeys.notifications.all, 'list', userId] as const,
    unreadCount: (userId: string) => [...queryKeys.notifications.all, 'unread', userId] as const,
  },
  
  // Masters
  masters: {
    all: ['masters'] as const,
    list: (filters?: any) => [...queryKeys.masters.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.masters.all, 'detail', id] as const,
    reviews: (id: string) => [...queryKeys.masters.all, 'reviews', id] as const,
  },
  
  // User
  user: {
    all: ['user'] as const,
    profile: (id: string) => [...queryKeys.user.all, 'profile', id] as const,
  },
};

