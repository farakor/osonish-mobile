# Исправления переводов для системных ошибок

## Проблема
В консоли появлялись ошибки:
```
LOG  i18next::translator: missingKey uz translation errors.error errors.error
```

Это происходило потому, что в коде использовался ключ `errors.error`, но в файлах переводов не было соответствующего перевода.

## Решение

### 1. Добавлены недостающие переводы в `errors` секцию

**Русский (`ru.json`):**
```json
"errors": {
  "error": "Ошибка",
  "invalid_phone": "Неверный формат номера телефона",
  "invalid_sms_code": "Неверный код подтверждения",
  "sms_send_error": "Ошибка отправки SMS",
  "sms_code_expired": "Код подтверждения истек",
  "too_many_attempts": "Превышено количество попыток",
  "general_error": "Произошла ошибка",
  "try_again": "Попробуйте еще раз"
}
```

**Узбекский (`uz.json`):**
```json
"errors": {
  "error": "Xato",
  "invalid_phone": "Telefon raqami formati noto'g'ri",
  "invalid_sms_code": "Tasdiqlash kodi noto'g'ri",
  "sms_send_error": "SMS yuborishda xato",
  "sms_code_expired": "Tasdiqlash kodi muddati tugagan",
  "too_many_attempts": "Urinishlar soni oshib ketdi",
  "general_error": "Xato yuz berdi",
  "try_again": "Qayta urinib ko'ring"
}
```

### 2. Проверены существующие переводы

Убедились, что в секции `auth` уже есть все необходимые переводы для:
- `invalid_phone`
- `sms_send_error` 
- `general_error`
- `invalid_code`
- `code_expired`

## Использование

Теперь в коде можно использовать:

```typescript
const tError = useErrorsTranslation();

// Для заголовка модального окна
Alert.alert(tError('error'), 'Сообщение об ошибке');

// Для конкретных ошибок
Alert.alert(tError('error'), tError('invalid_phone'));
Alert.alert(tError('error'), tError('sms_send_error'));
```

## Результат

✅ Устранены ошибки `missingKey` в консоли  
✅ Все системные модальные окна теперь корректно отображают переводы  
✅ Поддержка русского и узбекского языков для ошибок  
✅ Консистентность переводов между секциями `auth` и `errors`

---

**Дата исправления**: ${new Date().toLocaleDateString('ru-RU')}
**Статус**: ✅ Исправлено
