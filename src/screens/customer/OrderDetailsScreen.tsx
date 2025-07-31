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
  Modal,
  Dimensions,
} from 'react-native';
import { theme } from '../../constants';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CustomerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CalendarDateIcon from '../../../assets/calendar-date.svg';
import UserIcon from '../../../assets/user-01.svg';
import HomeIcon from '../../../assets/home-02.svg';
import { VideoView, useVideoPlayer } from 'expo-video';
import { HeaderWithBack } from '../../components/common';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { Order, Applicant, User } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // 24px margin on each side

type OrderDetailsRouteProp = RouteProp<CustomerStackParamList, 'OrderDetails'>;
type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

// Компонент для превью видео
const VideoPreview: React.FC<{ uri: string }> = ({ uri }) => {
  const player = useVideoPlayer(uri);
  return (
    <VideoView
      player={player}
      style={styles.mediaImage}
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
          console.log(`[OrderDetails] ✅ Изображение ${index + 1} загружено`);
          setIsLoading(false);
        }}
        onError={(error) => {
          console.error(`[OrderDetails] ❌ Ошибка загрузки изображения ${index + 1}:`, error.nativeEvent.error);
          console.error(`[OrderDetails] URL: ${uri}`);
          setHasError(true);
          setIsLoading(false);
        }}
        onLoadStart={() => {
          console.log(`[OrderDetails] 🔄 Начинаем загрузку изображения ${index + 1}`);
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

export const OrderDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OrderDetailsRouteProp>();
  const { orderId } = route.params;

  const [showApplicants, setShowApplicants] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Загружаем заказ по ID
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);

        // Получаем информацию о текущем пользователе
        const authState = authService.getAuthState();
        if (authState.user) {
          setCurrentUser(authState.user);
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

  // Загружаем отклики для заказа
  useEffect(() => {
    const loadApplicants = async () => {
      if (!orderId) return;

      try {
        setApplicantsLoading(true);
        const orderApplicants = await orderService.getApplicantsForOrder(orderId);
        setApplicants(orderApplicants);
        console.log(`[OrderDetailsScreen] Загружено ${orderApplicants.length} откликов для заказа ${orderId}`);
      } catch (error) {
        console.error('Ошибка загрузки откликов:', error);
      } finally {
        setApplicantsLoading(false);
      }
    };

    loadApplicants();
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

  const handleDeleteOrder = () => {
    Alert.alert(
      'Удалить заказ',
      'Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: API запрос для удаления заказа
              await new Promise(resolve => setTimeout(resolve, 1000));
              Alert.alert('Успешно', 'Заказ удален');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить заказ');
            }
          }
        }
      ]
    );
  };

  const handleAcceptApplicant = async (applicantId: string) => {
    try {
      const success = await orderService.updateApplicantStatus(applicantId, 'accepted');
      if (success) {
        Alert.alert('Успешно', 'Отклик принят');
        // Обновляем список откликов
        const updatedApplicants = await orderService.getApplicantsForOrder(orderId);
        setApplicants(updatedApplicants);
      } else {
        Alert.alert('Ошибка', 'Не удалось принять отклик');
      }
    } catch (error) {
      console.error('Ошибка принятия отклика:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при принятии отклика');
    }
  };

  const handleRejectApplicant = async (applicantId: string) => {
    try {
      const success = await orderService.updateApplicantStatus(applicantId, 'rejected');
      if (success) {
        Alert.alert('Успешно', 'Отклик отклонен');
        // Обновляем список откликов
        const updatedApplicants = await orderService.getApplicantsForOrder(orderId);
        setApplicants(updatedApplicants);
      } else {
        Alert.alert('Ошибка', 'Не удалось отклонить отклик');
      }
    } catch (error) {
      console.error('Ошибка отклонения отклика:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при отклонении отклика');
    }
  };

  const renderApplicant = ({ item }: { item: Applicant }) => {
    const formatAppliedAt = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} мин назад`;
      } else if (diffHours < 24) {
        return `${diffHours} ч назад`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} дн назад`;
      }
    };

    const formatPrice = (price: number) => {
      return price.toLocaleString('ru-RU');
    };

    return (
      <View style={styles.applicantCard}>
        <View style={styles.applicantHeader}>
          <View style={styles.applicantInfo}>
            <Text style={styles.applicantName}>{item.workerName}</Text>
            <View style={styles.applicantStats}>
              <Text style={styles.applicantRating}>⭐ {item.rating?.toFixed(1) || '4.5'}</Text>
              <Text style={styles.applicantJobs}>• {item.completedJobs || 0} заказов</Text>
            </View>
          </View>
          <Text style={styles.applicantTime}>{formatAppliedAt(item.appliedAt)}</Text>
        </View>

        {/* Предложенная цена */}
        {item.proposedPrice && (
          <View style={styles.proposedPriceContainer}>
            <Text style={styles.proposedPriceLabel}>Предложенная цена:</Text>
            <Text style={styles.proposedPriceValue}>
              {formatPrice(item.proposedPrice)} сум
              {order && item.proposedPrice !== order.budget && (
                <Text style={[
                  styles.priceDifference,
                  { color: item.proposedPrice > order.budget ? '#FF6B6B' : '#4ECDC4' }
                ]}>
                  {' '}({item.proposedPrice > order.budget ? '+' : ''}{formatPrice(item.proposedPrice - order.budget)})
                </Text>
              )}
            </Text>
          </View>
        )}

        {/* Комментарий исполнителя */}
        {item.message && item.message.trim() && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Комментарий:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        <View style={styles.applicantActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptApplicant(item.id)}
          >
            <Text style={styles.acceptButtonText}>Принять</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectApplicant(item.id)}
          >
            <Text style={styles.rejectButtonText}>Отклонить</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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

        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
              {currentUser?.profileImage ? (
                <Image source={{ uri: currentUser.profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <UserIcon width={24} height={24} stroke={theme.colors.text.secondary} />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {currentUser ? `${currentUser.lastName} ${currentUser.firstName}` : 'Пользователь'}
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

        {/* Applicants Preview */}
        {applicants.length > 0 && (
          <View style={styles.applicantsPreviewSection}>
            <View style={styles.applicantsHeader}>
              <Text style={styles.applicantsTitle}>Отклики ({applicants.length})</Text>
              <TouchableOpacity onPress={() => setShowApplicants(true)}>
                <Text style={styles.viewAllText}>Посмотреть все</Text>
              </TouchableOpacity>
            </View>

            {applicants.slice(0, 2).map((applicant) => (
              <View key={applicant.id} style={styles.applicantPreview}>
                <View style={styles.applicantPreviewHeader}>
                  <Text style={styles.applicantPreviewName}>{applicant.workerName}</Text>
                  <Text style={styles.applicantPreviewRating}>⭐ {applicant.rating?.toFixed(1) || '4.5'}</Text>
                </View>
                {applicant.proposedPrice && (
                  <Text style={styles.applicantPreviewPrice}>
                    {formatBudget(applicant.proposedPrice)} сум
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => setShowApplicants(true)}
        >
          <Text style={styles.manageButtonText}>
            Управление откликами {applicants.length > 0 ? `(${applicants.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Applicants Modal */}
      <Modal
        visible={showApplicants}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Отклики ({applicants.length})</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowApplicants(false)}
            >
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={applicants}
            renderItem={renderApplicant}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.applicantsList}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
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

  // Applicants Preview Section
  applicantsPreviewSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  applicantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  applicantsTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  viewAllText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  applicantPreview: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  applicantPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  applicantPreviewName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },
  applicantPreviewRating: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  applicantPreviewPrice: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },

  // Bottom Section
  bottomSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  manageButton: {
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
  manageButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  closeButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  applicantsList: {
    padding: theme.spacing.lg,
  },
  applicantCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  applicantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  applicantStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantRating: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  applicantJobs: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  applicantTime: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  applicantActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rejectButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  proposedPriceContainer: {
    backgroundColor: '#f8f9fa',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  proposedPriceLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    fontWeight: theme.fonts.weights.medium,
  },
  proposedPriceValue: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.semiBold,
  },
  priceDifference: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  messageContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  messageLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    fontWeight: theme.fonts.weights.medium,
  },
  messageText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    lineHeight: 20,
    backgroundColor: '#f8f9fa',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
}); 