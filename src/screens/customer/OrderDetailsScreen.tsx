import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Pressable,
  Animated,
  StatusBar,
  Linking,
} from 'react-native';
import { theme } from '../../constants';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { CustomerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CalendarIcon from '../../../assets/card-icons/calendar.svg';
import LocationIcon from '../../../assets/card-icons/location.svg';
import CategoryIcon from '../../../assets/card-icons/category.svg';
import BankNoteIcon from '../../../assets/card-icons/bank-note-01.svg';
import UserIcon from '../../../assets/user-01.svg';
import { VideoView, useVideoPlayer } from 'expo-video';
import { HeaderWithBack, MediaViewer } from '../../components/common';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { supabase } from '../../services/supabaseClient';
import { Order, Applicant, User } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // 24px margin on each side

type OrderDetailsRouteProp = RouteProp<CustomerStackParamList, 'OrderDetails'>;
type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

// Вспомогательная функция для определения видео файлов
const isVideoFile = (uri: string): boolean => {
  return /\.(mp4|mov|avi|mkv|webm|m4v|3gp|flv|wmv)(\?|$)/i.test(uri) ||
    uri.includes('video') ||
    uri.includes('/video/') ||
    uri.includes('_video_');
};

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
    const isVideo = isVideoFile(item);

    return (
      <View style={styles.photoContainer}>
        <MediaViewer
          uri={item}
          isVideo={isVideo}
          style={styles.mediaTouch}
          allImages={photos}
        >
          {isVideo ? (
            <VideoPreview uri={item} />
          ) : (
            <SafeImage uri={item} index={index} />
          )}
        </MediaViewer>
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
        keyExtractor={(item: string, index: number) => index.toString()}
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



  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Анимация для sticky header
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 100;
  const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 44; // 44 для iOS, currentHeight для Android

  // Состояния для подтверждения выбора исполнителя
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [acceptedApplicants, setAcceptedApplicants] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Состояния для завершения заказа
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);

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

        // Инициализируем список принятых исполнителей
        const accepted = new Set(
          orderApplicants
            .filter(applicant => applicant.status === 'accepted')
            .map(applicant => applicant.id)
        );
        setAcceptedApplicants(accepted);

        console.log(`[OrderDetailsScreen] Загружено ${orderApplicants.length} откликов для заказа ${orderId}, принято: ${accepted.size}`);
      } catch (error) {
        console.error('Ошибка загрузки откликов:', error);
      } finally {
        setApplicantsLoading(false);
      }
    };

    loadApplicants();
  }, [orderId]);

  // Создаем функции для переиспользования
  const loadOrderData = useCallback(async () => {
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
      console.error('[OrderDetailsScreen] Ошибка загрузки заказа:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const loadApplicantsData = useCallback(async () => {
    if (!orderId) return;

    try {
      setApplicantsLoading(true);
      const orderApplicants = await orderService.getApplicantsForOrder(orderId);
      setApplicants(orderApplicants);

      // Инициализируем список принятых исполнителей
      const accepted = new Set(
        orderApplicants
          .filter(applicant => applicant.status === 'accepted')
          .map(applicant => applicant.id)
      );
      setAcceptedApplicants(accepted);

      console.log(`[OrderDetailsScreen] Загружено ${orderApplicants.length} откликов для заказа ${orderId}, принято: ${accepted.size}`);
    } catch (error) {
      console.error('[OrderDetailsScreen] Ошибка загрузки откликов:', error);
    } finally {
      setApplicantsLoading(false);
    }
  }, [orderId]);

  // Обновляем данные при возврате на экран
  useFocusEffect(
    useCallback(() => {
      console.log('[OrderDetailsScreen] 🔄 useFocusEffect: перезагружаем данные');
      loadOrderData();
      loadApplicantsData();
    }, [loadOrderData, loadApplicantsData])
  );

  // Real-time обновления для заказа
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user || !orderId) {
      return;
    }

    console.log('[OrderDetailsScreen] Подключаем real-time обновления заказа');

    const orderSubscription = supabase
      .channel('order_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload: any) => {
          console.log('[OrderDetailsScreen] Real-time изменение заказа:', payload);
          loadOrderData();
        }
      )
      .subscribe();

    return () => {
      console.log('[OrderDetailsScreen] Отключаем real-time обновления заказа');
      orderSubscription.unsubscribe();
    };
  }, [orderId, loadOrderData]);

  // Real-time обновления для откликов
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user || !orderId) {
      return;
    }

    console.log('[OrderDetailsScreen] Подключаем real-time обновления откликов');

    const applicantsSubscription = supabase
      .channel('applicants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applicants',
          filter: `order_id=eq.${orderId}`
        },
        (payload: any) => {
          console.log('[OrderDetailsScreen] Real-time изменение откликов:', payload);
          loadApplicantsData();
        }
      )
      .subscribe();

    return () => {
      console.log('[OrderDetailsScreen] Отключаем real-time обновления откликов');
      applicantsSubscription.unsubscribe();
    };
  }, [orderId, loadApplicantsData]);

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

  const getApplicantStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'accepted': return '#28A745';
      case 'rejected': return '#DC3545';
      default: return '#6C757D';
    }
  };

  const getApplicantStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'accepted': return 'Принят';
      case 'rejected': return 'Отклонен';
      default: return 'Неизвестно';
    }
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

  // Показать модалку подтверждения выбора исполнителя
  const handleSelectApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setShowConfirmModal(true);
  };

  // Подтвердить выбор исполнителя
  const handleConfirmSelection = async () => {
    if (!selectedApplicant || !order || isProcessing) return;

    setIsProcessing(true);

    try {
      // Принимаем выбранного исполнителя
      const success = await orderService.updateApplicantStatus(selectedApplicant.id, 'accepted');
      if (!success) {
        Alert.alert('Ошибка', 'Не удалось принять отклик');
        setIsProcessing(false);
        setShowConfirmModal(false);
        setSelectedApplicant(null);
        return;
      }

      // Небольшая задержка для обеспечения обновления в БД
      await new Promise(resolve => setTimeout(resolve, 500));

      // Обновляем список откликов
      const updatedApplicants = await orderService.getApplicantsForOrder(orderId);
      setApplicants(updatedApplicants);

      // Обновляем список принятых исполнителей
      const newAcceptedApplicants = new Set(
        updatedApplicants
          .filter(applicant => applicant.status === 'accepted')
          .map(applicant => applicant.id)
      );
      setAcceptedApplicants(newAcceptedApplicants);

      // Проверяем, достигнуто ли нужное количество исполнителей
      if (newAcceptedApplicants.size >= order.workersNeeded) {
        // Автоматически отклоняем остальных
        const rejectionPromises = updatedApplicants
          .filter(applicant =>
            applicant.status === 'pending' &&
            !newAcceptedApplicants.has(applicant.id)
          )
          .map(applicant => orderService.updateApplicantStatus(applicant.id, 'rejected'));

        if (rejectionPromises.length > 0) {
          await Promise.all(rejectionPromises);

          // Обновляем список откликов еще раз после отклонения
          const finalUpdatedApplicants = await orderService.getApplicantsForOrder(orderId);
          setApplicants(finalUpdatedApplicants);

          // Обновляем список принятых исполнителей
          const finalAcceptedApplicants = new Set(
            finalUpdatedApplicants
              .filter(applicant => applicant.status === 'accepted')
              .map(applicant => applicant.id)
          );
          setAcceptedApplicants(finalAcceptedApplicants);
        }

        // Проверяем и обновляем статус заказа при достижении нужного количества исполнителей
        await orderService.checkAndUpdateOrderStatus(orderId);
      }

      setIsProcessing(false);
      setShowConfirmModal(false);
      setSelectedApplicant(null);

      // Показываем сообщение об успехе
      Alert.alert('Успешно', `Исполнитель ${selectedApplicant.workerName} выбран для выполнения заказа`);

    } catch (error) {
      console.error('Ошибка принятия отклика:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при принятии отклика');
      setIsProcessing(false);
      setShowConfirmModal(false);
      setSelectedApplicant(null);
    }
  };

  // Завершить заказ
  const handleCallWorker = (workerPhone: string, workerName: string) => {
    Alert.alert(
      'Позвонить исполнителю',
      `Позвонить ${workerName} по номеру ${workerPhone}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Позвонить',
          onPress: () => {
            Linking.openURL(`tel:${workerPhone}`);
          }
        }
      ]
    );
  };

  const handleCompleteOrder = async () => {
    if (!order || isCompletingOrder) return;

    Alert.alert(
      'Завершить заказ',
      'Вы уверены, что хотите завершить этот заказ? После завершения вам нужно будет оценить работу исполнителей.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Завершить',
          style: 'destructive',
          onPress: async () => {
            setIsCompletingOrder(true);
            try {
              // Получаем принятых исполнителей
              const acceptedWorkers = await orderService.getAcceptedWorkersForOrder(orderId);

              // Завершаем заказ
              const success = await orderService.completeOrder(orderId);
              if (!success) {
                Alert.alert('Ошибка', 'Не удалось завершить заказ');
                return;
              }

              // Обновляем статус заказа локально
              setOrder(prev => prev ? { ...prev, status: 'completed' } : null);

              // Если есть принятые исполнители, переходим к оценке
              if (acceptedWorkers.length > 0) {
                // Передаем всех принятых исполнителей для оценки
                navigation.navigate('Rating', {
                  orderId: orderId,
                  acceptedWorkers: acceptedWorkers,
                });
              } else {
                // Если нет исполнителей, просто показываем сообщение
                Alert.alert(
                  'Заказ завершен',
                  'Заказ успешно завершен',
                  [{ text: 'ОК', onPress: () => navigation.navigate('MainTabs' as any) }]
                );
              }
            } catch (error) {
              console.error('Ошибка завершения заказа:', error);
              Alert.alert('Ошибка', 'Произошла ошибка при завершении заказа');
            } finally {
              setIsCompletingOrder(false);
            }
          }
        }
      ]
    );
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

    const isAccepted = item.status === 'accepted';
    const isRejected = item.status === 'rejected';
    const isPending = item.status === 'pending';

    return (
      <View style={[
        styles.applicantCard,
        isAccepted && styles.acceptedCard,
        isRejected && styles.rejectedCard
      ]}>
        {/* Статус полоса */}
        {isAccepted && (
          <View style={styles.statusBar}>
            <View style={styles.statusIndicator}>
              <Text style={styles.statusIcon}>✓</Text>
              <Text style={styles.statusText}>Выбран</Text>
            </View>
          </View>
        )}

        {isRejected && (
          <View style={styles.statusBarRejected}>
            <View style={styles.statusIndicator}>
              <Text style={styles.statusIconRejected}>✗</Text>
              <Text style={styles.statusTextRejected}>Отклонен</Text>
            </View>
          </View>
        )}

        <View style={styles.applicantHeader}>
          <View style={styles.applicantInfo}>
            <View style={styles.nameContainer}>
              <Text style={[styles.applicantName, isRejected && styles.rejectedText]}>
                {item.workerName}
              </Text>
              {isAccepted && <Text style={styles.selectedBadge}>ВЫБРАН</Text>}
            </View>
            <View style={styles.applicantStats}>
              <Text style={[styles.applicantRating, isRejected && styles.rejectedText]}>
                ⭐ {item.rating ? item.rating.toFixed(1) : 'Нет рейтинга'}
              </Text>
              <Text style={[styles.applicantJobs, isRejected && styles.rejectedText]}>
                • {item.completedJobs || 0} заказов
              </Text>
            </View>
          </View>
          <Text style={[styles.applicantTime, isRejected && styles.rejectedText]}>
            {formatAppliedAt(item.appliedAt)}
          </Text>
        </View>

        {/* Предложенная цена */}
        {item.proposedPrice && (
          <View style={styles.proposedPriceContainer}>
            <Text style={[styles.proposedPriceLabel, isRejected && styles.rejectedText]}>
              Предложенная цена:
            </Text>
            <Text style={[styles.proposedPriceValue, isAccepted && styles.acceptedPrice]}>
              {formatPrice(item.proposedPrice)} сум
              {order && item.proposedPrice !== order.budget && (
                <Text style={[
                  styles.priceDifference,
                  { color: item.proposedPrice > order.budget ? '#FF6B6B' : '#4ECDC4' },
                  isRejected && styles.rejectedText
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
            <Text style={[styles.messageLabel, isRejected && styles.rejectedText]}>
              Комментарий:
            </Text>
            <Text style={[styles.messageText, isRejected && styles.rejectedText]}>
              {item.message}
            </Text>
          </View>
        )}

        {/* Контактная информация для принятого исполнителя */}
        {isAccepted && item.workerPhone && (
          <View style={styles.contactInfo}>
            <Text style={styles.phoneNumber}>📞 {item.workerPhone}</Text>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCallWorker(item.workerPhone, item.workerName)}
            >
              <Text style={styles.callButtonText}>Позвонить</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Кнопки действий - показываем только для pending заявок */}
        {isPending && (
          <View style={styles.applicantActions}>
            <Pressable
              style={({ pressed }) => [
                styles.acceptButton,
                {
                  backgroundColor: pressed ? '#3ABCB4' : theme.colors.primary,
                  opacity: pressed ? 0.8 : 1,
                  transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                }
              ]}
              onPress={() => handleSelectApplicant(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
            >
              <Text style={styles.acceptButtonText}>Принять</Text>
            </Pressable>
          </View>
        )}
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
      {/* Sticky Header */}
      <Animated.View style={[styles.stickyHeader, {
        paddingTop: STATUS_BAR_HEIGHT + theme.spacing.lg, // Увеличил отступ от статус бара
        opacity: scrollY.interpolate({
          inputRange: [0, HEADER_HEIGHT],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      }]}>
        <View style={styles.stickyHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.stickyTitleContainer}>
            <Text style={styles.stickyTitle} numberOfLines={1}>
              {order?.title || 'Загрузка...'}
            </Text>
            <Text style={styles.stickyPrice}>
              {order ? formatBudget(order.budget) + ' сум' : ''}
            </Text>
          </View>
          {order?.status === 'in_progress' && (
            <TouchableOpacity onPress={handleCompleteOrder}>
              <Text style={[styles.rightActionText, { color: '#DC2626' }]}>
                {isCompletingOrder ? 'Завершаем...' : 'Завершить'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <View style={styles.contentContainer}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Regular Header */}
          <HeaderWithBack
            rightAction={
              order?.status === 'in_progress' ? {
                text: isCompletingOrder ? 'Завершаем...' : 'Завершить',
                color: '#DC2626', // Красный цвет
                onPress: handleCompleteOrder,
              } : undefined
            }
          />

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
              <View style={styles.priceContainer}>
                <Text style={styles.orderPrice}>{formatBudget(order.budget)} сум</Text>
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
                  <BankNoteIcon width={20} height={20} color="#679B00" />
                </View>
                <Text style={styles.infoValue}>{formatBudget(order.budget)}</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <CategoryIcon width={20} height={20} color="#679B00" />
                </View>
                <Text style={styles.infoValue}>{order.category}</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <LocationIcon width={20} height={20} color="#679B00" />
                </View>
                <Text style={styles.infoValue}>{order.location}</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <CalendarIcon width={20} height={20} color="#679B00" />
                </View>
                <Text style={styles.infoValue}>{formatDate(order.serviceDate)}</Text>
              </View>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <Text style={styles.detailsTitle}>Детали</Text>
            <Text style={styles.detailsText}>{order.description}</Text>
          </View>

          {/* Краткий обзор откликов */}
          {applicants.length > 0 && (
            <View style={styles.applicantsSection}>
              <View style={styles.applicantsHeader}>
                <Text style={styles.applicantsTitle}>Отклики ({applicants.length})</Text>
                {order?.workersNeeded && (
                  <View style={styles.progressInfo}>
                    <Text style={styles.applicantsSubtitle}>
                      Выбрано {acceptedApplicants.size} из {order.workersNeeded} исполнител{order.workersNeeded === 1 ? 'я' : 'ей'}
                    </Text>
                    <View style={styles.progressBarSmall}>
                      <View
                        style={[
                          styles.progressFillSmall,
                          { width: `${Math.min((acceptedApplicants.size / order.workersNeeded) * 100, 100)}%` }
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>



              {/* Последние отклики (первые 3) */}
              {applicants.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.applicantPreview}>
                  <View style={styles.applicantPreviewHeader}>
                    <Text style={styles.applicantPreviewName}>{item.workerName}</Text>
                    <Text style={styles.applicantPreviewPrice}>{Math.round(item.proposedPrice || 0).toLocaleString()} сум</Text>
                  </View>
                  <View style={styles.applicantPreviewDetails}>
                    <Text style={styles.applicantPreviewRating}>
                      ⭐ {item.rating ? item.rating.toFixed(1) : 'Нет рейтинга'}
                    </Text>
                    <Text style={styles.applicantPreviewJobs}>• {item.completedJobs || 0} работ</Text>
                    <View style={[styles.applicantPreviewStatus, { backgroundColor: getApplicantStatusColor(item.status) }]}>
                      <Text style={styles.applicantPreviewStatusText}>{getApplicantStatusText(item.status)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Если откликов нет */}
          {applicants.length === 0 && !applicantsLoading && (
            <View style={styles.noApplicantsSection}>
              <Text style={styles.noApplicantsTitle}>Пока нет откликов</Text>
              <Text style={styles.noApplicantsText}>
                Исполнители еще не откликнулись на ваш заказ. Подождите немного или расширьте описание заказа.
              </Text>
            </View>
          )}
        </Animated.ScrollView>

        {/* Закрепленная кнопка внизу - показываем только если есть отклики */}
        {applicants.length > 0 && (
          <View style={styles.fixedBottomSection}>
            <TouchableOpacity
              style={styles.fixedViewAllApplicantsButton}
              onPress={() => navigation.navigate('ApplicantsList', { orderId: orderId })}
            >
              <Text style={styles.fixedViewAllApplicantsButtonText}>
                Посмотреть все отклики ({applicants.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>



      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmModalHeader}>
              <Text style={styles.confirmModalIcon}>👤</Text>
              <Text style={styles.confirmModalTitle}>
                Вы выбрали {selectedApplicant?.workerName} как исполнителя
              </Text>
              <Text style={styles.confirmModalSubtitle}>
                Подтвердите свой выбор. Данное действие нельзя отменить.
              </Text>
            </View>

            <View style={styles.confirmModalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmButton,
                  isProcessing && styles.confirmButtonDisabled,
                  {
                    opacity: pressed && !isProcessing ? 0.8 : 1,
                    backgroundColor: pressed && !isProcessing ? theme.colors.primary + 'CC' : theme.colors.primary
                  }
                ]}
                onPress={handleConfirmSelection}
                disabled={isProcessing}
              >
                <Text style={styles.confirmButtonText}>
                  {isProcessing ? 'Обрабатываем...' : 'Подтверждаю'}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  { opacity: pressed && !isProcessing ? 0.7 : 1 }
                ]}
                onPress={() => setShowConfirmModal(false)}
                disabled={isProcessing}
              >
                <Text style={[styles.cancelButtonText, isProcessing && styles.cancelButtonTextDisabled]}>
                  Отмена
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
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
  priceContainer: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
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
    paddingHorizontal: theme.spacing.lg,
  },
  galleryContainer: {
    position: 'relative',
  },
  photoContainer: {
    width: CARD_WIDTH,
    height: 240,
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
  mediaTouch: {
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
    gap: theme.spacing.md, // Одинаковые отступы между карточками
  },
  infoCard: {
    flexBasis: '47%', // Используем flexBasis для точной сетки 2x2
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  iconText: {
    fontSize: 16,
  },


  infoValue: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
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

  // Applicants Section
  applicantsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  applicantsHeader: {
    flexDirection: 'column',
    marginBottom: theme.spacing.md,
  },
  applicantsTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  applicantsSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fonts.weights.medium,
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
    position: 'relative',
    paddingTop: theme.spacing.xl, // Дополнительный отступ для полосы статуса
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
    paddingVertical: theme.spacing.md, // Увеличен размер как у кнопки "Создать новый заказ"
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

  // Стили для статусов карточек
  acceptedCard: {
    borderWidth: 2,
    borderColor: '#4ECDC4',
    backgroundColor: '#f0fffe',
  },
  rejectedCard: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  statusBar: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    backgroundColor: '#4ECDC4',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderTopLeftRadius: theme.borderRadius.lg - 1,
    borderTopRightRadius: theme.borderRadius.lg - 1,
    zIndex: 10,
  },
  statusBarRejected: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderTopLeftRadius: theme.borderRadius.lg - 1,
    borderTopRightRadius: theme.borderRadius.lg - 1,
    zIndex: 10,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: theme.spacing.xs,
  },
  statusIconRejected: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: theme.spacing.xs,
  },
  statusText: {
    color: 'white',
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
  },
  statusTextRejected: {
    color: 'white',
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  selectedBadge: {
    backgroundColor: '#4ECDC4',
    color: 'white',
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.bold,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
    overflow: 'hidden',
  },
  rejectedText: {
    color: '#9ca3af',
  },
  acceptedPrice: {
    color: '#4ECDC4',
    fontWeight: theme.fonts.weights.bold,
  },


  // Стили для модалки подтверждения
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Увеличил прозрачность для лучшей видимости
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    zIndex: 9999, // Максимальный z-index
  },
  confirmModalContainer: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 350,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmModalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  confirmModalIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  confirmModalTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  confirmModalSubtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmModalActions: {
    gap: theme.spacing.md,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  confirmButtonDisabled: {
    backgroundColor: theme.colors.disabled,
    opacity: 0.7,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
  },
  cancelButtonTextDisabled: {
    color: '#d1d5db',
  },


  applicantPreviewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  applicantPreviewJobs: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  applicantPreviewStatus: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: 'auto',
  },
  applicantPreviewStatusText: {
    fontSize: theme.fonts.sizes.xs,
    color: '#fff',
    fontWeight: theme.fonts.weights.medium,
  },
  viewAllApplicantsButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  viewAllApplicantsButtonText: {
    color: '#fff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  noApplicantsSection: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noApplicantsTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  noApplicantsText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressInfo: {
    marginTop: theme.spacing.xs,
  },
  progressBarSmall: {
    height: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },

  // Новые стили для фиксированной кнопки
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Достаточный отступ снизу для избежания перекрытия с кнопкой (высота кнопки + отступы)
  },
  fixedBottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.lg, // Дополнительный отступ для безопасной области
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    elevation: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fixedViewAllApplicantsButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  fixedViewAllApplicantsButtonText: {
    color: '#fff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    textAlign: 'center',
  },

  // Sticky Header Styles
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    minHeight: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: theme.fonts.sizes.xl,
    color: theme.colors.text.primary,
  },
  stickyTitleContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  stickyTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  stickyPrice: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 2,
  },
  rightActionText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: `${theme.colors.success}10`,
    borderRadius: theme.borderRadius.sm,
  },
  phoneNumber: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  callButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  callButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.surface,
  },
}); 