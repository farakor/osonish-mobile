# Руководство по миграции на Android 15+

## Быстрые исправления

### 1. Замена StatusBar.currentHeight

**Старый код:**
```tsx
import { StatusBar } from 'react-native';

const height = StatusBar.currentHeight || 24;
```

**Новый код:**
```tsx
import { getAndroidStatusBarHeight } from '../utils/safeAreaUtils';

const height = getAndroidStatusBarHeight();
```

### 2. Замена StatusBar компонента

**Старый код:**
```tsx
import { StatusBar } from 'react-native';

<StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
```

**Новый код:**
```tsx
import { EdgeToEdgeStatusBar } from '../components/common/EdgeToEdgeStatusBar';

<EdgeToEdgeStatusBar style="dark" />
```

### 3. Использование безопасных отступов

**Старый код:**
```tsx
const styles = StyleSheet.create({
  container: {
    paddingTop: StatusBar.currentHeight || 24,
  },
});
```

**Новый код:**
```tsx
import { usePlatformSafeAreaInsets } from '../utils/safeAreaUtils';

const Component = () => {
  const insets = usePlatformSafeAreaInsets();
  
  return (
    <View style={{ paddingTop: insets.top }}>
      {/* контент */}
    </View>
  );
};
```

## Автоматическая замена

Используйте поиск и замену в IDE:

1. `StatusBar.currentHeight` → `getAndroidStatusBarHeight()`
2. `import.*StatusBar.*from 'react-native'` → добавить импорт утилит
3. `<StatusBar.*backgroundColor.*/>` → `<EdgeToEdgeStatusBar style="dark" />`

## Проверка изменений

Запустите скрипт проверки:
```bash
node scripts/check-android-15-compatibility.js
```

## Тестирование

1. **Android 15+**: проверить Edge-to-Edge
2. **Складные устройства**: смена ориентации
3. **Планшеты**: адаптивность интерфейса
4. **Старые версии**: обратная совместимость
