-- Добавление полей для подсчета просмотров
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Добавляем поле для подсчета просмотров заказов
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 2. Добавляем поле для подсчета просмотров профилей пользователей
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_views_count INTEGER DEFAULT 0;

-- 3. Добавляем индексы для оптимизации сортировки по просмотрам
CREATE INDEX IF NOT EXISTS idx_orders_views_count ON orders(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_users_profile_views ON users(profile_views_count DESC) 
  WHERE role = 'worker' AND worker_type = 'professional';

-- 4. Создаем функцию для инкремента просмотров заказа
CREATE OR REPLACE FUNCTION increment_order_views(order_id_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE orders 
  SET views_count = COALESCE(views_count, 0) + 1,
      updated_at = NOW()
  WHERE id = order_id_param;
END;
$$;

-- 5. Создаем функцию для инкремента просмотров профиля
CREATE OR REPLACE FUNCTION increment_profile_views(user_id_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users 
  SET profile_views_count = COALESCE(profile_views_count, 0) + 1
  WHERE id = user_id_param;
END;
$$;

-- 6. Добавляем комментарии к полям
COMMENT ON COLUMN orders.views_count IS 'Количество просмотров заказа';
COMMENT ON COLUMN users.profile_views_count IS 'Количество просмотров профиля (для профессиональных мастеров)';

-- 7. Проверяем, что поля добавлены
SELECT 
  'orders.views_count' as field,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'views_count'
  ) as exists;

SELECT 
  'users.profile_views_count' as field,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'profile_views_count'
  ) as exists;

