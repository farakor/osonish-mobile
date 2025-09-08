// Импорты Lottie анимаций для категорий
const BricksAnimation = require('../../assets/bricks.json');
const CleaningToolsAnimation = require('../../assets/cleaning-tools.json');
const OliveTreeAnimation = require('../../assets/olive-tree.json');
const FoodDeliveryAnimation = require('../../assets/food-delivery.json');
const DeliveryTruckAnimation = require('../../assets/delivery-truck.json');
const DiscussionAnimation = require('../../assets/discussion.json');

// Функция для получения Lottie анимации по ключу категории
export const getCategoryAnimation = (categoryKey: string) => {
  // Нормализуем ключ категории для обратной совместимости
  const normalizedKey = normalizeCategoryKey(categoryKey);

  switch (normalizedKey) {
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
    // Узбекские названия (дополнительные)
    'Qurilish': 'construction',
    'Ovqatlanish': 'catering',
    // Английские названия для совместимости
    'Construction': 'construction',
    'Cleaning': 'cleaning',
    'Garden': 'garden',
    'Catering': 'catering',
    'Moving': 'moving',
    'Other': 'other',
  };

  return keyMap[categoryKey] || 'other';
};
