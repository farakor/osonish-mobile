# 🔔 Полная настройка Production Push Уведомлений для Osonish

## 📋 Обзор

Этот документ содержит пошаговое руководство по настройке полноценной системы push уведомлений для production deployment приложения Osonish.

## 🎯 Цели

1. Настроить Firebase Cloud Messaging (FCM) для Android
2. Настроить Apple Push Notification Service (APNs) для iOS  
3. Настроить EAS Build для production
4. Создать собственный сервер уведомлений (альтернатива Expo)
5. Протестировать систему в production окружении

## 📊 Текущее состояние

### ✅ Готово:
- Архитектура кода уведомлений
- EAS проект (ID: d25e6650-1e06-4ebb-8988-0085861affbf)
- Типы уведомлений: new_order, new_application, work_reminder, complete_work_reminder
- Локальное кэширование уведомлений
- Многоязычная поддержка (ru/uz)
- Настройки пользователей

### ⚠️ Требует настройки:
- Firebase проект и FCM
- Apple Developer Account и APNs
- Production credentials в EAS
- Собственный сервер уведомлений
- Production тестирование

---

## 🚀 ЭТАП 1: Настройка Firebase (Android)

### 1.1 Создание Firebase проекта

1. **Перейти на [Firebase Console](https://console.firebase.google.com/)**
2. **Нажать "Add project" (Добавить проект)**
3. **Ввести название проекта**: `osonish-production`
4. **Следовать инструкциям мастера**
   - Включить Google Analytics (рекомендуется)
   - Выбрать или создать Analytics account

### 1.2 Добавление Android приложения

1. **В Firebase Console выбрать проект `osonish-production`**
2. **Нажать на иконку Android** для добавления Android app
3. **Ввести данные приложения**:
   ```
   Android package name: com.farakor.osonishmobile
   App nickname: Osonish Mobile Production
   Debug signing certificate SHA-1: (оставить пустым для начала)
   ```
4. **Нажать "Register app"**

### 1.3 Скачивание google-services.json

1. **Firebase сгенерирует файл `google-services.json`**
2. **КРИТИЧЕСКИ ВАЖНО**: Скачать этот файл
3. **Поместить файл в корень проекта**: `osonish-mobile/google-services.json`

### 1.4 Настройка FCM в Firebase

1. **Перейти в Project Settings → Cloud Messaging**
2. **Скопировать Server key** (понадобится для собственного сервера)
3. **Скопировать Sender ID** 

---

## 🍎 ЭТАП 2: Настройка Apple Push Notifications (iOS)

### 2.1 Требования

- **Apple Developer Account** ($99/год)
- **Доступ к Apple Developer Console**

### 2.2 Создание App ID

1. **Войти в [Apple Developer Console](https://developer.apple.com/account/)**
2. **Перейти в Certificates, Identifiers & Profiles**
3. **Создать новый App ID**:
   ```
   Bundle ID: com.farakor.osonishmobile
   Description: Osonish Mobile Production
   ```
4. **Включить Push Notifications capability**

### 2.3 Создание APNs Key

1. **В Apple Developer Console перейти в Keys**
2. **Нажать "+" для создания нового ключа**
3. **Выбрать Apple Push Notifications service (APNs)**
4. **Ввести название**: `Osonish Production APNs Key`
5. **Скачать .p8 файл** (ВАЖНО: можно скачать только один раз!)
6. **Записать Key ID и Team ID**

---

## ⚙️ ЭТАП 3: Настройка EAS Build

### 3.1 Обновление app.json

Обновить конфигурацию для production:

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
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#000000"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.farakor.osonishmobile",
      "buildNumber": "1",
      "infoPlist": {
        "UIBackgroundModes": ["background-fetch", "remote-notification"]
      }
    },
    "android": {
      "package": "com.farakor.osonishmobile",
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

### 3.2 Обновление eas.json

```json
{
  "cli": {
    "version": ">= 16.17.4",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "aab"
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

### 3.3 Настройка credentials в EAS

```bash
# Настройка iOS credentials
npx eas credentials:configure --platform=ios

# При запросе выбрать:
# - Use existing Apple ID
# - Upload existing Push Notification key (.p8 файл)
# - Ввести Key ID и Team ID

# Настройка Android credentials  
npx eas credentials:configure --platform=android

# При запросе выбрать:
# - Upload existing Google Service Account Key (если есть)
# - Или Generate new Android Keystore
```

---

## 🖥️ ЭТАП 4: Собственный сервер уведомлений

### 4.1 Зачем нужен собственный сервер?

- **Лимиты Expo Push Service**: 1,000 уведомлений/месяц бесплатно
- **Больше контроля** над доставкой уведомлений
- **Аналитика** и мониторинг
- **Независимость** от внешних сервисов

### 4.2 Архитектура сервера

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Osonish App   │───▶│  Notification    │───▶│   FCM/APNs      │
│                 │    │     Server       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │    Database      │
                       │   (Analytics)    │
                       └──────────────────┘
```

### 4.3 Технологии для сервера

**Рекомендуемый стек**:
- **Backend**: Node.js + Express или Python + FastAPI
- **Database**: PostgreSQL (можно использовать тот же Supabase)
- **FCM SDK**: для Android уведомлений
- **APNs SDK**: для iOS уведомлений
- **Hosting**: Railway, Render, или DigitalOcean

---

## 🧪 ЭТАП 5: Тестирование

### 5.1 Preview билды

```bash
# Создание тестовых билдов
npx eas build --platform all --profile preview

# После завершения:
# - iOS: Установить через TestFlight
# - Android: Установить APK напрямую
```

### 5.2 Чек-лист тестирования

- [ ] Приложение запускается без ошибок
- [ ] Push токен регистрируется при первом запуске  
- [ ] Уведомления о новых заказах приходят исполнителям
- [ ] Уведомления о новых откликах приходят заказчикам
- [ ] Уведомления о выборе исполнителя работают
- [ ] Уведомления о завершении заказа работают
- [ ] Напоминания о работе приходят за день до работы
- [ ] Напоминания о завершении приходят через день после появления кнопки
- [ ] Настройки уведомлений сохраняются
- [ ] Уведомления не приходят при отключенных настройках
- [ ] Уведомления работают в фоновом режиме
- [ ] Уведомления работают при закрытом приложении

---

## 📈 ЭТАП 6: Production Deployment

### 6.1 Создание production билдов

```bash
# iOS билд
npx eas build --platform ios --profile production

# Android билд  
npx eas build --platform android --profile production

# Или оба сразу
npx eas build --platform all --profile production
```

### 6.2 Публикация в магазины

```bash
# App Store
npx eas submit --platform ios --profile production

# Google Play
npx eas submit --platform android --profile production
```

---

## 📊 Мониторинг и аналитика

### 6.1 Логирование уведомлений

Добавить в `notificationService.ts`:

```typescript
// Расширенная аналитика
private async logNotificationAnalytics(
  userId: string,
  notificationType: string,
  status: 'sent' | 'delivered' | 'opened' | 'failed',
  error?: string
): Promise<void> {
  try {
    await supabase
      .from('notification_analytics')
      .insert({
        user_id: userId,
        notification_type: notificationType,
        status,
        error,
        platform: Platform.OS,
        app_version: Constants.expoConfig?.version,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
}
```

### 6.2 Dashboard для мониторинга

Создать в admin панели:
- Статистика доставки уведомлений
- Количество активных push токенов
- Ошибки доставки
- Популярные типы уведомлений

---

## ⚠️ Важные моменты

### Безопасность
- **НЕ коммитить** `google-services.json` в git
- **НЕ коммитить** `.p8` файлы APNs ключей
- Использовать переменные окружения для секретных ключей

### Производительность
- Батчинг уведомлений (отправка группами)
- Retry механизм для неудачных отправок
- Кэширование токенов

### Соответствие требованиям
- GDPR compliance для европейских пользователей
- Возможность отписки от уведомлений
- Прозрачная политика конфиденциальности

---

## 📞 Поддержка и ресурсы

- **Expo Documentation**: https://docs.expo.dev/push-notifications/
- **Firebase Console**: https://console.firebase.google.com
- **Apple Developer**: https://developer.apple.com
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/

---

## 📅 Временные рамки

**Общее время**: 2-3 дня

1. **Firebase + APNs настройка**: 4-6 часов
2. **EAS credentials**: 2-3 часа  
3. **Собственный сервер**: 8-12 часов
4. **Тестирование**: 4-6 часов
5. **Production deployment**: 2-4 часа

---

**Дата создания**: $(date)  
**Версия документа**: 1.0  
**Автор**: Development Team
