-- =====================================================
-- ПРОВЕРКА ТЕКУЩЕГО СОСТОЯНИЯ
-- =====================================================
-- Выполните этот скрипт чтобы увидеть текущие политики
-- =====================================================

-- 1. Проверяем существующие политики
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    roles,
    qual as using_condition,
    with_check as check_condition
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- 2. Проверяем, включен ли RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage'
AND tablename = 'objects';

-- 3. Проверяем buckets
SELECT 
    id,
    name,
    public
FROM storage.buckets
WHERE name = 'order-media';

