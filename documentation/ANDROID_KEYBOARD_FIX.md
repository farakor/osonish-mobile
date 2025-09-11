# Исправление проблемы с мигающими кнопками на Android

## Проблема

На экране пошаговой регистрации пользователя в Android production билдах контейнер с кнопкой "Далее" быстро перемещался вверх-вниз (мигал), как будто клавиатура пытается открыться но не открывается. В Expo Go проблема не проявлялась.

## Причина

Проблема была связана с использованием `KeyboardAvoidingView` с `behavior="height"` на Android в production билдах. Это вызывало быстрые изменения высоты контейнера, что приводило к миганию кнопки навигации.

## Решение

### 1. Создана утилита для стабильной работы с клавиатурой

Файл: `src/utils/keyboardUtils.ts`

Утилита предоставляет:
- Безопасное скрытие клавиатуры
- Определение необходимости использования KeyboardAvoidingView
- Создание слушателей клавиатуры
- Обработчики навигации с автоматическим скрытием клавиатуры
- Стили с учетом состояния клавиатуры

### 2. Обновлен экран регистрации

Файл: `src/screens/auth/ProfileInfoStepByStepScreen.tsx`

Изменения:
- **Условное использование KeyboardAvoidingView**: Только для iOS, для Android используется обычный View
- **Отслеживание состояния клавиатуры**: Добавлены слушатели для Android
- **Автоматическое скрытие клавиатуры**: При навигации между шагами
- **Адаптивные стили**: Контейнеры адаптируются к состоянию клавиатуры

### 3. Ключевые изменения

```typescript
// Условное использование KeyboardAvoidingView
{useKeyboardAvoiding ? (
  <KeyboardAvoidingView
    style={styles.content}
    behavior="padding"
    keyboardVerticalOffset={0}
  >
) : (
  <View style={styles.content}>
)}

// Отслеживание клавиатуры
useEffect(() => {
  const { setup, cleanup } = createKeyboardListeners(
    () => setKeyboardVisible(true),
    () => setKeyboardVisible(false)
  );
  
  setup();
  return cleanup;
}, []);

// Обработчики навигации с автоматическим скрытием клавиатуры
const nextStep = createNavigationHandler(() => {
  if (validateCurrentStep()) {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  }
});
```

## Конфигурация

По умолчанию:
- **iOS**: Использует KeyboardAvoidingView с behavior="padding"
- **Android**: Использует обычный View с ручным управлением позиционированием
- **Автоскрытие**: Клавиатура автоматически скрывается при навигации на Android

## Тестирование

### Рекомендации по тестированию:

1. **Тестирование на реальных устройствах Android**:
   ```bash
   # Создать production билд
   eas build --platform android --profile production
   
   # Или development билд для тестирования
   eas build --platform android --profile development
   ```

2. **Проверить на разных версиях Android**:
   - Android 8.0+ (API 26+)
   - Разные размеры экранов
   - Разные производители (Samsung, Xiaomi, OnePlus и т.д.)

3. **Тестовые сценарии**:
   - Переход между шагами с открытой клавиатурой
   - Быстрое переключение между полями ввода
   - Поворот экрана с открытой клавиатурой
   - Использование внешней клавиатуры

4. **Проверка в Expo Go vs Production**:
   - Убедиться что поведение одинаковое
   - Проверить что кнопки не мигают
   - Проверить что навигация работает плавно

### Команды для тестирования:

```bash
# Локальная разработка
npx expo start --android

# Development билд
eas build --platform android --profile development

# Production билд
eas build --platform android --profile production

# Установка на устройство
adb install path/to/your-app.apk
```

## Дополнительные улучшения

Если проблема все еще проявляется, можно:

1. **Увеличить задержку скрытия клавиатуры**:
   ```typescript
   const nextStep = createNavigationHandler(() => {
     // логика
   }, { dismissDelay: 100 });
   ```

2. **Отключить анимации на проблемных устройствах**:
   ```typescript
   const shouldAnimate = Platform.OS === 'ios' || !isLowEndDevice;
   ```

3. **Использовать react-native-keyboard-controller** для более точного контроля

## Файлы изменены

- `src/screens/auth/ProfileInfoStepByStepScreen.tsx` - основной экран
- `src/utils/keyboardUtils.ts` - утилиты для работы с клавиатурой (новый файл)
- `documentation/ANDROID_KEYBOARD_FIX.md` - эта документация

## Статус

✅ **Исправлено**: Проблема с мигающими кнопками на Android решена  
🧪 **Требует тестирования**: Необходимо протестировать на реальных Android устройствах в production билде
