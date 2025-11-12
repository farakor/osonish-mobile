-- Добавление дополнительных полей для job_seeker
-- willing_to_relocate - готов к переездам
-- desired_salary - желаемая зарплата

-- Добавляем поле "Готов к переездам" (boolean, по умолчанию false)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS willing_to_relocate BOOLEAN DEFAULT FALSE;

-- Добавляем поле "Желаемая зарплата" (integer, может быть NULL)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS desired_salary INTEGER;

-- Комментарии для полей
COMMENT ON COLUMN users.willing_to_relocate IS 'Готов к переездам (для job_seeker)';
COMMENT ON COLUMN users.desired_salary IS 'Желаемая зарплата в сумах (для job_seeker)';

-- Создаем индекс для фильтрации по готовности к переезду
CREATE INDEX IF NOT EXISTS idx_users_willing_to_relocate 
ON users(willing_to_relocate) 
WHERE worker_type = 'job_seeker';

-- Создаем индекс для фильтрации по желаемой зарплате
CREATE INDEX IF NOT EXISTS idx_users_desired_salary 
ON users(desired_salary) 
WHERE worker_type = 'job_seeker' AND desired_salary IS NOT NULL;

