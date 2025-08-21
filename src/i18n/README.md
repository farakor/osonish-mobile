# Многоязычная поддержка (Internationalization)

Этот документ описывает систему многоязычной поддержки в приложении Osonish.

## Поддерживаемые языки

- **Русский** (`ru`) - основной язык
- **Узбекский** (`uz`) - латиница

## Структура файлов

```
src/i18n/
├── index.ts                 # Конфигурация i18next
├── locales/
│   ├── ru.json             # Переводы на русском
│   └── uz.json             # Переводы на узбекском
└── README.md               # Этот файл
```

## Использование переводов

### Базовое использование

```typescript
import { useTranslation } from '../../hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <Text>{t('common.continue')}</Text>
  );
}
```

### Использование категорийных хуков

```typescript
import { useAuthTranslation, useCommonTranslation } from '../../hooks/useTranslation';

function AuthScreen() {
  const t = useAuthTranslation();
  const tCommon = useCommonTranslation();
  
  return (
    <View>
      <Text>{t('welcome_title')}</Text>
      <Button title={tCommon('continue')} />
    </View>
  );
}
```

### Переводы с параметрами

```typescript
// В файле переводов
{
  "welcome_user": "Добро пожаловать, {{name}}!"
}

// В компоненте
<Text>{t('welcome_user', { name: 'Иван' })}</Text>
```

## Структура переводов

Переводы организованы по категориям:

- `common` - общие элементы (кнопки, действия)
- `auth` - авторизация и регистрация
- `profile` - профиль пользователя
- `orders` - заказы
- `jobs` - работы
- `notifications` - уведомления
- `support` - поддержка
- `categories` - категории услуг
- `errors` - сообщения об ошибках

## Управление языком

### Контекст языка

```typescript
import { useLanguage } from '../../contexts/LanguageContext';

function LanguageSettings() {
  const { currentLanguage, changeLanguage, isLanguageSelected } = useLanguage();
  
  const handleLanguageChange = async () => {
    await changeLanguage('uz');
  };
}
```

### Компонент переключения языка

```typescript
import { LanguageSwitcher } from '../../components/common';

function SettingsScreen() {
  return (
    <View>
      <LanguageSwitcher showLabel={true} />
    </View>
  );
}
```

## Переводы уведомлений

Для push-уведомлений используйте `TranslationService`:

```typescript
import { translationService } from '../../services/translationService';

// Получить перевод для конкретного языка
const notification = translationService.translateNotification(
  'notifications.new_application',
  'notifications.application_body',
  'uz',
  { orderTitle: 'Ремонт крыши' }
);

// Получить переводы для всех языков
const multiLangNotification = translationService.getMultiLanguageNotification(
  'notifications.new_application',
  'notifications.application_body',
  { orderTitle: 'Ремонт крыши' }
);
```

## Форматирование данных

### Даты и время

```typescript
import { translationService } from '../../services/translationService';

const date = new Date();
const formattedDate = translationService.formatDate(date, 'uz');
const formattedTime = translationService.formatTime(date, 'ru');
const formattedDateTime = translationService.formatDateTime(date, 'uz');
```

### Числа и валюта

```typescript
const number = 1234567;
const formattedNumber = translationService.formatNumber(number, 'uz');

const amount = 50000;
const formattedCurrency = translationService.formatCurrency(amount, 'ru', 'UZS');
```

## Добавление новых переводов

1. Добавьте ключ в файл `ru.json`
2. Добавьте соответствующий перевод в `uz.json`
3. Обновите типы в `useTranslation.ts` если нужно
4. Используйте новый ключ в компонентах

### Пример добавления нового перевода

```json
// ru.json
{
  "orders": {
    "new_feature": "Новая функция"
  }
}

// uz.json
{
  "orders": {
    "new_feature": "Yangi funksiya"
  }
}
```

## Рекомендации

1. **Всегда используйте переводы** - не хардкодьте текст в компонентах
2. **Группируйте по смыслу** - используйте правильные категории
3. **Описательные ключи** - используйте понятные названия ключей
4. **Проверяйте переводы** - убедитесь что переводы корректны
5. **Тестируйте на обоих языках** - проверяйте UI на разных языках

## Отладка

Для включения отладки i18n в режиме разработки:

```typescript
// В src/i18n/index.ts
i18n.init({
  debug: __DEV__, // Включает логи в консоль
  // ...
});
```

## Известные проблемы

1. **Длинные тексты** - узбекские переводы могут быть длиннее русских
2. **Направление текста** - оба языка используют LTR направление
3. **Шрифты** - убедитесь что шрифты поддерживают узбекские символы

## Поддержка

При возникновении проблем с переводами:

1. Проверьте консоль на ошибки i18next
2. Убедитесь что ключ существует в обоих файлах переводов
3. Проверьте правильность импорта хуков
4. Убедитесь что LanguageProvider обернут вокруг приложения
