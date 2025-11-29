-- Схема базы данных для Osonish в Supabase
-- Выполните этот SQL в вашем Supabase проекте

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    birth_date DATE NOT NULL,
    role VARCHAR(10) CHECK (role IN ('customer', 'worker')) NOT NULL,
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы заказов
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    location VARCHAR(200) NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    workers_needed INTEGER DEFAULT 1 CHECK (workers_needed > 0),
    service_date TIMESTAMP WITH TIME ZONE NOT NULL,
    photos TEXT[] DEFAULT '{}',
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled')) DEFAULT 'active',
    applicants_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_category ON public.orders(category);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Настройка Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

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

-- Функция для безопасного увеличения счетчика откликов
CREATE OR REPLACE FUNCTION increment_applicants_count(order_id UUID)
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

COMMENT ON COLUMN public.users.role IS 'Роль пользователя: customer (заказчик) или worker (исполнитель)';
COMMENT ON COLUMN public.orders.status IS 'Статус заказа: active, in_progress, completed, cancelled';
COMMENT ON COLUMN public.orders.budget IS 'Бюджет заказа в сумах';
COMMENT ON COLUMN public.orders.workers_needed IS 'Количество требуемых исполнителей';
COMMENT ON COLUMN public.orders.applicants_count IS 'Количество откликов на заказ'; 