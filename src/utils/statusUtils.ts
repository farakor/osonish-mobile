import { Order } from '../types';
import { theme } from '../constants';

// Типы статусов заказов
export type OrderStatus = Order['status'];

// Интерфейс для информации о статусе
export interface StatusInfo {
  text: string;
  color: string;
  backgroundColor: string;
}

// Хук для получения переведенной информации о статусе
export const getStatusInfo = (
  status: OrderStatus,
  t: (key: string) => string,
  workerView: boolean = false
): StatusInfo => {
  switch (status) {
    case 'new':
      return {
        text: t('status_new'),
        color: theme.colors.primary,
        backgroundColor: theme.colors.primary + '20',
      };
    case 'response_received':
      // Для исполнителей показываем как "Новый", для заказчиков - "Отклик получен"
      if (workerView) {
        return {
          text: t('status_new'),
          color: theme.colors.primary,
          backgroundColor: theme.colors.primary + '20',
        };
      } else {
        return {
          text: t('status_response_received'),
          color: '#FFFFFF',
          backgroundColor: theme.colors.primary,
        };
      }
    case 'in_progress':
      return {
        text: t('status_in_progress'),
        color: '#F59E0B',
        backgroundColor: '#FEF3C7',
      };
    case 'completed':
      return {
        text: t('status_completed'),
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
      };
    case 'cancelled':
      return {
        text: t('status_cancelled'),
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
      };
    case 'rejected':
      return {
        text: t('status_rejected') || 'Отклонен', // fallback если перевода нет
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
      };
    default:
      return {
        text: status,
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
      };
  }
};

// Функция для получения цвета статуса (для обратной совместимости)
export const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'new':
      return theme.colors.primary;
    case 'response_received':
      return '#10B981'; // зеленый цвет для статуса "отклик получен"
    case 'in_progress':
      return '#FFA500';
    case 'completed':
      return '#6B7280';
    case 'cancelled':
      return '#DC3545';
    case 'rejected':
      return '#EF4444';
    default:
      return theme.colors.text.secondary;
  }
};

// Функция для получения переведенного текста статуса
export const getStatusText = (status: OrderStatus, t: (key: string) => string): string => {
  switch (status) {
    case 'new':
      return t('status_new');
    case 'response_received':
      return t('status_response_received');
    case 'in_progress':
      return t('status_in_progress');
    case 'completed':
      return t('status_completed');
    case 'cancelled':
      return t('status_cancelled');
    case 'rejected':
      return t('status_rejected') || 'Отклонен';
    default:
      return status;
  }
};
