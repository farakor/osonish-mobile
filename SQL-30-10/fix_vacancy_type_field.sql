-- Скрипт для исправления поля type в таблице orders
-- Обновляет все записи, которые являются вакансиями, но не имеют правильного значения type

-- 1. Помечаем все вакансии (где есть job_title) как 'vacancy'
UPDATE orders 
SET type = 'vacancy' 
WHERE job_title IS NOT NULL 
  AND job_title != ''
  AND (type IS NULL OR type != 'vacancy');

-- 2. Помечаем все остальные заказы как 'daily'
UPDATE orders 
SET type = 'daily' 
WHERE type IS NULL 
  OR type = '';

-- 3. Проверяем результат
SELECT 
  type,
  COUNT(*) as count,
  COUNT(CASE WHEN job_title IS NOT NULL THEN 1 END) as with_job_title
FROM orders
GROUP BY type;

-- 4. Дополнительная проверка: вакансии без type='vacancy'
SELECT id, title, job_title, type 
FROM orders 
WHERE job_title IS NOT NULL 
  AND type != 'vacancy';

-- 5. Дополнительная проверка: заказы с type='vacancy', но без job_title
SELECT id, title, job_title, type 
FROM orders 
WHERE type = 'vacancy' 
  AND (job_title IS NULL OR job_title = '');

