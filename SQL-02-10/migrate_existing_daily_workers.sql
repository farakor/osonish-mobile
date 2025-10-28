-- Миграция для добавления специализации "one_day_job" существующим daily_worker пользователям
-- Дата: 6 октября 2025
-- Описание: Добавляет специализацию "Работа на 1 день" всем пользователям с типом daily_worker,
--           у которых нет специализаций или специализация one_day_job отсутствует

-- Шаг 1: Проверяем существующих daily_worker без специализаций
SELECT 
    id,
    first_name,
    last_name,
    phone,
    worker_type,
    specializations,
    created_at
FROM users
WHERE role = 'worker'
    AND worker_type = 'daily_worker'
    AND (
        specializations IS NULL 
        OR specializations = '[]'::jsonb
        OR NOT EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(specializations) AS spec
            WHERE spec->>'id' = 'one_day_job'
        )
    )
ORDER BY created_at DESC;

-- Шаг 2: Обновляем пользователей без специализаций
-- Добавляем специализацию "one_day_job" как основную
UPDATE users
SET 
    specializations = jsonb_build_array(
        jsonb_build_object(
            'id', 'one_day_job',
            'name', 'Работа на 1 день',
            'isPrimary', true
        )
    ),
    updated_at = NOW()
WHERE role = 'worker'
    AND worker_type = 'daily_worker'
    AND (
        specializations IS NULL 
        OR specializations = '[]'::jsonb
    );

-- Шаг 3: Обновляем пользователей, у которых есть специализации, но нет one_day_job
-- Добавляем one_day_job как основную специализацию, остальные делаем не основными
UPDATE users
SET 
    specializations = jsonb_build_array(
        jsonb_build_object(
            'id', 'one_day_job',
            'name', 'Работа на 1 день',
            'isPrimary', true
        )
    ) || (
        SELECT jsonb_agg(
            jsonb_set(spec, '{isPrimary}', 'false'::jsonb)
        )
        FROM jsonb_array_elements(specializations) AS spec
        WHERE spec->>'id' != 'one_day_job'
    ),
    updated_at = NOW()
WHERE role = 'worker'
    AND worker_type = 'daily_worker'
    AND specializations IS NOT NULL
    AND specializations != '[]'::jsonb
    AND NOT EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(specializations) AS spec
        WHERE spec->>'id' = 'one_day_job'
    );

-- Шаг 4: Проверяем результаты миграции
SELECT 
    id,
    first_name,
    last_name,
    worker_type,
    specializations,
    updated_at
FROM users
WHERE role = 'worker'
    AND worker_type = 'daily_worker'
ORDER BY updated_at DESC
LIMIT 20;

-- Шаг 5: Статистика по миграции
SELECT 
    COUNT(*) as total_daily_workers,
    COUNT(CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(specializations) AS spec
            WHERE spec->>'id' = 'one_day_job'
        ) THEN 1 
    END) as with_one_day_job_spec,
    COUNT(CASE 
        WHEN specializations IS NULL OR specializations = '[]'::jsonb THEN 1 
    END) as without_specializations
FROM users
WHERE role = 'worker'
    AND worker_type = 'daily_worker';

