# Настройка тестового пользователя в Supabase

## Быстрая настройка

### 1. Откройте Supabase Dashboard
- Перейдите в ваш проект Supabase
- Откройте раздел **SQL Editor**

### 2. Выполните SQL скрипт
Скопируйте и выполните содержимое файла `SQL/create_test_user_for_stores.sql`:

```sql
-- Создание тестового пользователя для App Store и Google Play
INSERT INTO users (
    id,
    phone,
    first_name,
    last_name,
    middle_name,
    birth_date,
    role,
    profile_image,
    city,
    preferred_language,
    is_verified,
    created_at,
    updated_at
) VALUES (
    'test-user-appstore-' || extract(epoch from now())::text,
    '+998999999999',
    'App Store',
    'Tester',
    'Google Play',
    '1990-01-01',
    'customer',
    NULL,
    'Ташкент',
    'ru',
    true,
    NOW(),
    NOW()
) ON CONFLICT (phone) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    middle_name = EXCLUDED.middle_name,
    updated_at = NOW();
```

### 3. Проверьте результат
После выполнения скрипта вы должны увидеть:
- ✅ Сообщение об успешном создании пользователя
- ✅ Информацию о созданном пользователе
- ✅ Подтверждение, что пользователь верифицирован

### 4. Проверка в приложении
1. Откройте приложение
2. Введите номер: `+998999999999`
3. Введите SMS код: `123456`
4. Должен произойти успешный вход

## Что создается

### Пользователь в таблице `users`:
- **ID**: Уникальный идентификатор
- **Phone**: `+998999999999`
- **Name**: App Store Tester
- **Role**: `customer`
- **City**: Ташкент
- **Language**: `ru` (русский)
- **Status**: Верифицирован (`is_verified = true`)

### Возможности тестового пользователя:
- ✅ Полный доступ к функциям заказчика
- ✅ Создание заказов
- ✅ Просмотр исполнителей
- ✅ Управление профилем
- ✅ Получение уведомлений

## Безопасность

- 🔒 Тестовый номер не связан с реальным пользователем
- 🔒 Не отправляются реальные SMS
- 🔒 Не влияет на работу обычных пользователей
- 🔒 Можно безопасно удалить после модерации

## Удаление тестового пользователя

После успешной модерации можно удалить тестового пользователя:

```sql
-- Удаление тестового пользователя
DELETE FROM users WHERE phone = '+998999999999';
```

## Поддержка

Если возникли проблемы:
- **Email**: info@oson-ish.uz
- **Telegram**: @osonish_support

---

**Дата создания**: ${new Date().toLocaleDateString('ru-RU')}
**Версия**: 1.0
