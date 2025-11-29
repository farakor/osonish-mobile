-- Скрипт для проверки существующих типов данных
-- Запустите СНАЧАЛА этот скрипт в Supabase SQL Editor

-- 1. Проверяем типы колонок в таблице orders
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'customer_id')
ORDER BY column_name;

-- 2. Проверяем типы колонок в таблице applicants  
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'applicants' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'order_id', 'worker_id')
ORDER BY column_name;

-- 3. Проверяем тип auth.users.id
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'auth'
  AND column_name = 'id';

-- 4. Показываем существующие foreign keys
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('orders', 'applicants');