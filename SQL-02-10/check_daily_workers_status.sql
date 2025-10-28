-- Быстрая проверка статуса Daily Workers
-- Используйте этот скрипт для мониторинга состояния daily_worker пользователей
-- Дата: 6 октября 2025

-- ============================================
-- ОБЩАЯ СТАТИСТИКА
-- ============================================

SELECT 
    '=== ОБЩАЯ СТАТИСТИКА ===' as section,
    NULL as metric,
    NULL as count,
    NULL as percentage;

SELECT 
    'Общая статистика' as section,
    'Всего Daily Workers' as metric,
    COUNT(*) as count,
    '100%' as percentage
FROM users
WHERE role = 'worker' AND worker_type = 'daily_worker'

UNION ALL

SELECT 
    'Общая статистика' as section,
    'С специализацией one_day_job' as metric,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / NULLIF((
        SELECT COUNT(*) FROM users 
        WHERE role = 'worker' AND worker_type = 'daily_worker'
    ), 0), 2)::text || '%' as percentage
FROM users
WHERE role = 'worker' 
    AND worker_type = 'daily_worker'
    AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(specializations) AS spec
        WHERE spec->>'id' = 'one_day_job'
    )

UNION ALL

SELECT 
    'Общая статистика' as section,
    'Без специализаций' as metric,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / NULLIF((
        SELECT COUNT(*) FROM users 
        WHERE role = 'worker' AND worker_type = 'daily_worker'
    ), 0), 2)::text || '%' as percentage
FROM users
WHERE role = 'worker' 
    AND worker_type = 'daily_worker'
    AND (specializations IS NULL OR specializations = '[]'::jsonb)

UNION ALL

SELECT 
    'Общая статистика' as section,
    'Есть спец-ии, но нет one_day_job' as metric,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / NULLIF((
        SELECT COUNT(*) FROM users 
        WHERE role = 'worker' AND worker_type = 'daily_worker'
    ), 0), 2)::text || '%' as percentage
FROM users
WHERE role = 'worker' 
    AND worker_type = 'daily_worker'
    AND specializations IS NOT NULL
    AND specializations != '[]'::jsonb
    AND NOT EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(specializations) AS spec
        WHERE spec->>'id' = 'one_day_job'
    );

-- ============================================
-- НЕДАВНО ЗАРЕГИСТРИРОВАННЫЕ (последние 7 дней)
-- ============================================

SELECT 
    '' as section,
    '=== НЕДАВНО ЗАРЕГИСТРИРОВАННЫЕ (7 дней) ===' as metric,
    NULL as count,
    NULL as percentage;

SELECT 
    'Недавние (7 дней)' as section,
    'Всего новых Daily Workers' as metric,
    COUNT(*) as count,
    '100%' as percentage
FROM users
WHERE role = 'worker' 
    AND worker_type = 'daily_worker'
    AND created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'Недавние (7 дней)' as section,
    'С специализацией one_day_job' as metric,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / NULLIF((
        SELECT COUNT(*) FROM users 
        WHERE role = 'worker' 
            AND worker_type = 'daily_worker'
            AND created_at > NOW() - INTERVAL '7 days'
    ), 0), 2)::text || '%' as percentage
FROM users
WHERE role = 'worker' 
    AND worker_type = 'daily_worker'
    AND created_at > NOW() - INTERVAL '7 days'
    AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(specializations) AS spec
        WHERE spec->>'id' = 'one_day_job'
    );

-- ============================================
-- ДЕТАЛЬНАЯ ИНФОРМАЦИЯ
-- ============================================

SELECT 
    '' as info,
    '=== ПОЛЬЗОВАТЕЛИ БЕЗ СПЕЦИАЛИЗАЦИИ ===' as details,
    NULL as data1,
    NULL as data2,
    NULL as data3;

-- Список пользователей без специализации one_day_job
SELECT 
    id,
    first_name || ' ' || last_name as full_name,
    phone,
    city,
    COALESCE(
        (SELECT COUNT(*) FROM jsonb_array_elements(specializations)), 
        0
    ) as other_specializations_count,
    created_at::date as registration_date
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
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- РАСПРЕДЕЛЕНИЕ ПО ГОРОДАМ
-- ============================================

SELECT 
    '' as info,
    '=== РАСПРЕДЕЛЕНИЕ ПО ГОРОДАМ ===' as details,
    NULL as data1,
    NULL as data2,
    NULL as data3;

SELECT 
    COALESCE(city, 'Не указан') as city,
    COUNT(*) as total_daily_workers,
    COUNT(CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(specializations) AS spec
            WHERE spec->>'id' = 'one_day_job'
        ) THEN 1 
    END) as with_one_day_job,
    COUNT(CASE 
        WHEN specializations IS NULL OR specializations = '[]'::jsonb THEN 1 
    END) as without_specializations,
    ROUND(
        COUNT(CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM jsonb_array_elements(specializations) AS spec
                WHERE spec->>'id' = 'one_day_job'
            ) THEN 1 
        END) * 100.0 / NULLIF(COUNT(*), 0),
        2
    ) as completion_percentage
FROM users
WHERE role = 'worker' AND worker_type = 'daily_worker'
GROUP BY city
ORDER BY total_daily_workers DESC;

-- ============================================
-- НЕДАВНИЕ ОБНОВЛЕНИЯ (последние 24 часа)
-- ============================================

SELECT 
    '' as info,
    '=== НЕДАВНИЕ ОБНОВЛЕНИЯ (24 часа) ===' as details,
    NULL as data1,
    NULL as data2,
    NULL as data3;

SELECT 
    id,
    first_name || ' ' || last_name as full_name,
    phone,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(specializations) AS spec
            WHERE spec->>'id' = 'one_day_job'
        ) THEN '✅ Есть one_day_job'
        ELSE '❌ Нет one_day_job'
    END as status,
    updated_at,
    updated_at - created_at as time_since_registration
FROM users
WHERE role = 'worker' 
    AND worker_type = 'daily_worker'
    AND updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC
LIMIT 20;

-- ============================================
-- РЕКОМЕНДАЦИИ
-- ============================================

SELECT 
    '' as info,
    '=== РЕКОМЕНДАЦИИ ===' as details,
    NULL as data1,
    NULL as data2;

SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) 
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
        ) > 0 THEN 
            '⚠️ ТРЕБУЕТСЯ МИГРАЦИЯ: Найдены Daily Workers без специализации one_day_job'
        ELSE 
            '✅ ВСЕ В ПОРЯДКЕ: Все Daily Workers имеют специализацию one_day_job'
    END as recommendation,
    CASE 
        WHEN (
            SELECT COUNT(*) 
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
        ) > 0 THEN 
            'Запустите: SQL/migrate_existing_daily_workers.sql'
        ELSE 
            'Миграция не требуется'
    END as action;

