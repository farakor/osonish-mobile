-- Исправление схемы Supabase для совместимости с приложением
-- Выполните этот SQL в вашем Supabase SQL Editor

-- 1. Изменяем тип customer_id с UUID на TEXT
ALTER TABLE public.orders 
ALTER COLUMN customer_id TYPE TEXT;

-- 2. Изменяем тип id в таблице users на TEXT (если нужно)
ALTER TABLE public.users 
ALTER COLUMN id TYPE TEXT;

-- 3. Обновляем внешний ключ
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. Обновляем функцию для счетчика откликов
DROP FUNCTION IF EXISTS increment_applicants_count(UUID);

CREATE OR REPLACE FUNCTION increment_applicants_count(order_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.orders 
    SET applicants_count = applicants_count + 1,
        updated_at = NOW()
    WHERE id = order_id;
END;
$$ LANGUAGE plpgsql;

-- Готово! Теперь Supabase совместим с приложением 