import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet, ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants';
import { authService } from '../../services/authService';
import { orderService } from '../../services/orderService';
import { User } from '../../types';
import UserEditIcon from '../../../assets/user-edit.svg';
import NotificationMessageIcon from '../../../assets/notification-message.svg';
import LifeBuoyIcon from '../../../assets/life-buoy-02.svg';
import LogOutIcon from '../../../assets/log-out-03.svg';
import FileIcon from '../../../assets/file-05.svg';
import FileShieldIcon from '../../../assets/file-shield-02.svg';
import { Ionicons } from '@expo/vector-icons';
import { useCustomerTranslation, useErrorsTranslation } from '../../hooks/useTranslation';
import { WebViewModal, DeleteAccountModal } from '../../components/common';

// Функция для получения высоты статусбара только на Android
const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};


interface ProfileOption {
  id: string;
  title: string;
  icon: string | React.ReactNode;
  action: () => void;
}

interface CustomerStats {
  totalOrders: number;
  completedOrders: number;
  activeOrders: number;
  averageRating: number;
  monthsOnPlatform: number;
}

export const CustomerProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const t = useCustomerTranslation();
  const tError = useErrorsTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [webViewModal, setWebViewModal] = useState<{
    visible: boolean;
    url: string;
    title: string;
  }>({
    visible: false,
    url: '',
    title: '',
  });
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  // Цвет для элементов выхода
  const logoutColor = '#FF3B30';
  const [stats, setStats] = useState<CustomerStats>({
    totalOrders: 0,
    completedOrders: 0,
    activeOrders: 0,
    averageRating: 0,
    monthsOnPlatform: 0
  });

  useEffect(() => {
    loadUserProfile();
    loadCustomerStats();
  }, [loadUserProfile, loadCustomerStats]);

  // Обновляем профиль при возврате на экран (например, после редактирования)
  useFocusEffect(
    React.useCallback(() => {
      console.log('[CustomerProfile] 🔄 useFocusEffect: перезагружаем профиль');
      setIsScreenFocused(true);
      loadUserProfile();
      loadCustomerStats();

      // Сбрасываем настройки статус-бара при фокусе на экран
      StatusBar.setBarStyle('dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#F8F9FA', true);
      }

      return () => {
        setIsScreenFocused(false);
        // Закрываем модальное окно при уходе с экрана
        setDeleteAccountModal(false);
      };
    }, [loadUserProfile, loadCustomerStats])
  );

  const loadUserProfile = useCallback(async () => {
    try {
      const authState = authService.getAuthState();
      if (authState.isAuthenticated && authState.user) {
        console.log('[CustomerProfile] 🔄 Обновляем данные пользователя');

        // Принудительно перезагружаем пользователя из базы данных
        console.log('[CustomerProfile] 🔄 Перезагружаем из базы данных...');
        const freshUser = await authService.findUserById(authState.user.id);

        if (freshUser) {
          console.log('[CustomerProfile] ✅ Данные обновлены из базы');
          console.log('[CustomerProfile] 📱 profileImage:', freshUser.profileImage);
          setUser(freshUser);

          // Обновляем локальное состояние authService
          authService.getAuthState().user = freshUser;
        } else {
          console.log('[CustomerProfile] ⚠️ Используем кэшированные данные');
          console.log('[CustomerProfile] 📱 profileImage:', authState.user.profileImage);
          setUser(authState.user);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      Alert.alert(tError('error'), t('profile_data_error'));
    } finally {
      setIsLoading(false);
    }
  }, [t, tError]);

  const loadCustomerStats = useCallback(async () => {
    try {
      // Получаем заказы заказчика
      const orders = await orderService.getCustomerOrders();

      // Рассчитываем статистику на основе реальных данных
      const totalOrders = orders.length;
      const completedOrders = orders.filter(order => order.status === 'completed').length;
      const activeOrders = orders.filter(order => order.status === 'active').length;

      // У заказчиков нет рейтинга
      let averageRating = 0;

      // Расчет месяцев на платформе
      const authState = authService.getAuthState();
      let monthsOnPlatform = 0;
      if (authState.user?.createdAt) {
        const createdDate = new Date(authState.user.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        monthsOnPlatform = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      }

      setStats({
        totalOrders,
        completedOrders,
        activeOrders,
        averageRating,
        monthsOnPlatform: Math.max(monthsOnPlatform, 1)
      });

      console.log('[CustomerProfile] Статистика загружена:', {
        totalOrders,
        completedOrders,
        activeOrders,
        averageRating,
        monthsOnPlatform
      });

    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);

      // Fallback к начальным данным при ошибке
      const authState = authService.getAuthState();
      let monthsOnPlatform = 1;
      if (authState.user?.createdAt) {
        const createdDate = new Date(authState.user.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        monthsOnPlatform = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)), 1);
      }

      setStats({
        totalOrders: 0,
        completedOrders: 0,
        activeOrders: 0,
        averageRating: 0,
        monthsOnPlatform
      });
    }
  }, []);



  const getInitials = (firstName?: string, lastName?: string): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'F';
  };

  const mainStatsData = [
    {
      id: 'orders',
      value: stats.totalOrders.toString(),
      label: t('orders_label'),
      color: theme.colors.primary,
      onPress: () => navigation.navigate('MyOrders' as never),
    },
    {
      id: 'experience',
      value: stats.monthsOnPlatform > 12
        ? `${Math.floor(stats.monthsOnPlatform / 12)} ${t('years_short')}`
        : `${stats.monthsOnPlatform} ${t('months_short')}`,
      label: t('on_platform_label'),
      color: theme.colors.primary,
    },
  ];

  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as never);
  };

  const handleNotifications = () => {
    navigation.navigate('Notifications' as never);
  };

  const handleSupport = () => {
    navigation.navigate('Support' as never);
  };


  const handleLogout = async () => {
    Alert.alert(
      t('logout_title'),
      t('logout_message'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              console.log('Logout successful');
              // Переходим к экрану авторизации
              navigation.navigate('Auth' as never);
            } catch (error) {
              console.error('Ошибка выхода:', error);
              Alert.alert(tError('error'), t('logout_error'));
            }
          }
        },
      ]
    );
  };

  const handleOpenWebView = (url: string, title: string) => {
    setWebViewModal({
      visible: true,
      url,
      title,
    });
  };

  const handleCloseWebView = () => {
    setWebViewModal({
      visible: false,
      url: '',
      title: '',
    });
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);

      const result = await authService.deleteAccount();

      if (result.success) {
        Alert.alert(
          t('delete_account_success'),
          '',
          [
            {
              text: t('ok'),
              onPress: () => {
                setDeleteAccountModal(false);
                navigation.navigate('Auth' as never);
              }
            }
          ]
        );
      } else {
        Alert.alert(tError('error'), result.error || t('delete_account_error'));
      }
    } catch (error) {
      console.error('Ошибка удаления аккаунта:', error);
      Alert.alert(tError('error'), t('delete_account_error'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const profileOptions: ProfileOption[] = [
    { id: '1', title: t('edit_profile'), icon: <UserEditIcon width={20} height={20} />, action: handleEditProfile },
    { id: '2', title: t('notifications'), icon: <NotificationMessageIcon width={20} height={20} />, action: handleNotifications },
    { id: '5', title: t('support'), icon: <LifeBuoyIcon width={20} height={20} />, action: handleSupport },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('loading_profile')}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{t('profile_load_error')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
          <Text style={styles.retryButtonText}>{t('try_again')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
        {/* Custom Header */}
        <View style={[styles.contentHeader, { paddingTop: theme.spacing.lg + getAndroidStatusBarHeight() }]}>
          <Text style={styles.title}>{t('profile_title')}</Text>
          <Text style={styles.subtitle}>{t('profile_subtitle')}</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* Profile Section with Gradient */}
          <View>
            <LinearGradient
              colors={['#679B00', '#5A8A00', '#4A7A00']}
              style={styles.profileSection}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Background Pattern for Customer */}
              <View style={styles.patternBackground}>
                <Ionicons name="bag-handle-outline" size={48} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon1} />
                <Ionicons name="card-outline" size={44} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon2} />
                <Ionicons name="storefront-outline" size={40} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon3} />
                <Ionicons name="receipt-outline" size={38} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon4} />
                <Ionicons name="home-outline" size={46} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon5} />
                <Ionicons name="basket-outline" size={42} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon6} />
                <Ionicons name="star-outline" size={40} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon7} />
                <Ionicons name="heart-outline" size={38} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon8} />
              </View>

              <View style={styles.profileImageContainer}>
                {user.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getInitials(user.firstName, user.lastName)}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.userNameContainer}>
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                {user.isVerified && (
                  <View style={styles.verifiedCheckmark}>
                    <Text style={styles.checkmarkIcon}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userPhone}>{user.phone}</Text>
              {stats.activeOrders > 0 && (
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>
                    {t('active_orders', { count: stats.activeOrders })}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Main Stats - Three Cards in Row */}
          <View style={styles.mainStatsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>{t('orders_label')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completedOrders}</Text>
              <Text style={styles.statLabel}>{t('completed_label')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {stats.monthsOnPlatform > 12
                  ? `${Math.floor(stats.monthsOnPlatform / 12)} ${t('years_short')}`
                  : `${stats.monthsOnPlatform} ${t('months_short')}`}
              </Text>
              <Text style={styles.statLabel}>{t('on_platform_label')}</Text>
            </View>
          </View>

          {/* Menu Options */}
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <UserEditIcon width={20} height={20} />
                </View>
                <Text style={styles.menuText}>{t('edit_profile')}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <NotificationMessageIcon width={20} height={20} />
                </View>
                <Text style={styles.menuText}>{t('settings_and_notifications')}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSupport}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <LifeBuoyIcon width={20} height={20} />
                </View>
                <Text style={styles.menuText}>{t('support')}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            {/* Information Section */}
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>{t('info')}</Text>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleOpenWebView('https://oson-ish.uz/terms-of-service.html', 'Пользовательское соглашение')}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <FileIcon width={20} height={20} />
                </View>
                <Text style={styles.menuText}>{t('terms_of_service')}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                if (Platform.OS === 'android') {
                  (navigation as any).navigate('DocumentWebView', {
                    url: 'https://oson-ish.uz/privacy-policy.html',
                    title: 'Политика в отношении обработки персональных данных',
                  });
                } else {
                  handleOpenWebView('https://oson-ish.uz/privacy-policy.html', 'Политика в отношении обработки персональных данных');
                }
              }}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <FileShieldIcon width={20} height={20} />
                </View>
                <Text style={styles.menuText}>{t('privacy_policy')}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.logoutMenuItem]} onPress={handleLogout}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <LogOutIcon width={20} height={20} color={logoutColor} />
                </View>
                <Text style={[styles.menuText, styles.logoutText]}>{t('logout')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.deleteAccountMenuItem]}
              onPress={() => setDeleteAccountModal(true)}
            >
              <Text style={[styles.menuText, styles.deleteAccountText]}>{t('delete_account')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* WebView Modal */}
      <WebViewModal
        visible={webViewModal.visible}
        url={webViewModal.url}
        title={webViewModal.title}
        onClose={handleCloseWebView}
      />

      {/* Delete Account Modal - только если экран активен и пользователь авторизован */}
      {isScreenFocused && user && (
        <DeleteAccountModal
          visible={deleteAccountModal}
          onClose={() => setDeleteAccountModal(false)}
          onConfirm={handleDeleteAccount}
          isDeleting={isDeletingAccount}
          title={t('delete_account_title')}
          message={t('delete_account_message')}
          confirmText={t('delete_account_confirm')}
          cancelText={t('cancel')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  contentHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },



  // Profile Section with Gradient
  profileSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 60,
    paddingHorizontal: 20,
    marginBottom: -30, // Negative margin to allow overlap
    position: 'relative',
    overflow: 'hidden',
  },

  // Background Pattern
  patternBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Icon Positions
  patternIcon1: {
    position: 'absolute',
    top: 15,
    left: 20,
    transform: [{ rotate: '15deg' }],
  },
  patternIcon2: {
    position: 'absolute',
    top: 45,
    right: 30,
    transform: [{ rotate: '-25deg' }],
  },
  patternIcon3: {
    position: 'absolute',
    top: 80,
    left: 60,
    transform: [{ rotate: '35deg' }],
  },
  patternIcon4: {
    position: 'absolute',
    top: 110,
    right: 80,
    transform: [{ rotate: '-15deg' }],
  },
  patternIcon5: {
    position: 'absolute',
    bottom: 50,
    left: 30,
    transform: [{ rotate: '45deg' }],
  },
  patternIcon6: {
    position: 'absolute',
    bottom: 80,
    right: 50,
    transform: [{ rotate: '-30deg' }],
  },
  patternIcon7: {
    position: 'absolute',
    bottom: 20,
    left: '45%',
    transform: [{ rotate: '20deg' }],
  },
  patternIcon8: {
    position: 'absolute',
    top: 30,
    left: '45%',
    transform: [{ rotate: '-40deg' }],
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  userPhone: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  verifiedCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1877F2', // Meta/Facebook blue
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  checkmarkIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Menu Section
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 20,
    color: '#C7C7CC',
    fontWeight: '300',
  },
  logoutMenuItem: {
    borderWidth: 0,
  },
  logoutText: {
    color: '#FF3B30', // Используем тот же цвет, что и для иконки
  },
  deleteAccountMenuItem: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  deleteAccountText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },

  // Section Divider
  sectionDivider: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Main Stats - Three Cards in Row
  mainStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 90,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
}); 