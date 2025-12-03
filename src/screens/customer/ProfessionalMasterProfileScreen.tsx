import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { theme, getSpecializationById, getTranslatedSpecializationNameSingular } from '../../constants';
import type { CustomerStackParamList } from '../../types';
import { HeaderWithBack, CategoryIcon, StarIcon } from '../../components/common';
import { lightElevationStyles } from '../../utils/noShadowStyles';
import {
  professionalMasterService,
  ProfessionalMaster,
} from '../../services/professionalMasterService';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { LinearGradient } from 'expo-linear-gradient';
import ProBadge from '../../../assets/pro_badge.svg';
import ShareIcon from '../../../assets/share-01.svg';
import PhoneIcon from '../../../assets/phone-call-01-white.svg';
import ArrowBackIcon from '../../../assets/arrow-narrow-left.svg';
import EmptyStateNoReviews from '../../../assets/empty-state-no-reviews.svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ProfessionalMasterProfileSkeleton } from '../../components/skeletons';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { AuthRequiredModal } from '../../components/auth/AuthRequiredModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Константы для сетки фотографий
const PHOTOS_PER_ROW = 3;
const SECTION_MARGIN = 24; // theme.spacing.lg - отступ секции от краев экрана
const SECTION_PADDING = 24; // theme.spacing.lg - внутренний отступ секции
const PHOTO_GAP = 8; // отступы между фотографиями
// Расчет доступной ширины:
// screenWidth - margin секции (48) - padding секции (48) - gaps между 3 фото (16) = screenWidth - 112
const availableWidth = screenWidth - (SECTION_MARGIN * 2) - (SECTION_PADDING * 2) - (PHOTO_GAP * (PHOTOS_PER_ROW - 1));
const PHOTO_SIZE = Math.floor(availableWidth / PHOTOS_PER_ROW);

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;
type ScreenRouteProp = RouteProp<CustomerStackParamList, 'ProfessionalMasterProfile'>;

export const ProfessionalMasterProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { masterId } = route.params;
  const { t } = useTranslation();
  
  // Hook для проверки авторизации
  const { requireAuth, isAuthModalVisible, hideAuthModal } = useRequireAuth();

  const [master, setMaster] = useState<ProfessionalMaster | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    loadMaster();
  }, [masterId]);

  const loadMaster = async () => {
    try {
      // Быстро загружаем данные чтобы проверить тип
      const data = await professionalMasterService.getMasterById(masterId);
      console.log('[ProfessionalMasterProfile] Загружен мастер:', {
        id: data?.id,
        name: data ? `${data.firstName} ${data.lastName}` : null,
        workerType: data?.workerType,
        workPhotos: data?.workPhotos,
        workPhotosLength: data?.workPhotos?.length || 0,
      });

      // Если это job_seeker, перенаправляем на специальный экран резюме
      if (data && data.workerType === 'job_seeker') {
        console.log('[ProfessionalMasterProfile] Перенаправление на JobSeekerProfileScreen');
        navigation.replace('JobSeekerProfile', { masterId });
        return;
      }

      // Только теперь показываем загрузку для правильного типа
      setIsLoading(true);
      setMaster(data);

      // Загружаем отзывы о мастере
      const reviewsData = await professionalMasterService.getMasterReviews(masterId);
      console.log('[ProfessionalMasterProfile] Загружено отзывов:', reviewsData.length);
      setReviews(reviewsData);

      // Увеличиваем счетчик просмотров профиля
      if (data) {
        await professionalMasterService.incrementProfileViews(masterId);
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля мастера:', error);
      Alert.alert(t('common.error'), t('customer.profile_load_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (!master) return;
    
    requireAuth(async () => {
      Alert.alert(
        t('customer.call_master_title'),
        t('customer.call_master_message', { phone: master.phone }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('customer.call_master'),
            onPress: async () => {
              try {
                // Логируем звонок перед открытием диалера
                const authState = authService.getAuthState();
                if (master && authState.user) {
                  console.log('[ProfessionalMasterProfile] 📞 Логируем звонок мастеру');
                  await orderService.logCallAttemptWithoutOrder({
                    callerId: authState.user.id,
                    receiverId: master.id, // Используем master.id, а не master.userId
                    callerType: 'customer',
                    receiverType: 'worker',
                    phoneNumber: master.phone,
                    callSource: 'professional_profile'
                  });
                  console.log('[ProfessionalMasterProfile] ✅ Звонок успешно залогирован');
                } else {
                  console.warn('[ProfessionalMasterProfile] ⚠️ Не удалось залогировать звонок - отсутствуют данные');
                }

                // Открываем диалер
                const phoneUrl = `tel:${master.phone}`;
                const canOpen = await Linking.canOpenURL(phoneUrl);
                if (canOpen) {
                  await Linking.openURL(phoneUrl);
                } else {
                  Alert.alert(t('common.error'), t('customer.call_error'));
                }
              } catch (error) {
                console.error('[ProfessionalMasterProfile] ❌ Ошибка при звонке:', error);
                // Все равно пытаемся открыть диалер
                const phoneUrl = `tel:${master.phone}`;
                const canOpen = await Linking.canOpenURL(phoneUrl);
                if (canOpen) {
                  await Linking.openURL(phoneUrl);
                } else {
                  Alert.alert(t('common.error'), t('customer.call_error'));
                }
              }
            },
          },
        ]
      );
    });
  };

  const handleShare = async () => {
    try {
      // Проверяем доступность функции шаринга
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t('common.error'), t('customer.share_unavailable'));
        return;
      }

      if (!viewShotRef.current || !viewShotRef.current.capture) {
        Alert.alert(t('common.error'), t('customer.screenshot_error'));
        return;
      }

      // Создаем скриншот
      const uri = await viewShotRef.current.capture();

      // Делимся скриншотом
      await Sharing.shareAsync(uri, {
        dialogTitle: t('customer.share_profile_title'),
        mimeType: 'image/png',
      });
    } catch (error) {
      console.error('Ошибка при создании скриншота:', error);
      Alert.alert(t('common.error'), t('customer.share_error'));
    }
  };

  const handlePhotoPress = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleClosePhotoModal = () => {
    setSelectedPhotoIndex(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = t('common.locale') === 'uz' ? 'uz-UZ' : 'ru-RU';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <View key={i} style={styles.starContainer}>
          <StarIcon filled={i <= rating} size={16} />
        </View>
      );
    }
    return stars;
  };

  const renderReview = (review: any) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewCustomerInfo}>
          <Text style={styles.reviewCustomerName}>{review.customerName}</Text>
          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
        </View>
        <View style={styles.reviewRating}>{renderStars(review.rating)}</View>
      </View>

      {review.orderTitle && (
        <Text style={styles.reviewOrderTitle}>
          {t('customer.order_title_prefix', { title: review.orderTitle })}
        </Text>
      )}

      {review.comment && (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      )}
    </View>
  );

  if (isLoading) {
    return <ProfessionalMasterProfileSkeleton />;
  }

  if (!master) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <HeaderWithBack title={t('customer.professional_master_profile')} backAction={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('customer.master_not_found')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const primarySpecialization = master.specializations.find(s => s.isPrimary);

  return (
    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Хедер с градиентом */}
      <LinearGradient
        colors={[theme.colors.primary, '#5a8200']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTopBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <ArrowBackIcon width={20} height={20} stroke={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Фото профиля и имя */}
          <View style={styles.profileHeader}>
            <View style={styles.profileImageWrapper}>
              {master.profileImage ? (
                <Image source={{ uri: master.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>
                    {master.firstName.charAt(0)}{master.lastName.charAt(0)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.profileNameContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>
                  {master.firstName} {master.lastName}
                </Text>
                {/* Бейдж PRO - не показываем для daily_worker */}
                {master.workerType !== 'daily_worker' && (
                  <ProBadge width={50} height={20} style={styles.proBadge} />
                )}
              </View>
              {primarySpecialization && (
                <Text style={styles.profileSpecialization}>
                  {getTranslatedSpecializationNameSingular(primarySpecialization.id, t)}
                </Text>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Статистические карточки */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {master.averageRating > 0 ? master.averageRating.toFixed(1) : '-'}
            </Text>
            <Text style={styles.statLabel}>{t('customer.rating_stat')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{master.completedJobs || 0}</Text>
            <Text style={styles.statLabel}>{t('customer.works_stat')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{master.profileViewsCount || 0}</Text>
            <Text style={styles.statLabel}>{t('customer.views_stat')}</Text>
          </View>
        </View>

        {/* Специализации */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('customer.specializations_title')}</Text>
          <View style={styles.specializationsContainer}>
            {Array.from({ length: Math.ceil(master.specializations.length / 2) }).map((_, rowIndex) => {
              const startIndex = rowIndex * 2;
              const rowSpecs = master.specializations.slice(startIndex, startIndex + 2);

              return (
                <ScrollView
                  key={`row-${rowIndex}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.specializationsRow}
                  contentContainerStyle={styles.specializationsRowContent}
                >
                  {rowSpecs.map((spec, specIndex) => {
                    const specializationData = getSpecializationById(spec.id);
                    return (
                      <View
                        key={`${spec.id}-${startIndex + specIndex}`}
                        style={[
                          styles.specChip,
                          spec.isPrimary && styles.specChipPrimary,
                        ]}
                      >
                        <CategoryIcon
                          icon={specializationData?.icon || '🔨'}
                          iconComponent={specializationData?.iconComponent}
                          size={18}
                          style={styles.specChipIcon}
                        />
                        <Text
                          style={[
                            styles.specChipText,
                            spec.isPrimary && styles.specChipTextPrimary,
                          ]}
                        >
                          {getTranslatedSpecializationNameSingular(spec.id, t)}
                        </Text>
                        {spec.isPrimary && (
                          <StarIcon width={14} height={14} style={styles.specChipStar} />
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              );
            })}
          </View>
        </View>

        {/* О себе */}
        {master.aboutMe && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('customer.about_me_title')}</Text>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutText}>{master.aboutMe}</Text>
            </View>
          </View>
        )}

        {/* Портфолио */}
        {master.workPhotos && master.workPhotos.length > 0 && (
          <View style={styles.portfolioSection}>
            <Text style={styles.sectionTitle}>
              {t('customer.portfolio_title')} ({master.workPhotos.length})
            </Text>
            <View style={styles.photosGrid}>
              {master.workPhotos.map((photo, index) => {
                const isNotLastInRow = (index + 1) % PHOTOS_PER_ROW !== 0;
                return (
                  <TouchableOpacity
                    key={`photo-${index}`}
                    style={[
                      styles.photoItem,
                      isNotLastInRow && styles.photoItemWithMargin,
                    ]}
                    onPress={() => handlePhotoPress(index)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: photo }}
                      style={styles.workPhoto}
                      resizeMode="cover"
                      onError={(error) => {
                        console.error(`[Portfolio] Ошибка загрузки фото ${index + 1}:`, error.nativeEvent);
                      }}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Отзывы */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>
            {t('customer.reviews_title', { count: reviews.length })}
          </Text>

          {reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {reviews.map(renderReview)}
            </View>
          ) : (
            <View style={styles.noReviewsContainer}>
              <EmptyStateNoReviews width={120} height={120} style={styles.noReviewsIcon} />
              <Text style={styles.noReviewsText}>{t('customer.no_reviews')}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Кнопки позвонить и поделиться */}
      <SafeAreaView edges={['bottom']} style={styles.bottomContainer}>
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <PhoneIcon width={24} height={24} style={styles.callButtonIcon} />
            <Text style={styles.callButtonText}>{t('customer.call_master')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <ShareIcon width={24} height={24} stroke={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Модальное окно для просмотра фото */}
      <Modal
        visible={selectedPhotoIndex !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePhotoModal}
      >
        <View style={styles.photoModalContainer}>
          <TouchableOpacity
            style={styles.photoModalClose}
            onPress={handleClosePhotoModal}
            activeOpacity={0.8}
          >
            <Text style={styles.photoModalCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedPhotoIndex !== null && master.workPhotos && (
            <Image
              source={{ uri: master.workPhotos[selectedPhotoIndex] }}
              style={styles.photoModalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
      
      {/* Auth Required Modal */}
      <AuthRequiredModal 
        visible={isAuthModalVisible}
        onClose={hideAuthModal}
        message={t('customer.call_master_auth_message')}
      />
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.secondary,
  },

  // Хедер с градиентом
  headerGradient: {
    paddingBottom: theme.spacing.md,
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },

  // Профиль в хедере
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  profileImageWrapper: {
    // Без тени для единообразия стиля
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  profileNameContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.white,
    marginRight: theme.spacing.sm,
  },
  proBadge: {
    marginTop: 2,
  },
  profileSpecialization: {
    fontSize: theme.fonts.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },

  // Скролл
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.md,
  },

  // Статистические карточки
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },

  // Секции
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },

  // Специализации
  specializationsContainer: {
    gap: 8,
  },
  specializationsRow: {
    flexGrow: 0,
  },
  specializationsRowContent: {
    flexDirection: 'row',
    gap: 8,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
  },
  specChipPrimary: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  specChipIcon: {
    marginRight: 6,
    flexShrink: 0,
  },
  specChipText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: '500',
    flexShrink: 1,
  },
  specChipTextPrimary: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  specChipStar: {
    marginLeft: 6,
  },

  // О себе
  aboutCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  aboutText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    lineHeight: 24,
    fontWeight: '400',
  },

  // Портфолио
  portfolioSection: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    marginBottom: PHOTO_GAP,
  },
  photoItemWithMargin: {
    marginRight: PHOTO_GAP,
  },
  workPhoto: {
    width: '100%',
    height: '100%',
  },

  // Модальное окно фото
  photoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  photoModalCloseText: {
    fontSize: 28,
    color: theme.colors.white,
    fontWeight: '300',
  },
  photoModalImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },

  // Кнопки внизу
  bottomContainer: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#DAE3EC',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  shareButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 56,
  },
  callButtonIcon: {
    marginRight: theme.spacing.xs,
  },
  callButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700',
  },

  // Секция отзывов
  reviewsSection: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  reviewsList: {
    gap: theme.spacing.md,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewCustomerInfo: {
    flex: 1,
  },
  reviewCustomerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  starContainer: {
    marginRight: 2,
  },
  reviewOrderTitle: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  noReviewsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noReviewsIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  noReviewsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

