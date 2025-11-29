-- 🚀 SQL для разрешения анонимной загрузки в order-media bucket
-- Выполните в SQL Editor вашего проекта Supabase

-- ВАЖНО: Сначала убедитесь что bucket 'order-media' существует!

-- 1. Включаем RLS для objects (если еще не включено)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Удаляем существующие политики для order-media
DROP POLICY IF EXISTS "Allow authenticated upload to order-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from order-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update in order-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from order-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- 3. Новая политика: АНОНИМНАЯ загрузка в order-media bucket
CREATE POLICY "Allow anonymous upload to order-media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'order-media');

-- 4. Политика для публичного чтения файлов
CREATE POLICY "Allow public read from order-media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'order-media');

-- 5. Политика для обновления файлов (анонимно)
CREATE POLICY "Allow anonymous update in order-media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'order-media');

-- 6. Политика для удаления файлов (анонимно)
CREATE POLICY "Allow anonymous delete from order-media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'order-media');

-- 7. Политика для просмотра buckets
DROP POLICY IF EXISTS "Public buckets are viewable by everyone" ON storage.buckets;
CREATE POLICY "Public buckets are viewable by everyone" 
ON storage.buckets 
FOR SELECT 
USING (true);

-- 🔍 Проверка результата:
SELECT 
  'Bucket order-media exists:' as check_type, 
  CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE name = 'order-media') 
    THEN 'YES' ELSE 'NO - Create it!' 
  END as result
UNION ALL
SELECT 
  'RLS enabled on objects:' as check_type, 
  CASE WHEN obj.relrowsecurity THEN 'YES' ELSE 'NO' END as result
FROM pg_class obj 
WHERE obj.relname = 'objects' AND obj.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage')
UNION ALL
SELECT 
  'Policies count for objects:' as check_type, 
  COUNT(*)::text as result
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%order-media%'; 