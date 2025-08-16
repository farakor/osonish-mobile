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
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { notificationService, NotificationSettings } from '../../services/notificationService';
import { authService } from '../../services/authService';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();

  const [allNotificationsEnabled, setAllNotificationsEnabled] = useState(true);
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
      setAllNotificationsEnabled(userSettings.allNotificationsEnabled);
    } catch (error) {
      console.error('Ошибка загрузки настроек уведомлений:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить настройки уведомлений');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      const settings: NotificationSettings = {
        allNotificationsEnabled,
        newOrdersEnabled: allNotificationsEnabled,
        newApplicationsEnabled: allNotificationsEnabled,
        orderUpdatesEnabled: allNotificationsEnabled,
        orderCompletedEnabled: allNotificationsEnabled,
      };

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
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Уведомления</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Загружаем настройки...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Уведомления</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Form Fields */}
        <View style={styles.form}>
          {/* Main Notification Toggle */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Уведомления</Text>
            <View style={styles.inputContainer}>
              <View style={styles.switchContainer}>
                <View style={styles.switchContent}>
                  <Text style={styles.switchTitle}>Получать уведомления</Text>
                  <Text style={styles.switchDescription}>
                    Уведомления о заказах, откликах и обновлениях
                  </Text>
                </View>
                <Switch
                  value={allNotificationsEnabled}
                  onValueChange={setAllNotificationsEnabled}
                  trackColor={{
                    false: '#C7C7CC',
                    true: '#679B0040'
                  }}
                  thumbColor={allNotificationsEnabled ? '#679B00' : '#FFFFFF'}
                  ios_backgroundColor="#C7C7CC"
                />
              </View>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoGroup}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                При отключении уведомлений вы можете пропустить важную информацию о ваших заказах и сообщения от исполнителей.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveSettings}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Сохраняем...' : 'Сохранить'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header (copied from EditProfileScreen)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#1A1A1A',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerRight: {
    width: 40,
  },

  scrollView: {
    flex: 1,
  },

  // Form (copied from EditProfileScreen)
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Switch specific styles
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },

  // Info section
  infoGroup: {
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },

  // Bottom Section (copied from EditProfileScreen)
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F8F9FA',
  },
  saveButton: {
    backgroundColor: '#679B00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#679B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
}); 