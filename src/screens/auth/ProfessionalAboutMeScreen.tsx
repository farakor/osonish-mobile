import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../constants';
import { noElevationStyles, borderButtonStyles } from '../../utils/noShadowStyles';
import type { RootStackParamList } from '../../types';
import { HeaderWithBack } from '../../components/common';
import { useAuthTranslation, useErrorsTranslation, useCommonTranslation } from '../../hooks/useTranslation';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MAX_PHOTOS = 10;
const MIN_PHOTOS = 1;

export const ProfessionalAboutMeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const t = useAuthTranslation();
  const tError = useErrorsTranslation();
  const tCommon = useCommonTranslation();
  const [aboutMe, setAboutMe] = useState('');
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async () => {
    if (workPhotos.length >= MAX_PHOTOS) {
      Alert.alert(t('max_photos_warning'), t('max_photos_message', { max: MAX_PHOTOS }));
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(tError('error'), t('gallery_permission_error'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - workPhotos.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotoUris = result.assets.map(asset => asset.uri);
        setWorkPhotos(prev => [...prev, ...newPhotoUris]);
      }
    } catch (error) {
      console.error('Ошибка выбора фото:', error);
      Alert.alert(tError('error'), t('photo_selection_error'));
    }
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      t('delete_photo_title'),
      t('delete_photo_message'),
      [
        { text: tCommon('cancel'), style: 'cancel' },
        {
          text: tCommon('delete'),
          style: 'destructive',
          onPress: () => {
            setWorkPhotos(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const handleContinue = async () => {
    if (aboutMe.trim().length < 20) {
      Alert.alert(t('max_photos_warning'), t('about_me_min_length_error'));
      return;
    }

    if (workPhotos.length < MIN_PHOTOS) {
      Alert.alert(t('max_photos_warning'), t('min_photos_error', { min: MIN_PHOTOS }));
      return;
    }

    try {
      setIsUploading(true);
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const profileDataString = await AsyncStorage.default.getItem('@temp_profile_data');

      if (!profileDataString) {
        Alert.alert(tError('error'), t('profile_data_not_found_error'));
        return;
      }

      console.log(`[ProfessionalAboutMe] ${t('uploading_photos')}`);

      // Загружаем фото работ в Supabase Storage
      const { mediaService } = await import('../../services/mediaService');
      const uploadedPhotoUrls: string[] = [];

      for (let i = 0; i < workPhotos.length; i++) {
        const localUri = workPhotos[i];
        console.log(`[ProfessionalAboutMe] Загрузка фото ${i + 1}/${workPhotos.length}:`, localUri);

        const result = await mediaService.uploadWorkPhoto(localUri);

        if (result.success && result.url) {
          uploadedPhotoUrls.push(result.url);
          console.log(`[ProfessionalAboutMe] Фото ${i + 1} успешно загружено:`, result.url);
        } else {
          console.error(`[ProfessionalAboutMe] Ошибка загрузки фото ${i + 1}:`, result.error);
          Alert.alert(tError('error'), t('photo_upload_error', { index: i + 1, error: result.error }));
          return;
        }
      }

      console.log('[ProfessionalAboutMe] Все фото загружены:', uploadedPhotoUrls);

      // Сохраняем описание и URL загруженных фото
      const profileData = JSON.parse(profileDataString);
      profileData.aboutMe = aboutMe.trim();
      profileData.workPhotos = uploadedPhotoUrls; // Сохраняем URL вместо локальных путей
      await AsyncStorage.default.setItem('@temp_profile_data', JSON.stringify(profileData));

      // Переходим к выбору города
      navigation.navigate('CitySelection', { role: 'worker', workerType: 'professional' });
    } catch (error) {
      console.error('Ошибка:', error);
      Alert.alert(tError('error'), t('general_error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderWithBack title={t('about_me_screen_title')} backAction={handleBackPress} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('about_me_section_title')}</Text>
            <Text style={styles.sectionHint}>
              {t('about_me_section_hint')}
            </Text>
            <TextInput
              style={styles.textArea}
              value={aboutMe}
              onChangeText={setAboutMe}
              placeholder={t('about_me_placeholder')}
              placeholderTextColor={theme.colors.text.secondary}
              multiline
              numberOfLines={6}
              maxLength={500}
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={() => {
                // Скрываем клавиатуру при нажатии "Готово"
              }}
            />
            <Text style={styles.charCounter}>
              {aboutMe.length} / 500
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {workPhotos.length > 0 
                ? t('work_photos_title_with_count', { count: workPhotos.length, max: MAX_PHOTOS })
                : t('work_photos_title')
              }
            </Text>
            <Text style={styles.sectionHint}>
              {t('work_photos_hint', { min: MIN_PHOTOS })}
            </Text>

            <View style={styles.photosGrid}>
              {workPhotos.map((uri, index) => {
                const isNotLastInRow = (index + 1) % 3 !== 0;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.photoContainer,
                      isNotLastInRow && styles.photoContainerWithMargin,
                    ]}
                    onPress={() => handleRemovePhoto(index)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri }} style={styles.photo} />
                    <View style={styles.removeButton}>
                      <Text style={styles.removeButtonText}>✕</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {workPhotos.length < MAX_PHOTOS && (
                <TouchableOpacity
                  style={[
                    styles.addPhotoButton,
                    (workPhotos.length + 1) % 3 !== 0 && styles.photoContainerWithMargin,
                  ]}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addPhotoIcon}>+</Text>
                  <Text style={styles.addPhotoText}>{t('add_photo_button')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (aboutMe.trim().length < 20 || workPhotos.length < MIN_PHOTOS) &&
            styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={
            isUploading ||
            aboutMe.trim().length < 20 ||
            workPhotos.length < MIN_PHOTOS
          }
          activeOpacity={0.8}
        >
          {isUploading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text
              style={[
                styles.continueButtonText,
                (aboutMe.trim().length < 20 || workPhotos.length < MIN_PHOTOS) &&
                styles.continueButtonTextDisabled,
              ]}
            >
              {tCommon('continue')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Формула: (ширина_экрана - отступы_контейнера - отступы_между_фото) / количество_в_ряд
// Для 3 фото в ряд: отступы между фото = 2 * 8px = 16px
const PHOTOS_PER_ROW = 3;
const PHOTO_GAP = theme.spacing.sm; // 8px
const photoSize = Math.floor((screenWidth - theme.spacing.lg * 2 - PHOTO_GAP * (PHOTOS_PER_ROW - 1)) / PHOTOS_PER_ROW);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    minHeight: 120,
    ...borderButtonStyles,
  },
  charCounter: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoContainer: {
    width: photoSize,
    height: photoSize,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: PHOTO_GAP,
  },
  photoContainerWithMargin: {
    marginRight: PHOTO_GAP,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: photoSize,
    height: photoSize,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: PHOTO_GAP,
    ...borderButtonStyles,
  },
  addPhotoIcon: {
    fontSize: 32,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  bottomContainer: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    alignItems: 'center',
    minHeight: isSmallScreen ? 44 : 48,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold as any,
  },
  continueButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },
});

