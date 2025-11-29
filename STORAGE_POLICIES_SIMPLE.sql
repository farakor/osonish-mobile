-- 🚀 Упрощенный SQL скрипт для Storage (минимум политик)
-- Выполните в SQL Editor вашего проекта Supabase

-- ВАЖНО: Сначала создайте bucket 'order-media' через UI если его нет!

-- 1. Основная политика для просмотра buckets (РЕШАЕТ ГЛАВНУЮ ПРОБЛЕМУ)
DROP POLICY IF EXISTS "Public buckets are viewable by everyone" ON storage.buckets;
CREATE POLICY "Public buckets are viewable by everyone" 
ON storage.buckets 
FOR SELECT 
USING (true);

-- 2. Политика для чтения файлов (публичный доступ)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'order-media');

-- 3. Политика для загрузки файлов (авторизованные пользователи)
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'order-media');

-- 🔍 Проверка результата:
SELECT 'Buckets:' as type, name, public FROM storage.buckets 
UNION ALL
SELECT 'Policies:' as type, policyname as name, 'buckets' as public FROM pg_policies WHERE tablename = 'buckets'
UNION ALL  
SELECT 'Policies:' as type, policyname as name, 'objects' as public FROM pg_policies WHERE tablename = 'objects'; 