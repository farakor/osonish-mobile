# Osonish Mobile

🇺🇿 **Osonish** — React Native marketplace приложение для поиска работы в Узбекистане. Приложение соединяет заказчиков (публикующих вакансии) с исполнителями (соискателями работы).

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

## 📁 Структура проекта
```
osonish-2/
└── osonish-mobile/
    ├── src/
    │   ├── screens/
    │   │   ├── auth/         # Экраны аутентификации
    │   │   │   ├── AuthScreen.tsx
    │   │   │   ├── RegistrationScreen.tsx
    │   │   │   ├── SmsVerificationScreen.tsx
    │   │   │   ├── RoleSelectionScreen.tsx
    │   │   │   └── index.ts
    │   ├── constants/       # Дизайн-система
    │   ├── navigation/      # Навигация
    │   └── types/           # Типы
    ├── App.tsx
    ├── package.json
    └── README.md
```

## 📱 Реализованные экраны
- **SplashScreen** — Экран загрузки с брендингом
- **AuthScreen** — Приветствие, кнопки регистрации и входа
- **RegistrationScreen** — Ввод и валидация номера телефона
- **SmsVerificationScreen** — Ввод 6-значного кода, авто-переход
- **RoleSelectionScreen** — Выбор роли (Покупатель/Исполнитель)

## 🔄 Поток навигации
```
SplashScreen → AuthScreen → RegistrationScreen → SmsVerificationScreen → RoleSelectionScreen
```

## 🧪 Тестирование аутентификации
1. Запустите приложение через Expo (`npm start -- --tunnel`)
2. Пройдите экраны:
   - SplashScreen (автопереход)
   - AuthScreen → "Зарегистрироваться"
   - RegistrationScreen → введите номер телефона
   - SmsVerificationScreen → **введите тестовый код**

### Тестовый SMS-код
**Используйте код:** `123456`
- Введите по одной цифре в каждое поле
- После ввода всех 6 цифр произойдет автоматическая проверка и переход к выбору роли
- При неправильном коде появится ошибка

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
   npm start -- --tunnel
   ```
4. **Сканируйте QR-код** в Expo Go (Android) или Camera app (iOS)

## 📋 Следующие этапы
- [ ] Экраны для Покупателя
- [ ] Экраны для Исполнителя
- [ ] Управление вакансиями
- [ ] Профиль пользователя
- [ ] Чат/Сообщения

## 👨‍💻 Автор
Разработано для рынка труда Узбекистана

## 📄 Лицензия
Этот проект создан для образовательных и коммерческих целей. 