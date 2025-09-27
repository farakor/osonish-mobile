# Исправления проблем iOS Production Build

## Обзор проблем

После публикации приложения в App Store были выявлены две критические проблемы:

1. **Проблема с выбором времени**: Время иногда застревает на 05:00 и не дает выбрать другое время
2. **Проблема с камерой**: При создании заказа, если выбрать "загрузить фото", а потом "снять фото/видео", камера не открывается

## Исправления

### 1. Исправление проблемы с выбором времени

**Проблема**: На iOS при инициализации `DateTimePicker` происходили конфликты с часовыми поясами, из-за чего время могло "застревать" на неправильном значении.

**Решение**:
- Улучшена инициализация времени при открытии пикера
- Добавлено создание новой даты для избежания проблем с часовыми поясами
- Исправлена логика обработки изменения времени на iOS

**Измененные файлы**:
- `src/screens/customer/CreateOrderStepByStepScreen.tsx`

**Ключевые изменения**:
```typescript
// Сброс времени при открытии пикера для iOS
if (Platform.OS === 'ios' && !selectedTime) {
  const resetDate = new Date();
  resetDate.setHours(9, 0, 0, 0);
  setTimePickerValue(resetDate);
}

// Создание новой даты для избежания проблем с часовыми поясами
if (date) {
  const newDate = new Date();
  newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
  setTimePickerValue(newDate);
}
```

### 2. Исправление проблемы с камерой

**Проблема**: В production build на iOS отсутствовали необходимые разрешения и правильная обработка запросов доступа к камере.

**Решение**:
- Добавлены недостающие разрешения в `app.json`
- Добавлен плагин `expo-image-picker` с правильными настройками
- Улучшена логика запроса разрешений камеры с проверкой текущего статуса
- Добавлена возможность перехода в настройки при отказе в разрешениях

**Измененные файлы**:
- `app.json`
- `src/screens/customer/CreateOrderStepByStepScreen.tsx`
- `src/screens/auth/ProfileInfoStepByStepScreen.tsx`

**Ключевые изменения в app.json**:
```json
{
  "android": {
    "permissions": [
      // ... существующие разрешения
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE"
    ]
  },
  "plugins": [
    // ... существующие плагины
    [
      "expo-image-picker",
      {
        "photosPermission": "Это приложение использует доступ к фотогалерее для загрузки изображений к заказам и профилю пользователя.",
        "cameraPermission": "Это приложение использует камеру для создания фотографий заказов и профиля пользователя."
      }
    ]
  ]
}
```

**Улучшенная логика запроса разрешений**:
```typescript
try {
  // Проверяем текущие разрешения
  const { status: currentStatus } = await ImagePicker.getCameraPermissionsAsync();
  
  let finalStatus = currentStatus;
  
  // Если разрешения нет, запрашиваем
  if (currentStatus !== 'granted') {
    const { status: newStatus } = await ImagePicker.requestCameraPermissionsAsync();
    finalStatus = newStatus;
  }
  
  if (finalStatus !== 'granted') {
    Alert.alert(
      'Нет доступа к камере',
      'Пожалуйста, разрешите доступ к камере в настройках приложения',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Настройки', onPress: () => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
          } else {
            Linking.openSettings();
          }
        }}
      ]
    );
    return;
  }
  
  // Запуск камеры
  let result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images', 'videos'],
    quality: 1.0,
    allowsEditing: false,
  });
  
} catch (error) {
  console.error('Ошибка при работе с камерой:', error);
  Alert.alert('Ошибка', 'Не удалось открыть камеру');
}
```

## Различия между Expo Go и Production Build

### Expo Go
- Автоматически обрабатывает многие разрешения
- Имеет встроенные разрешения для камеры и галереи
- Более "снисходительный" к ошибкам в коде

### Production Build
- Требует явного указания всех разрешений в `app.json`
- Строже проверяет разрешения системы
- Требует правильной обработки ошибок и исключений

## Рекомендации для будущих релизов

1. **Тестирование на реальных устройствах**: Всегда тестируйте production build на реальных устройствах перед публикацией
2. **Проверка разрешений**: Убедитесь, что все необходимые разрешения указаны в `app.json`
3. **Обработка ошибок**: Добавляйте try-catch блоки для всех операций с нативными API
4. **Пользовательский опыт**: Предоставляйте пользователям понятные сообщения об ошибках и способы их решения

## Следующие шаги

1. Пересобрать приложение с новыми изменениями
2. Протестировать на iOS устройствах
3. Обновить версию в App Store
4. Мониторить отзывы пользователей на предмет новых проблем
