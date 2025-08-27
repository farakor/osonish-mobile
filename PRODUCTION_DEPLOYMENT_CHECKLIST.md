# ✅ Чек-лист Production Deployment для Osonish

## 🎯 Обзор

Этот чек-лист поможет вам пошагово подготовить и развернуть приложение Osonish в production с полноценной системой push уведомлений.

---

## 📋 ЭТАП 1: Подготовка учетных записей

### Apple Developer Account (для iOS)
- [ ] Приобретен Apple Developer Account ($99/год)
- [ ] Создан App ID с Bundle Identifier: `com.farakor.osonishmobile`
- [ ] Включена Push Notifications capability
- [ ] Создан APNs Key (.p8 файл)
- [ ] Записаны Key ID и Team ID

### Google Play Console (для Android)
- [ ] Приобретен Google Play Developer Account ($25 единоразово)
- [ ] Создано приложение с package name: `com.farakor.osonishmobile`

### Firebase (для Android Push)
- [ ] Создан Firebase проект
- [ ] Добавлено Android приложение с правильным package name
- [ ] Скачан `google-services.json`
- [ ] Файл помещен в `osonish-mobile/google-services.json`

---

## 🔧 ЭТАП 2: Настройка конфигурации

### Обновление app.json
- [ ] Проверено название приложения: "Osonish"
- [ ] Установлена версия: "1.0.0"
- [ ] Настроен `bundleIdentifier`: "com.farakor.osonishmobile"
- [ ] Настроен `package`: "com.farakor.osonishmobile"
- [ ] Добавлен `googleServicesFile`: "./google-services.json"
- [ ] Настроены разрешения для уведомлений

### Обновление eas.json
- [ ] Обновлена версия CLI: ">= 16.17.4"
- [ ] Настроены профили build (development, preview, production)
- [ ] Настроены профили submit для магазинов
- [ ] Добавлен `autoIncrement` для production

---

## 🔑 ЭТАП 3: Настройка EAS Credentials

### Установка и авторизация
```bash
# Установка EAS CLI (если не установлен)
npm install -g @expo/eas-cli

# Авторизация
npx eas login
```

### Android Credentials
```bash
# Настройка Android credentials
npx eas credentials:configure --platform android

# При запросе выберите:
# - Generate new Android Keystore (для нового проекта)
# - Или загрузите существующий keystore
```

### iOS Credentials
```bash
# Настройка iOS credentials
npx eas credentials:configure --platform ios

# При запросе:
# - Используйте существующий Apple ID
# - Загрузите APNs Key (.p8 файл)
# - Введите Key ID и Team ID
```

### Проверка credentials
```bash
# Проверка Android
npx eas credentials:list --platform android

# Проверка iOS
npx eas credentials:list --platform ios
```

---

## 🧪 ЭТАП 4: Тестирование

### Автоматическое тестирование
```bash
# Запуск комплексного теста
cd osonish-mobile
node test-production-notifications.js
```

### Ручная проверка конфигурации
```bash
# Проверка Firebase настройки
node setup-firebase.js
```

### Создание preview билдов
```bash
# Android preview
npx eas build --platform android --profile preview

# iOS preview (требует Apple Developer Account)
npx eas build --platform ios --profile preview

# Оба сразу
npx eas build --platform all --profile preview
```

---

## 🖥️ ЭТАП 5: Собственный сервер уведомлений (опционально)

### Настройка сервера
```bash
# Переход в папку сервера
cd osonish-mobile/notification-server

# Установка зависимостей
npm install

# Копирование конфигурации
cp env.example .env

# Редактирование конфигурации
nano .env
```

### Настройка Firebase для сервера
- [ ] Создан Service Account в Firebase Console
- [ ] Скачан `firebase-service-account.json`
- [ ] Файл помещен в `notification-server/`
- [ ] Обновлен путь в `.env`

### Настройка APNs для сервера
- [ ] Скопирован `.p8` файл в `notification-server/`
- [ ] Обновлены настройки APNs в `.env`

### Запуск и тестирование сервера
```bash
# Запуск в development режиме
npm run dev

# Тестирование
curl http://localhost:3000/health
```

---

## 🚀 ЭТАП 6: Production Deployment

### Создание production билдов
```bash
# Android production билд
npx eas build --platform android --profile production

# iOS production билд
npx eas build --platform ios --profile production

# Оба сразу
npx eas build --platform all --profile production
```

### Публикация в магазины

#### Google Play Store
```bash
# Автоматическая публикация
npx eas submit --platform android --profile production

# Или загрузите .aab файл вручную в Google Play Console
```

#### Apple App Store
```bash
# Автоматическая публикация
npx eas submit --platform ios --profile production

# Или загрузите .ipa файл через App Store Connect
```

---

## 📊 ЭТАП 7: Мониторинг и аналитика

### Настройка мониторинга
- [ ] Настроен мониторинг доставки уведомлений
- [ ] Настроена аналитика в admin панели
- [ ] Настроены алерты на критические ошибки

### Проверка после публикации
- [ ] Приложение успешно установлено из магазинов
- [ ] Push токены регистрируются корректно
- [ ] Уведомления доставляются на реальные устройства
- [ ] Все типы уведомлений работают
- [ ] Настройки уведомлений сохраняются

---

## 🔍 Диагностика проблем

### Частые проблемы и решения

**Проблема**: Уведомления не доставляются на Android
**Решение**: 
- Проверьте `google-services.json`
- Убедитесь что package name совпадает
- Проверьте настройки FCM в Firebase Console

**Проблема**: Уведомления не доставляются на iOS
**Решение**:
- Проверьте APNs ключи и сертификаты
- Убедитесь что Bundle ID совпадает
- Проверьте что Push Notifications включены в App ID

**Проблема**: Ошибка при создании билда
**Решение**:
- Проверьте EAS credentials: `npx eas credentials:list`
- Обновите EAS CLI: `npm install -g @expo/eas-cli@latest`
- Очистите кэш: `npx eas build --clear-cache`

### Команды для диагностики
```bash
# Проверка статуса EAS
npx eas whoami

# Проверка конфигурации
npx eas config

# Просмотр логов билда
npx eas build:list

# Проверка credentials
npx eas credentials:list --platform all
```

---

## 📞 Поддержка и ресурсы

### Документация
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notifications](https://developer.apple.com/documentation/usernotifications)

### Полезные ссылки
- [Firebase Console](https://console.firebase.google.com/)
- [Apple Developer Console](https://developer.apple.com/)
- [Google Play Console](https://play.google.com/console/)
- [Expo Dashboard](https://expo.dev/)

---

## 📅 Временные рамки

**Общее время на deployment**: 1-2 дня

- **Настройка учетных записей**: 2-4 часа
- **Конфигурация и credentials**: 2-3 часа
- **Тестирование**: 2-4 часа
- **Production билды**: 1-2 часа
- **Публикация в магазины**: 1-2 часа
- **Проверка после публикации**: 1-2 часа

---

## ✅ Финальный чек-лист

Перед публикацией убедитесь что:

### Технические требования
- [ ] Все тесты пройдены успешно
- [ ] Preview билды протестированы на реальных устройствах
- [ ] Push уведомления работают корректно
- [ ] Приложение стабильно работает
- [ ] Нет критических багов

### Магазины приложений
- [ ] Подготовлены скриншоты для магазинов
- [ ] Написаны описания приложения
- [ ] Настроены метаданные (категория, ключевые слова)
- [ ] Подготовлена политика конфиденциальности
- [ ] Настроены возрастные ограничения

### Мониторинг
- [ ] Настроена аналитика
- [ ] Настроен мониторинг ошибок
- [ ] Настроены алерты
- [ ] Подготовлен план поддержки пользователей

---

**🎉 Поздравляем! Ваше приложение готово к production deployment!**

*Разработано командой Osonish* 🚀
