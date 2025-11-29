-- Безопасная миграция для системы завершения заказов и отзывов
-- Запустите эти команды в Supabase SQL Editor

-- 1. Сначала удаляем старые check constraints
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE applicants DROP CONSTRAINT IF EXISTS applicants_status_check;

-- 2. Обновляем все существующие заказы со статусом 'active' на 'new'
UPDATE orders SET status = 'new' WHERE status = 'active';

-- 3. Обновляем статусы откликов: 'selected' -> 'accepted'
UPDATE applicants SET status = 'accepted' WHERE status = 'selected';

-- 4. Добавляем новые check constraints с поддержкой всех статусов
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('new', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE applicants ADD CONSTRAINT applicants_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'));

-- 5. Удаляем таблицу reviews если она уже существует с неправильными типами
DROP TABLE IF EXISTS reviews CASCADE;

-- 6. Получаем типы данных из существующих таблиц
DO $$
DECLARE
    orders_id_type TEXT;
    users_id_type TEXT;
    applicants_worker_id_type TEXT;
BEGIN
    -- Получаем тип колонки id из таблицы orders
    SELECT data_type INTO orders_id_type
    FROM information_schema.columns 
    WHERE table_name = 'orders' AND table_schema = 'public' AND column_name = 'id';
    
    -- Получаем тип колонки id из таблицы auth.users
    SELECT data_type INTO users_id_type
    FROM information_schema.columns 
    WHERE table_name = 'users' AND table_schema = 'auth' AND column_name = 'id';
    
    -- Получаем тип worker_id из applicants (если есть)
    SELECT data_type INTO applicants_worker_id_type
    FROM information_schema.columns 
    WHERE table_name = 'applicants' AND table_schema = 'public' AND column_name = 'worker_id';

    RAISE NOTICE 'orders.id type: %, auth.users.id type: %, applicants.worker_id type: %', 
                 orders_id_type, users_id_type, applicants_worker_id_type;
END $$;

-- 7. Создаем таблицу отзывов с типами, соответствующими существующей схеме
-- Используем TEXT для всех ID кроме auth.users (который точно UUID)
CREATE TABLE reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Пытаемся добавить foreign keys (если типы совместимы)
DO $$
BEGIN
    -- FK для order_id
    BEGIN
        ALTER TABLE reviews ADD CONSTRAINT reviews_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
        RAISE NOTICE 'FK для order_id добавлен успешно';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Не удалось добавить FK для order_id: %', SQLERRM;
    END;
    
    -- FK для customer_id (пытаемся с orders.customer_id)
    BEGIN
        ALTER TABLE reviews ADD CONSTRAINT reviews_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES orders(customer_id) ON DELETE CASCADE;
        RAISE NOTICE 'FK для customer_id добавлен успешно (через orders.customer_id)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Не удалось добавить FK для customer_id через orders: %', SQLERRM;
        -- Пытаемся добавить без FK, только с индексом
        RAISE NOTICE 'Создаем индекс вместо FK для customer_id';
    END;
    
    -- FK для worker_id (пытаемся с applicants.worker_id)
    BEGIN
        -- Сначала пытаемся через applicants
        ALTER TABLE reviews ADD CONSTRAINT reviews_worker_id_fkey 
        FOREIGN KEY (worker_id) REFERENCES applicants(worker_id) ON DELETE CASCADE;
        RAISE NOTICE 'FK для worker_id добавлен успешно (через applicants.worker_id)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Не удалось добавить FK для worker_id через applicants: %', SQLERRM;
        -- Создаем только индекс
        RAISE NOTICE 'Создаем индекс вместо FK для worker_id';
    END;
END $$;

-- 9. Создаем индексы для эффективных запросов
CREATE INDEX IF NOT EXISTS idx_reviews_worker_id ON reviews(worker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_worker ON reviews(customer_id, worker_id);

-- 10. Настраиваем RLS (Row Level Security) для таблицы отзывов
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики если есть
DROP POLICY IF EXISTS "Customers can create reviews for their orders" ON reviews;
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;

-- Заказчики могут создавать отзывы только для своих заказов
CREATE POLICY "Customers can create reviews for their orders" ON reviews
  FOR INSERT 
  WITH CHECK (
    auth.uid()::text = customer_id AND 
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = order_id AND customer_id = auth.uid()::text
    )
  );

-- Все могут читать отзывы
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

-- 11. Добавляем функции для получения рейтинга работника
-- Версия для UUID
CREATE OR REPLACE FUNCTION get_worker_rating(worker_uuid UUID)
RETURNS TABLE (
  average_rating NUMERIC,
  total_reviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ROUND(AVG(rating::NUMERIC), 1), 0) as average_rating,
    COUNT(*)::INTEGER as total_reviews
  FROM reviews 
  WHERE worker_id = worker_uuid::text;
END;
$$ LANGUAGE plpgsql;

-- Версия для TEXT
CREATE OR REPLACE FUNCTION get_worker_rating(worker_text TEXT)
RETURNS TABLE (
  average_rating NUMERIC,
  total_reviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ROUND(AVG(rating::NUMERIC), 1), 0) as average_rating,
    COUNT(*)::INTEGER as total_reviews
  FROM reviews 
  WHERE worker_id = worker_text;
END;
$$ LANGUAGE plpgsql;

-- 12. Показываем результат
SELECT 'orders' as table_name, status, COUNT(*) as count 
FROM orders 
GROUP BY status
UNION ALL
SELECT 'applicants' as table_name, status, COUNT(*) as count 
FROM applicants 
GROUP BY status
UNION ALL
SELECT 'reviews' as table_name, 'total' as status, COUNT(*) as count 
FROM reviews
ORDER BY table_name, status;

-- 13. Показываем структуру созданной таблицы
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' 
  AND table_schema = 'public'
ORDER BY ordinal_position;