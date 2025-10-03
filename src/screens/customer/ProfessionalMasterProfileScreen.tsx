import React, { useState, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme, getSpecializationIcon } from '../../constants';
import type { CustomerStackParamList } from '../../types';
import { HeaderWithBack } from '../../components/common';
import { lightElevationStyles } from '../../utils/noShadowStyles';
import {
  professionalMasterService,
  ProfessionalMaster,
} from '../../services/professionalMasterService';

const { width: screenWidth } = Dimensions.get('window');
const photoSize = (screenWidth - theme.spacing.lg * 2 - theme.spacing.sm * 2) / 3;

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;
type ScreenRouteProp = RouteProp<CustomerStackParamList, 'ProfessionalMasterProfile'>;

export const ProfessionalMasterProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { masterId } = route.params;

  const [master, setMaster] = useState<ProfessionalMaster | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMaster();
  }, [masterId]);

  const loadMaster = async () => {
    try {
      setIsLoading(true);
      const data = await professionalMasterService.getMasterById(masterId);
      console.log('[ProfessionalMasterProfile] Загружен мастер:', {
        id: data?.id,
        name: data ? `${data.firstName} ${data.lastName}` : null,
        workPhotos: data?.workPhotos,
        workPhotosLength: data?.workPhotos?.length || 0,
      });
      setMaster(data);
    } catch (error) {
      console.error('Ошибка загрузки профиля мастера:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить профиль мастера');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (!master) return;

    Alert.alert(
      'Позвонить мастеру',
      `Позвонить на номер ${master.phone}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Позвонить',
          onPress: async () => {
            const phoneUrl = `tel:${master.phone}`;
            const canOpen = await Linking.canOpenURL(phoneUrl);
            if (canOpen) {
              await Linking.openURL(phoneUrl);
            } else {
              Alert.alert('Ошибка', 'Не удалось совершить звонок');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <HeaderWithBack title="Профиль мастера" backAction={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!master) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <HeaderWithBack title="Профиль мастера" backAction={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Мастер не найден</Text>
        </View>
      </SafeAreaView>
    );
  }

  const primarySpecialization = master.specializations.find(s => s.isPrimary);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <HeaderWithBack
        title={primarySpecialization?.name || 'Профиль мастера'}
        backAction={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Фото профиля и основная информация */}
        <View style={styles.headerSection}>
          {master.profileImage ? (
            <Image source={{ uri: master.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>
                {master.firstName.charAt(0)}{master.lastName.charAt(0)}
              </Text>
            </View>
          )}

          <Text style={styles.name}>
            {master.lastName} {master.firstName}
          </Text>

          {/* Рейтинг */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingIcon}>⭐</Text>
            <Text style={styles.ratingText}>
              {master.averageRating > 0 ? master.averageRating.toFixed(1) : 'Новый мастер'}
            </Text>
            {master.totalReviews > 0 && (
              <Text style={styles.reviewsText}>
                ({master.totalReviews} отзыв{master.totalReviews === 1 ? '' : master.totalReviews < 5 ? 'а' : 'ов'})
              </Text>
            )}
          </View>

          {/* Статистика */}
          {master.completedJobs > 0 && (
            <Text style={styles.statsText}>
              Выполнено работ: {master.completedJobs}
            </Text>
          )}
        </View>

        {/* Специализации */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Специализации</Text>
          <View style={styles.specializationsContainer}>
            {master.specializations.map((spec) => (
              <View
                key={spec.id}
                style={[
                  styles.specChip,
                  spec.isPrimary && styles.specChipPrimary,
                ]}
              >
                <Text style={styles.specChipIcon}>
                  {getSpecializationIcon(spec.id)}
                </Text>
                <Text
                  style={[
                    styles.specChipText,
                    spec.isPrimary && styles.specChipTextPrimary,
                  ]}
                >
                  {spec.name}
                </Text>
                {spec.isPrimary && (
                  <Text style={styles.specChipStar}>★</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* О себе */}
        {master.aboutMe && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>О себе</Text>
            <Text style={styles.aboutText}>{master.aboutMe}</Text>
          </View>
        )}

        {/* Фото работ */}
        {master.workPhotos && master.workPhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Фото работ ({master.workPhotos.length})
            </Text>
            <View style={styles.photosGrid}>
              {master.workPhotos.map((photo, index) => {
                console.log(`[ProfessionalMasterProfile] Фото ${index + 1}:`, photo);
                return (
                  <Image
                    key={index}
                    source={{ uri: photo }}
                    style={styles.workPhoto}
                    onError={(error) => {
                      console.error(`[ProfessionalMasterProfile] Ошибка загрузки фото ${index + 1}:`, error.nativeEvent);
                    }}
                    onLoad={() => {
                      console.log(`[ProfessionalMasterProfile] Фото ${index + 1} успешно загружено`);
                    }}
                  />
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Кнопка позвонить */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <Text style={styles.callButtonIcon}>📞</Text>
          <Text style={styles.callButtonText}>Позвонить</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.secondary,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: theme.spacing.md,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  name: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  ratingIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  ratingText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  reviewsText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  statsText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  section: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  specChipPrimary: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  specChipIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  specChipText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  specChipTextPrimary: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  specChipStar: {
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 4,
  },
  aboutText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  workPhoto: {
    width: photoSize,
    height: photoSize,
    borderRadius: 8,
  },
  bottomContainer: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    minHeight: 48,
  },
  callButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  callButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
  },
});

