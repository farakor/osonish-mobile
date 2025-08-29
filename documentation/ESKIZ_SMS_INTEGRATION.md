# Интеграция SMS авторизации через Eskiz.uz и Supabase

## Обзор

Данная документация описывает интеграцию SMS авторизации в мобильном приложении Oson Ish с использованием:
- **Eskiz.uz** - узбекский SMS-шлюз для отправки SMS
- **Supabase** - для управления пользователями и сессиями
- **Twilio** - альтернативный SMS провайдер (опционально)

## Архитектура

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Мобильное     │    │   SMS Сервисы    │    │    Supabase     │
│   приложение    │    │                  │    │                 │
│                 │    │  ┌─────────────┐ │    │  ┌────────────┐ │
│  ┌────────────┐ │    │  │   Eskiz.uz  │ │    │  │    Auth    │ │
│  │AuthService │◄┼────┼──┤             │ │    │  │            │ │
│  └────────────┘ │    │  └─────────────┘ │    │  └────────────┘ │
│                 │    │                  │    │                 │
│  ┌────────────┐ │    │  ┌─────────────┐ │    │  ┌────────────┐ │
│  │SMS Utils   │ │    │  │   Twilio    │ │    │  │ Database   │ │
│  └────────────┘ │    │  │ (fallback)  │ │    │  │            │ │
└─────────────────┘    │  └─────────────┘ │    │  └────────────┘ │
                       └──────────────────┘    └─────────────────┘
```

## Компоненты системы

### 1. EskizSMSService
Основной сервис для работы с Eskiz.uz API:
- Аутентификация в Eskiz API
- Отправка SMS сообщений
- Управление кодами верификации
- Проверка баланса аккаунта

### 2. SupabaseAuthService
Интеграция с Supabase для управления пользователями:
- Создание/получение пользователей по номеру телефона
- Управление Auth сессиями
- Синхронизация с SMS верификацией

### 3. SMS Error Handler
Централизованная обработка ошибок с локализацией:
- Обработка ошибок Eskiz и Twilio
- Локализация на русский, узбекский и английский
- Рекомендации по устранению ошибок

### 4. SMS Test Utils
Утилиты для тестирования SMS функциональности:
- Проверка конфигурации
- Тестирование отправки SMS
- Проверка интеграции с Supabase

## Настройка

### 1. Регистрация в Eskiz.uz

1. Зарегистрируйтесь на [my.eskiz.uz](https://my.eskiz.uz/)
2. Заключите договор (только для юридических лиц-резидентов Узбекистана)
3. Получите учетные данные в разделе "СМС" → "СМС шлюз"

### 2. Конфигурация переменных окружения

Создайте файл `.env` в корне проекта:

```env
# Eskiz.uz Configuration
ESKIZ_EMAIL=your_eskiz_email@example.com
ESKIZ_PASSWORD=your_eskiz_password
ESKIZ_BASE_URL=https://notify.eskiz.uz/api

# Twilio Configuration (опционально)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890

# SMS Settings
SMS_SENDER_NAME=OsonIsh

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Инициализация сервисов

В главном файле приложения (`App.tsx`):

```typescript
import { initializeSMSServices } from './src/services/smsServiceInitializer';

export default function App() {
  useEffect(() => {
    const initServices = async () => {
      const result = await initializeSMSServices();
      if (!result.success) {
        console.error('Ошибка инициализации SMS:', result.error);
      }
    };
    
    initServices();
  }, []);

  // ... остальной код приложения
}
```

## Использование

### 1. Отправка SMS кода

```typescript
import { supabaseAuthService } from './src/services/supabaseAuthService';

// Отправка SMS кода
const sendCode = async (phone: string) => {
  const result = await supabaseAuthService.signInWithPhone({ phone });
  
  if (result.success) {
    console.log('SMS код отправлен');
  } else {
    console.error('Ошибка:', result.error);
  }
};
```

### 2. Верификация кода

```typescript
// Верификация SMS кода
const verifyCode = async (phone: string, code: string) => {
  const result = await supabaseAuthService.verifyOtp({
    phone,
    token: code
  });
  
  if (result.success && result.user) {
    console.log('Пользователь авторизован:', result.user);
    // Переход в приложение
  } else {
    console.error('Ошибка верификации:', result.error);
  }
};
```

### 3. Обработка ошибок

```typescript
import { handleSMSError, setSMSErrorLanguage } from './src/utils/smsErrorHandler';

// Установка языка для ошибок
setSMSErrorLanguage('ru'); // 'ru', 'uz', 'en'

// Обработка ошибки
const handleError = (error: any) => {
  const smsError = handleSMSError(error, 'SMS Verification');
  
  Alert.alert('Ошибка', smsError.message);
  
  if (smsError.isRetryable) {
    // Показать кнопку "Повторить"
  }
};
```

## Тестирование

### 1. Быстрая проверка

```typescript
import { checkSMSHealth } from './src/utils/smsTestUtils';

const checkHealth = async () => {
  const health = await checkSMSHealth();
  
  if (health.healthy) {
    console.log('SMS сервис работает корректно');
  } else {
    console.log('Проблемы:', health.issues);
  }
};
```

### 2. Полное тестирование

```typescript
import { runSMSTests } from './src/utils/smsTestUtils';

const runTests = async () => {
  const results = await runSMSTests('+998901234567');
  
  console.log('Результаты тестов:', results);
};
```

### 3. Тестирование в режиме разработки

В режиме разработки (`__DEV__ = true`):
- SMS коды выводятся в консоль
- Не происходит реальная отправка SMS
- Доступны все тестовые функции

## API Eskiz.uz

### Основные endpoints:

1. **Аутентификация**
   ```
   POST https://notify.eskiz.uz/api/auth/login
   ```

2. **Отправка SMS**
   ```
   POST https://notify.eskiz.uz/api/message/sms/send
   ```

3. **Проверка баланса**
   ```
   GET https://notify.eskiz.uz/api/user/get-limit
   ```

4. **Информация о пользователе**
   ```
   GET https://notify.eskiz.uz/api/auth/user
   ```

### Формат номеров телефонов

Eskiz.uz принимает номера в формате:
- `998901234567` (без знака +)
- Автоматическое форматирование из `+998901234567`
- Поддержка формата `8901234567` → `998901234567`

## Безопасность

### Защитные меры:
- Коды действительны 10 минут
- Максимум 3 попытки ввода кода
- Защита от спама (1 минута между отправками)
- Автоматическая очистка истекших кодов
- Безопасное хранение токенов доступа

### Рекомендации:
- Используйте HTTPS для всех запросов
- Регулярно ротируйте API ключи
- Мониторьте подозрительную активность
- Настройте rate limiting на сервере

## Мониторинг и логирование

### Логи системы:
```
[EskizSMS] 🔐 Аутентификация в Eskiz API...
[EskizSMS] ✅ Успешная аутентификация
[EskizSMS] 📤 Отправка SMS на номер: 998901234567
[EskizSMS] ✅ SMS успешно отправлено, ID: 12345
[EskizSMS] 💰 Баланс аккаунта: 1000
```

### Мониторинг баланса:
```typescript
import { eskizSMSService } from './src/services/eskizSMSService';

const checkBalance = async () => {
  const result = await eskizSMSService.getBalance();
  
  if (result.success && result.balance < 100) {
    // Уведомление о низком балансе
    console.warn('Низкий баланс SMS:', result.balance);
  }
};
```

## Troubleshooting

### Частые проблемы:

1. **Ошибка аутентификации**
   - Проверьте email и пароль в конфигурации
   - Убедитесь, что аккаунт активен

2. **SMS не доставляются**
   - Проверьте баланс аккаунта
   - Убедитесь, что номер в правильном формате
   - Проверьте статус имени отправителя

3. **Превышение лимитов**
   - Проверьте дневные/месячные лимиты
   - Настройте rate limiting в приложении

4. **Проблемы с Supabase**
   - Проверьте URL и ключи Supabase
   - Убедитесь, что RLS политики настроены

### Диагностика:

```typescript
import { smsTestUtils } from './src/utils/smsTestUtils';

// Запуск диагностики
const diagnose = async () => {
  const results = await smsTestUtils.runFullTestSuite();
  
  // Анализ результатов
  if (!results.configurationTest.success) {
    console.log('Проблема с конфигурацией');
  }
  
  if (!results.authenticationTest.success) {
    console.log('Проблема с аутентификацией');
  }
};
```

## Миграция с Twilio

Если вы переходите с Twilio на Eskiz:

1. Обновите конфигурацию SMS провайдера:
   ```typescript
   // В src/config/smsConfig.ts
   provider: 'eskiz' // вместо 'twilio'
   ```

2. Добавьте учетные данные Eskiz в переменные окружения

3. Протестируйте интеграцию:
   ```typescript
   await runSMSTests();
   ```

4. Постепенно переключайте трафик

## Поддержка

Для получения поддержки:
- Документация Eskiz.uz: [documenter.getpostman.com](https://documenter.getpostman.com/view/663428/RzfmES4z?version=latest)
- Техническая поддержка Eskiz: support@eskiz.uz
- Документация Supabase: [supabase.com/docs](https://supabase.com/docs)

## Changelog

### v1.0.0 (2024-01-XX)
- Первоначальная интеграция с Eskiz.uz
- Поддержка Supabase Auth
- Система обработки ошибок
- Утилиты тестирования
- Локализация на 3 языка
