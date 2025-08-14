import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';


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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  }, []);

  // Обновляем профиль при возврате на экран (например, после редактирования)
  useFocusEffect(
    React.useCallback(() => {
      console.log('[CustomerProfile] 🔄 useFocusEffect: перезагружаем профиль');
      loadUserProfile();
      loadCustomerStats();
    }, [])
  );

  const loadUserProfile = async () => {
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
      Alert.alert('Ошибка', 'Не удалось загрузить данные профиля');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerStats = async () => {
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
  };

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        loadUserProfile(),
        loadCustomerStats()
      ]);
    } catch (error) {
      console.error('Ошибка обновления данных:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'У';
  };

  const mainStatsData = [
    {
      id: 'orders',
      value: stats.totalOrders.toString(),
      label: 'Заказов',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('MyOrders' as never),
    },
    {
      id: 'experience',
      value: stats.monthsOnPlatform > 12
        ? `${Math.floor(stats.monthsOnPlatform / 12)} г`
        : `${stats.monthsOnPlatform} мес`,
      label: 'На платформе',
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
      'Выход',
      'Вы действительно хотите выйти из аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              console.log('Logout successful');
              // Переходим к экрану авторизации
              navigation.navigate('Auth' as never);
            } catch (error) {
              console.error('Ошибка выхода:', error);
              Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
            }
          }
        },
      ]
    );
  };

  const profileOptions: ProfileOption[] = [
    { id: '1', title: 'Редактировать профиль', icon: <UserEditIcon width={20} height={20} />, action: handleEditProfile },
    { id: '2', title: 'Уведомления', icon: <NotificationMessageIcon width={20} height={20} />, action: handleNotifications },
    { id: '5', title: 'Поддержка', icon: <LifeBuoyIcon width={20} height={20} />, action: handleSupport },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Загрузка профиля...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Ошибка загрузки профиля</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
          <Text style={styles.retryButtonText}>Попробовать снова</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
              title="Обновление..."
              titleColor={theme.colors.text.secondary}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Профиль</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Profile Section with Gradient */}
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
                  {stats.activeOrders} активных заказов
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* Main Stats - Three Cards in Row */}
          <View style={styles.mainStatsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Заказов</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completedOrders}</Text>
              <Text style={styles.statLabel}>Завершено</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {stats.monthsOnPlatform > 12
                  ? `${Math.floor(stats.monthsOnPlatform / 12)} г`
                  : `${stats.monthsOnPlatform} мес`}
              </Text>
              <Text style={styles.statLabel}>На платформе</Text>
            </View>
          </View>

          {/* Menu Options */}
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <UserEditIcon width={20} height={20} />
                </View>
                <Text style={styles.menuText}>Редактировать профиль</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <NotificationMessageIcon width={20} height={20} />
                </View>
                <Text style={styles.menuText}>Уведомления</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSupport}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <LifeBuoyIcon width={20} height={20} />
                </View>
                <Text style={styles.menuText}>Поддержка</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.logoutMenuItem]} onPress={handleLogout}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <LogOutIcon width={20} height={20} color={logoutColor} />
                </View>
                <Text style={[styles.menuText, styles.logoutText]}>Выйти</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
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

  // New Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerRight: {
    width: 40,
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