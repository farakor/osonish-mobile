-- =====================================================
-- МАКСИМАЛЬНО ОТКРЫТЫЕ Storage Policies для "order-media"
-- =====================================================
-- Этот скрипт создает политики, которые позволяют:
-- - Всем просматривать файлы
-- - Всем аутентифицированным пользователям загружать файлы
-- - Всем аутентифицированным пользователям обновлять файлы
-- - Всем аутентифицированным пользователям удалять файлы
-- =====================================================

-- Удаляем все старые политики
DROP POLICY IF EXISTS "order_media_view_policy" ON storage.objects;
DROP POLICY IF EXISTS "order_media_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "order_media_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "order_media_delete_policy" ON storage.objects;

-- Удаляем возможные другие политики для order-media
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- =====================================================
-- НОВЫЕ ОТКРЫТЫЕ ПОЛИТИКИ
-- =====================================================

-- Политика 1: Любой может просматривать файлы (даже неавторизованные)
CREATE POLICY "order_media_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-media');

-- Политика 2: Любой авторизованный может загружать файлы
CREATE POLICY "order_media_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-media');

-- Политика 3: Любой авторизованный может обновлять файлы
CREATE POLICY "order_media_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'order-media')
WITH CHECK (bucket_id = 'order-media');

-- Политика 4: Любой авторизованный может удалять файлы
CREATE POLICY "order_media_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'order-media');

-- =====================================================
-- ПРОВЕРКА
-- =====================================================
-- Должны увидеть 4 политики для order-media

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'No WITH CHECK clause'
    END as check_clause
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND (
    policyname LIKE 'order_media%' 
    OR policyname LIKE '%order-media%'
)
ORDER BY policyname;

-- Также проверим, что RLS включен
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage'
AND tablename = 'objects';

