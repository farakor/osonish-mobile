# 🚀 Быстрое копирование базы данных

## 📋 Найденные таблицы в продакшене:

✅ **Основные таблицы:**
- `users` - пользователи
- `orders` - заказы  
- `applicants` - заявки исполнителей
- `notifications` - уведомления
- `reviews` - отзывы

✅ **Дополнительные таблицы:**
- `scheduled_reminders` - запланированные напоминания
- `review_moderation` - модерация отзывов
- `call_logs` - логи звонков
- `pending_ratings` - ожидающие оценки
- `moderation_rules` - правила модерации
- `notification_settings` - настройки уведомлений
- `push_tokens` - токены для push-уведомлений

✅ **Админ таблицы:**
- `admin_users` - администраторы
- `admin_sessions` - сессии администраторов

## 🎯 Рекомендуемый способ копирования

### Вариант 1: Через Supabase Dashboard (Самый простой)

1. **Продакшен проект** (qmbavgwkxtqudchuahdv):
   ```
   https://supabase.com/dashboard/project/qmbavgwkxtqudchuahdv
   Settings → Database → Backups → Download backup
   ```

2. **Тестовый проект** (ruuseponrzonvyyqpdsc):
   ```
   https://supabase.com/dashboard/project/ruuseponrzonvyyqpdsc
   SQL Editor → New query → Загрузить файл → Run
   ```

### Вариант 2: Пошаговое копирование структуры

1. **Получите структуру таблиц:**
   - Выполните `SQL/simple_export_schema.sql` в продакшене
   - Сохраните результаты каждого запроса

2. **Создайте таблицы в тестовой среде:**
   - Используйте полученные результаты для создания CREATE TABLE запросов

### Вариант 3: Автоматический скрипт

```bash
# Установите зависимости (если еще не установлены)
npm install @supabase/supabase-js

# Запустите копирование с тестовыми данными
node scripts/copy-database.js --sample-data
```

## 📝 Пример CREATE TABLE запросов

Основываясь на типичной структуре, вот примеры запросов для создания основных таблиц:

```sql
-- Таблица пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    birth_date DATE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'worker')),
    profile_image TEXT,
    city VARCHAR(100),
    preferred_language VARCHAR(5) DEFAULT 'ru',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица заказов
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    budget INTEGER NOT NULL,
    workers_needed INTEGER DEFAULT 1,
    service_date TIMESTAMPTZ NOT NULL,
    photos TEXT[],
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'cancelled')),
    applicants_count INTEGER DEFAULT 0,
    transport_paid BOOLEAN DEFAULT false,
    meal_included BOOLEAN DEFAULT false,
    meal_paid BOOLEAN DEFAULT false,
    auto_completed BOOLEAN DEFAULT false,
    auto_cancelled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица заявок
CREATE TABLE applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_name VARCHAR(200) NOT NULL,
    worker_phone VARCHAR(20) NOT NULL,
    rating DECIMAL(3,2),
    completed_jobs INTEGER DEFAULT 0,
    message TEXT,
    proposed_price INTEGER,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id, worker_id)
);

-- Таблица уведомлений
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔒 RLS Политики

После создания таблиц, не забудьте включить RLS и создать политики:

```sql
-- Включаем RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Примеры политик (упрощенные)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Orders are viewable by everyone" ON orders FOR SELECT USING (true);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid()::text = customer_id);
CREATE POLICY "Customers can update own orders" ON orders FOR UPDATE USING (auth.uid()::text = customer_id);
```

## ✅ Проверка успешного копирования

После копирования выполните проверки:

```sql
-- Проверка количества записей
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL  
SELECT 'applicants', COUNT(*) FROM applicants
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;

-- Проверка RLS политик
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';

-- Проверка внешних ключей
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
```

## 🎭 Создание тестовых данных

Если хотите создать безопасные тестовые данные вместо копирования реальных:

```sql
-- Тестовые пользователи
INSERT INTO users (phone, first_name, last_name, birth_date, role, city, preferred_language) VALUES
('+998901111111', 'Тест', 'Заказчик', '1990-01-01', 'customer', 'Ташкент', 'ru'),
('+998902222222', 'Тест', 'Исполнитель', '1985-05-15', 'worker', 'Ташкент', 'uz'),
('+998903333333', 'Админ', 'Тестовый', '1980-12-25', 'customer', 'Ташкент', 'ru');

-- Тестовые заказы
INSERT INTO orders (title, description, category, location, budget, workers_needed, service_date, customer_id, status) 
SELECT 
    'Тестовый заказ ' || generate_series,
    'Описание тестового заказа номер ' || generate_series,
    CASE (generate_series % 4) 
        WHEN 0 THEN 'Уборка'
        WHEN 1 THEN 'Ремонт' 
        WHEN 2 THEN 'Доставка'
        ELSE 'Другое'
    END,
    'Ташкент, район ' || generate_series,
    (generate_series * 10000 + 50000),
    (generate_series % 3 + 1),
    NOW() + (generate_series || ' days')::interval,
    (SELECT id FROM users WHERE role = 'customer' LIMIT 1),
    CASE (generate_series % 3)
        WHEN 0 THEN 'new'
        WHEN 1 THEN 'in_progress'
        ELSE 'completed'
    END
FROM generate_series(1, 10);
```

## 🔄 Переключение на тестовую среду

После успешного копирования:

```bash
# Переключитесь на тестовую среду
./switch-environment.sh dev

# Запустите приложение в тестовом режиме
cd osonish-mobile && npm run start:dev
cd osonish-admin && npm run dev
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в Supabase Dashboard
2. Убедитесь в правильности connection strings  
3. Проверьте права доступа к базам данных
4. Обратитесь к `DATABASE_MIGRATION_GUIDE.md` для подробной информации

---

**Статус:** ✅ Готово к использованию  
**Обновлено:** $(date)
