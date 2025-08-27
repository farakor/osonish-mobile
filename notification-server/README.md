# 🖥️ Osonish Notification Server

Собственный сервер push уведомлений для приложения Osonish с поддержкой Firebase FCM (Android) и Apple APNs (iOS).

## 🎯 Возможности

- ✅ **Firebase FCM** для Android устройств
- ✅ **Apple APNs** для iOS устройств  
- ✅ **Пакетная отправка** до 100 уведомлений за раз
- ✅ **Аналитика** и мониторинг доставки
- ✅ **Retry механизм** для неудачных отправок
- ✅ **Rate limiting** защита от спама
- ✅ **Логирование** всех операций
- ✅ **REST API** для интеграции

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd notification-server
npm install
```

### 2. Настройка окружения

```bash
# Скопируйте пример конфигурации
cp env.example .env

# Отредактируйте .env файл
nano .env
```

### 3. Настройка Firebase (Android)

1. Получите `firebase-service-account.json` из Firebase Console
2. Поместите файл в папку `notification-server/`
3. Обновите путь в `.env`:
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

### 4. Настройка APNs (iOS)

1. Получите `.p8` ключ из Apple Developer Console
2. Поместите файл в папку `notification-server/`
3. Обновите настройки в `.env`:
   ```
   APNS_KEY_PATH=./AuthKey_XXXXXXXXXX.p8
   APNS_KEY_ID=XXXXXXXXXX
   APNS_TEAM_ID=XXXXXXXXXX
   ```

### 5. Запуск сервера

```bash
# Development режим
npm run dev

# Production режим
npm start
```

## 📡 API Endpoints

### Проверка здоровья
```http
GET /health
```

### Информация о сервере
```http
GET /info
```

### Отправка уведомления
```http
POST /send-notification
Authorization: Bearer your-api-token
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title": "Заголовок уведомления",
  "body": "Текст уведомления",
  "data": {
    "orderId": "123",
    "type": "new_order"
  },
  "platform": "android"
}
```

### Пакетная отправка
```http
POST /send-batch
Authorization: Bearer your-api-token
Content-Type: application/json

{
  "notifications": [
    {
      "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      "title": "Уведомление 1",
      "body": "Текст 1",
      "platform": "android"
    },
    {
      "token": "ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]",
      "title": "Уведомление 2", 
      "body": "Текст 2",
      "platform": "ios"
    }
  ]
}
```

### Тестовое уведомление
```http
POST /test-notification
Authorization: Bearer your-api-token
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "android"
}
```

### Аналитика
```http
GET /analytics?from=2024-01-01&to=2024-01-31&platform=android
Authorization: Bearer your-api-token
```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт сервера | `3000` |
| `NODE_ENV` | Окружение | `development` |
| `API_TOKEN` | Токен для авторизации | - |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Путь к Firebase service account | - |
| `APNS_KEY_PATH` | Путь к APNs ключу | - |
| `APNS_KEY_ID` | ID APNs ключа | - |
| `APNS_TEAM_ID` | Team ID Apple Developer | - |
| `APNS_BUNDLE_ID` | Bundle ID приложения | `com.farakor.osonishmobile` |

### Лимиты

- **Максимальный размер пакета**: 100 уведомлений
- **Rate limit**: 1000 запросов в минуту
- **Максимальные попытки retry**: 3
- **Задержка retry**: 1000ms

## 📊 Мониторинг

### Логи

Логи сохраняются в папке `logs/`:
- `error.log` - только ошибки
- `combined.log` - все события

### Аналитика

Сервер собирает аналитику по:
- Количеству отправленных уведомлений
- Успешности доставки
- Ошибкам отправки
- Статистике по платформам
- Времени отправки

## 🐳 Docker

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Запуск с Docker
```bash
# Сборка образа
docker build -t osonish-notification-server .

# Запуск контейнера
docker run -d \
  --name osonish-notifications \
  -p 3000:3000 \
  -v $(pwd)/.env:/app/.env \
  -v $(pwd)/firebase-service-account.json:/app/firebase-service-account.json \
  -v $(pwd)/AuthKey_XXXXXXXXXX.p8:/app/AuthKey_XXXXXXXXXX.p8 \
  osonish-notification-server
```

## 🚀 Деплой

### Railway
```bash
# Установка Railway CLI
npm install -g @railway/cli

# Логин
railway login

# Деплой
railway up
```

### Render
1. Подключите GitHub репозиторий
2. Выберите `notification-server` как root directory
3. Настройте переменные окружения
4. Деплой автоматически

### DigitalOcean App Platform
1. Создайте новое приложение
2. Подключите GitHub репозиторий
3. Настройте build и run команды:
   - Build: `cd notification-server && npm ci`
   - Run: `cd notification-server && npm start`

## 🔐 Безопасность

### Рекомендации

1. **Используйте сложный API токен** в production
2. **Настройте HTTPS** для production
3. **Ограничьте доступ** по IP адресам
4. **Регулярно обновляйте** зависимости
5. **Мониторьте логи** на подозрительную активность

### Rate Limiting

Сервер автоматически ограничивает:
- 1000 запросов в минуту с одного IP
- Максимум 100 уведомлений в пакете
- Максимум 3 попытки retry

## 🧪 Тестирование

### Запуск тестов
```bash
npm test
```

### Тестирование API
```bash
# Проверка здоровья
curl http://localhost:3000/health

# Тестовое уведомление
curl -X POST http://localhost:3000/test-notification \
  -H "Authorization: Bearer your-api-token" \
  -H "Content-Type: application/json" \
  -d '{"token":"ExponentPushToken[xxx]","platform":"android"}'
```

## 📚 Интеграция с Osonish App

### Обновление notificationService.ts

```typescript
// Настройка для использования собственного сервера
await productionNotificationService.updateConfig({
  useCustomServer: true,
  customServerUrl: 'https://your-server.com',
  customServerToken: 'your-api-token'
});
```

## 🆘 Поддержка

### Частые проблемы

**Q: Уведомления не доставляются на Android**
A: Проверьте настройки Firebase и правильность `google-services.json`

**Q: Уведомления не доставляются на iOS**
A: Проверьте APNs ключи и Bundle ID

**Q: Ошибка "Invalid token"**
A: Убедитесь что используете правильный API токен в заголовке Authorization

### Логи и диагностика

```bash
# Просмотр логов
tail -f logs/combined.log

# Проверка ошибок
tail -f logs/error.log

# Диагностика
curl http://localhost:3000/info
```

## 📄 Лицензия

MIT License - см. файл LICENSE

---

**Разработано командой Osonish** 🚀
