# Osonish Mobile

🇺🇿 **Osonish** - это React Native marketplace приложение для поиска работы в Узбекистане. Приложение соединяет заказчиков (публикующих вакансии) с исполнителями (соискателями работы).

## 🚀 Технологии

- **React Native** с **Expo**
- **TypeScript** для типобезопасности
- **React Navigation** для навигации
- **Expo** для разработки и деплоя

## 🎨 Дизайн

- **Цветовая схема:** Зеленый (#679B00) и синий (#3500C6)
- **Типографика:** Inter font family
- **Система спейсинга:** 8px grid
- **Современный UI/UX** с тенями и скругленными углами

## 📱 Реализованные экраны

### ✅ Завершенные экраны

1. **SplashScreen** (`src/screens/shared/SplashScreen.tsx`)
   - Экран загрузки с брендингом
   - Автопереход на AuthScreen через 2 секунды

2. **AuthScreen** (`src/screens/auth/AuthScreen.tsx`)
   - Экран приветствия с логотипом и слоганом
   - Кнопки "Зарегистрироваться" и "Войти"
   - Условия использования

3. **RegistrationScreen** (`src/screens/auth/RegistrationScreen.tsx`)
   - Ввод номера телефона с форматированием для Узбекистана
   - Валидация номера (+998 XX XXX-XX-XX)
   - Умная кнопка "Продолжить" (активна только при корректном вводе)

4. **SmsVerificationScreen** (`src/screens/auth/SmsVerificationScreen.tsx`)
   - 6 полей для ввода SMS кода
   - Автопереход между полями
   - Автоверификация при заполнении всех полей
   - Таймер обратного отсчета для повторной отправки (60 сек)
   - Тестовый код: `123456`

### 🔄 Поток навигации

```
SplashScreen → AuthScreen → RegistrationScreen → SmsVerificationScreen → RoleSelection (следующий)
```

## 📁 Структура проекта

```
src/
├── constants/          # Константы дизайн-системы
│   ├── theme.ts       # Цвета, типографика, спейсинг
│   └── index.ts
├── navigation/         # Настройка навигации
│   ├── AppNavigator.tsx
│   └── index.ts
├── screens/           # Экраны приложения
│   ├── auth/         # Экраны аутентификации
│   │   ├── AuthScreen.tsx
│   │   ├── RegistrationScreen.tsx
│   │   ├── SmsVerificationScreen.tsx
│   │   └── index.ts
│   └── shared/       # Общие экраны
│       └── SplashScreen.tsx
└── types/            # TypeScript типы
    ├── navigation.ts # Типы для навигации
    └── index.ts
```

## 🛠 Установка и запуск

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/farakor/osonish-mobile.git
   cd osonish-mobile
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Запустите приложение:**
   ```bash
   npm start
   ```
   
   Или с туннелем для тестирования на реальном устройстве:
   ```bash
   npm start -- --tunnel
   ```

4. **Сканируйте QR код** в Expo Go (Android) или Camera app (iOS)

## 📋 Следующие этапы

- [ ] **RoleSelection Screen** - Выбор роли (Покупатель/Исполнитель)
- [ ] **Customer Screens** - Экраны для заказчиков
- [ ] **Worker Screens** - Экраны для исполнителей
- [ ] **Job Management** - Управление вакансиями
- [ ] **Profile Management** - Управление профилем
- [ ] **Chat/Messaging** - Система сообщений

## 🧪 Тестирование

- ✅ Все экраны протестированы через Expo tunnel
- ✅ Форматирование номера телефона работает корректно
- ✅ SMS верификация работает с тестовым кодом `123456`
- ✅ Навигация между экранами функционирует правильно
- ✅ TypeScript типизация настроена без ошибок

## 👨‍💻 Автор

Разработано для рынка труда Узбекистана

## 📄 Лицензия

Этот проект создан для образовательных и коммерческих целей. 