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
import { StatsWidget, StatItem } from '../../components/common';
import { authService } from '../../services/authService';
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

export const CustomerProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Загружаем профиль при первой загрузке
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Обновляем профиль при возврате на экран (например, после редактирования)
  useFocusEffect(
    React.useCallback(() => {
      console.log('[CustomerProfile] 🔄 useFocusEffect: перезагружаем профиль');
      loadUserProfile();
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

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadUserProfile();
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

  const statsData: StatItem[] = [
    {
      id: 'orders',
      icon: '',
      value: '12',
      label: 'Заказов',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('MyOrders' as never),
    },
    {
      id: 'rating',
      icon: '',
      value: '4.8',
      label: 'Рейтинг',
      color: theme.colors.primary,
    },
    {
      id: 'months',
      icon: '',
      value: '6 мес',
      label: 'На Oson Ish',
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
          {/* Content Header */}
          <View style={styles.contentHeader}>
            <Text style={styles.title}>Профиль</Text>
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
            <Text style={styles.userRole}>Заказчик</Text>
          </View>

          {/* Enhanced Stats Widget */}
          <StatsWidget
            stats={statsData}
            variant="cards"
            style={{ marginBottom: theme.spacing.xl }}
          />

          {/* Profile Options */}
          <View style={styles.profileOptions}>
            {profileOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionItem}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  {/* Изменено: поддержка компонента-иконки */}
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
    backgroundColor: theme.colors.background,
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
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.white,
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
    marginBottom: theme.spacing.xs,
  },
  userRole: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  optionTitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  optionArrow: {
    fontSize: 18,
    color: theme.colors.text.secondary,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoutText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.white,
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
}); 