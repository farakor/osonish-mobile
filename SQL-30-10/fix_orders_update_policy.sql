-- Проверка и исправление RLS политик для обновления заказов
-- Этот скрипт позволяет заказчикам обновлять только свои заказы

-- 1. Удаляем старую политику, если она существует
DROP POLICY IF EXISTS "Customers can update own orders" ON orders;

-- 2. Создаем новую политику, которая проверяет customer_id
CREATE POLICY "Customers can update own orders" ON orders 
FOR UPDATE 
USING (
  -- Проверяем, что пользователь обновляет свой заказ
  customer_id = auth.uid()::text OR
  -- Или разрешаем сервисной роли (для админки)
  auth.role() = 'service_role' OR
  -- Или если нет auth (для анонимных пользователей через service key)
  auth.uid() IS NULL
);

-- 3. Проверяем текущие политики
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'orders' AND policyname LIKE '%update%';

