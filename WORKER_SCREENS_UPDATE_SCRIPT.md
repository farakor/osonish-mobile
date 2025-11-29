# Скрипт обновления экранов исполнителя

## Экраны для обновления:

### ✅ Уже обновлены:
1. **WorkerJobsScreen.tsx** - главный экран (уже исправлен)
2. **WorkerApplicationsScreen.tsx** - мои заказы (исправлен)
3. **WorkerProfileScreen.tsx** - профиль (исправлен)

### 🔄 Требуют обновления:

#### 4. NotificationsScreen.tsx
```typescript
// Добавить импорты:
import { useAdaptiveStyles } from '../../hooks/useAdaptiveStyles';

// В компоненте:
const adaptiveStyles = useAdaptiveStyles();

// Обновить StatusBar:
<StatusBar 
  barStyle={adaptiveStyles.statusBar.barStyle} 
  backgroundColor={adaptiveStyles.statusBar.backgroundColor}
  translucent={adaptiveStyles.statusBar.translucent}
/>
```

#### 5. NotificationsListScreen.tsx
```typescript
// Добавить импорты:
import { useAdaptiveStyles } from '../../hooks/useAdaptiveStyles';
import { getSafeAreaPadding } from '../../utils/responsive';

// В компоненте:
const adaptiveStyles = useAdaptiveStyles();

// Обновить header стили:
paddingTop: getSafeAreaPadding().headerTop + theme.spacing.sm
```

#### 6. SupportScreen.tsx
```typescript
// Аналогично NotificationsScreen
```

#### 7. EditProfileScreen.tsx
```typescript
// Аналогично, но может использовать HeaderWithBack (уже обновлен)
```

#### 8. JobDetailsScreen.tsx
```typescript
// Проверить использование HeaderWithBack
```

## Универсальный паттерн обновления:

### 1. Добавить импорты:
```typescript
import { useAdaptiveStyles } from '../../hooks/useAdaptiveStyles';
import { getSafeAreaPadding } from '../../utils/responsive';
```

### 2. В компоненте:
```typescript
const adaptiveStyles = useAdaptiveStyles();
```

### 3. Обновить StatusBar:
```typescript
<StatusBar 
  barStyle={adaptiveStyles.statusBar.barStyle} 
  backgroundColor={adaptiveStyles.statusBar.backgroundColor}
  translucent={adaptiveStyles.statusBar.translucent}
/>
```

### 4. Обновить header стили:
```typescript
// Для экранов с собственным header:
paddingTop: getSafeAreaPadding().headerTop + theme.spacing.sm

// Для экранов с HeaderWithBack - уже исправлен автоматически
```

## Результат:
Все экраны исполнителя будут иметь правильные отступы от статус-бара на Android устройствах.
