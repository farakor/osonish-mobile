# 🔧 Исправление ошибки базы данных

## ❌ Проблема
```
ERROR [OrderService] ❌ Ошибка получения заказов для оценки: 
{"code": "PGRST202", "details": "Searched for the function public.get_pending_ratings_for_customer with parameter p_customer_id or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache.", "hint": null, "message": "Could not find the function public.get_pending_ratings_for_customer(p_customer_id) in the schema cache"}
```

## ✅ Решение

### Шаг 1: Откройте Supabase Dashboard
1. Перейдите на [supabase.com](https://supabase.com)
2. Войдите в свой проект
3. Откройте **SQL Editor** (левое меню)

### Шаг 2: Выполните SQL скрипт
1. Скопируйте содержимое файла `SQL/fix_auto_order_update_dependencies.sql`
2. Вставьте в SQL Editor
3. Нажмите **Run** (или Ctrl/Cmd + Enter)

### Шаг 3: Проверьте результат
После выполнения скрипта вы должны увидеть таблицу с результатами:

```
object_type                              | status
----------------------------------------|----------
pending_ratings table                   | ✅ EXISTS
auto_completed column                   | ✅ EXISTS  
auto_cancelled column                   | ✅ EXISTS
get_pending_ratings_for_customer function| ✅ EXISTS
add_pending_rating function             | ✅ EXISTS
remove_pending_rating function          | ✅ EXISTS
```

Все статусы должны быть **✅ EXISTS**.

## 🧪 Повторное тестирование

После выполнения SQL скрипта:

1. **Вернитесь в приложение** Expo Go
2. **Перейдите на главный экран** заказчика
3. **Найдите тестовую панель** внизу экрана
4. **Повторите тестирование**:
   - Нажмите **"Создать"** → должны создаться 3 заказа
   - Нажмите **"Запустить"** → должно пройти без ошибок
   - Нажмите **"Проверить"** → должно показать результаты

## 🔍 Что исправляет скрипт

### 1. Создает таблицу `pending_ratings`
- Для отслеживания заказов, требующих оценки
- С правильными связями и индексами

### 2. Добавляет колонки в таблицу `orders`
- `auto_completed` - флаг автозавершения
- `auto_cancelled` - флаг автоотмены

### 3. Создает необходимые функции
- `get_pending_ratings_for_customer()` - получение заказов для оценки
- `add_pending_rating()` - добавление записи об оценке
- `remove_pending_rating()` - удаление записи об оценке

### 4. Настраивает индексы и безопасность
- Индексы для быстрого поиска
- Политики Row Level Security (RLS)

## ⚠️ Если ошибка повторяется

### Проверьте подключение к базе данных:
```sql
-- Выполните в SQL Editor для проверки
SELECT current_database(), current_user, now();
```

### Проверьте права доступа:
```sql
-- Проверьте существование функций
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%pending_rating%';
```

### Очистите кэш Supabase:
1. В Supabase Dashboard перейдите в **Settings**
2. Найдите **API** раздел  
3. Нажмите **Restart API** (если доступно)

## 🎯 Ожидаемый результат

После исправления тестирование должно работать:
- ✅ **Создать**: 3 тестовых заказа
- ✅ **Запустить**: без ошибок в логах
- ✅ **Проверить**: "Автозавершено: 1, Автоотменено: 2"
- ✅ **Очистить**: тестовые заказы удалены

---

*Исправление подготовлено: 30 сентября 2025*
