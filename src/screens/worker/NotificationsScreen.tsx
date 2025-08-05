import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { HeaderWithBack } from '../../components/common';
import { notificationService, NotificationSettings } from '../../services/notificationService';
import { authService } from '../../services/authService';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();

  const [settings, setSettings] = useState<NotificationSettings>({
    allNotificationsEnabled: true,
    newOrdersEnabled: true,
    newApplicationsEnabled: true,
    orderUpdatesEnabled: true,
    orderCompletedEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      setIsLoading(true);
      const authState = authService.getAuthState();

      if (!authState.isAuthenticated || !authState.user) {
        Alert.alert('Ошибка', 'Пользователь не авторизован');
        return;
      }

      const userSettings = await notificationService.getUserNotificationSettings(authState.user.id);
      setSettings(userSettings);
    } catch (error) {
      console.error('Ошибка загрузки настроек уведомлений:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить настройки уведомлений');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
      // Если отключаем все уведомления, отключаем и все подкатегории
      ...(key === 'allNotificationsEnabled' && !value ? {
        newOrdersEnabled: false,
        newApplicationsEnabled: false,
        orderUpdatesEnabled: false,
        orderCompletedEnabled: false,
      } : {})
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      const success = await notificationService.updateNotificationSettings(settings);

      if (success) {
        Alert.alert('Успешно', 'Настройки уведомлений сохранены', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Ошибка', 'Не удалось сохранить настройки. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при сохранении настроек');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack title="Уведомления" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Загружаем настройки...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
              Уведомления {settings.allNotificationsEnabled ? 'включены' : 'отключены'}
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
              value={settings.allNotificationsEnabled}
              onValueChange={(value) => updateSetting('allNotificationsEnabled', value)}
              trackColor={{
                false: theme.colors.border,
                true: `${theme.colors.primary}40`
              }}
              thumbColor={settings.allNotificationsEnabled ? theme.colors.primary : theme.colors.text.secondary}
              ios_backgroundColor={theme.colors.border}
            />
          </View>
        </View>

        {/* Detailed Notification Settings for Workers */}
        {settings.allNotificationsEnabled && (
          <View style={styles.detailedSettings}>
            <Text style={styles.sectionTitle}>Типы уведомлений</Text>

            <View style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <View style={styles.notificationIcon}>
                  <Text style={styles.notificationIconText}>🆕</Text>
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>Новые заказы</Text>
                  <Text style={styles.notificationDescription}>
                    Уведомления о новых заказах для выполнения
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.newOrdersEnabled}
                onValueChange={(value) => updateSetting('newOrdersEnabled', value)}
                trackColor={{
                  false: theme.colors.border,
                  true: `${theme.colors.primary}40`
                }}
                thumbColor={settings.newOrdersEnabled ? theme.colors.primary : theme.colors.text.secondary}
                ios_backgroundColor={theme.colors.border}
              />
            </View>

            <View style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <View style={styles.notificationIcon}>
                  <Text style={styles.notificationIconText}>✅</Text>
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>Принятие заявок</Text>
                  <Text style={styles.notificationDescription}>
                    Уведомления когда заказчик выбирает вас
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.orderUpdatesEnabled}
                onValueChange={(value) => updateSetting('orderUpdatesEnabled', value)}
                trackColor={{
                  false: theme.colors.border,
                  true: `${theme.colors.primary}40`
                }}
                thumbColor={settings.orderUpdatesEnabled ? theme.colors.primary : theme.colors.text.secondary}
                ios_backgroundColor={theme.colors.border}
              />
            </View>

            <View style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <View style={styles.notificationIcon}>
                  <Text style={styles.notificationIconText}>🏁</Text>
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>Завершение работ</Text>
                  <Text style={styles.notificationDescription}>
                    Уведомления о завершении ваших работ
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.orderCompletedEnabled}
                onValueChange={(value) => updateSetting('orderCompletedEnabled', value)}
                trackColor={{
                  false: theme.colors.border,
                  true: `${theme.colors.primary}40`
                }}
                thumbColor={settings.orderCompletedEnabled ? theme.colors.primary : theme.colors.text.secondary}
                ios_backgroundColor={theme.colors.border}
              />
            </View>
          </View>
        )}



        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              При отключении уведомлений вы можете пропустить важную информацию о новых заказах и сообщения от заказчиков.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
  },
  detailedSettings: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },

}); 