# Быстрый старт: Интеграция Eskiz.uz SMS

## 🚀 Быстрая настройка за 5 минут

### 1. Получите учетные данные Eskiz.uz
1. Зарегистрируйтесь на [my.eskiz.uz](https://my.eskiz.uz/)
2. Заключите договор (только для юр. лиц Узбекистана)
3. Получите email и пароль в разделе "СМС" → "СМС шлюз"

### 2. Настройте переменные окружения
Создайте файл `.env`:
```env
ESKIZ_EMAIL=your_email@example.com
ESKIZ_PASSWORD=your_password
SMS_SENDER_NAME=OsonIsh
```

### 3. Инициализируйте сервисы
В `App.tsx`:
```typescript
import { initializeSMSServices } from './src/services/smsServiceInitializer';

useEffect(() => {
  initializeSMSServices().then(result => {
    if (result.success) {
      console.log('✅ SMS сервис готов');
    } else {
      console.error('❌ Ошибка SMS:', result.error);
    }
  });
}, []);
```

### 4. Используйте в компонентах
```typescript
import { supabaseAuthService } from './src/services/supabaseAuthService';

// Отправка SMS
const sendCode = async (phone: string) => {
  const result = await supabaseAuthService.signInWithPhone({ phone });
  if (result.success) {
    console.log('SMS отправлен');
  }
};

// Верификация
const verifyCode = async (phone: string, code: string) => {
  const result = await supabaseAuthService.verifyOtp({ phone, token: code });
  if (result.success) {
    console.log('Пользователь авторизован:', result.user);
  }
};
```

## 🧪 Тестирование

### Быстрая проверка:
```typescript
import { checkSMSHealth } from './src/utils/smsTestUtils';

const health = await checkSMSHealth();
console.log('Статус SMS:', health.healthy ? '✅' : '❌');
```

### Полное тестирование:
```typescript
import { runSMSTests } from './src/utils/smsTestUtils';

await runSMSTests('+998901234567');
```

## 🔧 Режимы работы

### Разработка (`__DEV__ = true`)
- SMS коды выводятся в консоль
- Реальные SMS не отправляются
- Доступны все тестовые функции

### Продакшн
- Реальная отправка SMS через Eskiz.uz
- Проверка баланса и аутентификации
- Логирование ошибок

## 📱 Поддерживаемые форматы номеров

- `+998901234567` ✅
- `998901234567` ✅
- `8901234567` ✅ (автоматически → 998901234567)
- `901234567` ✅ (автоматически → 998901234567)

## ⚠️ Важные моменты

1. **Баланс**: Регулярно проверяйте баланс аккаунта
2. **Лимиты**: Eskiz имеет дневные/месячные лимиты
3. **Имя отправителя**: Должно быть одобрено в Eskiz
4. **Договор**: Требуется для юридических лиц Узбекистана

## 🆘 Решение проблем

| Проблема | Решение |
|----------|---------|
| Ошибка аутентификации | Проверьте email/пароль в `.env` |
| SMS не доставляются | Проверьте баланс и формат номера |
| Превышение лимитов | Настройте rate limiting |
| Ошибки Supabase | Проверьте URL и ключи |

## 📚 Полная документация

Подробная документация: [ESKIZ_SMS_INTEGRATION.md](./documentation/ESKIZ_SMS_INTEGRATION.md)

## 🔄 Переключение с Twilio

Измените в `src/config/smsConfig.ts`:
```typescript
provider: 'eskiz' // вместо 'twilio'
```

Добавьте учетные данные Eskiz в `.env` и протестируйте.
