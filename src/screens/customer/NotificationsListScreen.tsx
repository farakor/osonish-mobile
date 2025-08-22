import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import { theme } from '../../constants';
import { HeaderWithBack } from '../../components/common';
import { notificationService, NotificationItem } from '../../services/notificationService';
import { authService } from '../../services/authService';
import { useCustomerTranslation, useErrorsTranslation, useCommonTranslation } from '../../hooks/useTranslation';

// SVG иконка check-circle-broken
const checkCircleBrokenSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path opacity="0.12" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#679B00"/>
<path d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572M22 4L12 14.01L9 11.01" stroke="#679B00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'new_application':
      return '📝';
    case 'order_update':
      return '📋';
    case 'order_completed':
      return '✅';
    case 'new_order':
      return '🆕';
    case 'worker_contact_info':
      return '📞';
    default:
      return '🔔';
  }
};

const getTimeAgo = (dateString: string, t: any): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return t('just_now');
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    const timeWord = minutes === 1 ? t('minute_ago') : minutes < 5 ? t('minutes_ago') : t('minutes_ago_many');
    return t('time_ago_template', { time: `${minutes} ${timeWord}` });
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    const timeWord = hours === 1 ? t('hour_ago') : hours < 5 ? t('hours_ago') : t('hours_ago_many');
    return t('time_ago_template', { time: `${hours} ${timeWord}` });
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    if (days === 1) return t('yesterday');
    if (days < 7) return t('days_ago', { count: days });

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

export const NotificationsListScreen: React.FC = () => {
  const navigation = useNavigation();
  const t = useCustomerTranslation();
  const tError = useErrorsTranslation();
  const tCommon = useCommonTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        Alert.alert(tError('error'), t('user_not_authorized'));
        return;
      }

      const [notificationsList, unreadCountResult] = await Promise.all([
        notificationService.getUserNotifications(authState.user.id),
        notificationService.getUnreadNotificationsCount(authState.user.id)
      ]);

      setNotifications(notificationsList);
      setUnreadCount(unreadCountResult);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
      Alert.alert(tError('error'), t('load_notifications_error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleNotificationPress = async (notification: NotificationItem) => {
    // Отмечаем как прочитанное (симуляция)
    await notificationService.markNotificationAsRead(notification.id);

    // Обновляем локальное состояние
    if (!notification.isRead) {
      setNotifications(prev => prev.map(item =>
        item.id === notification.id ? { ...item, isRead: true } : item
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Обработка навигации в зависимости от типа уведомления
    if (notification.data?.orderId) {
      (navigation as any).navigate('OrderDetails', { orderId: notification.data.orderId });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        Alert.alert(tError('error'), t('user_not_authorized'));
        return;
      }

      const success = await notificationService.markAllNotificationsAsRead(authState.user.id);
      if (success) {
        // Обновляем локальное состояние - отмечаем все как прочитанные
        setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
        setUnreadCount(0);
        Alert.alert(t('success'), t('mark_all_read_success'));
      } else {
        Alert.alert(tError('error'), t('mark_all_read_error'));
      }
    } catch (error) {
      console.error('Ошибка отметки уведомлений:', error);
      Alert.alert(tError('error'), t('mark_notifications_error'));
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.notificationIcon}>
        <Text style={styles.notificationIconText}>
          {getNotificationIcon(item.notificationType)}
        </Text>
        {!item.isRead && <View style={styles.unreadIndicator} />}
      </View>

      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationTitle,
          !item.isRead && styles.unreadText
        ]}>
          {item.title}
        </Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notificationTime}>
          {getTimeAgo(item.createdAt, t)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🔔</Text>
      <Text style={styles.emptyStateTitle}>{t('no_notifications')}</Text>
      <Text style={styles.emptyStateDescription}>
        {t('notifications_description')}
      </Text>
    </View>
  );

  const renderHeader = () => {
    const hasUnreadNotifications = notifications.some(item => !item.isRead);

    return (
      <View style={styles.headerActions}>
        {hasUnreadNotifications && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <View style={styles.markAllButtonContent}>
              <SvgXml xml={checkCircleBrokenSvg} style={styles.markAllButtonIcon} />
              <Text style={styles.markAllButtonText}>
                {t('mark_all_read', { count: unreadCount })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack title={t('notifications')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('loading_notifications')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBack title={t('notifications')} />

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadNotifications(true)}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  contentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
  },
  headerActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  markAllButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  markAllButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllButtonIcon: {
    marginRight: 8,
  },
  markAllButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadNotification: {
    backgroundColor: '#ECFDF5', // светло-зеленый фон как в карточке "Отклик получен"
    borderColor: theme.colors.primary,
    borderWidth: 0.5,
    shadowColor: '#10B981', // зеленый glow
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  notificationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${theme.colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    position: 'relative',
  },
  notificationIconText: {
    fontSize: 20,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.surface,
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
  unreadText: {
    fontWeight: theme.fonts.weights.semiBold,
  },
  notificationBody: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  notificationTime: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});