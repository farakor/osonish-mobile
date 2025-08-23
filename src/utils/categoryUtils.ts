import { useCategoriesTranslation, useCustomerTranslation } from '../hooks/useTranslation';

// Типы категорий
export type CategoryKey = 'construction' | 'cleaning' | 'garden' | 'catering' | 'moving' | 'other';

// Интерфейс для категории
export interface Category {
  key: CategoryKey;
  label: string;
  emoji: string;
}

// Хук для получения переведенных категорий
export const useTranslatedCategories = (): Category[] => {
  const tCategories = useCategoriesTranslation();

  return [
    { key: 'construction', label: tCategories('construction'), emoji: '🏗️' },
    { key: 'cleaning', label: tCategories('cleaning'), emoji: '🧹' },
    { key: 'garden', label: tCategories('garden'), emoji: '🌳' },
    { key: 'catering', label: tCategories('catering'), emoji: '🍽️' },
    { key: 'moving', label: tCategories('moving'), emoji: '🚚' },
    { key: 'other', label: tCategories('other'), emoji: '✨' },
  ];
};

// Функция для получения эмодзи по названию категории (для обратной совместимости)
export const getCategoryEmoji = (categoryLabel: string): string => {
  const emojiMap: { [key: string]: string } = {
    // Старые переведенные названия (для обратной совместимости)
    'Строительство': '🏗️',
    'Стройка': '🏗️',
    'Уборка': '🧹',
    'Tozalash': '🧹',
    'Сад': '🌳',
    'Bog\'dorchilik': '🌳',
    'Общепит': '🍽️',
    'Переезд': '🚚',
    'Ko\'chish': '🚚',
    'Прочее': '✨',
    'Другое': '✨',
    'Boshqa': '✨',
    // Новые ключи
    'construction': '🏗️',
    'cleaning': '🧹',
    'garden': '🌳',
    'catering': '🍽️',
    'moving': '🚚',
    'other': '✨',
    // Узбекские названия (дополнительные)
    'Qurilish': '🏗️',
    'Ovqatlanish': '🍽️',
    // Дополнительные категории
    'Ремонт техники': '🔧',
    'Доставка': '🚴',
    'Красота': '💄',
    'Обучение': '📚',
  };

  return emojiMap[categoryLabel] || '✨';
};

// Функция для получения переведенного названия категории по ключу
export const getCategoryLabel = (categoryKey: string, t: (key: string) => string): string => {
  const keyMap: { [key: string]: string } = {
    // Старые переведенные названия (для обратной совместимости)
    'Строительство': 'construction',
    'Стройка': 'construction',
    'Уборка': 'cleaning',
    'Tozalash': 'cleaning',
    'Сад': 'garden',
    'Bog\'dorchilik': 'garden',
    'Общепит': 'catering',
    'Переезд': 'moving',
    'Ko\'chish': 'moving',
    'Прочее': 'other',
    'Другое': 'other',
    'Boshqa': 'other',
    // Новые ключи (возвращаем как есть)
    'construction': 'construction',
    'cleaning': 'cleaning',
    'garden': 'garden',
    'catering': 'catering',
    'moving': 'moving',
    'other': 'other',
  };

  const translationKey = keyMap[categoryKey];
  return translationKey ? t(translationKey) : categoryKey;
};

// Функция для получения ключа категории по переведенному названию (для обратной совместимости)
export const getCategoryKeyFromLabel = (categoryLabel: string): string => {
  const labelToKeyMap: { [key: string]: string } = {
    // Старые переведенные названия (для обратной совместимости)
    'Строительство': 'construction',
    'Стройка': 'construction',
    'Уборка': 'cleaning',
    'Tozalash': 'cleaning',
    'Сад': 'garden',
    'Bog\'dorchilik': 'garden',
    'Общепит': 'catering',
    'Переезд': 'moving',
    'Ko\'chish': 'moving',
    'Прочее': 'other',
    'Другое': 'other',
    'Boshqa': 'other',
    // Новые ключи (возвращаем как есть)
    'construction': 'construction',
    'cleaning': 'cleaning',
    'garden': 'garden',
    'catering': 'catering',
    'moving': 'moving',
    'other': 'other',
  };

  return labelToKeyMap[categoryLabel] || categoryLabel;
};
