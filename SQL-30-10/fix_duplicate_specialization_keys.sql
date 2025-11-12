-- Обновление специализаций в базе данных после исправления дублирующихся ключей
-- Дата: 31 октября 2025
-- Описание: Обновляем ID специализаций для соответствия новым уникальным ключам
-- ВАЖНО: Специализации хранятся в поле users.specializations как JSONB массив

-- ===== ШАГ 1: ПРОВЕРКА =====
-- Проверяем пользователей с дублирующимися ID специализаций
SELECT 
    id,
    first_name || ' ' || last_name as full_name,
    phone,
    role,
    worker_type,
    spec.value->>'id' as specialization_id,
    spec.value->>'name' as specialization_name,
    spec.value->>'isPrimary' as is_primary
FROM users,
    jsonb_array_elements(specializations) as spec
WHERE role = 'worker'
    AND (
        spec.value->>'id' = 'it_security_specialist'
        OR spec.value->>'id' = 'logistics_head'
        OR spec.value->>'id' = 'hr_head'
        OR spec.value->>'id' = 'cfo'
    )
ORDER BY id, (spec.value->>'id');

-- Проверяем заказы с дублирующимися ID
SELECT 
    id,
    title,
    specialization_id,
    status,
    created_at
FROM orders 
WHERE specialization_id IN (
    'it_security_specialist',
    'logistics_head',
    'hr_head',
    'cfo'
)
ORDER BY specialization_id, created_at DESC;

-- ===== ШАГ 2: ОБНОВЛЕНИЕ (раскомментируйте после проверки) =====
/*
-- ВНИМАНИЕ: Эти запросы изменят данные в базе!
-- Убедитесь, что вы создали резервную копию перед выполнением!

-- Обновляем специализации в профилях пользователей
-- Заменяем старые ID на новые в JSONB массиве

-- 1. Обновляем it_security_specialist → security_it_specialist (для категории безопасности)
UPDATE users
SET specializations = (
    SELECT jsonb_agg(
        CASE 
            WHEN spec.value->>'id' = 'it_security_specialist' THEN
                jsonb_set(spec.value, '{id}', '"security_it_specialist"'::jsonb)
            ELSE spec.value
        END
    )
    FROM jsonb_array_elements(specializations) as spec
)
WHERE role = 'worker'
    AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(specializations) AS s
        WHERE s.value->>'id' = 'it_security_specialist'
    );

-- 2. Обновляем logistics_head → senior_logistics_head (для топ-менеджмента)
UPDATE users
SET specializations = (
    SELECT jsonb_agg(
        CASE 
            WHEN spec.value->>'id' = 'logistics_head' THEN
                jsonb_set(spec.value, '{id}', '"senior_logistics_head"'::jsonb)
            ELSE spec.value
        END
    )
    FROM jsonb_array_elements(specializations) as spec
)
WHERE role = 'worker'
    AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(specializations) AS s
        WHERE s.value->>'id' = 'logistics_head'
    );

-- 3. Обновляем hr_head → senior_hr_head (для топ-менеджмента)
UPDATE users
SET specializations = (
    SELECT jsonb_agg(
        CASE 
            WHEN spec.value->>'id' = 'hr_head' THEN
                jsonb_set(spec.value, '{id}', '"senior_hr_head"'::jsonb)
            ELSE spec.value
        END
    )
    FROM jsonb_array_elements(specializations) as spec
)
WHERE role = 'worker'
    AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(specializations) AS s
        WHERE s.value->>'id' = 'hr_head'
    );

-- 4. Обновляем cfo → senior_cfo (для топ-менеджмента)
UPDATE users
SET specializations = (
    SELECT jsonb_agg(
        CASE 
            WHEN spec.value->>'id' = 'cfo' THEN
                jsonb_set(spec.value, '{id}', '"senior_cfo"'::jsonb)
            ELSE spec.value
        END
    )
    FROM jsonb_array_elements(specializations) as spec
)
WHERE role = 'worker'
    AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(specializations) AS s
        WHERE s.value->>'id' = 'cfo'
    );

-- Обновляем заказы
UPDATE orders 
SET specialization_id = 'security_it_specialist'
WHERE specialization_id = 'it_security_specialist';

UPDATE orders 
SET specialization_id = 'senior_logistics_head'
WHERE specialization_id = 'logistics_head';

UPDATE orders 
SET specialization_id = 'senior_hr_head'
WHERE specialization_id = 'hr_head';

UPDATE orders 
SET specialization_id = 'senior_cfo'
WHERE specialization_id = 'cfo';
*/

-- ===== ШАГ 3: ПРОВЕРКА РЕЗУЛЬТАТА =====
-- Проверяем, что старые ID больше не используются
SELECT 
    'OLD IDS CHECK' as check_type,
    spec.value->>'id' as specialization_id,
    COUNT(DISTINCT users.id) as users_count
FROM users,
    jsonb_array_elements(specializations) as spec
WHERE role = 'worker'
    AND (
        spec.value->>'id' = 'it_security_specialist'
        OR spec.value->>'id' = 'logistics_head'
        OR spec.value->>'id' = 'hr_head'
        OR spec.value->>'id' = 'cfo'
    )
GROUP BY spec.value->>'id'
UNION ALL
SELECT 
    'NEW IDS CHECK' as check_type,
    spec.value->>'id' as specialization_id,
    COUNT(DISTINCT users.id) as users_count
FROM users,
    jsonb_array_elements(specializations) as spec
WHERE role = 'worker'
    AND (
        spec.value->>'id' = 'security_it_specialist'
        OR spec.value->>'id' = 'senior_logistics_head'
        OR spec.value->>'id' = 'senior_hr_head'
        OR spec.value->>'id' = 'senior_cfo'
    )
GROUP BY spec.value->>'id'
ORDER BY check_type, specialization_id;

-- Проверяем заказы
SELECT 
    'ORDERS CHECK' as check_type,
    specialization_id,
    COUNT(*) as count
FROM orders 
WHERE specialization_id IN (
    'it_security_specialist',
    'security_it_specialist',
    'logistics_head',
    'senior_logistics_head',
    'hr_head',
    'senior_hr_head',
    'cfo',
    'senior_cfo'
)
GROUP BY specialization_id
ORDER BY specialization_id;

