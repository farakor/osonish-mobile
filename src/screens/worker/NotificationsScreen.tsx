import React, { useState, useEffect } from 'react';
import { View,
  Text,
  StyleSheet, ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  Dimensions, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { usePlatformSafeAreaInsets, getFixedBottomStyle, getContainerBottomStyle } from '../../utils/safeAreaUtils';
import { notificationService, NotificationSettings } from '../../services/notificationService';
import { authService } from '../../services/authService';
import { HeaderWithBack, LanguageRadioSelector } from '../../components/common';
import { useWorkerTranslation } from '../../hooks/useTranslation';

const { height: screenHeight } = Dimensions.get('window');

// Определяем маленький экран для Android (высота меньше 1080px)
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = usePlatformSafeAreaInsets();
  const tWorker = useWorkerTranslation();

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
        Alert.alert(tWorker('general_error'), tWorker('user_not_authorized_notifications'));
        return;
      }

      console.log('[NotificationsScreen] 📱 Загружаем настройки для пользователя:', authState.user.id);
      const userSettings = await notificationService.getUserNotificationSettings(authState.user.id);
      console.log('[NotificationsScreen] 📱 Загруженные настройки:', userSettings);

      setAllNotificationsEnabled(userSettings.allNotificationsEnabled);
      console.log('[NotificationsScreen] 📱 Состояние переключателя установлено в:', userSettings.allNotificationsEnabled);
    } catch (error) {
      console.error('Ошибка загрузки настроек уведомлений:', error);
      Alert.alert(tWorker('general_error'), tWorker('load_settings_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (allNotificationsEnabled === null) {
      Alert.alert(tWorker('general_error'), tWorker('settings_loading_wait'));
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
        Alert.alert(tWorker('success'), tWorker('settings_saved_success'), [
          {
            text: tWorker('ok'),
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert(tWorker('general_error'), tWorker('save_settings_error'));
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      Alert.alert(tWorker('general_error'), tWorker('save_settings_general_error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4F5FC" />
        <HeaderWithBack title={tWorker('settings_and_notifications')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{tWorker('loading_settings')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5FC" />
      <HeaderWithBack title={tWorker('settings_and_notifications')} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Form Fields */}
        <View style={styles.form}>
          {/* Main Notification Toggle */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tWorker('notifications_label')}</Text>
            <View style={styles.inputContainer}>
              <View style={styles.switchContainer}>
                <View style={styles.switchContent}>
                  <Text style={styles.switchTitle}>{tWorker('receive_notifications')}</Text>
                  <Text style={styles.switchDescription}>
                    {tWorker('notifications_description')}
                  </Text>
                </View>
                <Switch
                  value={allNotificationsEnabled ?? false}
                  onValueChange={setAllNotificationsEnabled}
                  disabled={allNotificationsEnabled === null}
                />
              </View>
            </View>
          </View>

          {/* Language Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Язык / Til</Text>
            <LanguageRadioSelector />
          </View>

          {/* Info Section */}
          <View style={styles.infoGroup}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                {tWorker('notifications_info')}
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
            {isSaving ? tWorker('saving_notifications') : tWorker('save_notifications')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5FC',
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
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: isSmallScreen ? 8 : 10,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 16 : 20,
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
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
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  switchDescription: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#8E8E93',
    lineHeight: isSmallScreen ? 18 : 22,
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
    borderWidth: 0, borderColor: 'transparent',
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
    backgroundColor: '#F4F5FC',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    // Убираем тени для чистого вида
    elevation: 0, shadowOpacity: 0,
  },
  saveButton: {
    backgroundColor: '#679B00',
    borderRadius: 12,
    paddingVertical: isSmallScreen ? 12 : 16,
    alignItems: 'center',
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0, elevation: 0,
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


});