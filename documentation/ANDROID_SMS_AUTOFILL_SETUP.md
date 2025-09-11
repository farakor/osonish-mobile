# Настройка SMS автозаполнения для Android

## Обзор проблемы

На iOS клавиатура автоматически предлагает вставку кода из SMS при использовании `textContentType="oneTimeCode"`. На Android для реализации подобной функции требуется дополнительная настройка на стороне приложения.

## Решение

Мы реализовали комплексное решение, которое включает:

1. **SMS Reader Service** - сервис для чтения входящих SMS
2. **Enhanced SMS Input** - улучшенный компонент ввода с автозаполнением
3. **Нативный модуль Android** - для прослушивания входящих SMS
4. **Автоматические разрешения** - запрос разрешений у пользователя

## Компоненты решения

### 1. SMS Reader Service (`src/services/smsReaderService.ts`)

Основной сервис для работы с SMS автозаполнением:

```typescript
import { smsReaderService, useSmsReader } from '../services/smsReaderService';

// Использование в компоненте
const smsReader = useSmsReader();

// Запуск прослушивания
await smsReader.startListening({
  codeLength: 6,
  timeout: 60000,
  senderFilter: ['OSONISH', 'SMS-CODE']
});

// Добавление слушателя
smsReader.addCodeListener('my-listener', (code) => {
  console.log('Получен код:', code);
});
```

### 2. Enhanced SMS Input (`src/components/common/EnhancedSmsInput.tsx`)

Улучшенный компонент ввода SMS с автозаполнением:

```tsx
import EnhancedSmsInput from '../components/common/EnhancedSmsInput';

<EnhancedSmsInput
  length={6}
  onCodeChange={handleCodeChange}
  onComplete={handleCodeComplete}
  enableAutoFill={true}
  showAutoFillIndicator={true}
  autoFillTimeout={60000}
/>
```

### 3. Хук для автозаполнения (`src/hooks/useSmsAutoFill.ts`)

Простой хук для использования автозаполнения:

```typescript
import { useSimpleSmsAutoFill } from '../hooks/useSmsAutoFill';

const MyComponent = () => {
  const handleCodeReceived = (code: string) => {
    console.log('Автозаполнение:', code);
    setVerificationCode(code);
  };

  const smsAutoFill = useSimpleSmsAutoFill(handleCodeReceived, 6);

  return (
    // Ваш UI
  );
};
```

## Настройка Android

### 1. Разрешения в AndroidManifest.xml

Добавьте в `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  
  <!-- Разрешения для чтения SMS -->
  <uses-permission android:name="android.permission.RECEIVE_SMS" />
  <uses-permission android:name="android.permission.READ_SMS" />
  
  <!-- Разрешение для автозаполнения -->
  <uses-permission android:name="android.permission.BIND_AUTOFILL_SERVICE" />
  
  <application>
    <!-- Ваша конфигурация приложения -->
  </application>
</manifest>
```

### 2. Регистрация нативного модуля

Добавьте в `MainApplication.java`:

```java
import com.osonishmobile.SmsReaderPackage;

public class MainApplication extends Application implements ReactApplication {
  
  @Override
  protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
      new MainReactPackage(),
      new SmsReaderPackage(), // Добавить эту строку
      // другие пакеты...
    );
  }
}
```

### 3. Настройка автозаполнения в полях ввода

Для лучшей поддержки автозаполнения используйте правильные атрибуты:

```tsx
<TextInput
  autoComplete="sms-otp"
  textContentType="oneTimeCode"
  // Android-специфичные атрибуты
  importantForAutofill="yes"
  autoCompleteType="sms-otp"
/>
```

## Использование в экранах

### Обновление экранов верификации

Замените `StableSmsInput` на `EnhancedSmsInput`:

```tsx
// Старый код
import { StableSmsInput } from '../../components/common';

<StableSmsInput
  length={6}
  onCodeChange={handleCodeChange}
  onComplete={handleCodeComplete}
/>

// Новый код
import EnhancedSmsInput from '../../components/common/EnhancedSmsInput';

<EnhancedSmsInput
  length={6}
  onCodeChange={handleCodeChange}
  onComplete={handleCodeComplete}
  enableAutoFill={true}
  showAutoFillIndicator={true}
  autoFillTimeout={60000}
/>
```

## Функции автозаполнения

### 1. Автоматическое извлечение кода

Сервис автоматически извлекает коды из SMS используя различные паттерны:

- Цифровые коды (4-8 цифр): `1234`, `123456`
- Коды с разделителями: `12-34`, `123 456`
- Коды в скобках: `(1234)`
- Коды после двоеточия: `Код: 1234`
- Коды после слова "код": `Ваш код 1234`

### 2. Фильтрация отправителей

Можно настроить фильтр отправителей:

```typescript
await smsReader.startListening({
  senderFilter: ['OSONISH', 'SMS-CODE', '+998901234567']
});
```

### 3. Таймаут ожидания

Автоматическая остановка прослушивания через заданное время:

```typescript
await smsReader.startListening({
  timeout: 60000 // 1 минута
});
```

## Индикаторы автозаполнения

### 1. Визуальный индикатор

Компонент показывает индикатор ожидания SMS:

```tsx
<EnhancedSmsInput
  showAutoFillIndicator={true} // Показать индикатор
/>
```

### 2. Анимация ячеек

Ячейки ввода пульсируют во время ожидания автозаполнения.

## Обработка разрешений

### 1. Автоматический запрос

Сервис автоматически запрашивает разрешения при первом использовании:

```typescript
const hasPermission = await smsReader.requestPermission();
if (hasPermission) {
  await smsReader.startListening();
}
```

### 2. Проверка разрешений

```typescript
const hasPermission = await smsReader.hasPermission();
console.log('Есть разрешение:', hasPermission);
```

## Тестирование

### 1. Тестирование на эмуляторе

```bash
# Отправка тестового SMS через ADB
adb emu sms send +1234567890 "Ваш код: 123456"
```

### 2. Тестирование на реальном устройстве

1. Соберите приложение с нативным модулем
2. Отправьте SMS с кодом на устройство
3. Проверьте автозаполнение в полях ввода

### 3. Отладка

Включите логирование для отладки:

```typescript
// В консоли будут видны логи:
// "SMS Reader: Получено SMS от +1234567890"
// "SMS Reader: Извлечен код: 123456"
// "Enhanced SMS Input: Получен код через автозаполнение: 123456"
```

## Совместимость

### Поддерживаемые версии Android

- **Минимальная**: Android 6.0 (API 23)
- **Рекомендуемая**: Android 8.0+ (API 26+)
- **Оптимальная**: Android 10+ (API 29+)

### Поддерживаемые форматы SMS

- Цифровые коды: 4-8 цифр
- Коды с разделителями
- Коды в различных форматах текста
- Многоязычные SMS (русский, английский, узбекский)

## Безопасность

### 1. Разрешения

Приложение запрашивает только необходимые разрешения:
- `RECEIVE_SMS` - для получения входящих SMS
- `READ_SMS` - для чтения содержимого SMS

### 2. Обработка данных

- SMS обрабатываются только локально на устройстве
- Коды не сохраняются и не передаются на сервер
- Автоматическое удаление слушателей при закрытии экрана

### 3. Фильтрация

- Обработка только SMS с кодами верификации
- Игнорирование рекламных и других SMS
- Фильтрация по отправителям

## Устранение неполадок

### 1. Автозаполнение не работает

**Проблема**: Коды не появляются автоматически

**Решения**:
1. Проверьте разрешения в настройках приложения
2. Убедитесь, что SMS содержит цифровой код
3. Проверьте формат SMS (должен содержать 4-8 цифр)
4. Перезапустите прослушивание SMS

### 2. Разрешения не запрашиваются

**Проблема**: Диалог разрешений не появляется

**Решения**:
1. Проверьте AndroidManifest.xml
2. Убедитесь, что targetSdkVersion >= 23
3. Вручную запросите разрешения через настройки

### 3. Нативный модуль не найден

**Проблема**: "SmsReaderModule недоступен"

**Решения**:
1. Пересоберите приложение: `npx react-native run-android`
2. Очистите кэш: `npx react-native start --reset-cache`
3. Проверьте регистрацию модуля в MainApplication.java

### 4. Коды извлекаются неправильно

**Проблема**: Неправильный код или код не найден

**Решения**:
1. Проверьте формат SMS
2. Настройте длину кода: `codeLength: 6`
3. Добавьте кастомный паттерн извлечения

## Примеры использования

### Базовое использование

```tsx
import React, { useState } from 'react';
import EnhancedSmsInput from '../components/common/EnhancedSmsInput';

const SmsVerificationScreen = () => {
  const [code, setCode] = useState('');

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleCodeComplete = (completedCode: string) => {
    // Отправить код на сервер
    verifyCode(completedCode);
  };

  return (
    <EnhancedSmsInput
      length={6}
      value={code}
      onCodeChange={handleCodeChange}
      onComplete={handleCodeComplete}
      enableAutoFill={true}
      showAutoFillIndicator={true}
    />
  );
};
```

### Продвинутое использование

```tsx
import React, { useState, useRef } from 'react';
import { useSimpleSmsAutoFill } from '../hooks/useSmsAutoFill';
import EnhancedSmsInput, { EnhancedSmsInputRef } from '../components/common/EnhancedSmsInput';

const AdvancedSmsScreen = () => {
  const [code, setCode] = useState('');
  const smsInputRef = useRef<EnhancedSmsInputRef>(null);

  // Автозаполнение с кастомной логикой
  const handleAutoFill = (receivedCode: string) => {
    setCode(receivedCode);
    // Дополнительная логика
    if (receivedCode.length === 6) {
      verifyCodeAutomatically(receivedCode);
    }
  };

  const smsAutoFill = useSimpleSmsAutoFill(handleAutoFill, 6);

  const startManualListening = async () => {
    const started = await smsInputRef.current?.startAutoFill();
    if (!started) {
      // Показать сообщение об ошибке
    }
  };

  return (
    <View>
      <EnhancedSmsInput
        ref={smsInputRef}
        length={6}
        value={code}
        onCodeChange={setCode}
        enableAutoFill={true}
        autoFillTimeout={120000} // 2 минуты
      />
      
      <TouchableOpacity onPress={startManualListening}>
        <Text>Запустить автозаполнение</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## Заключение

Реализованное решение обеспечивает:

✅ **Автоматическое заполнение SMS кодов на Android**  
✅ **Совместимость с iOS (встроенное автозаполнение)**  
✅ **Гибкая настройка и конфигурация**  
✅ **Безопасная обработка SMS**  
✅ **Простое API для разработчиков**  
✅ **Визуальные индикаторы для пользователей**  

Теперь пользователи Android смогут использовать автозаполнение SMS кодов так же удобно, как на iOS!

## Дальнейшие улучшения

1. **Поддержка Google SMS Retriever API** - для более надежного автозаполнения
2. **Машинное обучение** - для лучшего распознавания кодов
3. **Кастомные паттерны** - для специфических форматов SMS
4. **Аналитика использования** - для оптимизации UX
