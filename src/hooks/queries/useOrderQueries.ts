import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { queryKeys } from '../../config/queryClient';
import { Order, OrderStatus } from '../../types';

/**
 * Hook для получения списка заказов пользователя
 */
export const useMyOrders = () => {
  return useQuery({
    queryKey: queryKeys.orders.myOrders(),
    queryFn: async () => {
      const orders = await orderService.getMyCreatedOrders();
      return orders;
    },
    staleTime: 2 * 60 * 1000, // 2 минуты - заказы обновляются часто
  });
};

/**
 * Hook для получения доступных заказов (для мастеров)
 */
export const useAvailableOrders = () => {
  return useQuery({
    queryKey: queryKeys.orders.availableOrders(),
    queryFn: async () => {
      const orders = await orderService.getAvailableOrders();
      return orders;
    },
    staleTime: 1 * 60 * 1000, // 1 минута - доступные заказы обновляются очень часто
  });
};

/**
 * Hook для получения деталей заказа
 */
export const useOrderDetails = (orderId: string) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: async () => {
      const order = await orderService.getOrderById(orderId);
      return order;
    },
    enabled: !!orderId,
    staleTime: 3 * 60 * 1000, // 3 минуты
  });
};

/**
 * Hook для получения заявок на заказ
 */
export const useOrderApplicants = (orderId: string) => {
  return useQuery({
    queryKey: queryKeys.applicants.byOrder(orderId),
    queryFn: async () => {
      const applicants = await orderService.getApplicants(orderId);
      return applicants;
    },
    enabled: !!orderId,
    staleTime: 2 * 60 * 1000, // 2 минуты
  });
};

/**
 * Hook для получения заявок с фильтрацией
 */
export const useFilteredOrderApplicants = (orderId: string) => {
  return useQuery({
    queryKey: queryKeys.applicants.filteredByOrder(orderId),
    queryFn: async () => {
      const applicants = await orderService.getFilteredApplicants(orderId);
      return applicants;
    },
    enabled: !!orderId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook для создания заказа с оптимистичным обновлением
 */
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: any) => orderService.createOrder(orderData),
    onMutate: async (newOrder) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.myOrders() });

      // Сохраняем предыдущее состояние
      const previousOrders = queryClient.getQueryData(queryKeys.orders.myOrders());

      // Оптимистично обновляем кэш
      queryClient.setQueryData(queryKeys.orders.myOrders(), (old: Order[] = []) => {
        return [...old, { ...newOrder, id: 'temp-' + Date.now(), status: 'new' as OrderStatus }];
      });

      return { previousOrders };
    },
    onError: (_err, _newOrder, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousOrders) {
        queryClient.setQueryData(queryKeys.orders.myOrders(), context.previousOrders);
      }
    },
    onSuccess: () => {
      // Обновляем кэш после успешного создания
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.myOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.availableOrders() });
    },
  });
};

/**
 * Hook для обновления статуса заказа с оптимистичным обновлением
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      orderService.updateOrderStatus(orderId, status),
    onMutate: async ({ orderId, status }) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.detail(orderId) });

      // Сохраняем предыдущее состояние
      const previousOrder = queryClient.getQueryData(queryKeys.orders.detail(orderId));

      // Оптимистично обновляем
      queryClient.setQueryData(queryKeys.orders.detail(orderId), (old: Order | undefined) => {
        if (!old) return old;
        return { ...old, status };
      });

      return { previousOrder };
    },
    onError: (_err, { orderId }, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(orderId), context.previousOrder);
      }
    },
    onSuccess: (_data, { orderId }) => {
      // Обновляем связанные запросы
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.myOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.availableOrders() });
    },
  });
};

/**
 * Hook для отмены заказа
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderService.cancelOrder(orderId),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.myOrders() });
    },
  });
};

/**
 * Hook для удаления заказа
 */
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderService.deleteOrder(orderId),
    onSuccess: (_data, orderId) => {
      queryClient.removeQueries({ queryKey: queryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.myOrders() });
    },
  });
};









