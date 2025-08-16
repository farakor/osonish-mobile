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
import UserIcon from '../../../assets/user-01.svg';
import { VideoView, useVideoPlayer } from 'expo-video';
import { HeaderWithBack, MediaViewer, OrderLocationMap } from '../../components/common';
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

  // Анимация для карточек откликов
  const animatedCards = useRef<{ [key: string]: Animated.Value }>({}).current;

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
      case 'accepted': return 'Выбран';
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

    // Инициализируем анимацию для карточки если её еще нет
    if (!animatedCards[item.id]) {
      animatedCards[item.id] = new Animated.Value(0);
      // Запускаем анимацию появления
      Animated.timing(animatedCards[item.id], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }

    const animatedStyle = {
      opacity: animatedCards[item.id],
      transform: [
        {
          translateY: animatedCards[item.id].interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
        {
          scale: animatedCards[item.id].interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[
        styles.modernApplicantCard,
        isAccepted && styles.modernAcceptedCard,
        isRejected && styles.modernRejectedCard,
        animatedStyle
      ]}>
        {/* Градиентная полоса статуса - только для принятых и отклоненных */}
        {isAccepted && <View style={styles.modernStatusBarAccepted} />}
        {isRejected && <View style={styles.modernStatusBarRejected} />}

        {/* Основное содержимое */}
        <View style={styles.modernCardContent}>
          {/* Заголовок с аватаром */}
          <View style={styles.modernApplicantHeader}>
            {/* Аватар исполнителя */}
            <View style={styles.modernAvatarContainer}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.modernAvatar} />
              ) : (
                <View style={styles.modernAvatarPlaceholder}>
                  <UserIcon width={22} height={22} stroke={theme.colors.text.secondary} />
                </View>
              )}
              {/* Рейтинг бейдж на аватаре */}
              <View style={styles.modernRatingBadge}>
                <Text style={styles.modernRatingText}>
                  {item.rating ? item.rating.toFixed(1) : '—'}
                </Text>
              </View>
            </View>

            {/* Информация исполнителя */}
            <View style={styles.modernApplicantInfo}>
              <View style={styles.modernNameRow}>
                <Text style={[styles.modernApplicantName, isRejected && styles.rejectedText]}>
                  {item.workerName}
                </Text>
                {isAccepted && (
                  <View style={styles.modernSelectedBadge}>
                    <Text style={styles.modernSelectedBadgeText}>✓ ВЫБРАН</Text>
                  </View>
                )}
              </View>

              <View style={styles.modernStatsRow}>
                <View style={styles.modernStatItem}>
                  <Text style={styles.modernStatIcon}>💼</Text>
                  <Text style={[styles.modernStatText, isRejected && styles.rejectedText]}>
                    {item.completedJobs || 0} заказов
                  </Text>
                </View>
              </View>
            </View>

            {/* Время и статус */}
            <View style={styles.modernTimeContainer}>
              <Text style={[styles.modernTimeText, isRejected && styles.rejectedText]}>
                {formatAppliedAt(item.appliedAt)}
              </Text>
              {!isAccepted && !isRejected && (
                <View style={styles.modernPendingDot} />
              )}
            </View>
          </View>

          {/* Предложенная цена */}
          {item.proposedPrice && (
            <View style={[
              styles.modernPriceContainer,
              isAccepted && styles.modernPriceContainerAccepted
            ]}>
              <View style={styles.modernPriceHeader}>
                <Text style={[styles.modernPriceLabel, isRejected && styles.rejectedText]}>
                  Предложенная цена
                </Text>
                {order && item.proposedPrice !== order.budget && (
                  <View style={[
                    styles.modernPriceDiffBadge,
                    { backgroundColor: item.proposedPrice > order.budget ? '#FFE6E6' : '#E6F7F6' }
                  ]}>
                    <Text style={[
                      styles.modernPriceDiffText,
                      { color: item.proposedPrice > order.budget ? '#FF4444' : '#4ECDC4' }
                    ]}>
                      {item.proposedPrice > order.budget ? '+' : ''}{formatPrice(item.proposedPrice - order.budget)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[
                styles.modernPriceValue,
                isAccepted && styles.modernPriceValueAccepted,
                isRejected && styles.rejectedText
              ]}>
                {formatPrice(item.proposedPrice)} сум
              </Text>
            </View>
          )}

          {/* Комментарий исполнителя */}
          {item.message && item.message.trim() && (
            <View style={styles.modernMessageContainer}>
              <Text style={[styles.modernMessageLabel, isRejected && styles.rejectedText]}>
                💬 Комментарий
              </Text>
              <Text style={[styles.modernMessageText, isRejected && styles.rejectedText]}>
                {item.message}
              </Text>
            </View>
          )}

          {/* Контактная информация для принятого исполнителя */}
          {isAccepted && item.workerPhone && (
            <View style={styles.modernContactInfo}>
              <View style={styles.modernContactHeader}>
                <Text style={styles.modernContactLabel}>📞 Контакты</Text>
              </View>
              <View style={styles.modernContactRow}>
                <Text style={styles.modernPhoneNumber}>{item.workerPhone}</Text>
                <TouchableOpacity
                  style={styles.modernCallButton}
                  onPress={() => handleCallWorker(item.workerPhone, item.workerName)}
                >
                  <Text style={styles.modernCallButtonText}>Позвонить</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Кнопки действий - показываем только для pending заявок */}
          {isPending && (
            <View style={styles.modernApplicantActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modernAcceptButton,
                  {
                    opacity: pressed ? 0.8 : 1,
                    transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                  }
                ]}
                onPress={() => handleSelectApplicant(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
              >
                <Text style={styles.modernAcceptButtonText}>✓ Принять исполнителя</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
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
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteOrder}
              activeOpacity={0.8}
            >
              <Text style={styles.completeButtonText}>
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
                color: '#FFFFFF', // Белый текст
                backgroundColor: '#DC2626', // Красный фон
                buttonStyle: true, // Включаем кнопочный стиль
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
                    <UserIcon width={22} height={22} stroke={theme.colors.text.secondary} />
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
              {/* Верхний ряд: Категория и Дата */}
              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <CategoryIcon width={22} height={22} color="#679B00" />
                </View>
                <Text style={styles.infoValue}>{order.category}</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <CalendarIcon width={22} height={22} color="#679B00" />
                </View>
                <Text style={styles.infoValue}>{formatDate(order.serviceDate)}</Text>
              </View>

              {/* Нижний ряд: Адрес на всю ширину */}
              <View style={styles.infoCardFullWidth}>
                <View style={styles.infoIcon}>
                  <LocationIcon width={22} height={22} color="#679B00" />
                </View>
                <Text style={styles.infoValue}>{order.location}</Text>
              </View>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <Text style={styles.detailsTitle}>Детали</Text>
            <Text style={styles.detailsText}>{order.description}</Text>
          </View>

          {/* Location Map Section */}
          {order.latitude && order.longitude && (
            <OrderLocationMap
              latitude={order.latitude}
              longitude={order.longitude}
              address={order.location}
              title="Куда ехать"
            />
          )}

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
              {applicants.slice(0, 3).map((item, index) => {
                // Инициализируем анимацию для превью если её еще нет
                const previewKey = `preview_${item.id}`;
                if (!animatedCards[previewKey]) {
                  animatedCards[previewKey] = new Animated.Value(0);
                  // Запускаем анимацию с задержкой для каждого элемента
                  Animated.timing(animatedCards[previewKey], {
                    toValue: 1,
                    duration: 300,
                    delay: index * 100, // Эффект каскада
                    useNativeDriver: true,
                  }).start();
                }

                const previewAnimatedStyle = {
                  opacity: animatedCards[previewKey],
                  transform: [
                    {
                      translateX: animatedCards[previewKey].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                };

                return (
                  <Animated.View key={item.id} style={[
                    styles.modernApplicantPreview,
                    item.status === 'accepted' && styles.modernPreviewAccepted,
                    item.status === 'rejected' && styles.modernPreviewRejected,
                    previewAnimatedStyle
                  ]}>


                    <View style={styles.modernPreviewContent}>
                      <View style={styles.modernPreviewHeader}>
                        {/* Мини аватар */}
                        <View style={styles.modernPreviewAvatarContainer}>
                          {item.avatar ? (
                            <Image source={{ uri: item.avatar }} style={styles.modernPreviewAvatar} />
                          ) : (
                            <View style={styles.modernPreviewAvatarPlaceholder}>
                              <UserIcon width={22} height={22} stroke={theme.colors.text.secondary} />
                            </View>
                          )}
                          {/* Мини рейтинг */}
                          {item.rating && (
                            <View style={styles.modernPreviewRatingMini}>
                              <Text style={styles.modernPreviewRatingMiniText}>
                                {item.rating.toFixed(1)}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.modernPreviewInfo}>
                          <View style={styles.modernPreviewNameRow}>
                            <Text style={styles.modernPreviewName}>{item.workerName}</Text>
                          </View>
                          {item.status === 'accepted' && (
                            <View style={styles.modernPreviewSelectedBadge}>
                              <Text style={styles.modernPreviewSelectedBadgeText}>✓ ВЫБРАН</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.modernPreviewPriceContainer}>
                          <Text style={styles.modernPreviewPrice}>
                            {Math.round(item.proposedPrice || 0).toLocaleString()} сум
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
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
    flex: 1, // Используем flex для равномерного распределения
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  infoCardFullWidth: {
    flexBasis: '100%', // Карточка на всю ширину
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
  // Старые стили откликов (сохраняем для обратной совместимости)
  applicantCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
    paddingTop: theme.spacing.xl,
  },

  // Новые современные стили для откликов
  modernApplicantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  modernAcceptedCard: {
    borderColor: '#679B00',
    borderWidth: 2,
    backgroundColor: '#FAFFFE',
  },
  modernRejectedCard: {
    opacity: 0.7,
    backgroundColor: '#F8F9FA',
  },
  modernStatusBarAccepted: {
    height: 4,
    backgroundColor: '#679B00', // fallback для устройств без градиентов
  },
  modernStatusBarRejected: {
    height: 4,
    backgroundColor: '#FF6B6B', // fallback
  },

  modernCardContent: {
    padding: 16,
    minHeight: 140,
  },
  modernApplicantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modernAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  modernAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
  },
  modernAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modernRatingBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#679B00',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  modernRatingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modernApplicantInfo: {
    flex: 1,
    marginRight: 8,
  },
  modernNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modernApplicantName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 24,
  },
  modernSelectedBadge: {
    backgroundColor: '#679B00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  modernSelectedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modernStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  modernStatIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  modernStatText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  modernTimeContainer: {
    alignItems: 'flex-end',
  },
  modernTimeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  modernPendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFA726',
  },
  modernPriceContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modernPriceContainerAccepted: {
    backgroundColor: '#F0FDFA',
    borderColor: '#679B00',
  },
  modernPriceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernPriceLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernPriceDiffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modernPriceDiffText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modernPriceValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  modernPriceValueAccepted: {
    color: '#679B00',
  },
  modernMessageContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#679B00',
  },
  modernMessageLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernMessageText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontWeight: '400',
  },
  modernContactInfo: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  modernContactHeader: {
    marginBottom: 12,
  },
  modernContactLabel: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernContactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernPhoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modernCallButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modernCallButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modernApplicantActions: {
    marginTop: 4,
  },
  modernAcceptButton: {
    backgroundColor: '#679B00',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#679B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  modernAcceptButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },

  // Стили для превью откликов
  modernApplicantPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  modernPreviewAccepted: {
    borderColor: '#679B00',
    backgroundColor: '#FAFFFE',
  },
  modernPreviewRejected: {
    opacity: 0.7,
    backgroundColor: '#F8F9FA',
  },

  modernPreviewContent: {
    padding: 16,
    minHeight: 100,
    justifyContent: 'center',
  },
  modernPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernPreviewAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  modernPreviewAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surface,
  },
  modernPreviewAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modernPreviewRatingMini: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#679B00',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modernPreviewRatingMiniText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modernPreviewInfo: {
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  modernPreviewNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  modernPreviewName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 22,
    flex: 1,
    marginRight: 6,
  },
  modernPreviewSelectedBadge: {
    backgroundColor: '#679B00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  modernPreviewSelectedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  modernPreviewPriceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernPreviewPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#679B00',
    textAlign: 'center',
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
    borderColor: '#679B00',
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
    backgroundColor: '#679B00',
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
    backgroundColor: '#679B00',
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
    color: '#679B00',
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
  completeButton: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: '#DC2626', // красный фон
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: '#FFFFFF', // белый текст
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