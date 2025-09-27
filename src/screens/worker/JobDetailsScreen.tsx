import React, { useState, useEffect, useRef } from 'react';
import { View,
  Text,
  StyleSheet, ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  Linking, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { usePlatformSafeAreaInsets, getFixedBottomStyle, getEdgeToEdgeBottomStyle, getImprovedFixedBottomStyle } from '../../utils/safeAreaUtils';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { WorkerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CalendarIcon from '../../../assets/card-icons/calendar.svg';
import LocationIcon from '../../../assets/card-icons/location.svg';
import CategoryIcon from '../../../assets/card-icons/category.svg';
import UserIcon from '../../../assets/user-01.svg';
import ArrowBackIcon from '../../../assets/arrow-narrow-left.svg';
import CarIcon from '../../../assets/car-01.svg';
import BankNoteIcon from '../../../assets/bank-note-01.svg';
import PhoneIcon from '../../../assets/phone-call-01-white.svg';
import { VideoView, useVideoPlayer } from 'expo-video';
import LottieView from 'lottie-react-native';
import { HeaderWithBack, PriceConfirmationModal, ProposePriceModal, MediaViewer, OrderLocationMap, StatusBadge } from '../../components/common';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { getCategoryEmoji, getCategoryLabel } from '../../utils/categoryUtils';
import { getCategoryAnimation } from '../../utils/categoryIconUtils';
import { locationService, LocationCoords } from '../../services/locationService';
import { supabase } from '../../services/supabaseClient';
import { Order, User } from '../../types';
import { useCustomerTranslation, useCategoriesTranslation, useWorkerTranslation } from '../../hooks/useTranslation';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // 24px margin on each side

type JobDetailsRouteProp = RouteProp<WorkerStackParamList, 'JobDetails'>;
type NavigationProp = NativeStackNavigationProp<WorkerStackParamList>;

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
  const tWorker = useWorkerTranslation();

  if (hasError) {
    return (
      <View style={[styles.mediaImage, styles.errorContainer]}>
        <Text style={styles.errorText}>❌</Text>
        <Text style={styles.errorSubtext}>{tWorker('loading_error')}</Text>
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
  const insets = usePlatformSafeAreaInsets();
  const t = useCustomerTranslation();
  const tCategories = useCategoriesTranslation();
  const tWorker = useWorkerTranslation();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled' | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [priceConfirmationVisible, setPriceConfirmationVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [mapCoords, setMapCoords] = useState<LocationCoords | null>(null);

  // Анимация для sticky header
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 100;
  const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 44; // 44 для iOS, currentHeight для Android

  // Загружаем заказ по ID
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);

        // Если в заказе нет координат, пробуем получить их по адресу
        if (orderData && (!orderData.latitude || !orderData.longitude) && orderData.location) {
          try {
            const coords = await locationService.geocodeAddress(orderData.location);
            if (coords) {
              setMapCoords(coords);
            }
          } catch (geoErr) {
            console.log('[JobDetailsScreen] Не удалось геокодировать адрес заказа:', geoErr);
          }
        } else if (orderData && orderData.latitude && orderData.longitude) {
          // При наличии координат очищаем возможные старые значения
          setMapCoords(null);
        }

        // Проверяем статус заявки пользователя
        const applicationData = await orderService.getUserApplicationStatus(orderId);
        setHasApplied(applicationData.hasApplied);
        setApplicationStatus(applicationData.status || null);

        // Загружаем информацию о заказчике
        if (orderData) {
          const customerData = await authService.findUserById(orderData.customerId);
          if (customerData) {
            setCustomer(customerData);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки заказа:', error);
        Alert.alert(tWorker('general_error'), tWorker('load_job_error'));
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();

    // Получаем местоположение пользователя
    const getUserLocation = async () => {
      try {
        const coords = await locationService.getCurrentLocation();
        if (coords) {
          setUserLocation(coords);
          console.log('[JobDetailsScreen] Местоположение пользователя получено:', coords);
        }
      } catch (error) {
        console.log('[JobDetailsScreen] Не удалось получить местоположение:', error);
      }
    };

    getUserLocation();
  }, [orderId]);

  // Real-time обновления статуса заявки
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user || !hasApplied) {
      return;
    }

    console.log('[JobDetailsScreen] Подключаем real-time обновления заявки');

    const subscription = supabase
      .channel('job_application_status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applicants',
          filter: `worker_id=eq.${authState.user.id} and order_id=eq.${orderId}`
        },
        async (payload: any) => {
          console.log('[JobDetailsScreen] Real-time изменение статуса заявки:', payload);
          // Обновляем статус заявки
          const applicationData = await orderService.getUserApplicationStatus(orderId);
          setApplicationStatus(applicationData.status || null);
        }
      )
      .subscribe();

    return () => {
      console.log('[JobDetailsScreen] Отключаем real-time обновления заявки');
      subscription.unsubscribe();
    };
  }, [orderId, hasApplied]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} ${t('at_time')} ${timeStr}`;
  };

  const formatBudget = (budget: number) => {
    return budget.toLocaleString('ru-RU');
  };

  const getApplicationStatusText = (status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled' | null) => {
    switch (status) {
      case 'pending':
        return tWorker('application_pending');
      case 'accepted':
        return tWorker('application_accepted');
      case 'rejected':
        return tWorker('application_rejected');
      case 'completed':
        return tWorker('application_completed');
      case 'cancelled':
        return tWorker('application_cancelled');
      default:
        return tWorker('application_submitted');
    }
  };

  // Координаты для карты: берем из заказа, иначе из геокодирования
  const effectiveLatitude: number | undefined = order?.latitude ?? mapCoords?.latitude;
  const effectiveLongitude: number | undefined = order?.longitude ?? mapCoords?.longitude;
  const hasMapCoords = typeof effectiveLatitude === 'number' && typeof effectiveLongitude === 'number';

  const handleApplyToJob = async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        Alert.alert(tWorker('general_error'), tWorker('login_required'));
        return;
      }

      if (!order) {
        Alert.alert(tWorker('general_error'), tWorker('order_not_found'));
        return;
      }

      // Показываем модалку подтверждения цены
      setPriceConfirmationVisible(true);
    } catch (error) {
      console.error('Ошибка при открытии формы отклика:', error);
      Alert.alert(tWorker('general_error'), tWorker('general_error'));
    }
  };

  const handleAcceptPrice = async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user || !order) {
        Alert.alert(tWorker('general_error'), tWorker('login_required'));
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
        setApplicationStatus('pending');
        Alert.alert(
          tWorker('success'),
          tWorker('response_sent_wait'),
          [{ text: tWorker('ok') }]
        );
      } else {
        Alert.alert(tWorker('general_error'), tWorker('send_response_error'));
      }
    } catch (error) {
      console.error('Ошибка отклика на заказ:', error);
      Alert.alert(tWorker('general_error'), tWorker('send_response_general_error'));
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
        Alert.alert(tWorker('general_error'), tWorker('login_required'));
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
        setApplicationStatus('pending');
        Alert.alert(
          tWorker('success'),
          tWorker('response_sent_wait'),
          [{ text: tWorker('ok') }]
        );
      } else {
        Alert.alert(tWorker('general_error'), tWorker('send_response_error'));
      }
    } catch (error) {
      console.error('Ошибка отклика на заказ:', error);
      Alert.alert(tWorker('general_error'), tWorker('send_response_general_error'));
    }
  };

  // Функция для звонка заказчику
  const handleCallCustomer = async () => {
    if (!customer?.phone) {
      Alert.alert(tWorker('general_error'), tWorker('phone_call_error'));
      return;
    }

    Alert.alert(
      tWorker('call_customer'),
      t('call_worker_confirmation', { name: `${customer.firstName} ${customer.lastName}` || 'Заказчик', phone: customer.phone }),
      [
        {
          text: tWorker('cancel'),
          style: 'cancel',
        },
        {
          text: tWorker('call_customer'),
          onPress: async () => {
            try {
              // Логируем попытку звонка перед открытием диалера
              const authState = authService.getAuthState();
              if (order && customer && authState.user) {
                await orderService.logCallAttempt({
                  orderId: order.id,
                  callerId: authState.user.id,
                  receiverId: customer.id,
                  callerType: 'worker',
                  receiverType: 'customer',
                  phoneNumber: customer.phone,
                  callSource: 'job_details'
                });
                console.log('[JobDetailsScreen] ✅ Звонок залогирован');
              }

              // Открываем диалер
              const phoneUrl = `tel:${customer.phone}`;
              Linking.openURL(phoneUrl).catch(() => {
                Alert.alert(tWorker('general_error'), tWorker('phone_call_error'));
              });
            } catch (error) {
              console.error('[JobDetailsScreen] ❌ Ошибка логирования звонка:', error);
              // Все равно открываем диалер, даже если логирование не удалось
              const phoneUrl = `tel:${customer.phone}`;
              Linking.openURL(phoneUrl).catch(() => {
                Alert.alert(tWorker('general_error'), tWorker('phone_call_error'));
              });
            }
          },
        },
      ]
    );
  };

  // Состояния загрузки и ошибок
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{tWorker('loading_job')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{tWorker('job_not_found')}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>{tWorker('back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <Animated.View style={[styles.stickyHeader, {
        paddingTop: STATUS_BAR_HEIGHT + theme.spacing.lg,
        opacity: scrollY.interpolate({
          inputRange: [0, HEADER_HEIGHT],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      }]}>
        <View style={styles.stickyHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowBackIcon width={20} height={20} stroke={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.stickyTitleContainer}>
            <Text style={styles.stickyTitle} numberOfLines={1}>
              {order?.title || tWorker('loading_job')}
            </Text>
            <Text style={styles.stickyPrice}>
              {order ? formatBudget(order.budget) + ' ' + t('sum_currency') : ''}
            </Text>
          </View>
          <View style={styles.rightActionContainer}>
            {/* Пустой контейнер для симметрии */}
          </View>
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
            rightComponent={<StatusBadge status={order.status} workerView={true} />}
          />

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
                  {customer ? `${customer.lastName} ${customer.firstName}` : tWorker('customer')}
                </Text>
                <Text style={styles.profileRole}>{tWorker('customer')}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.orderPrice}>{formatBudget(order.budget)} {t('sum_currency')}</Text>
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
                  <LottieView
                    source={getCategoryAnimation(order.category)}
                    style={styles.categoryLottieIcon}
                    autoPlay={false}
                    loop={false}
                    progress={0.5}
                  />
                </View>
                <Text style={styles.infoValue}>{getCategoryLabel(order.category, tCategories)}</Text>
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
                <Text style={styles.infoValue}>
                  {userLocation && order.latitude && order.longitude ?
                    `${order.location} (${locationService.formatDistance(
                      locationService.calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        order.latitude,
                        order.longitude
                      )
                    )})` :
                    order.location
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Amenities Section */}
          <View style={styles.amenitiesSection}>
            <Text style={styles.sectionTitle}>{tWorker('amenities')}</Text>
            <View style={styles.amenitiesContainer}>
              <View style={styles.amenityItem}>
                <View style={styles.amenityIconContainer}>
                  <CarIcon width={20} height={20} color={order.transportPaid ? theme.colors.primary : theme.colors.text.secondary} />
                </View>
                <Text style={order.transportPaid ? styles.amenityText : styles.amenityTextNegative}>
                  {order.transportPaid ? t('transport_paid_yes') : t('transport_paid_no')}
                </Text>
              </View>

              <View style={styles.amenityItem}>
                <View style={styles.amenityIconContainer}>
                  <BankNoteIcon width={20} height={20} color={order.mealIncluded || order.mealPaid ? theme.colors.primary : theme.colors.text.secondary} />
                </View>
                <Text style={order.mealIncluded || order.mealPaid ? styles.amenityText : styles.amenityTextNegative}>
                  {order.mealIncluded ? t('meal_included_yes') :
                    order.mealPaid ? t('meal_paid_yes') :
                      t('meal_included_no')}
                </Text>
              </View>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <Text style={styles.detailsTitle}>{tWorker('details')}</Text>
            <Text style={styles.detailsText}>{order.description}</Text>
          </View>

          {/* Location Map Section */}
          {hasMapCoords && (
            <OrderLocationMap
              latitude={effectiveLatitude as number}
              longitude={effectiveLongitude as number}
              address={order.location}
              title={tWorker('where_to_go')}
            />
          )}
        </Animated.ScrollView>

        {/* Fixed Bottom Section */}
        <View style={[styles.fixedBottomSection, getImprovedFixedBottomStyle(insets)]}>
          {order.status === 'in_progress' && customer?.phone ? (
            <TouchableOpacity
              style={styles.callButtonAccepted}
              onPress={handleCallCustomer}
            >
              <PhoneIcon width={24} height={24} />
              <View style={styles.callButtonTextContainer}>
                <Text style={styles.callButtonAcceptedText}>{tWorker('application_accepted')}</Text>
                <Text style={styles.callButtonSubText}>{tWorker('call_customer')}</Text>
              </View>
            </TouchableOpacity>
          ) : (
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
                {hasApplied ? getApplicationStatusText(applicationStatus) : tWorker('apply_for_job')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
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
    backgroundColor: '#F6F7F9',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  infoCardFullWidth: {
    flexBasis: '100%', // Карточка на всю ширину
    backgroundColor: '#F6F7F9',
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
  categoryLottieIcon: {
    width: 22,
    height: 22,
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

  // Content Container and Scroll Styles
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Достаточный отступ снизу для избежания перекрытия с кнопкой
  },

  // Fixed Bottom Section
  fixedBottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    // paddingTop и paddingBottom устанавливаются через getImprovedFixedBottomStyle
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    // Убираем только тени, границу оставляем
    elevation: 0, shadowOpacity: 0,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0, marginBottom: Platform.OS === 'ios' ? 16 : 0, // Отступ только на iOS
  },
  appliedButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 0, borderColor: theme.colors.border,
  },
  applyButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.white,
    textAlign: 'center',
  },
  appliedButtonText: {
    color: theme.colors.text.secondary,
  },


  callButtonAccepted: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0, marginBottom: Platform.OS === 'ios' ? 16 : 0,
  },

  callButtonTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonAcceptedText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.white,
    textAlign: 'center',
  },
  callButtonSubText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.white,
    textAlign: 'center',
    opacity: 0.9,
    marginTop: 2,
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
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
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
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
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
  rightActionContainer: {
    width: 40, // Такая же ширина как у кнопки назад для симметрии
  },

  // Amenities Section Styles
  amenitiesSection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: '#F6F7F9',
  },
  amenitiesContainer: {
    gap: theme.spacing.md,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  amenityIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  amenityIconContainer: {
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  amenityTextNegative: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
}); 