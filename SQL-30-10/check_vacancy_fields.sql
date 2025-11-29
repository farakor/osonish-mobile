-- Проверка наличия всех необходимых полей для вакансий в таблице orders

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'orders'
  AND column_name IN (
    'type',
    'job_title',
    'experience_level',
    'employment_type',
    'work_format',
    'work_schedule',
    'city',
    'salary_from',
    'salary_to',
    'salary_period',
    'skills',
    'languages',
    'views_count',
    'applicants_count'
  )
ORDER BY column_name;

-- Проверка наличия полей компании в таблице users
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN (
    'company_name',
    'user_type'
  )
ORDER BY column_name;

