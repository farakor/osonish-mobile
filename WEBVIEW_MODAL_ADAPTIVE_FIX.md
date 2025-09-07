# Адаптивные исправления WebViewModal для маленьких экранов

## Проблема
WebViewModal не отображался корректно на маленьких экранах Android (1080p и меньше), показывая только кнопку "X" в левом верхнем углу.

## Решение
Добавлена адаптивность для экранов с высотой меньше 1080px:

### Изменения в `WebViewModal.tsx`:

1. **Определение маленьких экранов:**
```typescript
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;
```

2. **Адаптивные настройки Modal:**
```typescript
<Modal
  visible={visible}
  animationType="slide"
  presentationStyle={isSmallScreen ? "overFullScreen" : "fullScreen"}
  onRequestClose={onClose}
  statusBarTranslucent={isSmallScreen}
  transparent={false}
  hardwareAccelerated={true}
>
```

3. **Адаптивные стили контейнера:**
```typescript
container: {
  flex: 1,
  backgroundColor: '#FFFFFF',
  paddingTop: isSmallScreen && Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
},
```

4. **Адаптивный header:**
```typescript
header: {
  paddingHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
  paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
  minHeight: isSmallScreen ? 56 : 64,
},
```

5. **Адаптивные размеры элементов:**
```typescript
closeButton: {
  width: isSmallScreen ? 28 : 32,
  height: isSmallScreen ? 28 : 32,
  borderRadius: isSmallScreen ? 14 : 16,
},
headerTitle: {
  fontSize: isSmallScreen ? theme.fonts.sizes.md : theme.fonts.sizes.lg,
  marginHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
},
```

6. **Отладочная информация:**
```typescript
React.useEffect(() => {
  if (visible && isSmallScreen) {
    console.log('🔍 WebViewModal Debug:', {
      screenHeight, screenWidth, isSmallScreen,
      statusBarHeight: StatusBar.currentHeight, visible, url
    });
  }
}, [visible]);
```

### Изменения в `ProfileInfoStepByStepScreen.tsx`:

1. **Очистка стилей контейнера:**
```typescript
container: {
  flex: 1,
  backgroundColor: theme.colors.background,
  position: 'relative', // Убеждаемся, что позиционирование корректное
},
```

## Результат
- ✅ **Адаптивность**: Автоматическое определение маленьких экранов
- ✅ **Правильное позиционирование**: overFullScreen для маленьких экранов
- ✅ **Учет статус-бара**: Правильные отступы для Android
- ✅ **Компактные размеры**: Уменьшенные элементы для маленьких экранов
- ✅ **Отладка**: Логирование для диагностики проблем
- ✅ **Очищенные стили**: Убраны потенциально конфликтующие стили

## Файлы изменены
- `osonish-mobile/src/components/common/WebViewModal.tsx`
- `osonish-mobile/src/screens/auth/ProfileInfoStepByStepScreen.tsx`

## Тестирование
1. Запустите приложение на Android устройстве с разрешением 1080p или меньше
2. Перейдите к экрану регистрации
3. Дойдите до шага согласия на обработку ПД
4. Нажмите на кнопку документа
5. Проверьте консоль на отладочные сообщения
6. Убедитесь, что модальное окно отображается корректно
