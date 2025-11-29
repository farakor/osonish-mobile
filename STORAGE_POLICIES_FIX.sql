-- 🔧 SQL скрипт для исправления Storage политик
-- Выполните в SQL Editor вашего проекта Supabase

-- 1. Включаем RLS для buckets (если еще не включено)
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- 2. Удаляем существующие политики (если есть) и создаем новые
DROP POLICY IF EXISTS "Allow public to view buckets" ON storage.buckets;
CREATE POLICY "Allow public to view buckets" 
ON storage.buckets 
FOR SELECT 
USING (true);

-- 3. Политика для создания buckets (для админов)
DROP POLICY IF EXISTS "Allow authenticated users to create buckets" ON storage.buckets;
CREATE POLICY "Allow authenticated users to create buckets" 
ON storage.buckets 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 4. Включаем RLS для objects (если еще не включено)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Политика для загрузки файлов в order-media bucket
DROP POLICY IF EXISTS "Allow authenticated upload to order-media" ON storage.objects;
CREATE POLICY "Allow authenticated upload to order-media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'order-media' 
  AND auth.role() = 'authenticated'
);

-- 6. Политика для чтения файлов из order-media bucket (публичное чтение)
DROP POLICY IF EXISTS "Allow public read from order-media" ON storage.objects;
CREATE POLICY "Allow public read from order-media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'order-media');

-- 7. Политика для обновления файлов (для владельцев)
DROP POLICY IF EXISTS "Allow authenticated update in order-media" ON storage.objects;
CREATE POLICY "Allow authenticated update in order-media" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'order-media' 
  AND auth.role() = 'authenticated'
);

-- 8. Политика для удаления файлов (для владельцев)
DROP POLICY IF EXISTS "Allow authenticated delete from order-media" ON storage.objects;
CREATE POLICY "Allow authenticated delete from order-media" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'order-media' 
  AND auth.role() = 'authenticated'
);

-- 🔍 Проверка результата
-- Выполните эти команды для проверки:

-- Проверить существующие buckets
-- SELECT * FROM storage.buckets;

-- Проверить политики для buckets
-- SELECT * FROM pg_policies WHERE tablename = 'buckets';

-- Проверить политики для objects
-- SELECT * FROM pg_policies WHERE tablename = 'objects';

-- 💡 Если bucket 'order-media' не существует, создайте его через UI:
-- Storage → Create a new bucket → Name: order-media → Public: ✅ 