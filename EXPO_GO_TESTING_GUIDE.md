# Тестирование автообновления заказов в Expo Go

## 🚫 Ограничения Expo Go

Expo Go **НЕ ПОДДЕРЖИВАЕТ**:
- Фоновые задачи (`expo-background-task`)
- Task Manager (`expo-task-manager`) 
- Выполнение кода когда приложение свернуто

## ✅ Что можно протестировать

### Вариант 1: Использование тестового компонента

Добавьте `AutoOrderTestPanel` на любой экран для быстрого тестирования:

```tsx
import { AutoOrderTestPanel } from '../components/AutoOrderTestPanel';

// В любом экране добавьте:
<AutoOrderTestPanel />
```

### Вариант 2: Создание отдельного экрана

1. **Добавьте экран в навигацию** (например, в `MainTabNavigator.tsx`):

```tsx
import { AutoOrderTestScreen } from '../screens/debug/AutoOrderTestScreen';

// Добавьте в стек навигации:
<Stack.Screen 
  name="AutoOrderTest" 
  component={AutoOrderTestScreen}
  options={{ title: 'Тест автообновления' }}
/>
```

2. **Добавьте кнопку для перехода** (например, в настройках):

```tsx
<TouchableOpacity 
  onPress={() => navigation.navigate('AutoOrderTest')}
>
  <Text>🧪 Тест автообновления заказов</Text>
</TouchableOpacity>
```

### Вариант 3: Использование хука напрямую

```tsx
import { useAutoOrderTest } from '../hooks/useAutoOrderTest';

const MyTestComponent = () => {
  const {
    isLoading,
    testOrders,
    createTestOrders,
    runAutoUpdate,
    checkResults,
    cleanupTestOrders,
  } = useAutoOrderTest();

  return (
    <View>
      <Button title="Создать тестовые заказы" onPress={createTestOrders} />
      <Button title="Запустить автообновление" onPress={runAutoUpdate} />
      <Button title="Проверить результаты" onPress={checkResults} />
      <Button title="Очистить" onPress={cleanupTestOrders} />
    </View>
  );
};
```

## 📋 Пошаговое тестирование

### Шаг 1: Подготовка базы данных
Убедитесь, что выполнен SQL скрипт:
```sql
-- Выполните в Supabase SQL Editor
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS auto_cancelled BOOLEAN DEFAULT false;
```

### Шаг 2: Создание тестовых заказов
1. Нажмите кнопку **"Создать"** или **"1. Создать тестовые заказы"**
2. Будут созданы 3 заказа на сегодняшнюю дату:
   - 🧪 ТЕСТ: Новый заказ (статус: `new`)
   - 🧪 ТЕСТ: Заказ с откликом (статус: `response_received`)
   - 🧪 ТЕСТ: Заказ в работе (статус: `in_progress`)

### Шаг 3: Запуск автообновления
1. Нажмите кнопку **"Запустить"** или **"2. Запустить автообновление"**
2. Система выполнит логику автообновления:
   - Заказы `new` и `response_received` → `cancelled` (auto_cancelled = true)
   - Заказы `in_progress` → `completed` (auto_completed = true)

### Шаг 4: Проверка результатов
1. Нажмите кнопку **"Проверить"** или **"3. Проверить результаты"**
2. Увидите обновленные статусы заказов
3. Проверьте логи в консоли разработчика

### Шаг 5: Очистка
1. Нажмите кнопку **"Очистить"** или **"4. Очистить тестовые данные"**
2. Все тестовые заказы будут удалены

## 🔍 Проверка в базе данных

Выполните в Supabase SQL Editor:

```sql
-- Проверка тестовых заказов
SELECT 
  id,
  title,
  status,
  auto_completed,
  auto_cancelled,
  service_date,
  updated_at
FROM orders 
WHERE title LIKE '🧪 ТЕСТ:%'
ORDER BY updated_at DESC;

-- Статистика автообновлений за сегодня
SELECT 
  COUNT(CASE WHEN auto_completed = true THEN 1 END) as auto_completed_count,
  COUNT(CASE WHEN auto_cancelled = true THEN 1 END) as auto_cancelled_count
FROM orders 
WHERE service_date = CURRENT_DATE;
```

## 📱 Логи и отладка

### В консоли разработчика ищите:
```
🧪 ТЕСТ: Запуск автообновления статусов...
✅ Заказ abc123 завершен автоматически
❌ Заказ def456 отменен автоматически
```

### В Metro/Expo логах:
- Откройте Metro bundler в браузере
- Перейдите на вкладку "Logs"
- Ищите сообщения с префиксом `[OrderService]`

## ⚠️ Важные замечания

### Для Expo Go:
- ✅ Тестирование логики автообновления
- ✅ Проверка обновления статусов в БД
- ✅ Отладка SQL запросов
- ❌ Фоновые задачи не работают
- ❌ Автоматический запуск в 20:00 не работает

### Для Production Build:
- ✅ Все функции работают полностью
- ✅ Фоновые задачи выполняются автоматически
- ✅ Запуск в 20:00 по расписанию

## 🚀 Переход на Production Build

Для полного тестирования создайте development build:

```bash
# Для iOS
expo run:ios

# Для Android  
expo run:android
```

В production build фоновые задачи будут работать автоматически каждые 15 минут после 20:00.

## 🐛 Устранение проблем

### Ошибка "Пользователь не авторизован"
- Убедитесь, что вы вошли в приложение
- Проверьте токен авторизации в Supabase

### Ошибка создания заказов
- Проверьте подключение к интернету
- Убедитесь, что Supabase доступен
- Проверьте права доступа к таблице `orders`

### Заказы не обновляются
- Убедитесь, что поле `auto_cancelled` добавлено в БД
- Проверьте, что заказы созданы на сегодняшнюю дату
- Посмотрите логи ошибок в консоли

---

*Руководство обновлено: 30 сентября 2025*
