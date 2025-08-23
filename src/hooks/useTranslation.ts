import { useTranslation as useI18nTranslation } from 'react-i18next';

// Типы для ключей переводов
export type TranslationKey =
  | `common.${string}`
  | `language.${string}`
  | `navigation.${string}`
  | `auth.${string}`
  | `profile.${string}`
  | `orders.${string}`
  | `jobs.${string}`
  | `worker.${string}`
  | `notifications.${string}`
  | `support.${string}`
  | `categories.${string}`
  | `errors.${string}`
  | `customer.${string}`;

export interface UseTranslationReturn {
  t: (key: TranslationKey, options?: any) => string;
  i18n: any;
  ready: boolean;
}

export const useTranslation = (): UseTranslationReturn => {
  const { t, i18n, ready } = useI18nTranslation();

  return {
    t: (key: TranslationKey, options?: any) => t(key, options),
    i18n,
    ready,
  };
};

// Хук для получения переводов определенной категории
export const useCategoryTranslation = (category: 'common' | 'language' | 'navigation' | 'auth' | 'profile' | 'orders' | 'jobs' | 'worker' | 'notifications' | 'support' | 'categories' | 'errors' | 'customer') => {
  const { t } = useTranslation();

  return (key: string, options?: any) => t(`${category}.${key}` as TranslationKey, options);
};

// Хук для общих переводов
export const useCommonTranslation = () => {
  return useCategoryTranslation('common');
};

// Хук для переводов аутентификации
export const useAuthTranslation = () => {
  return useCategoryTranslation('auth');
};

// Хук для переводов профиля
export const useProfileTranslation = () => {
  return useCategoryTranslation('profile');
};

// Хук для переводов заказов
export const useOrdersTranslation = () => {
  return useCategoryTranslation('orders');
};

// Хук для переводов работ
export const useJobsTranslation = () => {
  return useCategoryTranslation('jobs');
};

// Хук для переводов уведомлений
export const useNotificationsTranslation = () => {
  return useCategoryTranslation('notifications');
};

// Хук для переводов поддержки
export const useSupportTranslation = () => {
  return useCategoryTranslation('support');
};

// Хук для переводов категорий
export const useCategoriesTranslation = () => {
  return useCategoryTranslation('categories');
};

// Хук для переводов ошибок
export const useErrorsTranslation = () => {
  return useCategoryTranslation('errors');
};

// Хук для переводов заказчика
export const useCustomerTranslation = () => {
  return useCategoryTranslation('customer');
};

// Хук для переводов навигации
export const useNavigationTranslation = () => {
  return useCategoryTranslation('navigation');
};

// Хук для переводов исполнителя
export const useWorkerTranslation = () => {
  return useCategoryTranslation('worker');
};
