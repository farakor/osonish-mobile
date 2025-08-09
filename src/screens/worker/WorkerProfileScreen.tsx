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
}

export const WorkerProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<WorkerStats>({
    completedJobs: 0,
    rating: 0,
    totalReviews: 0,
    monthsOnPlatform: 0,
    activeApplications: 0,
    earnings: 0
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

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        loadUserProfile(),
        loadWorkerStats()
      ]);
    } catch (error) {
      console.error('Ошибка обновления данных:', error);
    } finally {
      setIsRefreshing(false);
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
          {/* Content Header */}
          <View style={styles.contentHeader}>
            <Text style={styles.title}>Профиль</Text>
            <Text style={styles.subtitle}>
              {stats.activeApplications > 0 && (
                `${stats.activeApplications} активных откликов`
              )}
            </Text>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(user.firstName, user.lastName)}
                </Text>
              </View>
            )}
            <Text style={styles.userName}>
              {user.firstName} {user.lastName}
              {user.middleName && ` ${user.middleName}`}
            </Text>
            <Text style={styles.userPhone}>{user.phone}</Text>
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Верифицирован</Text>
              </View>
            )}
            {stats.rating > 0 && (
              <View style={styles.ratingContainer}>
                <StarIcon filled={true} size={16} />
                <Text style={styles.ratingText}>{stats.rating}</Text>
                <Text style={styles.ratingCount}>
                  ({stats.totalReviews} отзыв{stats.totalReviews === 1 ? '' : stats.totalReviews < 5 ? 'а' : 'ов'})
                </Text>
              </View>
            )}
          </View>

          {/* Earnings Widget - Full Width */}
          <View style={styles.earningsContainer}>
            <View style={styles.earningsWidget}>
              <View style={styles.earningsIconContainer}>
                <Text style={styles.earningsIcon}>💰</Text>
              </View>
              <View style={styles.earningsTextContainer}>
                <Text style={styles.earningsValue}>{formatEarnings(stats.earnings)}</Text>
                <Text style={styles.earningsLabel}>Заработано</Text>
              </View>
              <View style={styles.earningsBadge}>
                <Text style={styles.earningsBadgeText}>+{stats.completedJobs}</Text>
              </View>
            </View>
          </View>

          {/* Main Stats - Three Cards in Row */}
          <View style={styles.mainStatsContainer}>
            {mainStatsData.map((stat) => (
              <TouchableOpacity
                key={stat.id}
                style={styles.statCard}
                onPress={stat.onPress}
                activeOpacity={stat.onPress ? 0.7 : 1}
                disabled={!stat.onPress}
              >
                <Text style={[styles.statValue, { color: stat.color }]}>
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Profile Options */}
          <View style={styles.profileOptions}>
            <Text style={styles.sectionTitle}>Настройки</Text>
            {profileOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionItem}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  {typeof option.icon === 'string' ? (
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                  ) : (
                    <View style={styles.optionIcon}>{option.icon}</View>
                  )}
                  <Text style={styles.optionTitle}>{option.title}</Text>
                </View>
                <Text style={styles.optionArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Выйти из аккаунта</Text>
          </TouchableOpacity>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appVersion}>Osonish v1.0.0</Text>
            <Text style={styles.appDescription}>
              Marketplace для поиска исполнителей в Узбекистане
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  contentHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  profileInfo: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.background,
  },
  userName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  userPhone: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },

  verifiedBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
  },
  verifiedText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.success,
    fontWeight: theme.fonts.weights.medium,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  ratingText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: '#FDB022',
    marginRight: theme.spacing.xs,
  },
  ratingCount: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  profileOptions: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  optionItem: {
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
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: theme.spacing.md,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  optionArrow: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.secondary,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: '#FF6B6B',
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  appVersion: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  appDescription: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Earnings Widget Styles
  earningsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  earningsWidget: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  earningsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  earningsIcon: {
    fontSize: 24,
  },
  earningsTextContainer: {
    flex: 1,
  },
  earningsValue: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  earningsLabel: {
    fontSize: theme.fonts.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: theme.fonts.weights.medium,
  },
  earningsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  earningsBadgeText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
  },

  // Main Stats Styles
  mainStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 80,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: theme.fonts.weights.medium,
  },
}); 