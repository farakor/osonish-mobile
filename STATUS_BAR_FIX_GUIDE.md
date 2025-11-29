# Руководство по исправлению проблем со статус-баром на Android

## Проблема
На Android устройствах header экранов пересекался со статус-баром, что приводило к некорректному отображению интерфейса.

## Решение

### 1. Создана система управления статус-баром

#### `src/utils/statusBar.ts`
Утилиты для правильной работы со статус-баром:

```typescript
// Получение высоты статус-бара для разных платформ
export const getStatusBarHeightSafe = (): number => {
  if (Platform.OS === 'ios') {
    const { height, width } = Dimensions.get('window');
    const isIPhoneX = height >= 812 || width >= 812;
    return isIPhoneX ? 44 : 20;
  }
  return StatusBar.currentHeight || 24; // Android
};

// Проверка необходимости отступа для статус-бара
export const needsStatusBarPadding = (): boolean => {
  return Platform.OS === 'android';
};

// Конфигурация StatusBar для разных экранов
export const getStatusBarConfig = (backgroundColor: string = '#679B00') => {
  return {
    barStyle: Platform.OS === 'ios' ? 'light-content' : 'dark-content',
    backgroundColor: Platform.OS === 'android' ? backgroundColor : undefined,
    translucent: Platform.OS === 'android',
  };
};
```

### 2. Обновлены адаптивные утилиты

#### `src/utils/responsive.ts`
Добавлена функция для безопасных отступов:

```typescript
// Получаем безопасные отступы с учетом статус-бара
export const getSafeAreaPadding = () => {
  const statusBarHeight = getStatusBarHeightSafe();
  const padding = getAdaptivePadding();
  
  return {
    // Для header, который должен учитывать статус-бар
    headerTop: needsStatusBarPadding() ? statusBarHeight + padding.md : padding.lg,
    
    // Для обычного контента под header
    contentTop: padding.lg,
    
    // Для модальных окон
    modalTop: needsStatusBarPadding() ? statusBarHeight + padding.sm : padding.md,
  };
};
```

### 3. Обновлен хук useAdaptiveStyles

#### `src/hooks/useAdaptiveStyles.ts`
Добавлена поддержка статус-бара:

```typescript
const safeAreaPadding = getSafeAreaPadding();
const statusBarConfig = getStatusBarConfig();

return {
  // Конфигурация статус-бара
  statusBar: statusBarConfig,
  
  // Безопасные отступы
  safeArea: safeAreaPadding,
  
  header: {
    paddingHorizontal: padding.lg,
    paddingTop: safeAreaPadding.headerTop, // Учитывает статус-бар
    paddingBottom: padding.md,
  },
  // ...
};
```

### 4. Создан компонент SafeAreaContainer

#### `src/components/common/SafeAreaContainer.tsx`
Универсальный контейнер для правильной работы со статус-баром:

```typescript
export const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({
  children,
  backgroundColor = '#679B00',
  statusBarStyle = 'light-content',
  hasHeader = false,
  style,
}) => {
  const adaptiveStyles = useAdaptiveStyles();

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={Platform.OS === 'android' ? backgroundColor : undefined}
        translucent={Platform.OS === 'android'}
      />
      {Platform.OS === 'ios' ? (
        <SafeAreaView style={styles.content}>
          {children}
        </SafeAreaView>
      ) : (
        <View style={[styles.content, hasHeader && { paddingTop: adaptiveStyles.safeArea.headerTop }]}>
          {children}
        </View>
      )}
    </View>
  );
};
```

### 5. Обновлены основные экраны

#### WorkerJobsScreen
```typescript
const adaptiveStyles = useAdaptiveStyles();

return (
  <View style={styles.container}>
    <StatusBar 
      barStyle={adaptiveStyles.statusBar.barStyle} 
      backgroundColor={adaptiveStyles.statusBar.backgroundColor}
      translucent={adaptiveStyles.statusBar.translucent}
    />
    <SafeAreaView style={styles.content}>
      <View style={styles.header}> {/* paddingTop учитывает статус-бар */}
        {/* Header content */}
      </View>
    </SafeAreaView>
  </View>
);

// Стили
const styles = StyleSheet.create({
  header: {
    paddingTop: getSafeAreaPadding().headerTop, // Автоматически учитывает статус-бар
    // ...
  },
});
```

#### CustomerHomeScreen
Аналогично обновлен для правильной работы со статус-баром.

## Использование

### Для новых экранов:

#### Вариант 1: Использование SafeAreaContainer
```typescript
import { SafeAreaContainer } from '../components/common';

export const MyScreen = () => {
  return (
    <SafeAreaContainer backgroundColor="#679B00" statusBarStyle="light-content">
      {/* Контент экрана */}
    </SafeAreaContainer>
  );
};
```

#### Вариант 2: Использование адаптивных стилей
```typescript
import { useAdaptiveStyles } from '../hooks/useAdaptiveStyles';
import { getSafeAreaPadding } from '../utils/responsive';

export const MyScreen = () => {
  const adaptiveStyles = useAdaptiveStyles();
  
  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={adaptiveStyles.statusBar.barStyle} 
        backgroundColor={adaptiveStyles.statusBar.backgroundColor}
        translucent={adaptiveStyles.statusBar.translucent}
      />
      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          {/* Header content */}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: getSafeAreaPadding().headerTop,
    // ...
  },
});
```

### Для существующих экранов:

1. Импортируйте необходимые утилиты:
```typescript
import { useAdaptiveStyles } from '../hooks/useAdaptiveStyles';
import { getSafeAreaPadding } from '../utils/responsive';
```

2. Обновите StatusBar:
```typescript
const adaptiveStyles = useAdaptiveStyles();

<StatusBar 
  barStyle={adaptiveStyles.statusBar.barStyle} 
  backgroundColor={adaptiveStyles.statusBar.backgroundColor}
  translucent={adaptiveStyles.statusBar.translucent}
/>
```

3. Обновите стили header:
```typescript
const styles = StyleSheet.create({
  header: {
    paddingTop: getSafeAreaPadding().headerTop, // Вместо фиксированного значения
    // ...остальные стили
  },
});
```

## Результат

✅ **Исправлено пересечение header со статус-баром на Android**
✅ **Корректное отображение на всех размерах экранов**
✅ **Автоматическая адаптация под разные устройства**
✅ **Сохранена совместимость с iOS**

## Тестирование

Рекомендуется протестировать на следующих устройствах:
- Android с разными версиями API (21+)
- Устройства с разной высотой статус-бара
- iPhone с и без "челки" (notch)

## Файлы для проверки

Основные файлы, которые были изменены:
1. `src/utils/statusBar.ts` - новые утилиты
2. `src/utils/responsive.ts` - обновленные адаптивные функции
3. `src/hooks/useAdaptiveStyles.ts` - поддержка статус-бара
4. `src/components/common/SafeAreaContainer.tsx` - новый компонент
5. `src/screens/worker/WorkerJobsScreen.tsx` - обновленный экран
6. `src/screens/customer/CustomerHomeScreen.tsx` - обновленный экран

## Заключение

Система управления статус-баром обеспечивает:
- Корректное отображение на всех Android устройствах
- Автоматическую адаптацию под разные размеры экранов
- Простоту использования для новых экранов
- Совместимость с существующим кодом
