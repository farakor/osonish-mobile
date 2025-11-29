-- Полная схема базы данных для Osonish в Supabase
-- Выполните этот SQL в вашем Supabase проекте
-- ВНИМАНИЕ: Использует TEXT для ID вместо UUID, чтобы соответствовать приложению

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    birth_date DATE NOT NULL,
    role VARCHAR(10) CHECK (role IN ('customer', 'worker')) NOT NULL,
    profile_image TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавляем недостающий столбец is_verified в таблицу users (если не существует)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_verified BOOLEAN DEFAULT false;
        COMMENT ON COLUMN public.users.is_verified IS 'Подтвержден ли пользователь';
    END IF;
END $$;

-- Создание таблицы заказов
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    location VARCHAR(200) NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    workers_needed INTEGER DEFAULT 1 CHECK (workers_needed > 0),
    service_date TIMESTAMP WITH TIME ZONE NOT NULL,
    photos TEXT[] DEFAULT '{}',
    customer_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled')) DEFAULT 'active',
    applicants_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы откликов исполнителей
CREATE TABLE IF NOT EXISTS public.applicants (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    worker_id TEXT REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    worker_name VARCHAR(200) NOT NULL,
    worker_phone VARCHAR(20) NOT NULL,
    rating DECIMAL(3,2) DEFAULT 4.5,
    completed_jobs INTEGER DEFAULT 0,
    message TEXT,
    proposed_price INTEGER, -- предложенная цена исполнителя в сумах
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_category ON public.orders(category);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applicants_order_id ON public.applicants(order_id);
CREATE INDEX IF NOT EXISTS idx_applicants_worker_id ON public.applicants(worker_id);
CREATE INDEX IF NOT EXISTS idx_applicants_status ON public.applicants(status);
CREATE INDEX IF NOT EXISTS idx_applicants_applied_at ON public.applicants(applied_at DESC);

-- Создание уникального индекса для предотвращения дублирования откликов
CREATE UNIQUE INDEX IF NOT EXISTS idx_applicants_unique_worker_order 
ON public.applicants(order_id, worker_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applicants_updated_at ON public.applicants;
CREATE TRIGGER update_applicants_updated_at
    BEFORE UPDATE ON public.applicants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Настройка Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Удаление существующих политик если есть
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Orders are viewable by everyone" ON public.orders;
DROP POLICY IF EXISTS "Users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Applicants are viewable by everyone" ON public.applicants;
DROP POLICY IF EXISTS "Users can insert applicants" ON public.applicants;
DROP POLICY IF EXISTS "Users can update applicants" ON public.applicants;

-- Политики доступа для пользователей (временно разрешаем всем)
-- В продакшн можно настроить более строгие правила
CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (true);

-- Политики доступа для заказов
CREATE POLICY "Orders are viewable by everyone" ON public.orders
    FOR SELECT USING (true);

CREATE POLICY "Users can insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update orders" ON public.orders
    FOR UPDATE USING (true);

-- Политики доступа для откликов
CREATE POLICY "Applicants are viewable by everyone" ON public.applicants
    FOR SELECT USING (true);

CREATE POLICY "Users can insert applicants" ON public.applicants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update applicants" ON public.applicants
    FOR UPDATE USING (true);

-- Функция для безопасного увеличения счетчика откликов
CREATE OR REPLACE FUNCTION increment_applicants_count(order_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.orders 
    SET applicants_count = applicants_count + 1,
        updated_at = NOW()
    WHERE id = order_id;
END;
$$ LANGUAGE plpgsql;

-- Комментарии к таблицам
COMMENT ON TABLE public.users IS 'Пользователи системы (заказчики и исполнители)';
COMMENT ON TABLE public.orders IS 'Заказы в системе';
COMMENT ON TABLE public.applicants IS 'Отклики исполнителей на заказы';

COMMENT ON COLUMN public.users.role IS 'Роль пользователя: customer (заказчик) или worker (исполнитель)';
COMMENT ON COLUMN public.users.is_verified IS 'Подтвержден ли пользователь';
COMMENT ON COLUMN public.orders.status IS 'Статус заказа: active, in_progress, completed, cancelled';
COMMENT ON COLUMN public.orders.budget IS 'Бюджет заказа в сумах';
COMMENT ON COLUMN public.orders.workers_needed IS 'Количество требуемых исполнителей';
COMMENT ON COLUMN public.orders.applicants_count IS 'Количество откликов на заказ';
COMMENT ON COLUMN public.applicants.status IS 'Статус отклика: pending, accepted, rejected';
COMMENT ON COLUMN public.applicants.rating IS 'Рейтинг исполнителя';
COMMENT ON COLUMN public.applicants.completed_jobs IS 'Количество выполненных заказов исполнителем';
COMMENT ON COLUMN public.applicants.proposed_price IS 'Предложенная цена исполнителя в сумах';

-- Проверяем что все создано успешно
SELECT 
    'users' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'is_verified'

UNION ALL

SELECT 
    'applicants' as table_name,
    'table_exists' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'applicants'
        ) THEN 'YES'
        ELSE 'NO'
    END as data_type

UNION ALL

SELECT 
    'orders' as table_name,
    'table_exists' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'orders'
        ) THEN 'YES'
        ELSE 'NO'
    END as data_type; 