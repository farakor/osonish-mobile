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
  const t = useCustomerTranslation();

  return [
    { key: 'construction', label: t('category_construction'), emoji: '🏗️' },
    { key: 'cleaning', label: t('category_cleaning'), emoji: '🧹' },
    { key: 'garden', label: t('category_garden'), emoji: '🌳' },
    { key: 'catering', label: t('category_catering'), emoji: '🍽️' },
    { key: 'moving', label: t('category_moving'), emoji: '🚚' },
    { key: 'other', label: t('category_other'), emoji: '✨' },
  ];
};

// Функция для получения эмодзи по названию категории (для обратной совместимости)
export const getCategoryEmoji = (categoryLabel: string): string => {
  const emojiMap: { [key: string]: string } = {
    // Русские названия
    'Стройка': '🏗️',
    'Уборка': '🧹',
    'Сад': '🌳',
    'Общепит': '🍽️',
    'Переезд': '🚚',
    'Прочее': '✨',
    // Узбекские названия
    'Qurilish': '🏗️',
    'Tozalash': '🧹',
    'Bog\'dorchilik': '🌳',
    'Ovqatlanish': '🍽️',
    'Ko\'chish': '🚚',
    'Boshqa': '✨',
    // Английские ключи
    'construction': '🏗️',
    'cleaning': '🧹',
    'garden': '🌳',
    'catering': '🍽️',
    'moving': '🚚',
    'other': '✨',
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
    'Стройка': 'category_construction',
    'Уборка': 'category_cleaning',
    'Сад': 'category_garden',
    'Общепит': 'category_catering',
    'Переезд': 'category_moving',
    'Прочее': 'category_other',
    'construction': 'category_construction',
    'cleaning': 'category_cleaning',
    'garden': 'category_garden',
    'catering': 'category_catering',
    'moving': 'category_moving',
    'other': 'category_other',
  };

  const translationKey = keyMap[categoryKey];
  return translationKey ? t(translationKey) : categoryKey;
};
