-- Расширение таблицы orders для поддержки вакансий
-- Добавляем новые поля для различения типов работ и данных вакансий

-- 1. Добавляем поле type для различения дневных работ и вакансий
ALTER TABLE orders ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'daily';

-- 2. Добавляем поля для вакансий
ALTER TABLE orders ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS work_format VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS work_schedule VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS salary_from DECIMAL(12, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS salary_to DECIMAL(12, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS salary_period VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS salary_type VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]';

-- 3. Обновляем существующие записи, устанавливая type='daily'
UPDATE orders SET type = 'daily' WHERE type IS NULL;

-- 4. Создаем таблицу для откликов на вакансии
CREATE TABLE IF NOT EXISTS vacancy_applications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    vacancy_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    applicant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT vacancy_applications_unique_applicant UNIQUE (vacancy_id, applicant_id)
);

-- 5. Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_city ON orders(city);
CREATE INDEX IF NOT EXISTS idx_orders_experience_level ON orders(experience_level);
CREATE INDEX IF NOT EXISTS idx_orders_employment_type ON orders(employment_type);
CREATE INDEX IF NOT EXISTS idx_vacancy_applications_vacancy_id ON vacancy_applications(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_vacancy_applications_applicant_id ON vacancy_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_vacancy_applications_status ON vacancy_applications(status);

-- 6. Добавляем триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_vacancy_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vacancy_applications_updated_at
    BEFORE UPDATE ON vacancy_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_vacancy_applications_updated_at();

-- 7. Настраиваем Row Level Security для vacancy_applications
ALTER TABLE vacancy_applications ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут просматривать отклики на свои вакансии
CREATE POLICY "Users can view applications to their vacancies"
    ON vacancy_applications FOR SELECT
    USING (
        vacancy_id IN (
            SELECT id FROM orders WHERE customer_id = auth.uid()::TEXT
        )
        OR applicant_id = auth.uid()::TEXT
    );

-- Политика: пользователи могут создавать отклики на вакансии
CREATE POLICY "Users can create applications to vacancies"
    ON vacancy_applications FOR INSERT
    WITH CHECK (applicant_id = auth.uid()::TEXT);

-- Политика: владельцы вакансий могут обновлять статус откликов
CREATE POLICY "Vacancy owners can update application status"
    ON vacancy_applications FOR UPDATE
    USING (
        vacancy_id IN (
            SELECT id FROM orders WHERE customer_id = auth.uid()::TEXT
        )
    );

-- Политика: пользователи могут удалять свои отклики
CREATE POLICY "Users can delete their own applications"
    ON vacancy_applications FOR DELETE
    USING (applicant_id = auth.uid()::TEXT);

-- 8. Добавляем комментарии для документации
COMMENT ON COLUMN orders.type IS 'Тип работы: daily (дневная работа) или vacancy (вакансия)';
COMMENT ON COLUMN orders.job_title IS 'Название вакансии';
COMMENT ON COLUMN orders.experience_level IS 'Требуемый уровень опыта (no_experience, 1_to_3_years, 3_to_6_years, more_than_6_years)';
COMMENT ON COLUMN orders.employment_type IS 'Тип занятости (full_time, part_time, project, shift_work)';
COMMENT ON COLUMN orders.work_format IS 'Формат работы (on_site, remote, hybrid, traveling)';
COMMENT ON COLUMN orders.work_schedule IS 'График работы';
COMMENT ON COLUMN orders.city IS 'Город вакансии';
COMMENT ON COLUMN orders.salary_from IS 'Минимальная зарплата';
COMMENT ON COLUMN orders.salary_to IS 'Максимальная зарплата';
COMMENT ON COLUMN orders.salary_period IS 'Период выплаты (per_month, per_week, per_day, per_shift, per_project)';
COMMENT ON COLUMN orders.salary_type IS 'Тип выплаты (before_tax, after_tax)';
COMMENT ON COLUMN orders.payment_frequency IS 'Частота выплат (daily, weekly, bi_monthly, monthly, per_project)';
COMMENT ON COLUMN orders.skills IS 'Требуемые навыки (JSON массив)';
COMMENT ON COLUMN orders.languages IS 'Требуемые языки (JSON массив)';

COMMENT ON TABLE vacancy_applications IS 'Отклики на вакансии';
COMMENT ON COLUMN vacancy_applications.vacancy_id IS 'ID вакансии (ссылка на orders)';
COMMENT ON COLUMN vacancy_applications.applicant_id IS 'ID соискателя';
COMMENT ON COLUMN vacancy_applications.cover_letter IS 'Сопроводительное письмо';
COMMENT ON COLUMN vacancy_applications.status IS 'Статус отклика (pending, accepted, rejected, withdrawn)';

