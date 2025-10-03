-- =====================================================
-- Storage Policies для bucket "order-media"
-- =====================================================
-- Этот скрипт настраивает политики доступа для публичного bucket "order-media"
-- 
-- ВАЖНО: Перед выполнением этого SQL:
-- 1. Создайте bucket "order-media" в Supabase Dashboard
-- 2. Storage → New Bucket → Name: order-media
-- 3. Public bucket: ✅ ОБЯЗАТЕЛЬНО включите
-- =====================================================

-- Удаляем существующие политики (если есть)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;

-- Политика 1: Любой может просматривать файлы (для публичного доступа к изображениям)
CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-media');

-- Политика 2: Аутентифицированные пользователи могут загружать файлы
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-media');

-- Политика 3: Пользователи могут обновлять свои файлы
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'order-media' AND auth.uid()::text = owner::text)
WITH CHECK (bucket_id = 'order-media' AND auth.uid()::text = owner::text);

-- Политика 4: Пользователи могут удалять свои файлы
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'order-media' AND auth.uid()::text = owner::text);

-- Включаем RLS для storage.objects (если еще не включено)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Проверка созданных политик
-- =====================================================
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
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

