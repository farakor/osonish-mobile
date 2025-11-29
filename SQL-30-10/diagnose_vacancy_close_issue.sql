-- Диагностика и исправление проблемы с завершением вакансий

-- 1. Проверяем текущий статус вакансии
SELECT 
    id,
    job_title,
    status,
    customer_id,
    type,
    updated_at
FROM orders
WHERE id = 'vacancy_1763755838035_5jv7r30';

-- 2. Проверяем все RLS политики для таблицы orders
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY cmd, policyname;

-- 3. Проверяем есть ли триггеры, которые могут мешать обновлению
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'orders'
ORDER BY trigger_name;

-- 4. Попробуем вручную обновить статус (с правами суперюзера)
-- ВАЖНО: Это работает только если вы выполняете запрос в Supabase Dashboard
UPDATE orders
SET 
    status = 'completed',
    updated_at = NOW()
WHERE id = 'vacancy_1763755838035_5jv7r30'
  AND type = 'vacancy'
RETURNING id, job_title, status, updated_at;

-- 5. Проверяем результат обновления
SELECT 
    id,
    job_title,
    status,
    type,
    customer_id,
    updated_at
FROM orders
WHERE id = 'vacancy_1763755838035_5jv7r30';

-- 6. Если политика блокирует UPDATE для пользователей, создадим более гибкую
-- Сначала удалим старую политику
DROP POLICY IF EXISTS "Customers can update own orders" ON orders;

-- Создаем новую политику, которая разрешает владельцам обновлять свои заказы
CREATE POLICY "Customers can update own orders" ON orders 
FOR UPDATE 
USING (
    -- Владелец может обновлять свой заказ
    customer_id = auth.uid()::text
)
WITH CHECK (
    -- При обновлении проверяем что customer_id не изменился
    customer_id = auth.uid()::text
);

-- 7. Если нужен более простой доступ для тестирования, временно разрешим всё
-- ВНИМАНИЕ: Использовать только для диагностики!
-- DROP POLICY IF EXISTS "Customers can update own orders" ON orders;
-- CREATE POLICY "Customers can update own orders" ON orders FOR UPDATE USING (true);

-- 8. Проверяем что политика создана правильно
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'orders' AND cmd = 'UPDATE';

-- 9. Дополнительная диагностика - проверяем количество завершенных вакансий
SELECT 
    status,
    type,
    COUNT(*) as count
FROM orders
WHERE type = 'vacancy'
GROUP BY status, type;

-- 10. Проверяем не блокирует ли SELECT политика чтение обновленных данных
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'orders' AND cmd = 'SELECT';

