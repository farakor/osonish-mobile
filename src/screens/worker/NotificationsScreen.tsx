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
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { usePlatformSafeAreaInsets, getFixedBottomStyle, getContainerBottomStyle } from '../../utils/safeAreaUtils';
import { notificationService, NotificationSettings } from '../../services/notificationService';
import { authService } from '../../services/authService';
import { HeaderWithBack } from '../../components/common';

const { height: screenHeight } = Dimensions.get('window');

// Определяем маленький экран для Android (высота меньше 1080px)
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = usePlatformSafeAreaInsets();

  const [allNotificationsEnabled, setAllNotificationsEnabled] = useState<boolean | null>(null);
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

      console.log('[NotificationsScreen] 📱 Загружаем настройки для пользователя:', authState.user.id);
      const userSettings = await notificationService.getUserNotificationSettings(authState.user.id);
      console.log('[NotificationsScreen] 📱 Загруженные настройки:', userSettings);

      setAllNotificationsEnabled(userSettings.allNotificationsEnabled);
      console.log('[NotificationsScreen] 📱 Состояние переключателя установлено в:', userSettings.allNotificationsEnabled);
    } catch (error) {
      console.error('Ошибка загрузки настроек уведомлений:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить настройки уведомлений');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (allNotificationsEnabled === null) {
      Alert.alert('Ошибка', 'Настройки еще загружаются. Попробуйте еще раз.');
      return;
    }

    console.log('[NotificationsScreen] 💾 Сохраняем настройки. Текущее состояние переключателя:', allNotificationsEnabled);
    setIsSaving(true);

    try {
      const settings: NotificationSettings = {
        allNotificationsEnabled,
      };

      console.log('[NotificationsScreen] 💾 Настройки для сохранения:', settings);
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
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <HeaderWithBack title="Уведомления" />

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
                <View style={[
                  styles.switchWrapper,
                  allNotificationsEnabled && styles.switchWrapperActive
                ]}>
                  <Switch
                    value={allNotificationsEnabled ?? false}
                    onValueChange={setAllNotificationsEnabled}
                    trackColor={{
                      false: '#C7C7CC',
                      true: '#FFFFFF'
                    }}
                    thumbColor={allNotificationsEnabled ? theme.colors.primary : '#FFFFFF'}
                    ios_backgroundColor="#C7C7CC"
                    disabled={allNotificationsEnabled === null}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoGroup}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                При отключении уведомлений вы можете пропустить важную информацию о новых заказах и сообщения от заказчиков.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomSection, getContainerBottomStyle(insets)]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (isSaving || allNotificationsEnabled === null) && styles.saveButtonDisabled
          ]}
          onPress={handleSaveSettings}
          disabled={isSaving || allNotificationsEnabled === null}
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

  scrollView: {
    flex: 1,
  },

  // Form (copied from EditProfileScreen)
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: isSmallScreen ? 16 : 20,
  },
  label: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: isSmallScreen ? 6 : 8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 12 : 16,
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
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#8E8E93',
    lineHeight: isSmallScreen ? 16 : 18,
  },

  // Info section
  infoGroup: {
    marginBottom: isSmallScreen ? 16 : 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    padding: isSmallScreen ? 12 : 16,
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
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666666',
    lineHeight: isSmallScreen ? 16 : 20,
  },

  // Bottom Section (copied from EditProfileScreen)
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0, // Динамически устанавливается через getFixedBottomStyle
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    // Убираем тени для чистого вида
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButton: {
    backgroundColor: '#679B00',
    borderRadius: 12,
    paddingVertical: isSmallScreen ? 12 : 16,
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
    fontSize: isSmallScreen ? 14 : 16,
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

  // Switch wrapper styles
  switchWrapper: {
    borderRadius: 20,
  },
  switchWrapperActive: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
  },
});