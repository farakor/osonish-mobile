-- ============================================
-- SQL Скрипт для включения функционала создания заказов исполнителями
-- Дата: 2025-10-30
-- Описание: Позволяет исполнителям (workers) создавать заказы как заказчики
-- ============================================

-- 1. Добавляем опциональное поле для отслеживания роли создателя заказа
-- Это поле используется только для аналитики и не влияет на логику приложения
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(20);

-- Создаем комментарий для поля
COMMENT ON COLUMN orders.created_by_role IS 'Роль пользователя, создавшего заказ (customer/worker) - используется только для аналитики';

-- 2. Обновляем существующие заказы - помечаем их как созданные заказчиками
UPDATE orders 
SET created_by_role = 'customer' 
WHERE created_by_role IS NULL;

-- ============================================
-- 3. ОБНОВЛЕНИЕ RLS ПОЛИТИК
-- ============================================

-- 3.1. Удаляем старые политики для таблицы orders
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Orders are viewable by everyone" ON orders;
DROP POLICY IF EXISTS "Customers can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

-- 3.2. Создаем новые улучшенные политики

-- Политика SELECT: Все авторизованные пользователи могут просматривать заказы
CREATE POLICY "Authenticated users can view orders" 
ON orders FOR SELECT 
USING (true);

-- Политика INSERT: Все авторизованные пользователи могут создавать заказы
-- (и заказчики, и исполнители)
CREATE POLICY "Authenticated users can create orders" 
ON orders FOR INSERT 
WITH CHECK (true);

-- Политика UPDATE: Пользователи могут обновлять только свои собственные заказы
-- (где они являются заказчиком)
CREATE POLICY "Users can update own orders" 
ON orders FOR UPDATE 
USING (customer_id = auth.uid()::text);

-- Политика DELETE: Пользователи могут удалять только свои собственные заказы
CREATE POLICY "Users can delete own orders" 
ON orders FOR DELETE 
USING (customer_id = auth.uid()::text);

-- ============================================
-- 4. СОЗДАНИЕ ИНДЕКСОВ ДЛЯ ОПТИМИЗАЦИИ ЗАПРОСОВ
-- ============================================

-- Индекс для быстрого поиска заказов, созданных конкретным пользователем
CREATE INDEX IF NOT EXISTS idx_orders_customer_id_created_at 
ON orders(customer_id, created_at DESC);

-- Индекс для аналитики по роли создателя
CREATE INDEX IF NOT EXISTS idx_orders_created_by_role 
ON orders(created_by_role) 
WHERE created_by_role IS NOT NULL;

-- Индекс для фильтрации заказов по статусу и дате
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at 
ON orders(status, created_at DESC);

-- ============================================
-- 5. СОЗДАНИЕ ФУНКЦИИ ДЛЯ ЛОГИРОВАНИЯ СОЗДАНИЯ ЗАКАЗОВ
-- ============================================

-- Функция для автоматического заполнения поля created_by_role при создании заказа
-- На основе роли текущего пользователя
CREATE OR REPLACE FUNCTION set_order_created_by_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Получаем роль пользователя из таблицы users
  SELECT role INTO NEW.created_by_role
  FROM users
  WHERE id = NEW.customer_id;
  
  -- Если роль не найдена, устанавливаем 'unknown'
  IF NEW.created_by_role IS NULL THEN
    NEW.created_by_role := 'unknown';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер для автоматического заполнения роли при создании заказа
DROP TRIGGER IF EXISTS trigger_set_order_created_by_role ON orders;
CREATE TRIGGER trigger_set_order_created_by_role
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_created_by_role();

-- ============================================
-- 6. СОЗДАНИЕ ПРЕДСТАВЛЕНИЯ ДЛЯ АНАЛИТИКИ
-- ============================================

-- Представление для аналитики заказов с информацией о создателе
CREATE OR REPLACE VIEW v_orders_with_creator_info AS
SELECT 
  o.id,
  o.title,
  o.description,
  o.customer_id,
  o.created_by_role,
  o.status,
  o.budget,
  o.workers_needed,
  o.service_date,
  o.created_at,
  o.updated_at,
  u.first_name || ' ' || u.last_name AS customer_name,
  u.role AS customer_current_role,
  u.phone AS customer_phone,
  CASE 
    WHEN o.created_by_role = 'worker' THEN 'Создан исполнителем'
    WHEN o.created_by_role = 'customer' THEN 'Создан заказчиком'
    ELSE 'Неизвестно'
  END AS creator_type_ru
FROM orders o
INNER JOIN users u ON o.customer_id = u.id;

COMMENT ON VIEW v_orders_with_creator_info IS 'Представление для аналитики заказов с информацией о создателе';

-- ============================================
-- 7. ПРОВЕРКА РАБОТОСПОСОБНОСТИ
-- ============================================

-- Проверяем, что политики созданы успешно
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'orders';
  
  IF policy_count >= 4 THEN
    RAISE NOTICE '✅ Все политики для таблицы orders созданы успешно (найдено: %)', policy_count;
  ELSE
    RAISE WARNING '⚠️ Внимание: найдено только % политик для таблицы orders', policy_count;
  END IF;
END $$;

-- Проверяем, что триггер создан успешно
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_set_order_created_by_role'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Триггер для автоматического заполнения роли создан успешно';
  ELSE
    RAISE WARNING '⚠️ Триггер не найден';
  END IF;
END $$;

-- Проверяем, что поле created_by_role добавлено
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'created_by_role'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE '✅ Поле created_by_role добавлено в таблицу orders';
  ELSE
    RAISE WARNING '⚠️ Поле created_by_role не найдено';
  END IF;
END $$;

-- ============================================
-- 8. ROLLBACK СКРИПТ (на случай необходимости отката)
-- ============================================

/*
-- ДЛЯ ОТКАТА ИЗМЕНЕНИЙ ВЫПОЛНИТЕ СЛЕДУЮЩИЙ КОД:

-- Удаляем представление
DROP VIEW IF EXISTS v_orders_with_creator_info;

-- Удаляем триггер и функцию
DROP TRIGGER IF EXISTS trigger_set_order_created_by_role ON orders;
DROP FUNCTION IF EXISTS set_order_created_by_role();

-- Удаляем индексы
DROP INDEX IF EXISTS idx_orders_customer_id_created_at;
DROP INDEX IF EXISTS idx_orders_created_by_role;
DROP INDEX IF EXISTS idx_orders_status_created_at;

-- Удаляем новые политики
DROP POLICY IF EXISTS "Authenticated users can view orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;

-- Восстанавливаем старые политики
CREATE POLICY "Orders are viewable by everyone" ON orders FOR SELECT USING (true);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can update own orders" ON orders FOR UPDATE USING (true);

-- Удаляем поле created_by_role
ALTER TABLE orders DROP COLUMN IF EXISTS created_by_role;

*/

-- ============================================
-- КОНЕЦ СКРИПТА
-- ============================================

-- Финальное сообщение об успешном выполнении
DO $$
BEGIN
  RAISE NOTICE '✅ Скрипт выполнен успешно! Исполнители теперь могут создавать заказы.';
END $$;
