import React from 'react';
import { useCategoriesTranslation } from '../hooks/useTranslation';
import { 
  PARENT_CATEGORIES, 
  SPECIALIZATIONS, 
  getSpecializationById,
  getSubcategoriesByParentId,
  SpecializationOption 
} from '../constants/specializations';

// Типы категорий (используем ID из специализаций)
export type CategoryKey = string;

// Интерфейс для категории
export interface Category {
  key: CategoryKey;
  label: string;
  emoji: string;
  iconComponent?: React.ComponentType<any>; // SVG компонент иконки
  isParent?: boolean;
  parentId?: string;
}


// Хук для получения переведенных категорий с иерархией
export const useTranslatedCategories = (): Category[] => {
  const tCategories = useCategoriesTranslation();

  const categories: Category[] = [];
  
  // Добавляем "Работа на 1 день" в начало
  const oneDayJob = SPECIALIZATIONS.find(s => s.id === 'one_day_job');
  if (oneDayJob) {
    categories.push({
      key: oneDayJob.id,
      label: tCategories(oneDayJob.id),
      emoji: oneDayJob.icon,
      iconComponent: oneDayJob.iconComponent,
    });
  }
  
  // Добавляем "Ремонт и строительство" как родительскую категорию
  const repairConstruction = PARENT_CATEGORIES.find(c => c.id === 'repair_construction');
  if (repairConstruction) {
    categories.push({
      key: repairConstruction.id,
      label: tCategories(repairConstruction.id),
      emoji: repairConstruction.icon,
      iconComponent: repairConstruction.iconComponent,
      isParent: true,
    });
    
    // Добавляем подкатегории ремонта и строительства
    const subcategories = getSubcategoriesByParentId('repair_construction');
    subcategories.forEach(subcat => {
      categories.push({
        key: subcat.id,
        label: tCategories(subcat.id),
        emoji: subcat.icon,
        iconComponent: subcat.iconComponent,
        parentId: 'repair_construction',
      });
    });
  }
  
  return categories;
};


// Функция для получения эмодзи по названию категории (для обратной совместимости)
export const getCategoryEmoji = (categoryLabel: string): string => {
  // Пробуем найти по ID
  const spec = getSpecializationById(categoryLabel);
  if (spec) return spec.icon;
  
  const emojiMap: { [key: string]: string } = {
    // Переводы категорий
    'Работа на 1 день': '📅',
    '1 kunlik ish': '📅',
    'Ремонт и строительство': '🔨',
    'Ta\'mirlash va qurilish': '🔨',
    'Бригады': '👷',
    'Brigadalar': '👷',
    'Сантехники': '🔧',
    'Santexniklar': '🔧',
    'Электрики': '⚡',
    'Elektriklar': '⚡',
    'Маляр-Штукатур': '🎨',
    'Bo\'yoqchi-Shtukaturchi': '🎨',
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
  };

  return emojiMap[categoryLabel] || '✨';
};

// Функция для получения переведенного названия категории по ключу
export const getCategoryLabel = (categoryKey: string, t: (key: string) => string): string => {
  return t(`categories.${categoryKey}`);
};

// Функция для получения ключа категории по переведенному названию (для обратной совместимости)
export const getCategoryKeyFromLabel = (categoryLabel: string): string => {
  // Пробуем найти специализацию по переведенному названию
  const allSpecs = [...PARENT_CATEGORIES, ...SPECIALIZATIONS];
  const spec = allSpecs.find(s => {
    const translatedName = s.name;
    return translatedName === categoryLabel;
  });
  
  if (spec) return spec.id;
  
  const labelToKeyMap: { [key: string]: string } = {
    // Переводы новых категорий
    'Работа на 1 день': 'one_day_job',
    '1 kunlik ish': 'one_day_job',
    'Ремонт и строительство': 'repair_construction',
    'Ta\'mirlash va qurilish': 'repair_construction',
    'Бригады': 'brigades',
    'Brigadalar': 'brigades',
    'Сантехники': 'plumber',
    'Santexniklar': 'plumber',
    'Электрики': 'electrician',
    'Elektriklar': 'electrician',
    'Маляр-Штукатур': 'painter',
    'Bo\'yoqchi-Shtukaturchi': 'painter',
    'Плотники': 'carpenter',
    'Duradgorlar': 'carpenter',
    'Плиточники': 'tiler',
    'Plikta o\'rnatish': 'tiler',
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
  };

  return labelToKeyMap[categoryLabel] || categoryLabel;
};
