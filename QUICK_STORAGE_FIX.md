# 🚨 Быстрое решение ошибки Storage RLS Policy

## Ошибка
```
new row violates row-level security policy
```

## ⚡ Решение за 2 минуты

### Шаг 1: Проверьте bucket

**Supabase Dashboard** → **Storage** → найдите bucket **`order-media`**

✅ Убедитесь что он помечен как **Public** (зеленый значок)

❌ Если НЕ Public:
1. Нажмите на bucket → **Settings**
2. Включите **Public bucket**
3. Сохраните

### Шаг 2: Выполните SQL скрипт

1. **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Скопируйте **весь** файл `osonish-mobile/SQL-02-10/storage_policies_open.sql`
3. Вставьте в редактор
4. Нажмите **Run** (или Ctrl+Enter)

### Шаг 3: Проверьте результат

После выполнения скрипта вы должны увидеть **4 политики**:

| Policy Name | Operation | Roles |
|------------|-----------|-------|
| order_media_authenticated_delete | DELETE | authenticated |
| order_media_authenticated_insert | INSERT | authenticated |
| order_media_authenticated_update | UPDATE | authenticated |
| order_media_public_read | SELECT | public |

### Шаг 4: Перезапустите приложение

```bash
# Остановите Metro (Ctrl+C)
npm start
```

## 🔍 Что делает этот скрипт?

Создает **максимально открытые политики**:

- ✅ **Все** могут просматривать файлы (даже неавторизованные)
- ✅ **Авторизованные** могут загружать файлы
- ✅ **Авторизованные** могут обновлять любые файлы
- ✅ **Авторизованные** могут удалять любые файлы

> **Примечание:** Это упрощенные политики для разработки. В продакшене можно сделать более строгие правила (например, пользователь может удалять только свои файлы).

## 🆘 Если все еще не работает

### Вариант 1: Создайте политики вручную через UI

1. **Supabase Dashboard** → **Storage** → **order-media** → **Policies**
2. Нажмите **New Policy**
3. Выберите **Get started quickly** → **Allow all operations for all users**
4. Нажмите **Review** → **Save policy**

### Вариант 2: Отключите RLS временно (только для тестирования!)

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

⚠️ **НЕ используйте это в продакшене!** Это небезопасно.

### Вариант 3: Пересоздайте bucket

1. Удалите bucket `order-media` (если в нем нет важных файлов)
2. Создайте новый bucket с именем `order-media`
3. ✅ Включите **Public bucket**
4. Выполните скрипт `storage_policies_open.sql`

## 📞 Проверка

Попробуйте загрузить фото работы в профиле мастера. Если загрузка успешна — все работает! ✅

## 🔐 Для продакшена

После того как все заработает, можно настроить более строгие политики:

```sql
-- Пример: только владелец может удалять свои файлы
DROP POLICY IF EXISTS "order_media_authenticated_delete" ON storage.objects;

CREATE POLICY "order_media_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'order-media' 
  AND (auth.uid())::text = owner::text
);
```

Но для начала используйте открытые политики из `storage_policies_open.sql`!

