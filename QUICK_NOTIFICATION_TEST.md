# 🚀 Быстрый тест уведомлений

## ✅ Credentials настроены правильно:
- **iOS Push Key**: ✅ 3J7A8DJHLP (активен)
- **Android FCM V1**: ✅ Настроен (обновлен 3 дня назад)
- **Все сертификаты**: ✅ Активны до 2026 года

## 🧪 Как протестировать уведомления:

### 1. В Expo Go (Development):
```bash
# Запустите приложение
expo start --clear

# Откройте в Expo Go
# В консоли разработчика выполните:
NotificationTest.runFullTest()
```

### 2. Пошаговое тестирование:
```javascript
// 1. Диагностика
NotificationTest.runFullDiagnostics()

// 2. Обновить токен
NotificationTest.refreshPushToken()

// 3. Тест локального уведомления
NotificationTest.addTestLocalNotification()

// 4. Тест push уведомления
NotificationTest.testSelfNotification()
```

### 3. Внешний тест (если есть токен):
```bash
# Найдите токен в логах приложения
# Выполните:
npm run test-notifications "ExponentPushToken[ваш-токен]"
```

## 🔍 Что искать в логах:

### ✅ Успешные логи:
```
[NotificationService] ✅ Push token получен: ExponentPushToken[...]
[NotificationService] ✅ Push token сохранен в БД
[NotificationService] ✅ Тестовое уведомление отправлено успешно
```

### ❌ Проблемные логи:
```
[NotificationService] ❌ Ошибка получения токена
[NotificationService] ⚠️ Разрешения на уведомления не получены
[NotificationService] ❌ Ошибка отправки push уведомления
```

## 🔧 Если уведомления не работают:

### В Expo Go:
1. **Проверьте разрешения** - Settings → Expo Go → Notifications → Allow
2. **Перезапустите приложение** - `expo start --clear`
3. **Проверьте интернет** - уведомления требуют сети

### В TestFlight:
1. **Пересоберите приложение** - `eas build --platform ios --profile production`
2. **Проверьте разрешения** - Settings → Osonish → Notifications → Allow
3. **Проверьте что сборка свежая** - credentials обновлены 12 дней назад

### В Google Play:
1. **Пересоберите приложение** - `eas build --platform android --profile production`
2. **Проверьте разрешения** - Settings → Apps → Osonish → Notifications → Allow

## 📱 Быстрая проверка разрешений:

### iOS:
Settings → Osonish → Notifications → ✅ Allow Notifications

### Android:
Settings → Apps → Osonish → Notifications → ✅ All notifications

## 🆘 Если ничего не помогает:

1. **Проверьте EAS Dashboard**: https://expo.dev/accounts/farakor/projects/osonish-mobile
2. **Проверьте Firebase Console**: https://console.firebase.google.com/project/osonish-mobile
3. **Пересоберите с нуля**:
   ```bash
   eas build --platform all --profile production --clear-cache
   ```
