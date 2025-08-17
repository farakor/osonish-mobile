# Osonish Mobile - Мобильное приложение для заказа услуг

Мобильное приложение Osonish - это React Native приложение для платформы заказа услуг, которое соединяет заказчиков и исполнителей в Узбекистане.

## 🚀 Технологии

- **React Native** - кроссплатформенная разработка
- **TypeScript** - типизированный JavaScript
- **NativeWind** - Tailwind CSS для React Native
- **React Navigation** - навигация между экранами
- **Expo** - платформа для разработки
- **Supabase** - backend и база данных
- **Firebase** - push-уведомления

## 📱 Функциональность

### Для заказчиков
- ✅ Создание заказов с детальным описанием
- ✅ Загрузка медиафайлов (фото/видео)
- ✅ Просмотр активных заказов
- ✅ Выбор исполнителя из списка заявок
- ✅ Рейтинговая система
- ✅ Профиль пользователя
- ✅ Push-уведомления
- ✅ Геолокация и карты

### Для исполнителей
- ✅ Просмотр доступных заказов
- ✅ Подача заявок на заказы
- ✅ История заявок и выполненных работ
- ✅ Профиль исполнителя
- ✅ Уведомления о новых заказах
- ✅ Геолокация для поиска ближайших заказов

## 🛠 Установка и запуск

### Предварительные требования
- Node.js (версия 18 или выше)
- npm или yarn
- Expo CLI
- Android Studio (для Android) или Xcode (для iOS)

### Установка зависимостей
```bash
cd osonish-mobile
npm install
```

### Запуск в режиме разработки
```bash
# Запуск с Expo Go
npm start

# Запуск с dev client
npm run start:dev

# Запуск на Android
npm run android

# Запуск на iOS
npm run ios
```

## 📁 Структура проекта

```
src/
├── components/          # Переиспользуемые компоненты
│   ├── cards/          # Карточки заказов
│   └── common/         # Общие компоненты
├── screens/            # Экраны приложения
│   ├── auth/           # Экран авторизации
│   ├── customer/       # Экраны для заказчиков
│   ├── worker/         # Экраны для исполнителей
│   └── shared/         # Общие экраны
├── navigation/         # Навигация
├── services/           # API сервисы
├── hooks/              # React hooks
├── types/              # TypeScript типы
├── constants/          # Константы
└── utils/              # Утилиты
```

## 🔧 Конфигурация

### Переменные окружения
Создайте файл `.env` в корне проекта:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
```

### Настройка Firebase
1. Создайте проект в Firebase Console
2. Добавьте `google-services.json` для Android
3. Настройте push-уведомления

### Настройка Supabase
1. Создайте проект в Supabase
2. Настройте таблицы и RLS политики
3. Добавьте переменные окружения

## 📦 Сборка

### Android
```bash
eas build --platform android
```

### iOS
```bash
eas build --platform ios
```

## 🚀 Развертывание

### Expo Application Services (EAS)
```bash
# Установка EAS CLI
npm install -g @expo/eas-cli

# Вход в аккаунт Expo
eas login

# Настройка проекта
eas build:configure

# Сборка для продакшена
eas build --platform all
```

## 📱 Скриншоты

[Здесь будут добавлены скриншоты приложения]

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License.

## 📞 Поддержка

Если у вас есть вопросы или проблемы, создайте issue в репозитории.

## 🔄 Версии

- **v1.1.0** - Текущая версия
  - Улучшенный дизайн карточек заказов
  - Оптимизация производительности
  - Исправление багов

---

Разработано с ❤️ для сообщества Osonish