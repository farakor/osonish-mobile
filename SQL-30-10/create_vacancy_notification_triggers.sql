-- ============================================
-- Database Triggers для автоматической постановки
-- уведомлений в очередь при событиях с вакансиями
-- 
-- МУЛЬТИЯЗЫЧНЫЕ УВЕДОМЛЕНИЯ (RU/UZ)
-- 
-- ВАЖНО: Вакансии хранятся в таблице orders с type='vacancy'
-- ============================================

-- ============================================
-- 1. Уведомление работодателю о новом отклике на вакансию
-- ============================================

-- Функция: Уведомить работодателя о новом отклике на вакансию
CREATE OR REPLACE FUNCTION trigger_notify_employer_on_vacancy_application()
RETURNS TRIGGER AS $$
DECLARE
    v_vacancy_title TEXT;
    v_vacancy_employer_id TEXT;
    v_applicant_name TEXT;
    v_employer_language TEXT;
    v_employer_company_name TEXT;
BEGIN
    -- Получаем информацию о вакансии, работодателе и соискателе
    SELECT 
        o.title,
        o.customer_id,
        u.first_name || ' ' || u.last_name,
        COALESCE(e.preferred_language, 'ru'),
        e.company_name
    INTO v_vacancy_title, v_vacancy_employer_id, v_applicant_name, v_employer_language, v_employer_company_name
    FROM orders o
    JOIN users u ON u.id = NEW.applicant_id
    LEFT JOIN users e ON e.id = o.customer_id
    WHERE o.id = NEW.vacancy_id AND o.type = 'vacancy';
    
    -- Проверяем, что это действительно вакансия
    IF v_vacancy_employer_id IS NULL THEN
        RAISE NOTICE 'Заказ % не является вакансией или не найден', NEW.vacancy_id;
        RETURN NEW;
    END IF;
    
    -- Добавляем уведомление в очередь с учётом языка
    INSERT INTO notification_queue (
        user_id,
        title,
        body,
        data,
        notification_type,
        priority
    ) VALUES (
        v_vacancy_employer_id,
        -- Заголовок в зависимости от языка
        CASE 
            WHEN v_employer_language = 'uz' THEN 'Vakansiyangizga yangi javob!'
            ELSE 'Новый отклик на вакансию!'
        END,
        -- Текст с параметрами
        CASE 
            WHEN v_employer_language = 'uz' 
            THEN v_applicant_name || ' "' || v_vacancy_title || '" vakansiyasiga javob berdi'
            ELSE v_applicant_name || ' откликнулся на вакансию "' || v_vacancy_title || '"'
        END,
        jsonb_build_object(
            'vacancy_id', NEW.vacancy_id,
            'application_id', NEW.id,
            'applicant_id', NEW.applicant_id,
            'applicant_name', v_applicant_name,
            'vacancyTitle', v_vacancy_title,
            'cover_letter', NEW.cover_letter,
            'company_name', v_employer_company_name,
            'type', 'new_vacancy_application'
        ),
        'new_vacancy_application',
        8 -- Очень высокий приоритет
    );
    
    RAISE NOTICE 'Добавлено уведомление работодателю % о новом отклике на вакансию', v_vacancy_employer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаём триггер
DROP TRIGGER IF EXISTS trigger_notify_employer_on_vacancy_application ON vacancy_applications;
CREATE TRIGGER trigger_notify_employer_on_vacancy_application
    AFTER INSERT ON vacancy_applications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_notify_employer_on_vacancy_application();

COMMENT ON FUNCTION trigger_notify_employer_on_vacancy_application IS 
'Уведомляет работодателя о новом отклике на его вакансию';

-- ============================================
-- 2. Уведомление соискателю при изменении статуса отклика на вакансию
-- ============================================

-- Функция: Уведомить соискателя об изменении статуса отклика на вакансию
CREATE OR REPLACE FUNCTION trigger_notify_applicant_on_vacancy_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_vacancy_title TEXT;
    v_vacancy_salary_from INTEGER;
    v_vacancy_salary_to INTEGER;
    v_applicant_language TEXT;
    v_employer_company_name TEXT;
    v_priority INTEGER := 7;
    v_salary_text TEXT;
BEGIN
    -- Только если статус действительно изменился
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Получаем информацию о вакансии, работодателя и языке соискателя
    SELECT 
        o.title, 
        o.salary_from::INTEGER,
        o.salary_to::INTEGER,
        COALESCE(u.preferred_language, 'ru'),
        e.company_name
    INTO 
        v_vacancy_title, 
        v_vacancy_salary_from,
        v_vacancy_salary_to,
        v_applicant_language,
        v_employer_company_name
    FROM orders o
    LEFT JOIN users u ON u.id = NEW.applicant_id
    LEFT JOIN users e ON e.id = o.customer_id
    WHERE o.id = NEW.vacancy_id AND o.type = 'vacancy';
    
    -- Проверяем, что это действительно вакансия
    IF v_vacancy_title IS NULL THEN
        RAISE NOTICE 'Заказ % не является вакансией или не найден', NEW.vacancy_id;
        RETURN NEW;
    END IF;
    
    -- Формируем текст зарплаты
    IF v_vacancy_salary_from IS NOT NULL AND v_vacancy_salary_to IS NOT NULL THEN
        v_salary_text := v_vacancy_salary_from || '-' || v_vacancy_salary_to || ' ' || 
            CASE WHEN v_applicant_language = 'uz' THEN 'so''m' ELSE 'сум' END;
    ELSIF v_vacancy_salary_from IS NOT NULL THEN
        v_salary_text := v_vacancy_salary_from || ' ' || 
            CASE WHEN v_applicant_language = 'uz' THEN 'so''mdan' ELSE 'сум от' END;
    ELSE
        v_salary_text := CASE WHEN v_applicant_language = 'uz' THEN 'kelishiladi' ELSE 'по договоренности' END;
    END IF;
    
    -- Определяем текст уведомления в зависимости от статуса
    CASE NEW.status
        WHEN 'accepted' THEN
            v_priority := 9;
            INSERT INTO notification_queue (
                user_id, title, body, data, notification_type, priority
            ) VALUES (
                NEW.applicant_id,
                CASE 
                    WHEN v_applicant_language = 'uz' THEN 'Sizni ishga qabul qilishdi!'
                    ELSE 'Вас выбрали на вакансию!'
                END,
                CASE 
                    WHEN v_applicant_language = 'uz' 
                    THEN 'Tabriklaymiz! Sizni "' || v_vacancy_title || '" lavozimiga' ||
                         CASE WHEN v_employer_company_name IS NOT NULL THEN ' ' || v_employer_company_name || ' kompaniyasiga' ELSE '' END ||
                         ' ishga qabul qilishdi'
                    ELSE 'Поздравляем! Вас выбрали на вакансию "' || v_vacancy_title || '"' ||
                         CASE WHEN v_employer_company_name IS NOT NULL THEN ' в компании ' || v_employer_company_name ELSE '' END
                END,
                jsonb_build_object(
                    'vacancy_id', NEW.vacancy_id, 
                    'application_id', NEW.id, 
                    'vacancyTitle', v_vacancy_title,
                    'salary', v_salary_text,
                    'company_name', v_employer_company_name,
                    'type', 'vacancy_application_accepted'
                ),
                'vacancy_application_update',
                v_priority
            );
            
        WHEN 'rejected' THEN
            v_priority := 5;
            -- Опционально: можно отправить уведомление об отклонении
            -- Пока не отправляем, как в случае с заказами
            
        ELSE
            RETURN NEW;
    END CASE;
    
    RAISE NOTICE 'Обработано изменение статуса отклика на вакансию % на %', NEW.id, NEW.status;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаём триггер
DROP TRIGGER IF EXISTS trigger_notify_applicant_on_vacancy_status_change ON vacancy_applications;
CREATE TRIGGER trigger_notify_applicant_on_vacancy_status_change
    AFTER UPDATE OF status ON vacancy_applications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_notify_applicant_on_vacancy_status_change();

COMMENT ON FUNCTION trigger_notify_applicant_on_vacancy_status_change IS 
'Уведомляет соискателя об изменении статуса его отклика на вакансию';

-- ============================================
-- Проверка работы триггеров
-- ============================================

/*

-- Тест 1: Создание отклика на вакансию (должно уведомить работодателя)
-- Сначала убедитесь, что у вас есть вакансия (order с type='vacancy')
INSERT INTO vacancy_applications (vacancy_id, applicant_id, cover_letter, status)
VALUES ('vacancy_id_here', 'jobseeker_id_here', 'Я очень хочу работать у вас', 'pending');

-- Проверка: 
SELECT * FROM notification_queue 
WHERE notification_type = 'new_vacancy_application' 
ORDER BY created_at DESC LIMIT 5;

-- Тест 2: Принятие отклика (должно уведомить соискателя)
UPDATE vacancy_applications 
SET status = 'accepted' 
WHERE id = 'application_id_here';

-- Проверка: 
SELECT * FROM notification_queue 
WHERE notification_type = 'vacancy_application_update' 
ORDER BY created_at DESC LIMIT 5;

-- Общая статистика очереди уведомлений о вакансиях
SELECT 
    notification_type,
    COUNT(*) as count,
    AVG(priority) as avg_priority,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM notification_queue
WHERE status = 'pending'
  AND notification_type IN ('new_vacancy_application', 'vacancy_application_update')
GROUP BY notification_type
ORDER BY count DESC;

*/
