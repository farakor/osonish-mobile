-- ========================================
-- ИСПРАВЛЕНИЕ RLS ПОЛИТИК ДЛЯ VACANCY_APPLICATIONS
-- ========================================
-- Проблема: текущие политики используют auth.uid(), которая не работает
-- с вашей системой аутентификации через таблицу users
-- Решение: упрощаем политики для работы с вашей системой

-- 1. Удаляем старые политики
DROP POLICY IF EXISTS "Users can view applications to their vacancies" ON vacancy_applications;
DROP POLICY IF EXISTS "Users can create applications to vacancies" ON vacancy_applications;
DROP POLICY IF EXISTS "Vacancy owners can update application status" ON vacancy_applications;
DROP POLICY IF EXISTS "Users can delete their own applications" ON vacancy_applications;

-- 2. Создаем новые упрощенные политики для тестирования/разработки
-- Эти политики разрешают все операции (можно уточнить позже)

-- Политика SELECT: все пользователи могут просматривать отклики
CREATE POLICY "Allow select vacancy_applications" 
ON vacancy_applications FOR SELECT 
USING (true);

-- Политика INSERT: все пользователи могут создавать отклики
CREATE POLICY "Allow insert vacancy_applications" 
ON vacancy_applications FOR INSERT 
WITH CHECK (true);

-- Политика UPDATE: все пользователи могут обновлять отклики
CREATE POLICY "Allow update vacancy_applications" 
ON vacancy_applications FOR UPDATE 
USING (true);

-- Политика DELETE: все пользователи могут удалять отклики
CREATE POLICY "Allow delete vacancy_applications" 
ON vacancy_applications FOR DELETE 
USING (true);

-- 3. Проверяем, что RLS включен
ALTER TABLE vacancy_applications ENABLE ROW LEVEL SECURITY;

-- 4. Показываем текущие политики для проверки
SELECT 
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'vacancy_applications'
ORDER BY policyname;

-- ========================================
-- КОММЕНТАРИИ
-- ========================================
-- После того, как система аутентификации будет окончательно настроена,
-- можно вернуть более строгие политики:
--
-- CREATE POLICY "Users can create applications" 
-- ON vacancy_applications FOR INSERT 
-- WITH CHECK (
--     applicant_id IN (SELECT id FROM users WHERE id = applicant_id)
-- );
--
-- CREATE POLICY "Users can view their applications" 
-- ON vacancy_applications FOR SELECT 
-- USING (
--     applicant_id IN (SELECT id FROM users WHERE id = applicant_id)
--     OR vacancy_id IN (SELECT id FROM orders WHERE customer_id IN (SELECT id FROM users))
-- );
-- ========================================

