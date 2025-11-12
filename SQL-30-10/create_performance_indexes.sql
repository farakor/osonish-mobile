-- ============================================================================
-- PERFORMANCE OPTIMIZATION: Database Indexes
-- ============================================================================
-- Этот скрипт создает индексы для ускорения наиболее частых запросов
-- Предполагаемое ускорение: 50-70% для индексированных запросов
-- ============================================================================

-- ВАЖНО: Выполните этот скрипт в Supabase SQL Editor
-- Рекомендуется выполнять в непиковые часы

-- ============================================================================
-- 0. ПРОВЕРКА СТРУКТУРЫ ТАБЛИЦ (опционально - закомментируйте после проверки)
-- ============================================================================

/*
-- Проверяем, какие таблицы существуют
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Проверяем колонки таблицы orders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;
*/

-- ============================================================================
-- 1. ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ ORDERS
-- ============================================================================

-- Индекс для поиска заказов по customer_id (используется ОЧЕНЬ часто)
-- Ускоряет: getMyCreatedOrders(), getCustomerOrders()
CREATE INDEX IF NOT EXISTS idx_orders_customer_id 
ON orders(customer_id);

-- Индекс для фильтрации по статусу (используется в каждом списке заказов)
-- Ускоряет: getAvailableOrders(), фильтрация по статусу
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status);

-- Индекс для сортировки по дате создания (используется везде)
-- Ускоряет: все списки заказов с сортировкой
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders(created_at DESC);

-- Индекс для сортировки по дате обновления
-- Ускоряет: отображение последних изменений
CREATE INDEX IF NOT EXISTS idx_orders_updated_at 
ON orders(updated_at DESC);

-- СОСТАВНОЙ индекс для customer_id + status (оптимизирует частый запрос)
-- Ускоряет: "показать МОИ активные/завершенные заказы"
CREATE INDEX IF NOT EXISTS idx_orders_customer_status 
ON orders(customer_id, status);

-- СОСТАВНОЙ индекс для status + created_at (для списков доступных заказов)
-- Ускоряет: getAvailableOrdersForWorker() с сортировкой
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON orders(status, created_at DESC);

-- Индекс для поиска по category (фильтрация по категориям)
-- Ускоряет: фильтрация заказов по категориям
CREATE INDEX IF NOT EXISTS idx_orders_category 
ON orders(category);

-- Индекс для поиска по location (фильтрация по локации)
-- Ускоряет: фильтрация заказов по местоположению
CREATE INDEX IF NOT EXISTS idx_orders_location 
ON orders(location);

-- ============================================================================
-- 2. ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ APPLICANTS (отклики на заказы)
-- ============================================================================

-- Индекс для поиска откликов по order_id (используется постоянно)
-- Ускоряет: getApplicants(), getFilteredApplicants()
CREATE INDEX IF NOT EXISTS idx_applicants_order_id 
ON applicants(order_id);

-- Индекс для поиска откликов по worker_id
-- Ускоряет: проверка существующих откликов пользователя
CREATE INDEX IF NOT EXISTS idx_applicants_worker_id 
ON applicants(worker_id);

-- СОСТАВНОЙ индекс для order_id + status (частый запрос)
-- Ускоряет: подсчет pending/accepted откликов для заказа
CREATE INDEX IF NOT EXISTS idx_applicants_order_status 
ON applicants(order_id, status);

-- СОСТАВНОЙ индекс для worker_id + status
-- Ускоряет: проверка статуса откликов пользователя
CREATE INDEX IF NOT EXISTS idx_applicants_worker_status 
ON applicants(worker_id, status);

-- Индекс для сортировки по дате создания
-- Ускоряет: отображение откликов в хронологическом порядке
CREATE INDEX IF NOT EXISTS idx_applicants_created_at 
ON applicants(created_at DESC);

-- ============================================================================
-- 3. ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ NOTIFICATIONS (уведомления)
-- ============================================================================

-- Индекс для поиска уведомлений по user_id
-- Ускоряет: getNotifications(), getUnreadCount()
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

-- СОСТАВНОЙ индекс для user_id + is_read (критически важный запрос)
-- Ускоряет: подсчет непрочитанных уведомлений
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, is_read);

-- Индекс для сортировки по дате создания
-- Ускоряет: отображение уведомлений в правильном порядке
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

-- СОСТАВНОЙ индекс для эффективного получения непрочитанных уведомлений
-- Ускоряет: getNotifications() с фильтром по is_read
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON notifications(user_id, is_read, created_at DESC);

-- ============================================================================
-- 4. ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ PROFESSIONAL_MASTERS (если существует)
-- ============================================================================
-- ПРИМЕЧАНИЕ: Если таблица не существует, эти команды будут пропущены

-- Проверяем существование таблицы и создаем индексы только если она есть
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'professional_masters'
    ) THEN
        -- Индекс для поиска по user_id
        CREATE INDEX IF NOT EXISTS idx_professional_masters_user_id 
        ON professional_masters(user_id);

        -- Индекс для фильтрации по specialization_id (если колонка существует)
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_masters'
            AND column_name = 'specialization_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_professional_masters_specialization 
            ON professional_masters(specialization_id);
        END IF;

        -- Индекс для фильтрации по city_id (если колонка существует)
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_masters'
            AND column_name = 'city_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_professional_masters_city 
            ON professional_masters(city_id);
        END IF;

        -- Индекс для сортировки по просмотрам (если колонка существует)
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_masters'
            AND column_name = 'views_count'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_professional_masters_views 
            ON professional_masters(views_count DESC);
        END IF;

        -- Индекс для сортировки по рейтингу (если колонка существует)
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_masters'
            AND column_name = 'rating'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_professional_masters_rating 
            ON professional_masters(rating DESC);
        END IF;

        RAISE NOTICE 'Индексы для professional_masters созданы';
    ELSE
        RAISE NOTICE 'Таблица professional_masters не найдена, пропускаем';
    END IF;
END $$;

-- ============================================================================
-- 5. ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ USERS (пользователи)
-- ============================================================================

-- Индекс для поиска по phone (используется при авторизации)
-- Ускоряет: login, проверка существования пользователя
DO $$
BEGIN
    -- Проверяем, какая колонка существует: phone или phone_number
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'phone'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_users_phone 
        ON users(phone);
        RAISE NOTICE 'Создан индекс для users.phone';
    ELSIF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'phone_number'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_users_phone_number 
        ON users(phone_number);
        RAISE NOTICE 'Создан индекс для users.phone_number';
    ELSE
        RAISE NOTICE 'Колонка phone/phone_number не найдена в таблице users';
    END IF;
END $$;

-- Индекс для поиска по email (если используется)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'email'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_users_email 
        ON users(email) WHERE email IS NOT NULL;
        RAISE NOTICE 'Создан индекс для users.email';
    ELSE
        RAISE NOTICE 'Колонка email не найдена в таблице users';
    END IF;
END $$;

-- Индекс для фильтрации по роли
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'role'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_users_role 
        ON users(role);
        RAISE NOTICE 'Создан индекс для users.role';
    ELSE
        RAISE NOTICE 'Колонка role не найдена в таблице users';
    END IF;
END $$;

-- ============================================================================
-- 6. ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ REVIEWS (если существует)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reviews'
    ) THEN
        -- Индекс для поиска отзывов по worker_id
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews'
            AND column_name = 'worker_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_reviews_worker_id 
            ON reviews(worker_id);
            RAISE NOTICE 'Создан индекс для reviews.worker_id';
        END IF;

        -- Индекс для поиска отзывов по customer_id
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews'
            AND column_name = 'customer_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_reviews_customer_id 
            ON reviews(customer_id);
            RAISE NOTICE 'Создан индекс для reviews.customer_id';
        END IF;

        -- Индекс для поиска отзывов по order_id
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews'
            AND column_name = 'order_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_reviews_order_id 
            ON reviews(order_id);
            RAISE NOTICE 'Создан индекс для reviews.order_id';
        END IF;

        -- Индекс для сортировки по дате создания
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews'
            AND column_name = 'created_at'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_reviews_created_at 
            ON reviews(created_at DESC);
            RAISE NOTICE 'Создан индекс для reviews.created_at';
        END IF;

        -- СОСТАВНОЙ индекс для worker_id + created_at
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews'
            AND column_name = 'worker_id'
        ) AND EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews'
            AND column_name = 'created_at'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_reviews_worker_created 
            ON reviews(worker_id, created_at DESC);
            RAISE NOTICE 'Создан составной индекс для reviews.worker_id + created_at';
        END IF;

        RAISE NOTICE 'Индексы для reviews созданы';
    ELSE
        RAISE NOTICE 'Таблица reviews не найдена, пропускаем';
    END IF;
END $$;

-- ============================================================================
-- 7. ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ CALL_LOGS (если существует)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'call_logs'
    ) THEN
        -- Индекс для поиска по caller_id
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'call_logs'
            AND column_name = 'caller_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_call_logs_caller_id 
            ON call_logs(caller_id);
            RAISE NOTICE 'Создан индекс для call_logs.caller_id';
        END IF;

        -- Индекс для поиска по receiver_id
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'call_logs'
            AND column_name = 'receiver_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_call_logs_receiver_id 
            ON call_logs(receiver_id);
            RAISE NOTICE 'Создан индекс для call_logs.receiver_id';
        END IF;

        -- Индекс для поиска по order_id (если колонка существует)
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'call_logs'
            AND column_name = 'order_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_call_logs_order_id 
            ON call_logs(order_id);
            RAISE NOTICE 'Создан индекс для call_logs.order_id';
        END IF;

        -- Индекс для caller_type
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'call_logs'
            AND column_name = 'caller_type'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_call_logs_caller_type 
            ON call_logs(caller_type);
            RAISE NOTICE 'Создан индекс для call_logs.caller_type';
        END IF;

        -- Индекс для receiver_type
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'call_logs'
            AND column_name = 'receiver_type'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_call_logs_receiver_type 
            ON call_logs(receiver_type);
            RAISE NOTICE 'Создан индекс для call_logs.receiver_type';
        END IF;

        -- Индекс для сортировки по времени звонка
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'call_logs'
            AND column_name = 'created_at'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_call_logs_created_at 
            ON call_logs(created_at DESC);
            RAISE NOTICE 'Создан индекс для call_logs.created_at';
        END IF;

        RAISE NOTICE 'Индексы для call_logs созданы';
    ELSE
        RAISE NOTICE 'Таблица call_logs не найдена, пропускаем';
    END IF;
END $$;

-- ============================================================================
-- ПРОВЕРКА СОЗДАННЫХ ИНДЕКСОВ
-- ============================================================================

-- Выполните этот запрос ОТДЕЛЬНО, чтобы увидеть все созданные индексы
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND (
        indexname LIKE 'idx_orders_%' 
        OR indexname LIKE 'idx_applicants_%'
        OR indexname LIKE 'idx_notifications_%'
        OR indexname LIKE 'idx_professional_masters_%'
        OR indexname LIKE 'idx_users_%'
        OR indexname LIKE 'idx_reviews_%'
        OR indexname LIKE 'idx_call_logs_%'
    )
ORDER BY tablename, indexname;
*/

-- ============================================================================
-- СТАТИСТИКА ИСПОЛЬЗОВАНИЯ ИНДЕКСОВ
-- ============================================================================

-- После использования приложения в течение некоторого времени,
-- выполните этот запрос ОТДЕЛЬНО чтобы увидеть, какие индексы используются:
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;
*/

-- ============================================================================
-- ПРИМЕЧАНИЯ
-- ============================================================================
-- 1. Индексы занимают место на диске, но значительно ускоряют запросы
-- 2. Индексы автоматически обновляются при изменении данных
-- 3. Для очень больших таблиц (>100k записей) индексы критически важны
-- 4. Составные индексы (composite indexes) оптимизированы для конкретных запросов
-- 5. Индексы особенно эффективны для:
--    - WHERE условий
--    - JOIN операций
--    - ORDER BY сортировки
--    - GROUP BY группировки
--
-- ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:
-- - Загрузка списка заказов: 50-70% быстрее
-- - Подсчет откликов: 60-80% быстрее
-- - Получение уведомлений: 50-60% быстрее
-- - Поиск мастеров: 40-60% быстрее
-- ============================================================================

