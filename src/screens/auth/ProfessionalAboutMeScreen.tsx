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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../constants';
import { noElevationStyles, borderButtonStyles } from '../../utils/noShadowStyles';
import type { RootStackParamList } from '../../types';
import { HeaderWithBack } from '../../components/common';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MAX_PHOTOS = 10;
const MIN_PHOTOS = 1;

export const ProfessionalAboutMeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [aboutMe, setAboutMe] = useState('');
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async () => {
    if (workPhotos.length >= MAX_PHOTOS) {
      Alert.alert('Внимание', `Можно загрузить максимум ${MAX_PHOTOS} фотографий`);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение на доступ к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setWorkPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Ошибка выбора фото:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать фото');
    }
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Удалить фото?',
      'Вы уверены, что хотите удалить это фото?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
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
      Alert.alert('Внимание', 'Опишите себя более подробно (минимум 20 символов)');
      return;
    }

    if (workPhotos.length < MIN_PHOTOS) {
      Alert.alert('Внимание', `Загрузите хотя бы ${MIN_PHOTOS} фото ваших работ`);
      return;
    }

    try {
      setIsUploading(true);
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const profileDataString = await AsyncStorage.default.getItem('@temp_profile_data');

      if (!profileDataString) {
        Alert.alert('Ошибка', 'Данные профиля не найдены');
        return;
      }

      console.log('[ProfessionalAboutMe] Загрузка фото работ в Storage...');

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
          Alert.alert('Ошибка', `Не удалось загрузить фото ${i + 1}: ${result.error}`);
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
      Alert.alert('Ошибка', 'Произошла ошибка. Попробуйте снова.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBack title="О себе" backAction={handleBackPress} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Расскажите о себе</Text>
            <Text style={styles.sectionHint}>
              Опишите ваш опыт работы, достижения и что вы умеете делать лучше всего
            </Text>
            <TextInput
              style={styles.textArea}
              value={aboutMe}
              onChangeText={setAboutMe}
              placeholder="Например: Опыт работы сантехником более 10 лет. Специализируюсь на установке..."
              placeholderTextColor={theme.colors.text.secondary}
              multiline
              numberOfLines={6}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCounter}>
              {aboutMe.length} / 500
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Фото ваших работ {workPhotos.length > 0 && `(${workPhotos.length}/${MAX_PHOTOS})`}
            </Text>
            <Text style={styles.sectionHint}>
              Загрузите фотографии выполненных работ. Минимум {MIN_PHOTOS} фото.
            </Text>

            <View style={styles.photosGrid}>
              {workPhotos.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.photoContainer}
                  onPress={() => handleRemovePhoto(index)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri }} style={styles.photo} />
                  <View style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>✕</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {workPhotos.length < MAX_PHOTOS && (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addPhotoIcon}>+</Text>
                  <Text style={styles.addPhotoText}>Добавить фото</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomContainer}>
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
                Продолжить
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const photoSize = (screenWidth - theme.spacing.lg * 2 - theme.spacing.sm * 2) / 3;

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
    gap: theme.spacing.sm,
  },
  photoContainer: {
    width: photoSize,
    height: photoSize,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
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
    paddingVertical: theme.spacing.md,
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

