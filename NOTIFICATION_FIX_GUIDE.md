# 🔔 Руководство по исправлению Push Уведомлений

## 🔍 Проблемы, которые были найдены и исправлены:

### ✅ Исправленные проблемы:
1. **Добавлен `background-fetch` в iOS UIBackgroundModes** - для фоновой обработки уведомлений
2. **Добавлено разрешение `POST_NOTIFICATIONS`** для Android 13+ 
3. **Улучшена конфигурация EAS** - добавлены resourceClass для стабильной сборки
4. **Исправлена Firebase конфигурация** - убраны переменные окружения, используются прямые значения

### 🚨 Критические проблемы, которые нужно решить:

#### 1. **APNs ключ для iOS (ОБЯЗАТЕЛЬНО)**
Для работы уведомлений в TestFlight и App Store нужен APNs ключ:

```bash
# 1. Зайдите в Apple Developer Console
# 2. Перейдите в Certificates, Identifiers & Profiles
# 3. Создайте APNs Key (.p8 файл)
# 4. Добавьте в EAS Secrets:

eas secret:create --scope project --name APPLE_PUSH_KEY --value "$(cat path/to/AuthKey_XXXXXXXXXX.p8)"
eas secret:create --scope project --name APPLE_PUSH_KEY_ID --value "XXXXXXXXXX"
eas secret:create --scope project --name APPLE_TEAM_ID --value "Z22573B2K6"
```

#### 2. **Обновить eas.json с APNs конфигурацией**
```json
{
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release",
        "simulator": false,
        "resourceClass": "m-medium"
      }
    }
  }
}
```

#### 3. **Проверить Bundle ID и Package Name**
Убедитесь, что Bundle ID и Package Name совпадают:
- iOS Bundle ID: `com.farakor.osonishmobile`
- Android Package: `com.farakor.osonishmobile`
- Firebase Project Package: `com.farakor.osonishmobile`

## 🛠️ Следующие шаги:

### Для Expo Go (Development):
```bash
# 1. Перезапустите приложение
expo start --clear

# 2. Проверьте логи уведомлений
# В приложении должны появиться логи: "✅ Push token получен"
```

### Для TestFlight (Production):
```bash
# 1. Настройте APNs ключ (см. выше)
# 2. Пересоберите приложение
eas build --platform ios --profile production

# 3. Загрузите в TestFlight
eas submit --platform ios
```

### Для Google Play (Production):
```bash
# 1. Убедитесь что google-services.json актуален
# 2. Пересоберите приложение
eas build --platform android --profile production

# 3. Загрузите в Google Play
eas submit --platform android
```

## 🧪 Тестирование уведомлений:

### В приложении:
1. Откройте консоль разработчика
2. Найдите логи: `[NotificationService] ✅ Push token получен`
3. Используйте функцию тестирования в настройках приложения

### Внешнее тестирование:
```bash
# Используйте Expo Push Tool
npx expo send-notification --to="ExponentPushToken[xxxxxx]" --title="Test" --body="Test message"
```

## 📱 Проверка разрешений:

### iOS:
1. Настройки → Osonish → Уведомления → Включить
2. Убедитесь что все типы уведомлений включены

### Android:
1. Настройки → Приложения → Osonish → Уведомления → Включить
2. Проверьте каналы уведомлений

## 🔧 Отладка проблем:

### Если уведомления не приходят:
1. **Проверьте логи** - должен быть получен push token
2. **Проверьте разрешения** - в системных настройках
3. **Проверьте интернет** - уведомления требуют сети
4. **Проверьте APNs ключ** - для iOS production

### Если токен не получается:
1. **Expo Go**: Убедитесь что EAS projectId настроен
2. **Production**: Убедитесь что APNs ключ добавлен в EAS
3. **Android**: Проверьте google-services.json

## 📞 Поддержка:
Если проблемы остаются, проверьте:
- EAS Dashboard: https://expo.dev/accounts/farakor/projects/osonish-mobile
- Firebase Console: https://console.firebase.google.com/project/osonish-mobile
- Apple Developer: https://developer.apple.com/account/
