-- 🎯 ОДНА КОМАНДА для решения проблемы "bucket не найден"
-- Скопируйте и выполните в SQL Editor:

CREATE POLICY "Allow everyone to see buckets" ON storage.buckets FOR SELECT USING (true); 