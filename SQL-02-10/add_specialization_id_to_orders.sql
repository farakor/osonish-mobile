-- Добавление поля specialization_id в таблицу orders
-- Это поле позволяет связать заказ с конкретной специализацией профессионального мастера

-- 1. Добавляем колонку specialization_id
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS specialization_id TEXT;

-- 2. Добавляем комментарий к колонке
COMMENT ON COLUMN orders.specialization_id IS 'ID специализации для профессиональных мастеров (например: plumber, electrician, carpenter)';

-- 3. Создаем индекс для улучшения производительности поиска по специализации
CREATE INDEX IF NOT EXISTS idx_orders_specialization_id 
ON orders(specialization_id) 
WHERE specialization_id IS NOT NULL;

-- 4. Проверяем результат
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'orders'
  AND column_name = 'specialization_id';

-- 5. Показываем несколько записей для проверки
SELECT 
    id,
    title,
    category,
    specialization_id,
    status,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;
