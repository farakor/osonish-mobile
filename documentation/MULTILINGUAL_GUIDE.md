# 🌐 Руководство по многоязычности Osonish Mobile

## Обзор

Приложение Osonish поддерживает два языка:
- **Русский** (ru) - основной язык
- **Узбекский** (uz) - латиница

## 🚀 Быстрый старт

### 1. Использование переводов в компонентах

```typescript
import { useAuthTranslation } from '../../hooks/useTranslation';

function LoginScreen() {
  const t = useAuthTranslation();
  
  return (
    <View>
      <Text>{t('login_title')}</Text>
      <Button title={t('login')} />
    </View>
  );
}
```

### 2. Добавление нового перевода

1. Добавьте в `src/i18n/locales/ru.json`:
```json
{
  "orders": {
    "new_status": "Новый статус"
  }
}
```

2. Добавьте в `src/i18n/locales/uz.json`:
```json
{
  "orders": {
    "new_status": "Yangi holat"
  }
}
```

3. Используйте в компоненте:
```typescript
const t = useOrdersTranslation();
<Text>{t('new_status')}</Text>
```

## 📱 Пользовательский опыт

### Поток выбора языка
1. **Splash Screen** → проверка выбора языка
2. **Language Selection** → если язык не выбран
3. **Auth/Main App** → после выбора языка

### Переключение языка в настройках
```typescript
import { LanguageSwitcher } from '../../components/common';

<LanguageSwitcher showLabel={true} />
```

## 🔧 Доступные хуки

| Хук | Категория | Пример использования |
|-----|-----------|---------------------|
| `useTranslation()` | Все | `t('common.continue')` |
| `useCommonTranslation()` | Общие | `t('save')` |
| `useAuthTranslation()` | Авторизация | `t('login_title')` |
| `useOrdersTranslation()` | Заказы | `t('create_order')` |
| `useProfileTranslation()` | Профиль | `t('edit_profile')` |

## 🔔 Уведомления

Для многоязычных push-уведомлений:

```typescript
import { translationService } from '../../services/translationService';

// Для конкретного языка
const notification = translationService.translateNotification(
  'notifications.new_order',
  'notifications.order_created',
  'uz'
);

// Для всех языков
const multiLang = translationService.getMultiLanguageNotification(
  'notifications.new_order',
  'notifications.order_created'
);
```

## 📊 Форматирование данных

```typescript
// Дата и время
translationService.formatDate(new Date(), 'uz');
translationService.formatTime(new Date(), 'ru');

// Числа и валюта
translationService.formatNumber(1234567, 'uz');
translationService.formatCurrency(50000, 'ru', 'UZS');
```

## 🎯 Категории переводов

- **common** - кнопки, общие действия
- **auth** - вход, регистрация
- **profile** - профиль пользователя
- **orders** - создание, управление заказами
- **jobs** - поиск работы
- **notifications** - уведомления
- **support** - поддержка
- **categories** - категории услуг
- **errors** - ошибки

## ⚡ Лучшие практики

### ✅ Правильно
```typescript
// Используйте переводы
const t = useAuthTranslation();
<Text>{t('welcome_title')}</Text>

// Группируйте по смыслу
{
  "auth": {
    "login_title": "Вход в систему",
    "login_subtitle": "Введите данные"
  }
}
```

### ❌ Неправильно
```typescript
// Не хардкодьте текст
<Text>Добро пожаловать</Text>

// Не смешивайте категории
{
  "common": {
    "login_title": "Вход в систему" // Должно быть в auth
  }
}
```

## 🛠 Отладка

1. **Включите debug режим** в `src/i18n/index.ts`:
```typescript
debug: __DEV__
```

2. **Проверьте консоль** на ошибки i18next

3. **Убедитесь в наличии переводов** в обоих файлах

## 📝 Чеклист для новых экранов

- [ ] Импортирован нужный хук переводов
- [ ] Все тексты используют переводы
- [ ] Добавлены переводы в оба файла (ru.json, uz.json)
- [ ] Протестировано на обоих языках
- [ ] Проверена длина текстов в UI
- [ ] Форматирование дат/чисел использует translationService

## 🔄 Процесс разработки

1. **Создайте компонент** с переводами
2. **Добавьте ключи** в файлы переводов
3. **Протестируйте** на обоих языках
4. **Проверьте UI** на разных размерах экрана
5. **Убедитесь** что уведомления переведены

## 📞 Поддержка

При проблемах с переводами:
1. Проверьте структуру JSON файлов
2. Убедитесь в правильности ключей
3. Проверьте импорты хуков
4. Посмотрите консоль на ошибки

---

**Помните**: Качественная локализация - это не только перевод текста, но и адаптация UX под культурные особенности пользователей! 🌍
