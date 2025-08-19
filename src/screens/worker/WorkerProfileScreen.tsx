import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants';
import { StatItem } from '../../components/common';
import { authService } from '../../services/authService';
import { orderService } from '../../services/orderService';
import { StarIcon } from '../../components/common';
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

interface WorkerStats {
  completedJobs: number;
  rating: number;
  totalReviews: number;
  monthsOnPlatform: number;
  activeApplications: number;
  earnings: number;
  earningsChange?: number; // Процентное изменение заработка
}

// Функция для получения высоты статусбара только на Android
const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

export const WorkerProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  // Анимация для header
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Анимированный отступ для элементов профиля
  const profileContentMarginTop = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 80 + getAndroidStatusBarHeight()], // 80px высота header + высота статусбара на Android
    extrapolate: 'clamp',
  });

  // Анимация для скрытия имени в основной секции
  const profileNameOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  // Цвет для элементов выхода
  const logoutColor = '#FF3B30';
  const [stats, setStats] = useState<WorkerStats>({
    completedJobs: 0,
    rating: 0,
    totalReviews: 0,
    monthsOnPlatform: 0,
    activeApplications: 0,
    earnings: 0,
    earningsChange: 12.8 // Заглушка для демонстрации
  });

  useEffect(() => {
    loadUserProfile();
    loadWorkerStats();
  }, []);

  // Обновляем профиль при возврате на экран (например, после редактирования)
  useFocusEffect(
    React.useCallback(() => {
      console.log('[WorkerProfile] 🔄 useFocusEffect: перезагружаем профиль');
      loadUserProfile();

      // Сбрасываем настройки статус-бара при фокусе на экран
      StatusBar.setBarStyle('dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#F8F9FA', true);
      }
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      const authState = authService.getAuthState();
      if (authState.isAuthenticated && authState.user) {
        console.log('[WorkerProfile] 🔄 Обновляем данные пользователя');

        // Принудительно перезагружаем пользователя из базы данных
        console.log('[WorkerProfile] 🔄 Перезагружаем из базы данных...');
        const freshUser = await authService.findUserById(authState.user.id);

        if (freshUser) {
          console.log('[WorkerProfile] ✅ Данные обновлены из базы');
          console.log('[WorkerProfile] 📱 profileImage:', freshUser.profileImage);
          setUser(freshUser);

          // Обновляем локальное состояние authService
          authService.getAuthState().user = freshUser;
        } else {
          console.log('[WorkerProfile] ⚠️ Используем кэшированные данные');
          console.log('[WorkerProfile] 📱 profileImage:', authState.user.profileImage);
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



  const loadWorkerStats = async () => {
    try {
      setIsLoading(true);

      const authState = authService.getAuthState();
      if (!authState.user) {
        console.error('[WorkerProfile] Пользователь не авторизован');
        return;
      }

      // Получаем реальные данные о заявках исполнителя
      const applications = await orderService.getWorkerApplications();

      // Рассчитываем статистику на основе реальных данных
      const completedJobs = applications.filter(app => app.status === 'completed').length;
      const activeApplications = applications.filter(app =>
        app.status === 'pending' || app.status === 'accepted'
      ).length;

      // Получаем рейтинг из новой системы отзывов
      const workerRating = await orderService.getWorkerRating(authState.user.id);
      const averageRating = workerRating?.averageRating || 0;
      const totalReviews = workerRating?.totalReviews || 0;

      // Расчет месяцев на платформе
      let monthsOnPlatform = 0;
      if (authState.user?.createdAt) {
        const createdDate = new Date(authState.user.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        monthsOnPlatform = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      }

      // Получаем заработок с принятых заказов (не дожидаясь завершения)
      const earnings = await orderService.getWorkerEarnings(authState.user.id);

      setStats({
        completedJobs,
        rating: averageRating,
        totalReviews,
        monthsOnPlatform: Math.max(monthsOnPlatform, 1),
        activeApplications,
        earnings
      });

      console.log('[WorkerProfile] Статистика загружена:', {
        completedJobs,
        averageRating,
        monthsOnPlatform,
        activeApplications,
        earnings,
        totalReviews: workerRating?.totalReviews || 0
      });

    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);

      // Fallback к демо-данным при ошибке
      const authState = authService.getAuthState();
      let monthsOnPlatform = 1;
      if (authState.user?.createdAt) {
        const createdDate = new Date(authState.user.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        monthsOnPlatform = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)), 1);
      }

      setStats({
        completedJobs: 0,
        rating: 0,
        totalReviews: 0,
        monthsOnPlatform,
        activeApplications: 0,
        earnings: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'У';
  };

  const formatEarnings = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}М сум`;
    } else if (amount >= 1000) {
      return `${Math.floor(amount / 1000)}К сум`;
    }
    return `${amount} сум`;
  };

  const mainStatsData: StatItem[] = [
    {
      id: 'jobs',
      icon: '',
      value: stats.completedJobs.toString(),
      label: 'Заказов',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('Applications' as never),
    },
    {
      id: 'rating',
      icon: '',
      value: stats.rating.toString(),
      label: 'Рейтинг',
      color: theme.colors.primary,
    },
    {
      id: 'experience',
      icon: '',
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
    { id: '3', title: 'Поддержка', icon: <LifeBuoyIcon width={20} height={20} />, action: handleSupport },
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
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.content}>
        {/* Animated Header */}
        <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
          <LinearGradient
            colors={['#679B00', '#5A8A00', '#4A7A00']}
            style={[styles.animatedHeaderGradient, { paddingTop: 16 + getAndroidStatusBarHeight() }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Background Pattern */}
            <View style={styles.headerPatternBackground}>
              <Ionicons name="hammer-outline" size={24} color="rgba(255, 255, 255, 0.15)" style={styles.headerPatternIcon1} />
              <Ionicons name="build-outline" size={22} color="rgba(255, 255, 255, 0.15)" style={styles.headerPatternIcon2} />
              <Ionicons name="construct-outline" size={20} color="rgba(255, 255, 255, 0.15)" style={styles.headerPatternIcon3} />
              <Ionicons name="settings-outline" size={18} color="rgba(255, 255, 255, 0.15)" style={styles.headerPatternIcon4} />
            </View>
            <Text style={styles.animatedHeaderTitle}>
              {user ? `${user.firstName} ${user.lastName}` : 'Профиль'}
            </Text>
          </LinearGradient>
        </Animated.View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Regular Header */}
          <View style={[styles.regularHeader, { paddingTop: 16 + getAndroidStatusBarHeight() }]}>
            <Text style={styles.headerTitle}>Профиль</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Profile Section with Gradient */}
          <Animated.View style={{ marginTop: profileContentMarginTop }}>
            <LinearGradient
              colors={['#679B00', '#5A8A00', '#4A7A00']}
              style={styles.profileSection}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Background Pattern */}
              <View style={styles.patternBackground}>
                <Ionicons name="hammer-outline" size={48} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon1} />
                <Ionicons name="build-outline" size={44} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon2} />
                <Ionicons name="construct-outline" size={40} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon3} />
                <Ionicons name="hardware-chip-outline" size={38} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon4} />
                <Ionicons name="flash-outline" size={46} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon5} />
                <Ionicons name="settings-outline" size={42} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon6} />
                <Ionicons name="hammer-outline" size={40} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon7} />
                <Ionicons name="build-outline" size={38} color="rgba(255, 255, 255, 0.15)" style={styles.patternIcon8} />
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
              <Animated.View style={[styles.userNameContainer, { opacity: profileNameOpacity }]}>
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                {user.isVerified && (
                  <View style={styles.verifiedCheckmark}>
                    <Text style={styles.checkmarkIcon}>✓</Text>
                  </View>
                )}
              </Animated.View>
              <Text style={styles.userPhone}>{user.phone}</Text>
              {stats.rating > 0 && (
                <View style={styles.ratingContainer}>
                  <StarIcon filled={true} size={16} />
                  <Text style={styles.ratingText}>{stats.rating}</Text>
                  <Text style={styles.ratingCount}>
                    ({stats.totalReviews} отзыв{stats.totalReviews === 1 ? '' : stats.totalReviews < 5 ? 'а' : 'ов'})
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Modern Earnings Widget */}
          <View style={styles.earningsContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                // TODO: Навигация к детальному экрану доходов
                console.log('Открыть детали доходов');
              }}
            >
              <LinearGradient
                colors={['#FFE066', '#FFCC33']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modernEarningsWidget}
              >
                <View style={styles.earningsMainContent}>
                  <Text style={styles.earningsTitle}>Заработано</Text>
                  <Text style={styles.modernEarningsValue}>{formatEarnings(stats.earnings)}</Text>
                  {stats.earningsChange !== undefined && (
                    <View style={styles.earningsChangeContainer}>
                      <Text style={styles.earningsChangeIcon}>
                        {stats.earningsChange >= 0 ? '📈' : '📉'}
                      </Text>
                      <Text style={styles.earningsChangeText}>
                        {stats.earningsChange >= 0 ? '+' : ''}{stats.earningsChange.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.expandArrowContainer}>
                  <Text style={styles.expandArrow}>↗</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Main Stats - Three Cards in Row */}
          <View style={styles.mainStatsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completedJobs}</Text>
              <Text style={styles.statLabel}>Заказов</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.rating}</Text>
              <Text style={styles.statLabel}>Рейтинг</Text>
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
        </Animated.ScrollView>
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

  // Animated Header Styles
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  animatedHeaderGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  animatedHeaderTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Header Pattern Background
  headerPatternBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerPatternIcon1: {
    position: 'absolute',
    top: 8,
    left: 15,
    transform: [{ rotate: '15deg' }],
  },
  headerPatternIcon2: {
    position: 'absolute',
    top: 12,
    right: 25,
    transform: [{ rotate: '-25deg' }],
  },
  headerPatternIcon3: {
    position: 'absolute',
    top: 8,
    left: '45%',
    transform: [{ rotate: '35deg' }],
  },
  headerPatternIcon4: {
    position: 'absolute',
    top: 15,
    right: 60,
    transform: [{ rotate: '-15deg' }],
  },

  // Regular Header (in scroll)
  regularHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
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

  // Modern Earnings Widget
  earningsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 10,
  },
  modernEarningsWidget: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    minHeight: 120,
    overflow: 'hidden',
  },
  earningsMainContent: {
    flex: 1,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.7)',
    marginBottom: 8,
  },
  modernEarningsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  earningsChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  earningsChangeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  earningsChangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  expandArrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  expandArrow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
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