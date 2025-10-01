import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { theme } from '../constants';
import { useAutoOrderTest, TestOrder } from '../hooks/useAutoOrderTest';

export const AutoOrderTestPanel: React.FC = () => {
  const {
    isLoading,
    testOrders,
    createTestOrders,
    runAutoUpdate,
    checkResults,
    cleanupTestOrders,
  } = useAutoOrderTest();

  const getStatusColor = (order: TestOrder) => {
    if (order.auto_completed) return '#4CAF50'; // Зеленый для завершенных
    if (order.auto_cancelled) return '#F44336'; // Красный для отмененных
    if (order.status === 'in_progress') return '#FF9800'; // Оранжевый для в работе
    if (order.status === 'new') return '#2196F3'; // Синий для новых
    if (order.status === 'response_received') return '#9C27B0'; // Фиолетовый для с откликом
    return '#757575'; // Серый по умолчанию
  };

  const getStatusText = (order: TestOrder) => {
    if (order.auto_completed) return '✅ Автозавершен';
    if (order.auto_cancelled) return '❌ Автоотменен';

    switch (order.status) {
      case 'new': return '🆕 Новый';
      case 'response_received': return '📩 Отклик получен';
      case 'in_progress': return '⚠️ В работе';
      case 'completed': return '✅ Завершен';
      case 'cancelled': return '❌ Отменен';
      default: return order.status;
    }
  };

  const renderTestOrder = ({ item }: { item: TestOrder }) => (
    <View style={styles.orderItem}>
      <Text style={styles.orderTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
        <Text style={styles.statusText}>
          {getStatusText(item)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Тест автообновления заказов</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.createButton]}
          onPress={createTestOrders}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Создать</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.runButton]}
          onPress={runAutoUpdate}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Запустить</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.checkButton]}
          onPress={checkResults}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Проверить</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cleanButton]}
          onPress={cleanupTestOrders}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Очистить</Text>
        </TouchableOpacity>
      </View>

      {testOrders.length > 0 && (
        <View style={styles.ordersContainer}>
          <Text style={styles.ordersTitle}>Тестовые заказы:</Text>
          <FlatList
            data={testOrders}
            renderItem={renderTestOrder}
            keyExtractor={(item) => item.id}
            style={styles.ordersList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      )}
    </View>
  );
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text.primary,
  },
  ordersList: {
    maxHeight: 200,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  orderTitle: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
