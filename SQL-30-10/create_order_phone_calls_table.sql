-- Очистка существующих объектов (если есть)
DROP VIEW IF EXISTS order_phone_conversion;
DROP TABLE IF EXISTS order_phone_calls CASCADE;

-- Создание таблицы для хранения статистики звонков по номеру телефона заказчика
CREATE TABLE IF NOT EXISTS order_phone_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  caller_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  called_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_order_phone_calls_order_id ON order_phone_calls(order_id);
CREATE INDEX IF NOT EXISTS idx_order_phone_calls_caller_id ON order_phone_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_order_phone_calls_called_at ON order_phone_calls(called_at);

-- Добавляем поле для счетчика звонков в таблицу orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone_calls_count INTEGER DEFAULT 0;

-- Создаем функцию для увеличения счетчика звонков
CREATE OR REPLACE FUNCTION increment_order_phone_calls(order_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE orders
  SET phone_calls_count = COALESCE(phone_calls_count, 0) + 1
  WHERE id = order_id;
END;
$$ LANGUAGE plpgsql;

-- Добавляем комментарии для документации
COMMENT ON TABLE order_phone_calls IS 'Статистика звонков заказчику по номеру телефона';
COMMENT ON COLUMN order_phone_calls.order_id IS 'ID заказа';
COMMENT ON COLUMN order_phone_calls.caller_id IS 'ID пользователя, который позвонил (NULL если не авторизован)';
COMMENT ON COLUMN order_phone_calls.called_at IS 'Время звонка';
COMMENT ON COLUMN orders.phone_calls_count IS 'Количество звонков заказчику';

-- Настройка RLS (Row Level Security)
ALTER TABLE order_phone_calls ENABLE ROW LEVEL SECURITY;

-- Политика: все могут добавлять записи (для логирования)
CREATE POLICY "Anyone can insert phone calls" ON order_phone_calls
  FOR INSERT WITH CHECK (true);

-- Политика: только владелец заказа может видеть статистику звонков
CREATE POLICY "Order owner can view phone calls" ON order_phone_calls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_phone_calls.order_id
      AND orders.customer_id = auth.uid()::TEXT
    )
  );

-- Политика: администраторы могут видеть всю статистику
CREATE POLICY "Admins can view all phone calls" ON order_phone_calls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Создаем представление для расчета конверсии (просмотры -> звонки)
CREATE OR REPLACE VIEW order_phone_conversion AS
SELECT 
  o.id as order_id,
  o.title,
  o.customer_id,
  o.phone_views_count,
  o.phone_calls_count,
  CASE 
    WHEN o.phone_views_count > 0 
    THEN ROUND((o.phone_calls_count::NUMERIC / o.phone_views_count::NUMERIC * 100), 2)
    ELSE 0 
  END as conversion_rate
FROM orders o
WHERE o.phone_views_count > 0 OR o.phone_calls_count > 0;

-- Добавляем комментарий для представления
COMMENT ON VIEW order_phone_conversion IS 'Расчет конверсии: процент звонков от просмотров номера';

