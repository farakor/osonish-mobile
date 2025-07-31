import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { theme } from '../../constants';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { WorkerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CalendarDateIcon from '../../../assets/calendar-date.svg';
import { VideoView, useVideoPlayer } from 'expo-video';
import { HeaderWithBack, PriceConfirmationModal, ProposePriceModal } from '../../components/common';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { Order } from '../../types';

type JobDetailsRouteProp = RouteProp<WorkerStackParamList, 'JobDetails'>;
type NavigationProp = NativeStackNavigationProp<WorkerStackParamList>;

// Компонент для видео превью
const VideoPreview: React.FC<{ uri: string }> = ({ uri }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.play();
  });

  return (
    <VideoView
      style={styles.media}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
      contentFit="cover"
      nativeControls={false}
    />
  );
};

export const JobDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<JobDetailsRouteProp>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [customerName, setCustomerName] = useState('Заказчик');
  const [priceConfirmationVisible, setPriceConfirmationVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Загружаем заказ по ID
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);

        // Проверяем, откликнулся ли пользователь
        const applied = await orderService.hasUserAppliedToOrder(orderId);
        setHasApplied(applied);

        // Загружаем имя заказчика
        if (orderData) {
          const customer = await authService.findUserById(orderData.customerId);
          if (customer) {
            setCustomerName(`${customer.lastName} ${customer.firstName.charAt(0)}.`);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки заказа:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить данные заказа');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatBudget = (budget: number) => {
    return budget.toLocaleString('ru-RU');
  };

  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} мин назад`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ч назад`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} дн назад`;
    }
  };

  const handleApplyToJob = async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        Alert.alert('Ошибка', 'Необходимо войти в систему');
        return;
      }

      if (!order) {
        Alert.alert('Ошибка', 'Заказ не найден');
        return;
      }

      // Показываем модалку подтверждения цены
      setPriceConfirmationVisible(true);
    } catch (error) {
      console.error('Ошибка при открытии формы отклика:', error);
      Alert.alert('Ошибка', 'Произошла ошибка');
    }
  };

  const handleAcceptPrice = async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user || !order) {
        Alert.alert('Ошибка', 'Необходимо войти в систему');
        return;
      }

      // Закрываем модалку подтверждения
      setPriceConfirmationVisible(false);

      // Создаем отклик с исходной ценой заказа
      const applicantCreated = await orderService.createApplicant({
        orderId: order.id,
        workerId: authState.user.id,
        message: '',
        proposedPrice: order.budget
      });

      if (applicantCreated) {
        setHasApplied(true);
        Alert.alert(
          'Успешно!',
          'Отклик отправлен, ожидайте решение заказчика.',
          [{ text: 'ОК' }]
        );
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить отклик');
      }
    } catch (error) {
      console.error('Ошибка отклика на заказ:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при отправке отклика');
    }
  };

  const handleProposePrice = () => {
    // Закрываем модалку подтверждения и показываем модалку предложения цены
    setPriceConfirmationVisible(false);
    setModalVisible(true);
  };

  const handleSubmitProposal = async (proposedPrice: number, message: string) => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user || !order) {
        Alert.alert('Ошибка', 'Необходимо войти в систему');
        return;
      }

      // Создаем отклик с предложенной ценой
      const applicantCreated = await orderService.createApplicant({
        orderId: order.id,
        workerId: authState.user.id,
        message: message,
        proposedPrice: proposedPrice
      });

      if (applicantCreated) {
        setHasApplied(true);
        Alert.alert(
          'Успешно!',
          'Отклик отправлен, ожидайте решение заказчика.',
          [{ text: 'ОК' }]
        );
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить отклик');
      }
    } catch (error) {
      console.error('Ошибка отклика на заказ:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при отправке отклика');
    }
  };

  // Состояния загрузки и ошибок
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загружаем данные заказа...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Заказ не найден</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <HeaderWithBack />

        {/* Order Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{order.title}</Text>
          <Text style={styles.budget}>{formatBudget(order.budget)} сум</Text>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация о заказе</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Категория:</Text>
            <Text style={styles.infoValue}>{order.category}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Работников:</Text>
            <Text style={styles.infoValue}>{order.workersNeeded}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Дата:</Text>
            <View style={styles.dateValue}>
              <CalendarDateIcon width={16} height={16} stroke={theme.colors.text.primary} />
              <Text style={styles.infoValue}>{formatDate(order.serviceDate)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Местоположение:</Text>
            <Text style={styles.infoValue}>{order.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Заказчик:</Text>
            <Text style={styles.infoValue}>{customerName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Откликов:</Text>
            <Text style={styles.infoValue}>{order.applicantsCount}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Создан:</Text>
            <Text style={styles.infoValue}>{formatCreatedAt(order.createdAt)}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.description}>{order.description}</Text>
        </View>

        {/* Photos/Videos */}
        {order.photos && order.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Фото и видео</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaContainer}>
              {order.photos.map((photo, index) => {
                const isVideo = photo.includes('.mp4') || photo.includes('.mov');
                return (
                  <View key={index} style={styles.mediaWrapper}>
                    {isVideo ? (
                      <VideoPreview uri={photo} />
                    ) : (
                      <Image source={{ uri: photo }} style={styles.media} />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.applyButton,
            hasApplied && styles.appliedButton
          ]}
          onPress={hasApplied ? undefined : handleApplyToJob}
          disabled={hasApplied}
        >
          <Text style={[
            styles.applyButtonText,
            hasApplied && styles.appliedButtonText
          ]}>
            {hasApplied ? 'Отклик отправлен' : 'Откликнуться'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Модалка подтверждения цены */}
      <PriceConfirmationModal
        visible={priceConfirmationVisible}
        onClose={() => setPriceConfirmationVisible(false)}
        onAcceptPrice={handleAcceptPrice}
        onProposePrice={handleProposePrice}
        orderPrice={order?.budget || 0}
        orderTitle={order?.title || ''}
      />

      {/* Модалка предложения цены */}
      <ProposePriceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitProposal}
        originalPrice={order?.budget || 0}
        orderTitle={order?.title || ''}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  errorButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
  },
  errorButtonText: {
    color: theme.colors.background,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  titleSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  budget: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
    flex: 2,
    textAlign: 'right',
  },
  dateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  description: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  mediaContainer: {
    marginTop: theme.spacing.sm,
  },
  mediaWrapper: {
    marginRight: theme.spacing.md,
  },
  media: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  bottomSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  appliedButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  applyButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.background,
  },
  appliedButtonText: {
    color: theme.colors.text.secondary,
  },
}); 