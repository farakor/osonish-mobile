-- Исправление схемы Supabase - ПРАВИЛЬНАЯ ВЕРСИЯ
-- Выполните этот SQL в вашем Supabase SQL Editor

-- 1. Сначала удаляем внешний ключ
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

-- 2. Удаляем существующие данные (если есть)
DELETE FROM public.orders;
DELETE FROM public.users;

-- 3. Изменяем тип id в таблице users на TEXT
ALTER TABLE public.users 
ALTER COLUMN id TYPE TEXT;

-- 4. Изменяем тип customer_id в таблице orders на TEXT
ALTER TABLE public.orders 
ALTER COLUMN customer_id TYPE TEXT;

-- 5. Изменяем тип id в таблице orders на TEXT (для совместимости)
ALTER TABLE public.orders 
ALTER COLUMN id TYPE TEXT;

-- 6. Теперь создаем внешний ключ заново
ALTER TABLE public.orders 
ADD CONSTRAINT orders_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 7. Обновляем функцию для счетчика откликов
DROP FUNCTION IF EXISTS increment_applicants_count(UUID);
DROP FUNCTION IF EXISTS increment_applicants_count(TEXT);

CREATE OR REPLACE FUNCTION increment_applicants_count(order_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.orders 
    SET applicants_count = applicants_count + 1,
        updated_at = NOW()
    WHERE id = order_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Обновляем функцию автоматического обновления updated_at для TEXT типов
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Готово! Теперь все типы совместимы с приложением 