-- =====================================================
-- Обновление таблицы call_logs для поддержки звонков без контекста заказа
-- =====================================================
-- Дата: 07 октября 2025
-- Описание: Делает поля order_id, order_status и days_since_order_created nullable
--           для поддержки звонков из профилей мастеров (без контекста заказа)

-- Проверяем текущую структуру таблицы
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'call_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Делаем order_id nullable (если не nullable)
ALTER TABLE call_logs 
ALTER COLUMN order_id DROP NOT NULL;

-- Делаем order_status nullable (если не nullable)
ALTER TABLE call_logs 
ALTER COLUMN order_status DROP NOT NULL;

-- Делаем days_since_order_created nullable (если не nullable)
ALTER TABLE call_logs 
ALTER COLUMN days_since_order_created DROP NOT NULL;

-- Проверяем обновленную структуру
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'call_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Комментарии к таблице и столбцам
COMMENT ON TABLE call_logs IS 'Логи звонков пользователей (как с контекстом заказа, так и без)';
COMMENT ON COLUMN call_logs.order_id IS 'ID заказа (nullable для звонков вне контекста заказа)';
COMMENT ON COLUMN call_logs.order_status IS 'Статус заказа на момент звонка (nullable если нет контекста заказа)';
COMMENT ON COLUMN call_logs.days_since_order_created IS 'Дней с создания заказа (nullable если нет контекста заказа)';
COMMENT ON COLUMN call_logs.call_source IS 'Источник звонка: order_details, applicants_list, job_details, professional_profile, worker_profile, other';

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_call_logs_caller_id ON call_logs(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_receiver_id ON call_logs(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_order_id ON call_logs(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_call_source ON call_logs(call_source);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_initiated_at ON call_logs(call_initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller_receiver ON call_logs(caller_id, receiver_id);

-- Проверка данных: показываем статистику по источникам звонков
SELECT 
  call_source,
  COUNT(*) as total_calls,
  COUNT(order_id) as calls_with_order,
  COUNT(*) - COUNT(order_id) as calls_without_order,
  COUNT(DISTINCT caller_id) as unique_callers,
  COUNT(DISTINCT receiver_id) as unique_receivers
FROM call_logs
GROUP BY call_source
ORDER BY total_calls DESC;

-- Проверка: звонки без контекста заказа
SELECT 
  call_source,
  caller_type,
  receiver_type,
  COUNT(*) as count
FROM call_logs
WHERE order_id IS NULL
GROUP BY call_source, caller_type, receiver_type
ORDER BY count DESC;
