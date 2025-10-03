-- =====================================================
-- УПРОЩЕННЫЙ Storage Policies для bucket "order-media"
-- =====================================================
-- Выполните этот скрипт через Supabase Dashboard SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- =====================================================

-- Сначала удаляем старые политики (если существуют)
DROP POLICY IF EXISTS "order_media_view_policy" ON storage.objects;
DROP POLICY IF EXISTS "order_media_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "order_media_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "order_media_delete_policy" ON storage.objects;

-- Политика 1: Любой может просматривать файлы
CREATE POLICY "order_media_view_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'order-media');

-- Политика 2: Аутентифицированные пользователи могут загружать файлы
CREATE POLICY "order_media_upload_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-media');

-- Политика 3: Пользователи могут обновлять свои файлы
CREATE POLICY "order_media_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'order-media' AND (auth.uid())::text = owner::text)
WITH CHECK (bucket_id = 'order-media' AND (auth.uid())::text = owner::text);

-- Политика 4: Пользователи могут удалять свои файлы
CREATE POLICY "order_media_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'order-media' AND (auth.uid())::text = owner::text);

-- Проверка созданных политик
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE 'order_media%'
ORDER BY policyname;

