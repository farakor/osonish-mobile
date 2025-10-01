# Руководство по копированию базы данных из продакшена в тестовую среду

## 🎯 Цель
Скопировать полную структуру и данные из продакшен Supabase проекта в тестовый проект для безопасного тестирования.

## 📋 Основные таблицы в проекте

Из анализа кода выявлены следующие основные таблицы:
- `users` - пользователи (клиенты и исполнители)
- `orders` - заказы
- `applicants` - заявки исполнителей на заказы
- `notifications` - уведомления
- `scheduled_reminders` - запланированные напоминания
- `reviews` - отзывы
- `review_moderation` - модерация отзывов
- `call_logs` - логи звонков
- `pending_ratings` - ожидающие оценки
- `admin_users` - администраторы
- `admin_sessions` - сессии администраторов

## 🚀 Способ 1: Через Supabase Dashboard (Рекомендуется)

### Шаг 1: Экспорт из продакшена

1. Зайдите в ваш **продакшен проект** Supabase
2. Перейдите в **Settings → Database**
3. Найдите раздел **Database backups**
4. Нажмите **Download backup** или **Create backup**
5. Скачайте `.sql` файл с полным дампом

### Шаг 2: Импорт в тестовую среду

1. Зайдите в ваш **тестовый проект** Supabase (`ruuseponrzonvyyqpdsc`)
2. Перейдите в **SQL Editor**
3. Создайте новый запрос
4. Загрузите скачанный `.sql` файл или скопируйте его содержимое
5. Выполните запрос

## 🛠️ Способ 2: Через pg_dump (Для продвинутых пользователей)

### Требования:
- PostgreSQL клиент установлен локально
- Доступ к connection strings обоих проектов

### Команды:

```bash
# 1. Получите connection strings из Settings → Database в обоих проектах

# 2. Экспорт из продакшена
pg_dump "postgresql://postgres:[PASSWORD]@db.qmbavgwkxtqudchuahdv.supabase.co:5432/postgres" \
  --no-owner --no-privileges --clean --if-exists \
  > production_backup.sql

# 3. Импорт в тестовую среду
psql "postgresql://postgres:[PASSWORD]@db.ruuseponrzonvyyqpdsc.supabase.co:5432/postgres" \
  < production_backup.sql
```

## 🔧 Способ 3: Через SQL скрипты (Ручной)

Если предыдущие способы не работают, можно скопировать данные вручную:

### Шаг 1: Экспорт структуры

Выполните в **продакшен проекте**:

```sql
-- Получить DDL всех таблиц
SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
    string_agg(
        column_name || ' ' || data_type ||
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE 
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE 
            WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default
            ELSE ''
        END,
        ', '
    ) || ');' as create_statement
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.tablename
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('users', 'orders', 'applicants', 'notifications', 'scheduled_reminders', 'reviews', 'review_moderation', 'call_logs', 'pending_ratings', 'admin_users', 'admin_sessions')
GROUP BY schemaname, tablename;
```

### Шаг 2: Экспорт данных

```sql
-- Экспорт пользователей (без паролей для безопасности)
COPY (
    SELECT id, phone, first_name, last_name, middle_name, birth_date, role, profile_image, city, preferred_language, created_at, updated_at 
    FROM users 
    LIMIT 100  -- Ограничиваем для тестов
) TO STDOUT WITH CSV HEADER;

-- Экспорт заказов (последние 50)
COPY (
    SELECT * FROM orders 
    ORDER BY created_at DESC 
    LIMIT 50
) TO STDOUT WITH CSV HEADER;

-- Экспорт заявок
COPY (
    SELECT * FROM applicants 
    WHERE created_at > NOW() - INTERVAL '30 days'
) TO STDOUT WITH CSV HEADER;
```

## 🤖 Способ 4: Автоматический скрипт

Создан специальный скрипт для автоматизации процесса.

## ⚠️ Важные замечания

### Что нужно учесть при копировании:

1. **Пароли пользователей**: Не копируйте реальные пароли в тестовую среду
2. **Персональные данные**: Рассмотрите анонимизацию телефонов и имен
3. **Файлы и изображения**: Supabase Storage нужно копировать отдельно
4. **RLS политики**: Убедитесь, что политики безопасности скопированы
5. **Функции и триггеры**: Проверьте, что все функции работают

### Рекомендации по данным для тестов:

```sql
-- Создание тестовых пользователей вместо копирования реальных
INSERT INTO users (phone, first_name, last_name, birth_date, role, city, preferred_language) VALUES
('+998901111111', 'Тест', 'Заказчик', '1990-01-01', 'customer', 'Ташкент', 'ru'),
('+998902222222', 'Тест', 'Исполнитель', '1985-05-15', 'worker', 'Ташкент', 'uz'),
('+998903333333', 'Админ', 'Тестовый', '1980-12-25', 'customer', 'Ташкент', 'ru');

-- Создание тестовых заказов
INSERT INTO orders (title, description, category, location, budget, workers_needed, service_date, customer_id, status) VALUES
('Тестовый заказ 1', 'Описание тестового заказа', 'Уборка', 'Ташкент, Мирабад', 50000, 1, '2024-02-01', (SELECT id FROM users WHERE phone = '+998901111111'), 'new'),
('Тестовый заказ 2', 'Еще один тест', 'Ремонт', 'Ташкент, Юнусабад', 100000, 2, '2024-02-02', (SELECT id FROM users WHERE phone = '+998901111111'), 'in_progress');
```

## 🔍 Проверка успешного копирования

После копирования выполните проверки:

```sql
-- Проверка количества записей
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 
    'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 
    'applicants' as table_name, COUNT(*) as count FROM applicants
UNION ALL
SELECT 
    'notifications' as table_name, COUNT(*) as count FROM notifications;

-- Проверка структуры таблиц
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'orders', 'applicants', 'notifications')
ORDER BY table_name, ordinal_position;

-- Проверка RLS политик
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public';
```

## 🛡️ Безопасность при копировании

### Что делать с чувствительными данными:

1. **Анонимизация телефонов**:
```sql
UPDATE users SET phone = '+99890' || LPAD((ROW_NUMBER() OVER())::text, 7, '0');
```

2. **Сброс паролей** (если есть):
```sql
UPDATE users SET password_hash = NULL;
```

3. **Очистка персональных данных**:
```sql
UPDATE users SET 
    first_name = 'Тест' || id::text,
    last_name = 'Пользователь',
    middle_name = NULL,
    profile_image = NULL;
```

## 🔄 Регулярное обновление тестовой среды

Рекомендуется обновлять тестовую среду:
- **Еженедельно** - для актуальности структуры
- **Перед крупными обновлениями** - для тестирования миграций
- **При изменении схемы БД** - для проверки совместимости

## 📞 Поддержка

Если возникают проблемы:
1. Проверьте логи в Supabase Dashboard
2. Убедитесь в правильности connection strings
3. Проверьте права доступа к базам данных
4. Обратитесь к документации Supabase

---

**Создано:** $(date)  
**Статус:** ✅ Готово к использованию
