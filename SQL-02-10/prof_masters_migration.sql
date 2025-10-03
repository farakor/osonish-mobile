-- Добавление полей для профессиональных мастеров в таблицу users
-- Выполните этот скрипт в Supabase SQL Editor

-- Добавляем поле для типа исполнителя
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS worker_type VARCHAR(20) DEFAULT 'daily_worker' CHECK (worker_type IN ('daily_worker', 'professional'));

-- Добавляем поле для описания "О себе"
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS about_me TEXT;

-- Добавляем массив для хранения специализаций (до 3)
-- Формат: [{"id": "plumber", "name": "Сантехники", "isPrimary": true}, ...]
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'::jsonb;

-- Добавляем массив для хранения URL фотографий работ (до 10)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS work_photos TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Добавляем индексы для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_users_worker_type ON users(worker_type) WHERE worker_type = 'professional';
CREATE INDEX IF NOT EXISTS idx_users_specializations ON users USING GIN (specializations) WHERE worker_type = 'professional';

-- Комментарии к полям
COMMENT ON COLUMN users.worker_type IS 'Тип исполнителя: daily_worker (дневная работа) или professional (профессиональный мастер)';
COMMENT ON COLUMN users.about_me IS 'Описание исполнителя о себе (только для профессиональных мастеров)';
COMMENT ON COLUMN users.specializations IS 'Массив специализаций профессионального мастера (до 3): 1 основная и 2 дополнительных';
COMMENT ON COLUMN users.work_photos IS 'Массив URL фотографий работ профессионального мастера (до 10 фото)';

-- Проверяем результат
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('worker_type', 'about_me', 'specializations', 'work_photos')
ORDER BY ordinal_position;

