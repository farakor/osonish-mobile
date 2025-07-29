import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { HeaderWithBack } from '../../components/common';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();

  const [allNotificationsEnabled, setAllNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const toggleAllNotifications = () => {
    setAllNotificationsEnabled(prev => !prev);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      // TODO: API запрос для сохранения настроек уведомлений
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert('Успешно', 'Настройки уведомлений сохранены');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <HeaderWithBack title="Уведомления" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Text style={styles.summaryIconText}>🔔</Text>
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>Настройки уведомлений</Text>
            <Text style={styles.summaryDescription}>
              Уведомления {allNotificationsEnabled ? 'включены' : 'отключены'}
            </Text>
          </View>
        </View>

        {/* Main Notification Toggle */}
        <View style={styles.mainToggle}>
          <View style={styles.notificationItem}>
            <View style={styles.notificationLeft}>
              <View style={styles.notificationIcon}>
                <Text style={styles.notificationIconText}>🔔</Text>
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>Все уведомления</Text>
                <Text style={styles.notificationDescription}>
                  Получать все уведомления от приложения
                </Text>
              </View>
            </View>
            <Switch
              value={allNotificationsEnabled}
              onValueChange={toggleAllNotifications}
              trackColor={{
                false: theme.colors.border,
                true: `${theme.colors.primary}40`
              }}
              thumbColor={allNotificationsEnabled ? theme.colors.primary : theme.colors.text.secondary}
              ios_backgroundColor={theme.colors.border}
            />
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              При отключении уведомлений вы можете пропустить важную информацию о ваших заказах и сообщения от исполнителей.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveSection}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSaveSettings}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Сохраняем...' : 'Сохранить настройки'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  summaryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${theme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  summaryIconText: {
    fontSize: 24,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  summaryDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  mainToggle: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  notificationIconText: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  notificationDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },

  infoSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${theme.colors.primary}08`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}20`,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  saveSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
}); 