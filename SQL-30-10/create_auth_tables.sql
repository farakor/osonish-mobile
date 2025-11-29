-- Создание таблиц для SMS-авторизации и пользовательских сессий
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Таблица для хранения OTP кодов
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для otp_codes
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- 2. Таблица для хранения пользовательских сессий
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Индексы для user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 3. Функция для автоматической очистки истекших OTP кодов
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Функция для автоматической очистки истекших сессий
CREATE OR REPLACE FUNCTION cleanup_expired_user_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Планировщик для автоматической очистки (опционально)
-- Выполняется каждый час
-- Примечание: для использования cron в Supabase нужно включить pg_cron расширение
-- SELECT cron.schedule('cleanup-expired-otps', '0 * * * *', 'SELECT cleanup_expired_otp_codes()');
-- SELECT cron.schedule('cleanup-expired-sessions', '0 * * * *', 'SELECT cleanup_expired_user_sessions()');

-- 6. Отключаем RLS для этих таблиц (они используются внутренне)
ALTER TABLE otp_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Комментарии к таблицам
COMMENT ON TABLE otp_codes IS 'Таблица для хранения OTP кодов для SMS-авторизации';
COMMENT ON COLUMN otp_codes.phone IS 'Номер телефона в формате 998XXXXXXXXX';
COMMENT ON COLUMN otp_codes.code IS '6-значный OTP код';
COMMENT ON COLUMN otp_codes.expires_at IS 'Время истечения кода (обычно 5 минут)';

COMMENT ON TABLE user_sessions IS 'Таблица для хранения пользовательских сессий';
COMMENT ON COLUMN user_sessions.user_id IS 'ID пользователя из таблицы users';
COMMENT ON COLUMN user_sessions.expires_at IS 'Время истечения сессии (обычно 30 дней)';

-- Проверка создания таблиц
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('otp_codes', 'user_sessions')
ORDER BY table_name, ordinal_position;

