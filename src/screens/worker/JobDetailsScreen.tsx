import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { theme } from '../../constants';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { WorkerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CalendarDateIcon from '../../../assets/calendar-date.svg';
import UserIcon from '../../../assets/user-01.svg';
import HomeIcon from '../../../assets/home-02.svg';
import { VideoView, useVideoPlayer } from 'expo-video';
import { HeaderWithBack, PriceConfirmationModal, ProposePriceModal } from '../../components/common';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { Order, User } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // 24px margin on each side

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
      style={styles.mediaImage}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
      contentFit="cover"
      nativeControls={false}
    />
  );
};

// Компонент для изображения с обработкой ошибок
const SafeImage: React.FC<{ uri: string; index: number }> = ({ uri, index }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <View style={[styles.mediaImage, styles.errorContainer]}>
        <Text style={styles.errorText}>❌</Text>
        <Text style={styles.errorSubtext}>Ошибка загрузки</Text>
      </View>
    );
  }

  return (
    <View style={styles.mediaImageContainer}>
      <Image
        source={{ uri }}
        style={styles.mediaImage}
        resizeMode="cover"
        onLoad={() => {
          console.log(`[JobDetails] ✅ Изображение ${index + 1} загружено`);
          setIsLoading(false);
        }}
        onError={(error) => {
          console.error(`[JobDetails] ❌ Ошибка загрузки изображения ${index + 1}:`, error.nativeEvent.error);
          console.error(`[JobDetails] URL: ${uri}`);
          setHasError(true);
          setIsLoading(false);
        }}
        onLoadStart={() => {
          console.log(`[JobDetails] 🔄 Начинаем загрузку изображения ${index + 1}`);
          setIsLoading(true);
        }}
      />
      {isLoading && (
        <View style={[styles.mediaImage, styles.loadingOverlay]}>
          <Text style={styles.loadingText}>⏳</Text>
        </View>
      )}
    </View>
  );
};

// Компонент галереи изображений
const ImageGallery: React.FC<{ photos: string[] }> = ({ photos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const renderPhoto = ({ item, index }: { item: string; index: number }) => {
    const isVideo = /\.(mp4|mov|avi|mkv|webm|m4v|3gp|flv|wmv)(\?|$)/i.test(item) ||
      item.includes('video') ||
      item.includes('/video/') ||
      item.includes('_video_');

    return (
      <View style={styles.photoContainer}>
        {isVideo ? (
          <VideoPreview uri={item} />
        ) : (
          <SafeImage uri={item} index={index} />
        )}
      </View>
    );
  };

  const onScroll = (event: any) => {
    const slideSize = CARD_WIDTH;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  return (
    <View style={styles.galleryContainer}>
      <FlatList
        ref={flatListRef}
        data={photos}
        renderItem={renderPhoto}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item, index) => index.toString()}
      />

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonLeft]}
            onPress={goToPrevious}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.navButtonRight]}
            onPress={goToNext}
            disabled={currentIndex === photos.length - 1}
          >
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Dots indicator */}
      {photos.length > 1 && (
        <View style={styles.dotsContainer}>
          {photos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.activeDot : styles.inactiveDot
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export const JobDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<JobDetailsRouteProp>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [customer, setCustomer] = useState<User | null>(null);
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

        // Загружаем информацию о заказчике
        if (orderData) {
          const customerData = await authService.findUserById(orderData.customerId);
          if (customerData) {
            setCustomer(customerData);
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
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatBudget = (budget: number) => {
    return budget.toLocaleString('ru-RU');
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

        {/* Customer Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
              {customer?.profileImage ? (
                <Image source={{ uri: customer.profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <UserIcon width={24} height={24} stroke={theme.colors.text.secondary} />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {customer ? `${customer.lastName} ${customer.firstName}` : 'Заказчик'}
              </Text>
              <Text style={styles.profileRole}>Заказчик</Text>
            </View>
          </View>
        </View>

        {/* Order Title */}
        <View style={styles.titleSection}>
          <Text style={styles.orderTitle}>{order.title}</Text>
        </View>

        {/* Image Gallery */}
        {order.photos && order.photos.length > 0 && (
          <View style={styles.gallerySection}>
            <ImageGallery photos={order.photos} />
          </View>
        )}

        {/* Info Grid */}
        <View style={styles.infoSection}>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Text style={styles.iconText}>💰</Text>
              </View>
              <Text style={styles.infoValue}>{formatBudget(order.budget)}</Text>
              <Text style={styles.infoLabel}>Бюджет</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Text style={styles.iconText}>🏷️</Text>
              </View>
              <Text style={styles.infoValue}>{order.category}</Text>
              <Text style={styles.infoLabel}>Категория</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <HomeIcon width={20} height={20} stroke={theme.colors.primary} />
              </View>
              <Text style={styles.infoValue}>{order.location}</Text>
              <Text style={styles.infoLabel}>Район</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <CalendarDateIcon width={20} height={20} stroke={theme.colors.primary} />
              </View>
              <Text style={styles.infoValue}>{formatDate(order.serviceDate)}</Text>
              <Text style={styles.infoLabel}>Дата</Text>
            </View>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Детали</Text>
          <Text style={styles.detailsText}>{order.description}</Text>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
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
            {hasApplied ? 'Отклик отправлен' : 'Подать заявку'}
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
  errorSubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  errorButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
  },

  // Profile Section
  profileSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  profileRole: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },

  // Title Section
  titleSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  orderTitle: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    lineHeight: 32,
  },

  // Gallery Section
  gallerySection: {
    marginBottom: theme.spacing.lg,
  },
  galleryContainer: {
    position: 'relative',
  },
  photoContainer: {
    width: CARD_WIDTH,
    height: 240,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaImageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navButtonLeft: {
    left: theme.spacing.xl,
  },
  navButtonRight: {
    right: theme.spacing.xl,
  },
  navButtonText: {
    fontSize: 24,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.bold,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: theme.spacing.md,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  // Info Section
  infoSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoCard: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconText: {
    fontSize: 20,
  },
  infoValue: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Details Section
  detailsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  detailsTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  detailsText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },

  // Bottom Section
  bottomSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appliedButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  applyButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.white,
  },
  appliedButtonText: {
    color: theme.colors.text.secondary,
  },
}); 