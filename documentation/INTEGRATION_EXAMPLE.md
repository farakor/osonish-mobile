# Пример интеграции тестирования автообновления заказов

## Быстрая интеграция

### Вариант 1: Добавление на главный экран (временно для тестирования)

Найдите главный экран приложения (например, `HomeScreen.tsx` или `DashboardScreen.tsx`) и добавьте:

```tsx
// В импорты добавьте:
import { AutoOrderTestPanel } from '../components/AutoOrderTestPanel';

// В JSX добавьте (например, в конец экрана):
export const HomeScreen = () => {
  return (
    <ScrollView>
      {/* Ваш существующий контент */}
      
      {/* Добавьте в конец для тестирования */}
      {__DEV__ && <AutoOrderTestPanel />}
    </ScrollView>
  );
};
```

### Вариант 2: Добавление в экран настроек

Найдите экран настроек (например, `SettingsScreen.tsx`) и добавьте кнопку:

```tsx
import { AutoOrderTestPanel } from '../components/AutoOrderTestPanel';

export const SettingsScreen = () => {
  const [showTestPanel, setShowTestPanel] = useState(false);

  return (
    <ScrollView>
      {/* Ваши существующие настройки */}
      
      {__DEV__ && (
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>🛠️ Отладка (только для разработки)</Text>
          
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => setShowTestPanel(!showTestPanel)}
          >
            <Text style={styles.debugButtonText}>
              🧪 {showTestPanel ? 'Скрыть' : 'Показать'} тест автообновления заказов
            </Text>
          </TouchableOpacity>
          
          {showTestPanel && <AutoOrderTestPanel />}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  debugSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#495057',
  },
  debugButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

### Вариант 3: Создание отдельного экрана отладки

1. **Создайте экран отладки** (`DebugScreen.tsx`):

```tsx
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AutoOrderTestPanel } from '../components/AutoOrderTestPanel';

export const DebugScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>🛠️ Экран отладки</Text>
        <Text style={styles.subtitle}>Только для разработки</Text>
        
        <AutoOrderTestPanel />
        
        {/* Здесь можно добавить другие отладочные компоненты */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#212529',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6c757d',
  },
});
```

2. **Добавьте в навигацию** (в файле навигации):

```tsx
import { DebugScreen } from '../screens/DebugScreen';

// В стек навигации добавьте:
{__DEV__ && (
  <Stack.Screen 
    name="Debug" 
    component={DebugScreen}
    options={{ 
      title: '🛠️ Отладка',
      headerStyle: { backgroundColor: '#6c757d' },
      headerTintColor: 'white',
    }}
  />
)}
```

3. **Добавьте кнопку для перехода** (например, в настройках):

```tsx
{__DEV__ && (
  <TouchableOpacity 
    style={styles.debugNavigateButton}
    onPress={() => navigation.navigate('Debug')}
  >
    <Text style={styles.debugNavigateText}>🛠️ Перейти к отладке</Text>
  </TouchableOpacity>
)}
```

## Пример использования хука напрямую

Если вы хотите создать свой собственный интерфейс:

```tsx
import React from 'react';
import { View, Button, Text, Alert } from 'react-native';
import { useAutoOrderTest } from '../hooks/useAutoOrderTest';

export const MyCustomTestComponent = () => {
  const {
    isLoading,
    testOrders,
    createTestOrders,
    runAutoUpdate,
    checkResults,
    cleanupTestOrders,
  } = useAutoOrderTest();

  const handleFullTest = async () => {
    try {
      Alert.alert('Начинаем полный тест', 'Это займет несколько секунд...');
      
      // 1. Создаем тестовые заказы
      await createTestOrders();
      
      // 2. Ждем немного
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. Запускаем автообновление
      await runAutoUpdate();
      
      // 4. Проверяем результаты
      await checkResults();
      
      Alert.alert('Тест завершен', 'Проверьте результаты выше');
      
    } catch (error) {
      Alert.alert('Ошибка теста', String(error));
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        🧪 Тестирование автообновления
      </Text>
      
      <Button 
        title="🚀 Запустить полный тест" 
        onPress={handleFullTest}
        disabled={isLoading}
      />
      
      <View style={{ marginVertical: 10 }} />
      
      <Button title="1. Создать заказы" onPress={createTestOrders} disabled={isLoading} />
      <Button title="2. Запустить обновление" onPress={runAutoUpdate} disabled={isLoading} />
      <Button title="3. Проверить результаты" onPress={checkResults} disabled={isLoading} />
      <Button title="4. Очистить" onPress={cleanupTestOrders} disabled={isLoading} />
      
      {testOrders.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>Тестовые заказы ({testOrders.length}):</Text>
          {testOrders.map(order => (
            <Text key={order.id} style={{ fontSize: 12, marginTop: 5 }}>
              {order.status === 'completed' && order.auto_completed && '✅ '}
              {order.status === 'cancelled' && order.auto_cancelled && '❌ '}
              {order.title}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};
```

## Быстрый старт для тестирования

1. **Выберите один из вариантов выше** и интегрируйте в ваше приложение
2. **Убедитесь, что выполнен SQL скрипт**:
   ```sql
   ALTER TABLE orders ADD COLUMN IF NOT EXISTS auto_cancelled BOOLEAN DEFAULT false;
   ```
3. **Запустите приложение в Expo Go**
4. **Найдите тестовый компонент** и нажмите кнопки по порядку:
   - Создать → Запустить → Проверить → Очистить

## Что вы увидите

### После создания тестовых заказов:
- 3 новых заказа с префиксом "🧪 ТЕСТ:"
- Разные статусы: `new`, `response_received`, `in_progress`

### После запуска автообновления:
- Заказы `new` и `response_received` → `cancelled` (auto_cancelled = true)
- Заказы `in_progress` → `completed` (auto_completed = true)

### В логах консоли:
```
🧪 ТЕСТ: Запуск автообновления статусов...
✅ Заказ abc123 завершен автоматически
❌ Заказ def456 отменен автоматически
```

---

*Пример интеграции обновлен: 30 сентября 2025*
