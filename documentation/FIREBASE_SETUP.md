# 🔥 Настройка Firebase для Push-уведомлений

## Шаги настройки:

### 1. 🚀 Создание Firebase проекта

1. Перейти на [Firebase Console](https://console.firebase.google.com/)
2. Нажать "Add project" (Добавить проект)
3. Ввести название проекта: `osonish-mobile` 
4. Следовать инструкциям мастера

### 2. 📱 Добавление Android приложения

1. В Firebase Console выбрать свой проект
2. Нажать на иконку Android для добавления Android app
3. Ввести данные:
   - **Android package name**: `com.farakor.osonishmobile`
   - **App nickname**: `Osonish Mobile`
   - **Debug signing certificate SHA-1**: (опционально для development)

### 3. 📄 Скачивание google-services.json

1. Firebase сгенерирует файл `google-services.json`
2. **ВАЖНО**: Скачать этот файл
3. Положить файл в корень проекта: `osonish-mobile/google-services.json`

### 4. ⚙️ Настройка FCM credentials в EAS

Выполнить команды:

```bash
# 1. Загрузить google-services.json в EAS
npx eas credentials:configure --platform android

# 2. Выбрать: 
#    - "Google Service Account Key" -> "Manage your Google Service Account Key"
#    - "Set up Google Service Account Key" 

# 3. Пересобрать development build
npx eas build --platform android --profile development --clear-cache
```

### 5. 🔑 Server Key для Expo Push Service (опционально)

Если планируете отправлять push через Expo Push Service:

1. В Firebase Console: Project Settings → Cloud Messaging
2. Скопировать "Server key" 
3. Добавить в переменные окружения EAS или в код

## 📋 Чек-лист

- [ ] Создан Firebase проект
- [ ] Добавлено Android приложение с правильным package name
- [ ] Скачан google-services.json файл
- [ ] Файл помещен в корень проекта
- [ ] Настроены FCM credentials в EAS
- [ ] Пересобран development build

## 🚨 Важные замечания

- **Package name** должен точно совпадать: `com.farakor.osonishmobile`
- Файл `google-services.json` не должен коммититься в git (добавить в .gitignore)
- После настройки FCM нужно пересобрать build