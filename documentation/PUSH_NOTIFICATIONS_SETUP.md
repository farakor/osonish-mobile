# 📱 Настройка Push-уведомлений через Expo Push Service

## 🎯 Текущая рабочая конфигурация

**Статус**: ✅ **РАБОТАЕТ КОРРЕКТНО** (протестировано 2024)

**Принцип работы**: Единая система через Expo Push Service для всех сред (Expo Go, Production iOS/Android)

---

## 🏗️ Архитектура системы

### 1. **Регистрация токена**
```
Приложение запускается → notificationService.init() → 
Получение Expo Push Token с EAS projectId → 
Сохранение в БД после авторизации пользователя
```

### 2. **Отправка уведомлений**
```
Создание заказа → orderService → notificationService.sendNotificationToUser() → 
productionNotificationService → Expo Push API → FCM/APNs
```

---

## 🔧 Ключевые файлы и настройки

### 📄 `app.json` - Основная конфигурация
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "d25e6650-1e06-4ebb-8988-0085861affbf"
      }
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

**⚠️ КРИТИЧНО**: `projectId` должен соответствовать EAS проекту!

### 📄 `eas.json` - Build конфигурация
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "aab"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

---

## 🔑 Основные сервисы

### 1. `notificationService.ts` - Главный сервис
**Ответственность**:
- Инициализация и регистрация токенов
- Создание Android notification channel
- Интерфейс для отправки уведомлений

**Ключевые методы**:
```typescript
async init(): Promise<void>                    // Инициализация при запуске
async registerForPushNotifications()          // Регистрация токена
async registerPushTokenAfterAuth()            // Повторная регистрация после авторизации
async sendNotificationToUser()                // Отправка уведомления пользователю
```

**⚠️ ВАЖНО**: Токен регистрируется при запуске, но сохраняется в БД только после авторизации!

### 2. `productionNotificationService.ts` - Отправка уведомлений
**Ответственность**:
- Определение среды выполнения
- Отправка через Expo Push API
- Логирование и диагностика

**Ключевой принцип**: 
```typescript
// ✅ ВСЕГДА используем Expo Push Service
private async sendViaExpoAPI(message: ProductionPushMessage): Promise<boolean>
```

### 3. `authService.ts` - Интеграция с авторизацией
**Критичные точки**:
- После успешной верификации SMS
- После регистрации нового пользователя  
- При восстановлении сессии

```typescript
// ✅ В каждой точке авторизации:
const { notificationService } = await import('./notificationService');
await notificationService.registerPushTokenAfterAuth();
```

---

## 🎯 Логика работы по средам

### 🧪 **Expo Go (Development)**
```
Среда: { appOwnership: "expo", isDev: true }
Токен: ExponentPushToken[...]
Отправка: Expo Push Service → Expo Go приложение
Результат: ✅ Уведомления приходят в Expo Go
```

### 📱 **Production (iOS/Android)**
```
Среда: { appOwnership: "standalone", isDev: false }
Токен: ExponentPushToken[...] (тот же формат!)
Отправка: Expo Push Service → APNs/FCM → Нативное приложение
Результат: ✅ Уведомления приходят в production приложение
```

**🔥 КЛЮЧЕВОЙ МОМЕНТ**: Expo Push Service автоматически маршрутизирует уведомления в правильную среду!

---

## 🚨 Что НЕЛЬЗЯ менять

### ❌ **Запрещённые изменения**:

1. **НЕ добавлять прямую работу с FCM/APNs**:
   ```typescript
   // ❌ НЕПРАВИЛЬНО
   import { getFCMToken } from './firebase';
   const fcmToken = await getFCMToken();
   ```

2. **НЕ менять логику получения токена**:
   ```typescript
   // ❌ НЕПРАВИЛЬНО
   const token = await Notifications.getDevicePushTokenAsync();
   
   // ✅ ПРАВИЛЬНО
   const token = await Notifications.getExpoPushTokenAsync({ projectId });
   ```

3. **НЕ менять URL отправки**:
   ```typescript
   // ❌ НЕПРАВИЛЬНО
   fetch('https://fcm.googleapis.com/fcm/send', ...)
   
   // ✅ ПРАВИЛЬНО  
   fetch('https://exp.host/--/api/v2/push/send', ...)
   ```

4. **НЕ убирать повторную регистрацию после авторизации**:
   ```typescript
   // ✅ ОБЯЗАТЕЛЬНО в authService.ts
   await notificationService.registerPushTokenAfterAuth();
   ```

---

## 🔍 Диагностика и отладка

### Команды для тестирования:
```javascript
// В консоли разработчика
notificationService.diagnosePushNotifications()  // Полная диагностика
notificationService.testPushNotification()       // Тест отправки
```

### Ожидаемые логи при работе:
```
[NotificationService] 🔍 Поиск EAS projectId...
[NotificationService] 📋 ProjectId найден: d25e6650-1e06-4ebb-8988-0085861affbf
[NotificationService] ✅ Expo push token получен: ExponentPushToken[...]
[NotificationService] 🏗️ Среда выполнения: {"isProduction": false, "platform": "ios"}
[ProductionNotificationService] 🚀 Отправка через Expo Push Service
[ProductionNotificationService] 📡 Ответ Expo API: {"data": {"status": "ok"}}
```

### Проблемы и решения:

**🔴 "Пользователь не авторизован, токен не сохранен"**
- ✅ Решение: Токен сохранится автоматически после авторизации

**🔴 "ProjectId не настроен"**
- ✅ Проверить `app.json` → `expo.extra.eas.projectId`

**🔴 "Уведомления не приходят в production"**
- ✅ Проверить credentials в EAS: `eas credentials`
- ✅ Убедиться что сборка production: `eas build --platform all`

---

## 📋 Чек-лист перед изменениями

Перед любыми изменениями в системе уведомлений:

- [ ] ✅ Система работает в текущем виде
- [ ] 📖 Прочитана данная документация  
- [ ] 🧪 Протестирована отправка в Expo Go
- [ ] 📱 Протестирована отправка в production (если есть доступ)
- [ ] 📝 Сохранены логи "до" изменений
- [ ] 🔄 После изменений - полное тестирование

---

## 🎯 Контакты и поддержка

**Последнее обновление**: 2024  
**Протестировано на**: iOS (Expo Go), Android (Expo Go)  
**Статус production**: ✅ Готово к использованию

**При проблемах**:
1. Проверить логи в консоли разработчика
2. Выполнить `notificationService.diagnosePushNotifications()`
3. Сравнить с ожидаемыми логами в этой документации
4. Убедиться что не нарушены запрещённые изменения

---

## 🔗 Связанные файлы

- `src/services/notificationService.ts` - Основной сервис
- `src/services/productionNotificationService.ts` - Отправка уведомлений  
- `src/services/authService.ts` - Интеграция с авторизацией
- `src/services/orderService.ts` - Отправка уведомлений о заказах
- `app.json` - Конфигурация Expo
- `eas.json` - Конфигурация сборки

**🎉 Система настроена и работает стабильно!**
