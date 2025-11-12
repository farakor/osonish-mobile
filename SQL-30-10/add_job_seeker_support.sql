-- Миграция для добавления поддержки job_seeker (ищущих вакансию)
-- Дата: 2025-11-01
-- Описание: Добавляет новый тип исполнителя 'job_seeker' и поля для резюме
-- БЕЗОПАСНО ДЛЯ ПРОДАКШЕНА: Не влияет на существующих пользователей

-- ПРОВЕРКА ПЕРЕД МИГРАЦИЕЙ: Смотрим текущие типы пользователей
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '=== СУЩЕСТВУЮЩИЕ ТИПЫ ПОЛЬЗОВАТЕЛЕЙ ===';
    FOR r IN (
        SELECT worker_type, COUNT(*) as count 
        FROM users 
        WHERE worker_type IS NOT NULL 
        GROUP BY worker_type
    ) LOOP
        RAISE NOTICE 'Тип: %, Количество: %', r.worker_type, r.count;
    END LOOP;
    RAISE NOTICE '=======================================';
END $$;

-- 1. Добавляем поля для job_seeker в таблицу users
-- IF NOT EXISTS делает операцию безопасной - не упадет если поля уже есть
ALTER TABLE users
ADD COLUMN IF NOT EXISTS education JSONB,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS work_experience JSONB;

-- 2. Добавляем комментарии к новым полям
COMMENT ON COLUMN users.education IS 'Образование для job_seeker (массив JSONB объектов: institution, degree, yearStart, yearEnd)';
COMMENT ON COLUMN users.skills IS 'Навыки для job_seeker (массив строк)';
COMMENT ON COLUMN users.work_experience IS 'Опыт работы для job_seeker (массив JSONB объектов: company, position, yearStart, yearEnd, description)';

-- 3. Проверяем текущую структуру worker_type
-- Если поле worker_type существует, выведем информацию о нем
DO $$
DECLARE
    r RECORD;
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'worker_type'
    ) THEN
        RAISE NOTICE 'Поле worker_type существует. Текущие значения:';
        FOR r IN (
            SELECT DISTINCT worker_type 
            FROM users 
            WHERE worker_type IS NOT NULL
        ) LOOP
            RAISE NOTICE '  - %', r.worker_type;
        END LOOP;
    ELSE
        RAISE NOTICE 'Поле worker_type не существует, создаем...';
        ALTER TABLE users ADD COLUMN worker_type TEXT;
    END IF;
END $$;

-- 4. Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_worker_type_job_seeker 
ON users(worker_type) 
WHERE worker_type = 'job_seeker';

CREATE INDEX IF NOT EXISTS idx_users_skills 
ON users USING GIN (skills) 
WHERE skills IS NOT NULL;

-- 5. Удаляем старое ограничение если оно есть (для миграции со старой версии)
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_desired_salary_positive;

-- 5.1. Обновляем constraint для worker_type, чтобы поддерживать job_seeker
-- ВАЖНО: Старые значения ('daily_worker', 'professional') ОСТАЮТСЯ валидными!
-- Сначала удаляем старый constraint (IF EXISTS делает операцию безопасной)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_worker_type_check;

-- Создаем новый constraint с поддержкой всех трех типов
-- NULL также разрешен для совместимости
ALTER TABLE users ADD CONSTRAINT users_worker_type_check 
CHECK (worker_type IN ('daily_worker', 'professional', 'job_seeker') OR worker_type IS NULL);

-- ПРОВЕРКА ПОСЛЕ МИГРАЦИИ: Убеждаемся что старые пользователи не затронуты
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM users
    WHERE worker_type IS NOT NULL 
    AND worker_type NOT IN ('daily_worker', 'professional', 'job_seeker');
    
    IF invalid_count > 0 THEN
        RAISE WARNING 'ВНИМАНИЕ! Найдено % пользователей с невалидным worker_type!', invalid_count;
    ELSE
        RAISE NOTICE '✓ Все существующие пользователи валидны';
    END IF;
END $$;

-- 6. Проверяем результаты миграции
DO $$
BEGIN
    RAISE NOTICE '=== Результаты миграции ===';
    RAISE NOTICE 'Поле education: %', 
        (SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'education'
        ));
    RAISE NOTICE 'Поле skills: %', 
        (SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'skills'
        ));
    RAISE NOTICE 'Поле work_experience: %', 
        (SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'work_experience'
        ));
    RAISE NOTICE '=========================';
END $$;

-- 7. Проверяем количество пользователей по типам
SELECT 
    worker_type,
    COUNT(*) as count
FROM users
WHERE role = 'worker'
GROUP BY worker_type
ORDER BY worker_type;

-- 8. Пример вставки тестового пользователя job_seeker (закомментировано)
/*
INSERT INTO users (
    phone,
    first_name,
    last_name,
    birth_date,
    role,
    worker_type,
    city,
    is_verified,
    education,
    skills,
    work_experience,
    specializations
) VALUES (
    '+998901234567',
    'Тест',
    'Ищущий',
    '1995-01-01',
    'worker',
    'job_seeker',
    'tashkent',
    true,
    '[
        {
            "institution": "НУУз",
            "degree": "Программист",
            "yearStart": "2015",
            "yearEnd": "2019"
        }
    ]'::jsonb,
    ARRAY['JavaScript', 'React', 'Node.js', 'Управление проектами'],
    '[
        {
            "company": "IT Company",
            "position": "Frontend Developer",
            "yearStart": "2019",
            "yearEnd": "2023"
        }
    ]'::jsonb,
    '[
        {
            "id": "web_developer",
            "name": "Веб-разработчик",
            "isPrimary": true
        }
    ]'::jsonb
);
*/

