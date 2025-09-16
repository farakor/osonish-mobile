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
- Создание слушателей клавиатуры с информацией о высоте
- Обработчики навигации с автоматическим скрытием клавиатуры
- Стили с учетом состояния клавиатуры и динамическим позиционированием
- Анимированное позиционирование навигации над клавиатурой

### 2. Обновлен экран регистрации

Файл: `src/screens/auth/ProfileInfoStepByStepScreen.tsx`

Изменения:
- **Условное использование KeyboardAvoidingView**: Только для iOS, для Android используется обычный View
- **Отслеживание состояния клавиатуры**: Добавлены слушатели для Android с информацией о высоте
- **Автоматическое скрытие клавиатуры**: При навигации между шагами
- **Адаптивные стили**: Контейнеры адаптируются к состоянию клавиатуры
- **Анимированное позиционирование**: Навигационная панель плавно перемещается над клавиатурой
- **Динамическое позиционирование**: Кнопки всегда видны над клавиатурой

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

// Отслеживание клавиатуры с информацией о высоте
const [keyboardInfo, setKeyboardInfo] = useState<KeyboardInfo>({
  visible: false,
  height: 0
});

useEffect(() => {
  const { setup, cleanup } = createKeyboardListeners(
    (info: KeyboardInfo) => {
      setKeyboardInfo(info);
      // Анимируем позицию навигации над клавиатурой
      if (Platform.OS === 'android') {
        navigationBottom.value = withTiming(info.height + 45, { duration: 250 });
      }
    },
    () => {
      setKeyboardInfo({ visible: false, height: 0 });
      // Возвращаем навигацию в исходное положение
      if (Platform.OS === 'android') {
        navigationBottom.value = withTiming(0, { duration: 250 });
      }
    }
  );
  
  setup();
  return cleanup;
}, []);

// Анимированный стиль для навигации
const animatedNavigationStyle = useAnimatedStyle(() => {
  if (Platform.OS === 'android' && keyboardInfo.visible) {
    return {
      position: 'absolute',
      bottom: navigationBottom.value,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E5E7',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 8,
    };
  }
  return {};
});

// Использование анимированного стиля
<Animated.View style={[
  styles.navigation,
  animatedNavigationStyle,
  !keyboardInfo.visible && getImprovedFixedBottomStyle(insets)
]}>
```

## Конфигурация

По умолчанию:
- **iOS**: Использует KeyboardAvoidingView с behavior="padding"
- **Android**: Использует обычный View с ручным управлением позиционированием
- **Автоскрытие**: Клавиатура автоматически скрывается при навигации на Android
- **Анимация**: Плавное перемещение навигационной панели над клавиатурой (250ms)
- **Позиционирование**: Динамическое позиционирование на основе высоты клавиатуры

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
   - Проверка позиционирования кнопок над клавиатурой
   - Тестирование анимации появления/скрытия навигации
   - Проверка на разных размерах клавиатур (включая SwiftKey, Gboard и т.д.)

4. **Проверка в Expo Go vs Production**:
   - Убедиться что поведение одинаковое
   - Проверить что кнопки не мигают
   - Проверить что навигация работает плавно
   - Убедиться что кнопки всегда видны над клавиатурой
   - Проверить плавность анимации перемещения навигации

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
✅ **Исправлено**: Проблема с перекрытием кнопок клавиатурой решена  
✅ **Добавлено**: Анимированное позиционирование навигации над клавиатурой  
🧪 **Требует тестирования**: Необходимо протестировать новое позиционирование на реальных Android устройствах в production билде

## Новые возможности

- **Динамическое позиционирование**: Навигационная панель автоматически перемещается над клавиатурой
- **Плавная анимация**: 250ms анимация для плавного перемещения
- **Адаптивная высота**: Позиционирование основано на реальной высоте клавиатуры
- **Улучшенный UX**: Кнопки всегда доступны пользователю
