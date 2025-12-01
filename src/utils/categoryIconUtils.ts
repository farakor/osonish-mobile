// Импорты Lottie анимаций для категорий
const BricksAnimation = require('../../assets/bricks.json');
const CleaningToolsAnimation = require('../../assets/cleaning-tools.json');
const OliveTreeAnimation = require('../../assets/olive-tree.json');
const FoodDeliveryAnimation = require('../../assets/food-delivery.json');
const DeliveryTruckAnimation = require('../../assets/delivery-truck.json');
const DiscussionAnimation = require('../../assets/discussion.json');

import { getSpecializationById } from '../constants/specializations';

// Функция для получения Lottie анимации по ключу категории
export const getCategoryAnimation = (categoryKey: string) => {
  // Пробуем получить специализацию
  const spec = getSpecializationById(categoryKey);
  
  // Проверяем parent ID для подкатегорий
  if (spec?.parentIds?.includes('repair_construction') || categoryKey === 'repair_construction') {
    return BricksAnimation;
  }
  
  // Нормализуем ключ категории для обратной совместимости
  const normalizedKey = normalizeCategoryKey(categoryKey);

  switch (normalizedKey) {
    case 'one_day_job':
      return DiscussionAnimation;
    case 'repair_construction':
    case 'construction':
      return BricksAnimation;
    case 'cleaning':
      return CleaningToolsAnimation;
    case 'garden':
      return OliveTreeAnimation;
    case 'catering':
      return FoodDeliveryAnimation;
    case 'moving':
      return DeliveryTruckAnimation;
    case 'other':
      return DiscussionAnimation;
    default:
      return DiscussionAnimation;
  }
};


// Функция для нормализации ключа категории (для обратной совместимости)
const normalizeCategoryKey = (categoryKey: string): string => {
  const spec = getSpecializationById(categoryKey);
  if (spec) return spec.id;
  
  const keyMap: { [key: string]: string } = {
    // Переводы новых категорий
    'Работа на 1 день': 'one_day_job',
    '1 kunlik ish': 'one_day_job',
    'Ремонт и строительство': 'repair_construction',
    'Ta\'mirlash va qurilish': 'repair_construction',
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
    // Узбекские названия (дополнительные)
    'Qurilish': 'construction',
    'Ovqatlanish': 'catering',
  };

  return keyMap[categoryKey] || categoryKey;
};
