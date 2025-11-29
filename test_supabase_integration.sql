-- Тестовый скрипт для проверки интеграции отзывов
-- Запустите эти команды в Supabase SQL Editor для тестирования

-- 1. Проверяем существование таблиц
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('orders', 'applicants', 'reviews');

-- 2. Проверяем структуру таблицы reviews
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Проверяем ограничения
SELECT conname, contype, consrc
FROM pg_constraint 
WHERE conrelid = 'public.reviews'::regclass;

-- 4. Проверяем индексы
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'reviews' AND schemaname = 'public';

-- 5. Проверяем политики RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'reviews';

-- 6. Тестируем функцию получения рейтинга
SELECT * FROM get_worker_rating('00000000-0000-0000-0000-000000000000'::uuid);

-- 7. Проверяем ограничения для applicants
SELECT conname, consrc
FROM pg_constraint 
WHERE conrelid = 'public.applicants'::regclass 
AND conname = 'applicants_status_check';

-- 8. Показываем примеры данных (если есть)
SELECT 'orders' as table_name, status, COUNT(*) as count 
FROM orders 
GROUP BY status
UNION ALL
SELECT 'applicants' as table_name, status, COUNT(*) as count 
FROM applicants 
GROUP BY status
UNION ALL
SELECT 'reviews' as table_name, 'total' as status, COUNT(*) as count 
FROM reviews
ORDER BY table_name, status;