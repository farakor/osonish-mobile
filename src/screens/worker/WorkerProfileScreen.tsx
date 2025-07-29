import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { StatsWidget, StatItem } from '../../components/common';
import { authService } from '../../services/authService';
import UserEditIcon from '../../../assets/user-edit.svg';
import NotificationMessageIcon from '../../../assets/notification-message.svg';
import LifeBuoyIcon from '../../../assets/life-buoy-02.svg';


interface ProfileOption {
  id: string;
  title: string;
  icon: string | React.ReactNode;
  action: () => void;
}


export const WorkerProfileScreen: React.FC = () => {
  const navigation = useNavigation();

  const statsData: StatItem[] = [
    {
      id: 'orders',
      icon: '',
      value: '23',
      label: 'Заказов',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('Applications' as never),
    },
    {
      id: 'rating',
      icon: '',
      value: '4.9',
      label: 'Рейтинг',
      color: theme.colors.primary,
    },
    {
      id: 'experience',
      icon: '',
      value: '8 мес',
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
    { id: '3', title: 'Поддержка', icon: <LifeBuoyIcon width={20} height={20} />, action: handleSupport },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Content Header */}
          <View style={styles.contentHeader}>
            <Text style={styles.title}>Профиль</Text>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>АР</Text>
            </View>
            <Text style={styles.userName}>Алишер Рахимов</Text>
            <Text style={styles.userPhone}>+998 90 123 45 67</Text>
            <Text style={styles.userRole}>Исполнитель</Text>
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
  },
  userPhone: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  userRole: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
}); 