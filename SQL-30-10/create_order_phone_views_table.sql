-- Очистка существующих объектов (если есть)
DROP VIEW IF EXISTS order_phone_conversion;
DROP TABLE IF EXISTS order_phone_views CASCADE;

-- Создание таблицы для хранения статистики просмотров номера телефона заказчика
CREATE TABLE IF NOT EXISTS order_phone_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  viewer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_order_phone_views_order_id ON order_phone_views(order_id);
CREATE INDEX IF NOT EXISTS idx_order_phone_views_viewer_id ON order_phone_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_order_phone_views_viewed_at ON order_phone_views(viewed_at);

-- Добавляем поле для счетчика просмотров номера телефона в таблицу orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone_views_count INTEGER DEFAULT 0;

-- Создаем функцию для увеличения счетчика просмотров номера телефона
CREATE OR REPLACE FUNCTION increment_order_phone_views(order_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE orders
  SET phone_views_count = COALESCE(phone_views_count, 0) + 1
  WHERE id = order_id;
END;
$$ LANGUAGE plpgsql;

-- Добавляем комментарии для документации
COMMENT ON TABLE order_phone_views IS 'Статистика просмотров номера телефона заказчика';
COMMENT ON COLUMN order_phone_views.order_id IS 'ID заказа';
COMMENT ON COLUMN order_phone_views.viewer_id IS 'ID пользователя, который просмотрел номер (NULL если не авторизован)';
COMMENT ON COLUMN order_phone_views.viewed_at IS 'Время просмотра номера';
COMMENT ON COLUMN orders.phone_views_count IS 'Количество просмотров номера телефона заказчика';

-- Настройка RLS (Row Level Security)
ALTER TABLE order_phone_views ENABLE ROW LEVEL SECURITY;

-- Политика: все могут добавлять записи (для логирования)
CREATE POLICY "Anyone can insert phone views" ON order_phone_views
  FOR INSERT WITH CHECK (true);

-- Политика: только владелец заказа может видеть статистику просмотров своего номера
CREATE POLICY "Order owner can view phone views" ON order_phone_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_phone_views.order_id
      AND orders.customer_id = auth.uid()::TEXT
    )
  );

-- Политика: администраторы могут видеть всю статистику
CREATE POLICY "Admins can view all phone views" ON order_phone_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

