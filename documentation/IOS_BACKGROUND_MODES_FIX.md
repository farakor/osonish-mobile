# 🍎 Исправление ошибки UIBackgroundModes для iOS App Store

## 🚨 Проблема
При отправке приложения в App Store Connect возникала ошибка валидации:
```
Invalid Info.plist value. The Info.plist key UIBackgroundModes contains an invalid value: 'background-processing'
Invalid Info.plist value. The Info.plist key UIBackgroundModes contains an invalid value: 'background-fetch'
```

## ✅ Решение

### 1. Обновлен `app.json`
**Было:**
```json
"UIBackgroundModes": [
  "remote-notification",
  "background-fetch",
  "background-processing", 
  "fetch"
]
```

**Стало:**
```json
"UIBackgroundModes": [
  "remote-notification"
]
```

### 2. Удалены плагины фоновых задач
Удалены из `plugins` в `app.json`:
- `expo-task-manager`
- `expo-background-task`

### 3. Отключен backgroundTaskService в App.tsx
- Удален импорт `backgroundTaskService`
- Заменен вызов на информационное сообщение

## 📋 Что это означает

### ✅ Работает как прежде:
- Push-уведомления через `remote-notification`
- Все основные функции приложения
- Уведомления о новых заказах

### ⚠️ Изменения:
- Автозавершение заказов теперь происходит только при активном приложении
- Фоновая обработка недоступна (требует специального разрешения Apple)

## 🔄 Альтернативы для фоновых задач

Если в будущем потребуется фоновая обработка:

1. **Запросить разрешение у Apple** на использование `background-processing`
2. **Использовать server-side решения** для автозавершения заказов
3. **Push-уведомления с действиями** для критических операций

## 🚀 Результат
Приложение теперь соответствует требованиям App Store и может быть успешно отправлено в TestFlight.
