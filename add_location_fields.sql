-- Миграция для добавления полей геолокации в таблицу orders
-- Выполните эту миграцию в Supabase SQL Editor

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Добавляем комментарии к полям
COMMENT ON COLUMN orders.latitude IS 'Широта места выполнения заказа';
COMMENT ON COLUMN orders.longitude IS 'Долгота места выполнения заказа';

-- Создаем индекс для быстрого поиска заказов по геолокации
CREATE INDEX IF NOT EXISTS idx_orders_location 
ON orders USING btree (latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Добавляем проверочные ограничения для корректности координат
ALTER TABLE orders
ADD CONSTRAINT check_latitude_range 
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
ADD CONSTRAINT check_longitude_range 
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));