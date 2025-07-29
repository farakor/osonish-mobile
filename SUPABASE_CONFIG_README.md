# 🔧 Конфигурация Supabase

## ⚠️ Важно для разработчиков

Файл `src/services/supabaseClient.ts` **НЕ ВКЛЮЧЕН** в Git репозиторий по соображениям безопасности.

## 🚀 Быстрая настройка

1. **Скопируйте template файл**:
   ```bash
   cp src/services/supabaseClient.template.ts src/services/supabaseClient.ts
   ```

2. **Получите ключи Supabase**:
   - Откройте ваш проект на [supabase.com](https://supabase.com)
   - Перейдите в **Settings** → **API**
   - Скопируйте **URL** и **anon public key**

3. **Настройте файл** `src/services/supabaseClient.ts`:
   ```typescript
   const supabaseUrl = 'https://ваш-проект-id.supabase.co';
   const supabaseAnonKey = 'ваш-anon-ключ';
   ```

4. **Выполните SQL схему** в Supabase:
   - Скопируйте содержимое `supabase-schema-fix-correct.sql`
   - Выполните в **SQL Editor** вашего Supabase проекта

## ✅ Проверка

После настройки в консоли должно появиться:
```
✅ Supabase клиент создан успешно
[OrderService] ✅ Supabase подключен успешно
```

## 📖 Полная инструкция

Смотрите `SUPABASE_SETUP.md` для подробной пошаговой инструкции.

---

**🔒 Безопасность**: Никогда не коммитите файл `supabaseClient.ts` с реальными токенами! 