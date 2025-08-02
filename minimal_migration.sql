-- МИНИМАЛЬНАЯ МИГРАЦИЯ - работает с любыми типами
-- Запустите ТОЛЬКО этот файл в Supabase SQL Editor

-- 1. Удаляем таблицу если существует
DROP TABLE IF EXISTS reviews CASCADE;

-- 2. Обновляем ограничения для applicants (добавляем completed)
ALTER TABLE applicants DROP CONSTRAINT IF EXISTS applicants_status_check;
ALTER TABLE applicants ADD CONSTRAINT applicants_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'));

-- 3. Создаем простую таблицу отзывов БЕЗ foreign keys
CREATE TABLE reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Создаем индексы
CREATE INDEX idx_reviews_worker_id ON reviews(worker_id);
CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

-- 5. Включаем RLS с простой политикой
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Простая политика: пользователи могут создавать отзывы
CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- Все могут читать отзывы
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

-- 6. Простая функция для рейтинга
CREATE OR REPLACE FUNCTION get_worker_rating(worker_id_param TEXT)
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
  WHERE worker_id = worker_id_param;
END;
$$ LANGUAGE plpgsql;

-- 7. Проверяем результат
SELECT 
    'reviews' as table_name,
    COUNT(*) as total_rows
FROM reviews;

-- 8. Показываем структуру таблицы
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' 
  AND table_schema = 'public'
ORDER BY ordinal_position;