import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { theme } from '../../constants';
import { clearAllUserData, getDataStats } from '../../utils/clearAllData';
import { authService } from '../../services/authService';
import { orderService } from '../../services/orderService';
import { notificationService } from '../../services/notificationService';

export function DevScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<{
    users: number;
    orders: number;
    storageKeys: string[];
  } | null>(null);

  const handleGetStats = async () => {
    try {
      const dataStats = await getDataStats();
      setStats(dataStats);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось получить статистику данных');
    }
  };

  const handleClearAllData = async () => {
    Alert.alert(
      'Подтвердите очистку',
      'Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить.',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Удалить все',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await clearAllUserData();
              Alert.alert('Успешно', 'Все данные удалены!', [
                {
                  text: 'OK',
                  onPress: () => {
                    setStats(null);
                    handleGetStats(); // Обновляем статистику
                  }
                }
              ]);
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось очистить данные');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCreateTestData = async () => {
    setIsLoading(true);
    try {
      // Создаем тестового пользователя
      const testResult = await authService.completeRegistration({
        phone: '+998901234567',
        firstName: 'Тестовый',
        lastName: 'Пользователь',
        middleName: 'Иванович',
        birthDate: '1990-01-01',
        role: 'customer',
        profileImage: undefined
      });

      if (testResult.success) {
        // Создаем тестовую заявку
        await orderService.createOrder({
          title: 'Тестовая заявка',
          description: 'Описание тестовой заявки',
          location: 'Ташкент',
          category: 'cleaning',
          budget: 50000,
          workersNeeded: 2,
          serviceDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          photos: []
        });

        Alert.alert('Успешно', 'Тестовые данные созданы!');
        handleGetStats(); // Обновляем статистику
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать тестовые данные');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagnosePushNotifications = async () => {
    setIsLoading(true);
    try {
      console.log('\n🔍 Запуск диагностики push уведомлений из DevScreen...');
      await notificationService.diagnosePushNotifications();
      Alert.alert('Диагностика завершена', 'Проверьте консоль для подробностей');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выполнить диагностику');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPushNotification = async () => {
    setIsLoading(true);
    try {
      console.log('\n🧪 Запуск тестирования push уведомлений из DevScreen...');
      const success = await notificationService.testPushNotification();
      Alert.alert(
        success ? 'Тест завершен' : 'Тест не удался',
        success
          ? 'Уведомление отправлено. Если не получили, проверьте настройки устройства.'
          : 'Не удалось отправить тестовое уведомление. Проверьте консоль.'
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выполнить тест');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshPushToken = async () => {
    setIsLoading(true);
    try {
      console.log('\n🔄 Обновление push токена из DevScreen...');
      const success = await notificationService.refreshPushToken();
      Alert.alert(
        success ? 'Токен обновлен' : 'Ошибка обновления',
        success
          ? 'Push токен успешно обновлен'
          : 'Не удалось обновить push токен. Проверьте консоль.'
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить токен');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Панель разработчика</Text>
          <Text style={styles.subtitle}>Управление данными приложения</Text>
        </View>

        {/* Статус подключения */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Статус подключения</Text>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Supabase:</Text>
            <View style={[styles.statusIndicator, orderService.getSupabaseStatus() ? styles.statusOnline : styles.statusOffline]}>
              <Text style={styles.statusText}>
                {orderService.getSupabaseStatus() ? '✅ Подключен' : '❌ Отключен'}
              </Text>
            </View>
          </View>
          {!orderService.getSupabaseStatus() && (
            <Text style={styles.warningText}>
              ⚠️ Используется локальное хранилище. Синхронизация между устройствами недоступна.
            </Text>
          )}
        </View>

        {/* Статистика */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Статистика данных</Text>
          <TouchableOpacity style={styles.button} onPress={handleGetStats}>
            <Text style={styles.buttonText}>Обновить статистику</Text>
          </TouchableOpacity>

          {stats && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Пользователи:</Text>
                <Text style={styles.statValue}>{stats.users}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Заявки:</Text>
                <Text style={styles.statValue}>{stats.orders}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Ключей в хранилище:</Text>
                <Text style={styles.statValue}>{stats.storageKeys.length}</Text>
              </View>
              {stats.storageKeys.length > 0 && (
                <View style={styles.keysContainer}>
                  <Text style={styles.keysTitle}>Ключи хранилища:</Text>
                  {stats.storageKeys.map((key, index) => (
                    <Text key={index} style={styles.keyItem}>• {key}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Диагностика уведомлений */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Диагностика уведомлений</Text>
          <TouchableOpacity
            style={[styles.button, styles.diagnosisButton]}
            onPress={handleDiagnosePushNotifications}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Проверяем...' : '🔍 Диагностика push уведомлений'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTestPushNotification}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Тестируем...' : '🧪 Отправить тестовое уведомление'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.refreshButton]}
            onPress={handleRefreshPushToken}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Обновляем...' : '🔄 Обновить push токен'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.warningText}>
            💡 Если уведомления не приходят, сначала запустите диагностику
          </Text>
        </View>

        {/* Тестовые данные */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Тестовые данные</Text>
          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={handleCreateTestData}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Создаём...' : 'Создать тестовые данные'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Очистка данных */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Очистка данных</Text>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClearAllData}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Удаляем...' : 'Удалить ВСЕ данные'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.warningText}>
            ⚠️ Это действие удалит всех пользователей, заявки и другие данные приложения
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  createButton: {
    backgroundColor: theme.colors.success,
  },
  clearButton: {
    backgroundColor: theme.colors.error,
  },
  diagnosisButton: {
    backgroundColor: '#9C88FF',
  },
  testButton: {
    backgroundColor: '#FF9500',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
  },
  statValue: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  keysContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  keysTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  keyItem: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    paddingVertical: 2,
  },
  warningText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.error,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 