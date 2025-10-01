import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants';
import {
  createTestOrdersForAutoUpdate,
  forceAutoOrderUpdate,
  checkAutoUpdateResults,
  cleanupTestOrders,
} from '../../utils/testAutoOrderUpdates';

export const AutoOrderTestScreen: React.FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const handleCreateTestOrders = async () => {
    setIsLoading(true);
    try {
      addResult('🧪 Создание тестовых заказов...');
      await createTestOrdersForAutoUpdate();
      addResult('✅ Тестовые заказы созданы успешно');
      Alert.alert('Успех', 'Тестовые заказы созданы');
    } catch (error) {
      addResult(`❌ Ошибка: ${error}`);
      Alert.alert('Ошибка', 'Не удалось создать тестовые заказы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceUpdate = async () => {
    setIsLoading(true);
    try {
      addResult('🔄 Принудительный запуск автообновления...');
      await forceAutoOrderUpdate();
      addResult('✅ Автообновление выполнено успешно');
      Alert.alert('Успех', 'Автообновление статусов выполнено');
    } catch (error) {
      addResult(`❌ Ошибка: ${error}`);
      Alert.alert('Ошибка', 'Не удалось выполнить автообновление');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckResults = async () => {
    setIsLoading(true);
    try {
      addResult('🔍 Проверка результатов...');
      await checkAutoUpdateResults();
      addResult('✅ Проверка завершена (смотрите логи в консоли)');
      Alert.alert('Готово', 'Результаты проверены. Смотрите логи в консоли разработчика');
    } catch (error) {
      addResult(`❌ Ошибка: ${error}`);
      Alert.alert('Ошибка', 'Не удалось проверить результаты');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    setIsLoading(true);
    try {
      addResult('🧹 Очистка тестовых заказов...');
      await cleanupTestOrders();
      addResult('✅ Тестовые заказы очищены');
      Alert.alert('Успех', 'Тестовые заказы очищены');
    } catch (error) {
      addResult(`❌ Ошибка: ${error}`);
      Alert.alert('Ошибка', 'Не удалось очистить тестовые заказы');
    } finally {
      setIsLoading(false);
    }
  };

  const TestButton: React.FC<{
    title: string;
    onPress: () => void;
    color?: string;
    disabled?: boolean;
  }> = ({ title, onPress, color = theme.colors.primary, disabled = false }) => (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: disabled ? '#ccc' : color },
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>🧪 Тестирование автообновления заказов</Text>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Важно</Text>
          <Text style={styles.warningText}>
            Фоновые задачи не работают в Expo Go. Этот экран позволяет протестировать логику вручную.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Шаги тестирования:</Text>

          <TestButton
            title="1. Создать тестовые заказы"
            onPress={handleCreateTestOrders}
            color="#4CAF50"
          />

          <TestButton
            title="2. Запустить автообновление"
            onPress={handleForceUpdate}
            color="#FF9800"
          />

          <TestButton
            title="3. Проверить результаты"
            onPress={handleCheckResults}
            color="#2196F3"
          />

          <TestButton
            title="4. Очистить тестовые данные"
            onPress={handleCleanup}
            color="#F44336"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.logHeader}>
            <Text style={styles.sectionTitle}>Логи выполнения:</Text>
            <TouchableOpacity onPress={clearResults} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Очистить</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logContainer}>
            {results.length === 0 ? (
              <Text style={styles.noLogsText}>Логи появятся здесь после выполнения действий</Text>
            ) : (
              results.map((result, index) => (
                <Text key={index} style={styles.logText}>
                  {result}
                </Text>
              ))
            )}
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Что тестируется:</Text>
          <Text style={styles.infoText}>
            • Заказы "В работе" → "Завершен" (auto_completed = true){'\n'}
            • Заказы "Новый"/"Отклик получен" → "Отменен" (auto_cancelled = true){'\n'}
            • Обновление статусов откликов{'\n'}
            • Отправка уведомлений
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🔍 Как проверить в базе данных:</Text>
          <Text style={styles.infoText}>
            SELECT id, title, status, auto_completed, auto_cancelled{'\n'}
            FROM orders{'\n'}
            WHERE service_date = CURRENT_DATE{'\n'}
            ORDER BY updated_at DESC;
          </Text>
        </View>
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
    marginBottom: 20,
    color: theme.colors.text.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.colors.text.primary,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#D1ECF1',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C5460',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0C5460',
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  logContainer: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    maxHeight: 200,
  },
  noLogsText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  logText: {
    color: '#00ff00',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
