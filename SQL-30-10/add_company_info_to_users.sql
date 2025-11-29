-- ============================================
-- Добавление информации о компании в таблицу users
-- ============================================
-- Дата: 22 ноября 2025
-- Описание: Добавляет поля для различения физических и юридических лиц

-- 1. Добавляем поле user_type (тип пользователя)
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'individual';

-- 2. Добавляем поле company_name (название компании)
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

-- 3. Добавляем комментарии для документации
COMMENT ON COLUMN users.user_type IS 'Тип пользователя: individual (физ. лицо) или company (юр. лицо)';
COMMENT ON COLUMN users.company_name IS 'Название компании (только для юридических лиц)';

-- 4. Создаем индекс для быстрого поиска по типу пользователя
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- 5. Обновляем существующих пользователей
-- Все существующие пользователи автоматически становятся физическими лицами
UPDATE users 
SET user_type = 'individual' 
WHERE user_type IS NULL;

-- 6. Проверка структуры таблицы
-- Раскомментируйте для проверки после применения
/*
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('user_type', 'company_name')
ORDER BY ordinal_position;
*/

-- Готово! Теперь таблица users поддерживает информацию о компаниях

