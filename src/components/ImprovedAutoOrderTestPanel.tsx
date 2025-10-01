import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { theme } from '../constants';
import { useAutoOrderTest } from '../hooks/useAutoOrderTest';
import {
  createTestOrdersSimple,
  createRealUserOrdersForTesting,
  runTestAutoUpdate,
  checkTestResults,
  cleanupTestOrdersSimple,
} from '../utils/simpleAutoOrderTest';
import { debugUserOrders, debugOrdersByStatus } from '../utils/debugOrdersHelper';

export const ImprovedAutoOrderTestPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [useSimpleMode, setUseSimpleMode] = useState(true);
  const [processAllOrders, setProcessAllOrders] = useState(false);

  // Хук для сложного режима
  const {
    isLoading: hookLoading,
    testOrders,
    createTestOrders: hookCreateOrders,
    runAutoUpdate: hookRunUpdate,
    checkResults: hookCheckResults,
    cleanupTestOrders: hookCleanup,
  } = useAutoOrderTest();

  const handleCreateOrders = async () => {
    setIsLoading(true);
    try {
      if (useSimpleMode) {
        await createTestOrdersSimple();
      } else {
        await hookCreateOrders();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunUpdate = async () => {
    setIsLoading(true);
    try {
      if (useSimpleMode) {
        await runTestAutoUpdate(processAllOrders);
      } else {
        await hookRunUpdate(processAllOrders);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckResults = async () => {
    setIsLoading(true);
    try {
      if (useSimpleMode) {
        await checkTestResults();
      } else {
        await hookCheckResults();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    setIsLoading(true);
    try {
      if (useSimpleMode) {
        await cleanupTestOrdersSimple();
      } else {
        await hookCleanup();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullTest = async () => {
    Alert.alert(
      'Полный тест',
      'Запустить полный цикл тестирования?\n\n1. Создать заказы\n2. Запустить автообновление\n3. Проверить результаты',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Запустить',
          onPress: async () => {
            setIsLoading(true);
            try {
              console.log('🧪 [FULL TEST] Начинаем полный тест...');

              // 1. Создаем заказы
              console.log('🧪 [FULL TEST] Шаг 1: Создание заказов...');
              const created = await createTestOrdersSimple();
              if (!created) {
                Alert.alert('Ошибка', 'Не удалось создать заказы');
                return;
              }

              // 2. Ждем немного
              await new Promise(resolve => setTimeout(resolve, 2000));

              // 3. Запускаем автообновление
              console.log('🧪 [FULL TEST] Шаг 2: Автообновление...');
              const updated = await runTestAutoUpdate(processAllOrders);
              if (!updated) {
                Alert.alert('Ошибка', 'Не удалось выполнить автообновление');
                return;
              }

              // 4. Ждем немного
              await new Promise(resolve => setTimeout(resolve, 1000));

              // 5. Проверяем результаты
              console.log('🧪 [FULL TEST] Шаг 3: Проверка результатов...');
              await checkTestResults();

              console.log('🧪 [FULL TEST] Полный тест завершен!');

            } catch (error) {
              console.error('🧪 [FULL TEST] Ошибка полного теста:', error);
              Alert.alert('Ошибка', `Полный тест не удался: ${error}`);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const loading = isLoading || hookLoading;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Тест автообновления заказов</Text>

      {/* Переключатель режима */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, useSimpleMode && styles.modeButtonActive]}
          onPress={() => setUseSimpleMode(true)}
        >
          <Text style={[styles.modeButtonText, useSimpleMode && styles.modeButtonTextActive]}>
            Простой
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, !useSimpleMode && styles.modeButtonActive]}
          onPress={() => setUseSimpleMode(false)}
        >
          <Text style={[styles.modeButtonText, !useSimpleMode && styles.modeButtonTextActive]}>
            Детальный
          </Text>
        </TouchableOpacity>
      </View>

      {/* Переключатель обработки заказов (только в простом режиме) */}
      {useSimpleMode && (
        <View style={styles.orderTypeSelector}>
          <TouchableOpacity
            style={[styles.orderTypeButton, !processAllOrders && styles.orderTypeButtonActive]}
            onPress={() => setProcessAllOrders(false)}
          >
            <Text style={[styles.orderTypeButtonText, !processAllOrders && styles.orderTypeButtonTextActive]}>
              🧪 Только тестовые
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.orderTypeButton, processAllOrders && styles.orderTypeButtonActive]}
            onPress={() => setProcessAllOrders(true)}
          >
            <Text style={[styles.orderTypeButtonText, processAllOrders && styles.orderTypeButtonTextActive]}>
              🌍 Все заказы
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Кнопка полного теста */}
      <TouchableOpacity
        style={[styles.fullTestButton]}
        onPress={handleFullTest}
        disabled={loading}
      >
        <Text style={styles.fullTestButtonText}>🚀 Полный тест</Text>
      </TouchableOpacity>

      {/* Кнопка отладки */}
      <TouchableOpacity
        style={[styles.debugButton]}
        onPress={debugUserOrders}
        disabled={loading}
      >
        <Text style={styles.debugButtonText}>🔍 Отладка заказов</Text>
      </TouchableOpacity>

      {/* Кнопка создания реальных заказов */}
      <TouchableOpacity
        style={[styles.realOrdersButton]}
        onPress={createRealUserOrdersForTesting}
        disabled={loading}
      >
        <Text style={styles.realOrdersButtonText}>🏠 Создать реальные заказы</Text>
      </TouchableOpacity>

      {/* Основные кнопки */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.createButton]}
          onPress={handleCreateOrders}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Создать</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.runButton]}
          onPress={handleRunUpdate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Запустить</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.checkButton]}
          onPress={handleCheckResults}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Проверить</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cleanButton]}
          onPress={handleCleanup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Очистить</Text>
        </TouchableOpacity>
      </View>

      {/* Показываем заказы только в детальном режиме */}
      {!useSimpleMode && testOrders.length > 0 && (
        <View style={styles.ordersContainer}>
          <Text style={styles.ordersTitle}>Тестовые заказы ({testOrders.length}):</Text>
          {testOrders.slice(0, 3).map((order, index) => (
            <View key={order.id} style={styles.orderItem}>
              <Text style={styles.orderTitle} numberOfLines={1}>
                {order.title}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>
                  {getStatusEmoji(order.status)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      )}
    </View>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return '#4CAF50';
    case 'cancelled': return '#F44336';
    case 'in_progress': return '#FF9800';
    case 'new': return '#2196F3';
    case 'response_received': return '#9C27B0';
    default: return '#757575';
  }
};

const getStatusEmoji = (status: string) => {
  switch (status) {
    case 'completed': return '✅';
    case 'cancelled': return '❌';
    case 'in_progress': return '⚠️';
    case 'new': return '🆕';
    case 'response_received': return '📩';
    default: return '❓';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: theme.colors.text.primary,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: 'white',
  },
  orderTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  orderTypeButtonActive: {
    backgroundColor: '#e17055',
  },
  orderTypeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d63031',
  },
  orderTypeButtonTextActive: {
    color: 'white',
  },
  fullTestButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  fullTestButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  realOrdersButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  realOrdersButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  runButton: {
    backgroundColor: '#FF9800',
  },
  checkButton: {
    backgroundColor: '#2196F3',
  },
  cleanButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  ordersContainer: {
    marginTop: 8,
  },
  ordersTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text.primary,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 4,
  },
  orderTitle: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
});
