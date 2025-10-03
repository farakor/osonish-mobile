-- Исправление: Заменяем названия городов на ID
-- Выполните этот скрипт в Supabase SQL Editor

-- Обновляем существующих пользователей - меняем названия городов на ID
UPDATE users 
SET city = 'samarkand'
WHERE city IN ('Самарканд и область', 'Samarqand viloyati va shahri', 'Samarkand');

-- Проверяем результат
SELECT 
    id,
    first_name || ' ' || last_name as full_name,
    role,
    city,
    worker_type,
    created_at
FROM users
WHERE city IS NOT NULL
ORDER BY created_at DESC;

-- Подсчитываем пользователей по городам
SELECT 
    city,
    role,
    COUNT(*) as count
FROM users
WHERE city IS NOT NULL
GROUP BY city, role
ORDER BY city, role;

