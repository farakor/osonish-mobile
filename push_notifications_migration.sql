-- Миграция для системы push уведомлений
-- Запустите эти команды в Supabase SQL Editor

-- 1. Создаем таблицу для хранения push токенов
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  device_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- 2. Создаем таблицу для хранения настроек уведомлений пользователей
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  all_notifications_enabled BOOLEAN DEFAULT true,
  new_orders_enabled BOOLEAN DEFAULT true,
  new_applications_enabled BOOLEAN DEFAULT true,
  order_updates_enabled BOOLEAN DEFAULT true,
  order_completed_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Создаем таблицу для логирования отправленных уведомлений
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered'))
);

-- 4. Создаем индексы для эффективных запросов
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);

-- 5. Настраиваем RLS (Row Level Security)
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Политики для push_tokens
DROP POLICY IF EXISTS "Users can manage their own push tokens" ON push_tokens;
CREATE POLICY "Users can manage their own push tokens" ON push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Политики для notification_settings
DROP POLICY IF EXISTS "Users can manage their own notification settings" ON notification_settings;
CREATE POLICY "Users can manage their own notification settings" ON notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- Политики для notification_logs
DROP POLICY IF EXISTS "Users can read their own notification logs" ON notification_logs;
CREATE POLICY "Users can read their own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 6. Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Создаем триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON push_tokens;
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Функция для получения активных push токенов пользователя
CREATE OR REPLACE FUNCTION get_user_push_tokens(target_user_id UUID)
RETURNS TABLE (
  token TEXT,
  device_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT pt.token, pt.device_type
  FROM push_tokens pt
  WHERE pt.user_id = target_user_id 
    AND pt.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 9. Функция для получения настроек уведомлений с дефолтными значениями
CREATE OR REPLACE FUNCTION get_notification_settings(target_user_id UUID)
RETURNS TABLE (
  all_notifications_enabled BOOLEAN,
  new_orders_enabled BOOLEAN,
  new_applications_enabled BOOLEAN,
  order_updates_enabled BOOLEAN,
  order_completed_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ns.all_notifications_enabled, true),
    COALESCE(ns.new_orders_enabled, true),
    COALESCE(ns.new_applications_enabled, true),
    COALESCE(ns.order_updates_enabled, true),
    COALESCE(ns.order_completed_enabled, true)
  FROM notification_settings ns
  WHERE ns.user_id = target_user_id
  UNION ALL
  SELECT true, true, true, true, true
  WHERE NOT EXISTS (
    SELECT 1 FROM notification_settings WHERE user_id = target_user_id
  )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 10. Показываем результат
SELECT 'push_tokens' as table_name, COUNT(*) as count FROM push_tokens
UNION ALL
SELECT 'notification_settings' as table_name, COUNT(*) as count FROM notification_settings
UNION ALL
SELECT 'notification_logs' as table_name, COUNT(*) as count FROM notification_logs
ORDER BY table_name;