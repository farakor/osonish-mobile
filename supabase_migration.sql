-- Миграция для системы завершения заказов и отзывов
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

-- 5. Создаем таблицу отзывов с правильными типами данных
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Создаем индексы для эффективных запросов
CREATE INDEX IF NOT EXISTS idx_reviews_worker_id ON reviews(worker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_worker ON reviews(customer_id, worker_id);

-- 7. Настраиваем RLS (Row Level Security) для таблицы отзывов
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики если есть
DROP POLICY IF EXISTS "Customers can create reviews for their orders" ON reviews;
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;

-- Заказчики могут создавать отзывы только для своих заказов
CREATE POLICY "Customers can create reviews for their orders" ON reviews
  FOR INSERT 
  WITH CHECK (
    auth.uid() = customer_id AND 
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = order_id AND customer_id = auth.uid()
    )
  );

-- Все могут читать отзывы
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

-- 8. Добавляем функцию для получения рейтинга работника
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
  WHERE worker_id = worker_uuid;
END;
$$ LANGUAGE plpgsql;

-- 8b. Добавляем функцию для получения рейтинга работника (перегрузка для TEXT)
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
  WHERE worker_id = worker_text::UUID;
END;
$$ LANGUAGE plpgsql;

-- 9. Показываем результат
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