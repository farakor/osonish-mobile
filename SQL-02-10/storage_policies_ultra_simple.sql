-- =====================================================
-- УЛЬТРА-ПРОСТЫЕ Storage Policies (с условием true)
-- =====================================================
-- Выполните через Supabase Dashboard SQL Editor
-- =====================================================

-- Удаляем ВСЕ старые политики для order-media
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- =====================================================
-- НОВЫЕ ПОЛИТИКИ (максимально открытые)
-- =====================================================

-- 1. Любой может читать
CREATE POLICY "allow_all_select"
ON storage.objects FOR SELECT
USING (true);

-- 2. Авторизованные могут загружать
CREATE POLICY "allow_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Авторизованные могут обновлять
CREATE POLICY "allow_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Авторизованные могут удалять
CREATE POLICY "allow_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (true);

-- Включаем RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ПРОВЕРКА
-- =====================================================
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

