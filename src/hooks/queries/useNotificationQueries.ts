import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../../services/notificationService';
import { queryKeys } from '../../config/queryClient';

/**
 * Hook для получения списка уведомлений
 */
export const useNotifications = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.notifications.list(userId),
    queryFn: async () => {
      const notifications = await notificationService.getNotifications(userId);
      return notifications;
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 минута - уведомления обновляются часто
  });
};

/**
 * Hook для получения количества непрочитанных уведомлений
 */
export const useUnreadNotificationsCount = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(userId),
    queryFn: async () => {
      const count = await notificationService.getUnreadCount(userId);
      return count;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 секунд - счетчик обновляется очень часто
    refetchInterval: 60 * 1000, // Автоматическое обновление каждую минуту
  });
};

/**
 * Hook для отметки уведомления как прочитанного
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ notificationId, userId }: { notificationId: string; userId: string }) =>
      notificationService.markAsRead(notificationId),
    onMutate: async ({ notificationId, userId }) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.list(userId) });

      // Сохраняем предыдущее состояние
      const previousNotifications = queryClient.getQueryData(queryKeys.notifications.list(userId));

      // Оптимистично обновляем
      queryClient.setQueryData(queryKeys.notifications.list(userId), (old: any[] = []) => {
        return old.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        );
      });

      return { previousNotifications };
    },
    onError: (_err, { userId }, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.list(userId),
          context.previousNotifications
        );
      }
    },
    onSuccess: (_data, { userId }) => {
      // Обновляем счетчик непрочитанных
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) });
    },
  });
};

/**
 * Hook для отметки всех уведомлений как прочитанных
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => notificationService.markAllAsRead(userId),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) });
    },
  });
};




















