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
import { useTranslation } from '../../hooks/useTranslation';

// SVG иконка check-circle-broken
const checkCircleBrokenSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path opacity="0.12" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#679B00"/>
<path d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572M22 4L12 14.01L9 11.01" stroke="#679B00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// SVG иконка empty-state-notifications
const emptyStateNotificationsSvg = `<svg width="161" height="160" viewBox="0 0 161 160" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M101.271 106.624V137.954C101.155 137.954 99.6405 138.537 99.5241 138.537C99.4076 138.537 99.2911 138.537 99.2911 138.653C99.1746 138.653 99.0582 138.653 98.9417 138.769C96.4959 139.468 93.0018 140.051 92.303 140.167V106.624H101.271Z" fill="white"/>
<path d="M109.424 106.624V134.693C108.842 135.042 107.793 135.392 106.978 135.858H106.862C105.347 136.557 103.6 137.255 100.572 138.187V106.74H109.424V106.624Z" fill="#D5DAE5"/>
<path d="M76.6961 128.986C75.0655 131.432 73.0856 135.392 71.9209 138.653C71.8044 138.886 71.6879 139.235 71.6879 139.468C70.8726 139.352 70.0574 139.119 69.2421 138.886C68.5433 137.255 68.0774 135.508 68.0774 135.508C68.5433 134.926 68.8927 134.46 69.3585 133.994C71.5715 131.315 73.9008 129.452 76.6961 128.986Z" fill="#AAB2C5"/>
<path d="M72.3867 139.585C72.1538 139.585 71.9208 139.468 71.6879 139.468C70.8726 139.352 70.0573 139.119 69.2421 138.886C68.6597 138.769 68.1938 138.536 67.6115 138.42C67.3786 138.304 67.1456 138.304 66.9127 138.187C66.6797 138.071 66.4468 138.071 66.0974 137.954C63.0692 137.022 60.1575 135.741 57.3622 134.344C54.4505 129.452 52.8199 123.512 50.0247 115.243C50.0247 115.126 50.0247 115.126 49.9082 115.01C49.9082 115.01 50.1411 115.01 50.7235 115.243C51.0729 115.476 51.6552 115.709 52.3541 116.174C53.7517 117.106 55.9646 118.737 59.2257 121.416C63.3021 124.793 66.7962 129.801 69.2421 133.878C70.2903 135.741 71.222 137.372 71.9208 138.653C72.1538 138.886 72.2702 139.235 72.3867 139.585Z" fill="#D5DAE5"/>
<path d="M67.6117 138.304C67.3788 138.187 67.1458 138.187 66.9129 138.071C66.68 137.954 66.447 137.954 66.0976 137.838C60.74 127.123 54.6837 120.251 51.1896 116.291C50.8402 115.825 50.4908 115.476 50.1414 115.126C50.1414 115.01 50.1414 115.01 50.0249 114.893C50.0249 114.893 50.2578 114.893 50.8402 115.126C51.1896 115.359 51.7719 115.592 52.4707 116.058C56.0813 120.251 62.2541 127.355 67.6117 138.304Z" fill="#F1F3FA"/>
<path d="M122.003 113.263C122.003 113.263 121.886 113.496 121.653 113.962C120.256 116.524 115.597 125.026 113.384 132.48C113.268 132.48 113.268 132.597 113.151 132.597C113.151 132.597 113.035 132.713 112.918 132.713C110.822 133.994 108.143 135.159 106.978 135.741H106.862C103.368 137.372 99.6407 138.42 99.4077 138.42C101.155 132.713 103.717 127.588 107.328 123.279C108.026 122.464 108.725 121.648 109.424 120.95C109.541 120.833 109.657 120.717 109.773 120.6C112.802 117.572 115.946 115.592 118.974 114.311C119.324 114.194 119.673 113.962 120.023 113.845C120.372 113.612 120.954 113.496 121.537 113.263C121.77 113.379 121.886 113.263 122.003 113.263Z" fill="#D5DAE5"/>
<path d="M121.886 113.03C121.886 113.03 121.77 113.147 121.653 113.496C121.653 113.612 121.537 113.612 121.537 113.729C115.48 119.086 110.705 128.055 107.677 135.509C107.444 135.625 107.211 135.741 106.978 135.858H106.862C106.629 135.974 106.279 136.091 106.046 136.207C106.163 135.974 106.279 135.858 106.279 135.858C107.793 132.131 111.87 121.532 118.974 114.428C119.207 114.195 119.44 113.962 119.673 113.729C120.489 113.496 121.187 113.263 121.886 113.03Z" fill="#F1F3FA"/>
<path d="M141.453 83.0972C141.453 104.295 129.69 123.163 113.151 132.597C113.151 132.597 113.035 132.713 112.918 132.713C110.822 133.994 108.143 135.159 106.978 135.741H106.862C105.93 136.091 100.339 138.42 99.4077 138.42C99.2912 138.42 99.1747 138.42 99.1747 138.536C99.0583 138.536 98.9418 138.536 98.8253 138.653C96.3795 139.352 92.8854 139.934 92.1866 140.051C92.1866 140.4 81.4714 141.448 72.3869 139.468C71.2222 139.468 63.7682 137.488 57.2459 134.227C38.8438 124.677 26.1487 105.343 26.1487 83.0972C26.1487 51.3012 52.0048 25.5615 83.8008 25.5615C115.713 25.5615 141.453 51.3012 141.453 83.0972Z" fill="#F1F3FA"/>
<path d="M145.879 71.4504V107.09H118.043V107.206H62.2542V43.1485H115.248C115.946 43.032 116.645 43.032 117.46 43.032C118.392 43.032 119.207 43.032 120.139 43.1485C121.304 43.2649 122.352 43.3814 123.4 43.6143C128.874 44.779 133.766 47.5743 137.493 51.3013C142.734 56.5424 145.879 63.647 145.879 71.4504Z" fill="url(#paint0_linear_6007_1871)"/>
<path d="M135.164 81.234C138.658 81.234 141.569 78.4387 141.569 74.8282C141.569 71.2176 138.658 68.4224 135.164 68.4224C131.67 68.4224 128.758 71.2176 128.758 74.8282C128.758 78.4387 131.553 81.234 135.164 81.234Z" fill="#AAB2C5"/>
<path d="M136.212 80.4185C139.822 80.4185 142.85 77.6233 142.85 74.0127C142.85 70.4022 139.939 67.6069 136.212 67.6069C132.601 67.6069 129.573 70.4022 129.573 74.0127C129.573 77.6233 132.485 80.4185 136.212 80.4185Z" fill="#D5DAE5"/>
<path d="M136.561 80.4185C140.055 80.4185 142.967 77.6233 142.967 74.0127C142.967 70.4022 140.055 67.6069 136.561 67.6069C133.067 67.6069 130.156 70.4022 130.156 74.0127C130.156 77.6233 132.951 80.4185 136.561 80.4185Z" fill="#F1F3FA"/>
<path d="M136.561 76.4586C137.959 76.4586 139.007 75.4104 139.007 74.0127C139.007 72.6151 137.959 71.5669 136.561 71.5669C135.163 71.5669 134.115 72.6151 134.115 74.0127C134.115 75.4104 135.163 76.4586 136.561 76.4586Z" fill="#D5DAE5"/>
<path d="M89.9736 68.6551V107.206H33.1367V68.6551C33.1367 56.5424 41.7554 46.2931 53.0529 43.7308C54.9164 43.2649 56.7799 43.1484 58.7599 43.1484H64.5833C77.3949 43.1484 87.8771 52.466 89.8571 64.6952C89.8571 65.8599 89.9736 67.2575 89.9736 68.6551Z" fill="#AAB2C5"/>
<path opacity="0.7" d="M89.9738 74.3623L89.6244 65.0448C87.6444 52.8156 77.0457 43.498 64.3506 43.498H58.5271C56.5472 43.498 54.6837 43.731 52.8201 44.0804L52.1213 44.6627L66.447 103.713L89.7408 104.994L89.9738 74.3623Z" fill="url(#paint1_linear_6007_1871)"/>
<path d="M89.8571 64.6952C87.8771 52.466 77.2785 43.1484 64.5833 43.1484H58.7599C56.7799 43.1484 54.9164 43.2649 53.0529 43.7308C41.639 46.2931 33.1367 56.4259 33.1367 68.6551V107.206H89.9736V68.6551C89.9736 67.2575 89.8571 65.8599 89.8571 64.6952ZM87.6442 104.877H35.4661V68.6551C35.4661 57.94 43.0366 48.3895 53.6353 46.0602C55.1494 45.7108 56.6635 45.5943 58.7599 45.5943H64.5833C75.9973 45.5943 85.6642 53.7471 87.5277 65.0446C87.5277 65.5105 87.5277 66.0928 87.5277 66.6752C87.5277 67.374 87.5277 68.0728 87.5277 68.7716V104.877H87.6442Z" fill="#AAB2C5"/>
<path d="M106.279 72.3823H136.911C137.842 72.3823 138.541 73.0811 138.541 74.0129C138.541 74.9446 137.842 75.6435 136.911 75.6435H106.279V72.3823Z" fill="#D5DAE5"/>
<path d="M105.231 56.7756C105.581 56.3097 106.396 56.5426 106.396 57.2415V72.266V75.76H93.8171V57.2415C93.8171 56.6591 94.516 56.3097 94.9818 56.7756L99.0582 61.6673C99.6406 62.3661 100.689 62.3661 101.271 61.6673L105.231 56.7756Z" fill="#F1F3FA"/>
<path d="M23.4698 30.5701C21.9557 37.6747 21.1404 44.8958 21.0239 52.1168C20.9075 58.7556 20.9075 66.0931 22.8874 72.4989C25.3333 80.6517 32.9038 88.8046 42.2213 86.3587C47.3459 84.9611 51.5388 80.5353 52.7035 75.0612C53.4023 71.5671 52.3541 67.4907 49.5588 65.3943C46.5306 63.4143 42.1048 63.8802 39.426 66.326C36.5143 68.7719 35.3496 72.4989 35.4661 76.1094C35.5826 79.72 36.9802 83.214 38.6108 86.3587C43.5025 95.3268 68.8927 90.5516 87.7607 88.3387" stroke="#D5DAE5" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="4 4"/>
<path d="M14.3853 24.7464C14.9676 27.0758 17.5299 27.8911 20.0922 26.4935C22.8875 25.0958 24.751 24.1641 24.1687 21.9512C23.5863 19.8547 21.024 19.6218 18.1123 19.3889C14.5017 19.0394 13.8029 22.417 14.3853 24.7464Z" fill="#D5DAE5"/>
<path d="M34.7672 26.843C33.8355 28.823 30.8073 29.9877 28.7109 28.0077C26.3815 25.9112 24.6344 24.5136 25.5662 22.3007C26.4979 20.3207 28.3614 20.9031 31.8555 21.4854C34.7672 22.1842 35.9319 24.7466 34.7672 26.843Z" fill="#D5DAE5"/>
<path d="M25.4499 19.0395C23.9358 18.8065 22.5381 19.6218 22.0722 21.0195C21.9558 21.3689 21.7228 21.9512 21.7228 22.5336C21.3734 25.4453 22.3052 28.0076 24.0522 28.2405C25.7993 28.4735 27.5463 26.2606 28.0122 23.5818C28.0122 22.7665 28.0122 22.1841 28.0122 21.6018C27.8957 20.2042 26.8475 19.2724 25.4499 19.0395C25.4499 19.0395 25.3334 19.0395 25.4499 19.0395Z" fill="#AAB2C5"/>
<path d="M94.5159 107.207H93.1182C93.7006 108.604 94.05 110.817 94.2829 113.496C92.6524 113.845 89.6242 113.379 87.7607 111.982C87.1783 109.885 86.7124 108.255 86.2466 107.207H84.7325C85.0819 107.789 85.6642 109.652 86.363 112.331C83.8007 114.777 82.1701 113.845 77.162 111.399C76.6961 111.166 76.1138 110.817 75.4149 110.584C74.2503 109.187 73.3185 108.022 72.3867 107.207H70.1738C71.1056 107.789 72.3867 108.954 73.7844 110.584C66.4468 116.175 59.8081 113.729 56.1976 112.448C55.6152 112.215 55.1493 112.098 54.6835 111.982C50.7235 109.885 47.113 108.255 44.0848 107.207H39.426V107.323C45.133 108.255 58.5269 115.126 70.5232 122.93V123.046H70.6397C79.7243 128.986 87.9936 135.509 91.1382 140.284L92.3029 140.167V140.284V140.167C92.5359 140.167 92.8853 140.051 93.1182 140.051C93.3512 140.051 93.5841 139.934 93.7006 139.934C93.4676 138.886 92.6523 134.693 91.6041 129.569C92.1865 129.918 92.8853 130.267 93.817 130.267C94.05 130.267 94.2829 130.267 94.3994 130.267C94.2829 133.994 94.1664 137.488 93.9335 140.051C94.3994 139.934 94.8653 139.934 95.3311 139.818C95.6805 133.994 96.7288 114.311 94.5159 107.207ZM94.2829 114.894C94.3994 116.641 94.5159 118.504 94.5159 120.368C93.0018 121.066 92.07 120.251 90.6724 118.737C90.2065 118.155 89.6242 117.572 89.0418 117.223C88.8089 116.058 88.4595 115.01 88.2265 113.962C90.09 114.777 92.5359 115.126 94.2829 114.894ZM87.9936 119.203C88.4595 121.416 89.0418 123.862 89.5077 126.307C89.1583 126.307 88.9253 126.54 88.6924 126.657C88.2265 127.006 87.5277 127.356 85.8971 126.89C85.3148 125.842 84.7325 124.793 84.1501 123.862C83.4513 122.58 82.636 121.416 82.0537 120.368C84.7325 120.484 86.4795 120.135 87.9936 119.203ZM86.7124 113.845C87.0618 115.01 87.2948 116.291 87.6442 117.689C86.363 118.737 84.7325 119.203 81.1219 118.737C79.7243 116.641 78.4431 114.661 77.2784 113.03C81.4713 115.126 83.8007 116.175 86.7124 113.845ZM60.6234 115.243C61.6716 115.476 62.7198 115.592 63.8845 115.592C67.1456 115.592 70.7562 114.661 74.5997 111.749C76.2302 113.845 77.9773 116.408 79.7243 119.203C77.6279 121.183 74.1338 121.416 71.1056 121.649C67.6115 119.319 64.001 117.223 60.6234 115.243ZM72.9691 122.813C75.6479 122.58 78.5596 122.115 80.4231 120.368C81.8207 122.58 83.2184 125.026 84.616 127.356C84.0336 128.52 82.869 128.753 80.3066 128.171C78.0937 126.307 75.5314 124.56 72.9691 122.813ZM82.636 129.802C83.6842 129.802 84.7325 129.569 85.5477 128.637C87.0618 131.316 88.5759 133.994 89.7406 136.091C87.7607 134.111 85.3148 132.014 82.636 129.802ZM91.7206 137.256C90.4394 134.81 88.6924 131.549 86.8289 128.404C88.1101 128.52 88.8089 128.054 89.3912 127.822C89.5077 127.822 89.5077 127.705 89.6242 127.705C89.6242 127.705 89.7406 127.822 89.8571 127.938C90.5559 131.083 91.1382 134.344 91.7206 137.256ZM94.3994 128.637C93.1182 128.986 92.07 128.287 91.1382 127.356C90.6724 124.793 90.09 122.231 89.5077 119.669L89.6242 119.785C90.7888 121.066 92.3029 122.58 94.5159 121.998C94.5159 124.095 94.5159 126.424 94.3994 128.637Z" fill="#AAB2C5"/>
<defs>
<linearGradient id="paint0_linear_6007_1871" x1="104.073" y1="45.2613" x2="104.073" y2="81.2818" gradientUnits="userSpaceOnUse">
<stop stop-color="#B0BACC"/>
<stop offset="1" stop-color="#969EAE"/>
</linearGradient>
<linearGradient id="paint1_linear_6007_1871" x1="88.534" y1="73.5161" x2="64.5341" y2="74.6342" gradientUnits="userSpaceOnUse">
<stop stop-color="#42465A"/>
<stop offset="1" stop-color="#575E84" stop-opacity="0"/>
</linearGradient>
</defs>
</svg>`;

const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'new_order':
      return '🆕';
    case 'order_update':
      return '✅';
    case 'order_completed':
      return '🏁';
    case 'new_application':
      return '📝';
    default:
      return '🔔';
  }
};

const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'только что';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes === 1) {
      return '1 минуту назад';
    } else if (minutes < 5) {
      return `${minutes} минуты назад`;
    } else {
      return `${minutes} минут назад`;
    }
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    if (hours === 1) {
      return '1 час назад';
    } else if (hours < 5) {
      return `${hours} часа назад`;
    } else {
      return `${hours} часов назад`;
    }
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    if (days === 1) return 'вчера';
    if (days < 7) return `${days} дней назад`;

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
  const { t } = useTranslation();
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
        Alert.alert('Ошибка', 'Пользователь не авторизован');
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
      Alert.alert('Ошибка', 'Не удалось загрузить уведомления');
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

  const handleNotificationPress = useCallback(async (notification: NotificationItem) => {
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
      (navigation as any).navigate('JobDetails', { orderId: notification.data.orderId });
    }
  }, [navigation]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        Alert.alert('Ошибка', 'Пользователь не авторизован');
        return;
      }

      const success = await notificationService.markAllNotificationsAsRead(authState.user.id);
      if (success) {
        // Обновляем локальное состояние - отмечаем все как прочитанные
        setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
        setUnreadCount(0);
        Alert.alert('Успешно', 'Все уведомления отмечены как прочитанные');
      } else {
        Alert.alert('Ошибка', 'Не удалось отметить уведомления как прочитанные');
      }
    } catch (error) {
      console.error('Ошибка отметки уведомлений:', error);
      Alert.alert('Ошибка', 'Произошла ошибка');
    }
  }, []);

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
          {getTimeAgo(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <SvgXml xml={emptyStateNotificationsSvg} style={styles.emptyStateIcon} />
      <Text style={styles.emptyStateTitle}>{t('notifications.no_notifications_title')}</Text>
      <Text style={styles.emptyStateDescription}>
        {t('notifications.no_notifications_description')}
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
                {t('notifications.mark_all_read_button', { count: unreadCount })}
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
        <HeaderWithBack title={t('notifications.title')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('notifications.loading_notifications')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBack title={t('notifications.title')} />

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
    width: 80,
    height: 80,
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