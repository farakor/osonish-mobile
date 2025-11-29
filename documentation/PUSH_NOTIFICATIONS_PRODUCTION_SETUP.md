# 🔔 Настройка Push Уведомлений для Продакшена

## Обзор

Данная документация описывает пошаговый процесс настройки push уведомлений для приложения Osonish в продакшене (App Store и Google Play).

## ✅ Текущий статус

- ✅ Архитектура кода готова
- ✅ EAS проект настроен (projectId: d25e6650-1e06-4ebb-8988-0085861affbf)
- ✅ База данных структура готова
- ✅ Логика уведомлений реализована
- ⚠️ Требуется настройка для продакшена

## 📋 Необходимые учетные данные

### Apple Developer Account
- **Apple ID**: Аккаунт разработчика ($99/год)
- **Team ID**: Идентификатор команды
- **Bundle Identifier**: com.yourcompany.osonish
- **APNs Key**: Ключ для Apple Push Notification Service

### Google Play Console
- **Google Play Developer Account** ($25 единоразово)
- **Package Name**: com.yourcompany.osonish
- **Firebase Project**: Для FCM (Firebase Cloud Messaging)
- **Service Account Key**: JSON файл для автоматизации

## 🚀 Пошаговый план настройки

### Этап 1: Подготовка учетных данных

#### 1.1 Apple Developer Account
```bash
# После получения Apple Developer Account:
# 1. Зайдите в Apple Developer Console
# 2. Создайте App ID с Bundle Identifier: com.yourcompany.osonish
# 3. Включите Push Notifications capability
# 4. Создайте APNs Key в Certificates, Identifiers & Profiles
# 5. Скачайте .p8 файл ключа
```

#### 1.2 Google Play Console & Firebase
```bash
# После получения Google Play Console:
# 1. Создайте приложение в Google Play Console
# 2. Создайте Firebase проект на https://console.firebase.google.com
# 3. Добавьте Android приложение с package name: com.yourcompany.osonish
# 4. Скачайте google-services.json
# 5. Настройте Service Account для автоматизации
```

### Этап 2: Настройка EAS Build

#### 2.1 Обновление app.json
```json
{
  "expo": {
    "name": "Osonish",
    "slug": "osonish-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "owner": "farakor",
    "extra": {
      "eas": {
        "projectId": "d25e6650-1e06-4ebb-8988-0085861affbf"
      }
    },
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#000000"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.osonish",
      "buildNumber": "1",
      "infoPlist": {
        "UIBackgroundModes": ["background-fetch", "remote-notification"]
      }
    },
    "android": {
      "package": "com.yourcompany.osonish",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "WAKE_LOCK",
        "com.google.android.c2dm.permission.RECEIVE"
      ],
      "useNextNotificationsApi": true,
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "defaultChannel": "default"
        }
      ]
    ]
  }
}
```

#### 2.2 Обновление eas.json
```json
{
  "cli": {
    "version": ">= 16.17.4",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### Этап 3: Настройка сертификатов

#### 3.1 iOS (APNs)
```bash
# 1. Настройка iOS credentials
eas credentials:configure --platform=ios

# 2. При запросе выберите:
#    - Use existing Apple ID
#    - Upload existing Push Notification key (.p8 файл)
#    - Введите Key ID и Team ID

# 3. Проверка настроек
eas credentials:list --platform=ios
```

#### 3.2 Android (FCM)
```bash
# 1. Поместите google-services.json в корень проекта
cp ~/Downloads/google-services.json ./

# 2. Настройка Android credentials
eas credentials:configure --platform=android

# 3. При запросе выберите:
#    - Generate new Android Keystore
#    - Или загрузите существующий keystore

# 4. Проверка настроек
eas credentials:list --platform=android
```

### Этап 4: Тестирование

#### 4.1 Preview билды
```bash
# Создание тестовых билдов
eas build --platform all --profile preview

# После завершения билда:
# - iOS: Установите через TestFlight или распространение Ad Hoc
# - Android: Установите APK напрямую
```

#### 4.2 Чек-лист тестирования
- [ ] Приложение запускается без ошибок
- [ ] Push токен регистрируется при первом запуске
- [ ] Уведомления о новых заказах приходят исполнителям
- [ ] Уведомления о новых откликах приходят заказчикам
- [ ] Уведомления о выборе исполнителя работают
- [ ] Уведомления о завершении заказа работают
- [ ] Настройки уведомлений сохраняются
- [ ] Уведомления не приходят при отключенных настройках

### Этап 5: Продакшен

#### 5.1 Создание продакшен билдов
```bash
# iOS билд
eas build --platform ios --profile production

# Android билд
eas build --platform android --profile production

# Или оба сразу
eas build --platform all --profile production
```

#### 5.2 Публикация в магазины
```bash
# App Store
eas submit --platform ios --profile production

# Google Play
eas submit --platform android --profile production
```

## ⚠️ Важные моменты

### Лимиты Expo Push Service
- **Бесплатно**: 1,000 уведомлений/месяц
- **Pro Plan**: Неограниченно ($29/месяц)

### Альтернатива - Собственный Push Server
Если превышаете лимиты Expo, рассмотрите создание собственного push сервера:

```typescript
// Замените в notificationService.ts функцию sendPushNotification
private async sendPushNotification(
  token: string,
  title: string,
  body: string,
  data: any = {}
): Promise<void> {
  try {
    // Вместо Expo push service
    const response = await fetch('YOUR_CUSTOM_PUSH_SERVER/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SERVER_TOKEN'
      },
      body: JSON.stringify({
        token,
        title,
        body,
        data,
        platform: Platform.OS
      }),
    });

    if (!response.ok) {
      throw new Error(`Push notification failed: ${response.statusText}`);
    }

    console.log('[NotificationService] ✅ Push уведомление отправлено через собственный сервер');
  } catch (error) {
    console.error('[NotificationService] ❌ Ошибка отправки через собственный сервер:', error);
    throw error;
  }
}
```

## 📁 Необходимые файлы

Убедитесь, что у вас есть эти файлы перед публикацией:

### iOS
- [ ] APNs Key (.p8 файл)
- [ ] App Store Connect App ID
- [ ] Apple Team ID

### Android
- [ ] google-services.json
- [ ] google-service-account.json (для автоматизации)
- [ ] Android Keystore файл

## 🔍 Мониторинг в продакшене

### Analytics push уведомлений
Добавьте трекинг в `notificationService.ts`:

```typescript
// Добавьте в функцию logNotification
private async logNotification(
  userId: string,
  title: string,
  body: string,
  data: any,
  notificationType: PushNotificationData['notificationType']
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        title,
        body,
        data,
        notification_type: notificationType,
        status: 'sent',
        // Добавьте дополнительные поля для аналитики
        platform: Platform.OS,
        app_version: Constants.expoConfig?.version,
        sent_at: new Date().toISOString()
      });

    if (error) {
      console.error('[NotificationService] ❌ Ошибка логирования уведомления:', error);
    }
  } catch (error) {
    console.error('[NotificationService] ❌ Ошибка логирования уведомления:', error);
  }
}
```

## 📞 Поддержка

При возникновении проблем:

1. **Expo Documentation**: https://docs.expo.dev/push-notifications/
2. **EAS Build Docs**: https://docs.expo.dev/build/introduction/
3. **Firebase Console**: https://console.firebase.google.com
4. **Apple Developer**: https://developer.apple.com

## 📅 Чек-лист перед запуском

- [ ] Apple Developer Account активен
- [ ] Google Play Console настроен
- [ ] Firebase проект создан
- [ ] APNs ключи настроены
- [ ] FCM настроен
- [ ] google-services.json добавлен
- [ ] Bundle/Package identifiers совпадают
- [ ] Тестирование на реальных устройствах пройдено
- [ ] Все типы уведомлений протестированы
- [ ] Настройки уведомлений работают
- [ ] Мониторинг настроен

---

**Дата создания**: $(date)  
**Версия документа**: 1.0  
**Автор**: Development Team