-- Миграция: добавление колонки proposed_price в таблицу applicants
-- Выполните этот SQL в SQL Editor вашего Supabase проекта

-- Добавляем колонку proposed_price в таблицу applicants (если не существует)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'applicants' 
        AND column_name = 'proposed_price'
    ) THEN
        ALTER TABLE public.applicants ADD COLUMN proposed_price INTEGER;
        COMMENT ON COLUMN public.applicants.proposed_price IS 'Предложенная цена исполнителя в сумах';
    END IF;
END $$;

-- Проверяем что колонка успешно добавлена
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'applicants' 
    AND column_name = 'proposed_price'; 