import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar, Alert,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { usePlatformSafeAreaInsets, getFixedBottomStyle, getContainerBottomStyle, isSmallScreen as isSmallScreenUtil } from '../../utils/safeAreaUtils';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { HeaderWithBack, PlusIcon, CategoryIcon } from '../../components/common';
import { authService } from '../../services/authService';
import { User, Specialization, Education, WorkExperience } from '../../types';
import { useWorkerTranslation } from '../../hooks/useTranslation';
import { SPECIALIZATIONS, getSpecializationById, getTranslatedSpecializationName, getTranslatedSpecializationNameSingular } from '../../constants/specializations';
import { mediaService } from '../../services/mediaService';
import RemoveIcon from '../../../assets/remove.svg';
import { getAllCities, getCityName } from '../../utils/cityUtils';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const MAX_WORK_PHOTOS = 10;

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = usePlatformSafeAreaInsets();
  const { i18n, t } = useTranslation();
  const tWorker = useWorkerTranslation();

  // Состояние загрузки и данных пользователя
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Состояние формы
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [city, setCity] = useState<string>('');
  const [showCityModal, setShowCityModal] = useState(false);

  // Состояния фокуса для полей ввода
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);

  // Дополнительные поля для профессиональных мастеров
  const [aboutMe, setAboutMe] = useState('');
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);
  const [showSpecializationModal, setShowSpecializationModal] = useState(false);

  // Поля для job_seeker
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [desiredSalary, setDesiredSalary] = useState('');
  const [willingToRelocate, setWillingToRelocate] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const authState = authService.getAuthState();

      if (authState.isAuthenticated && authState.user) {
        const userData = authState.user;
        setUser(userData);

        // Заполняем форму данными пользователя
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setBirthDate(userData.birthDate ? new Date(userData.birthDate) : null);
        setProfileImage(userData.profileImage || null);
        setCity(userData.city || '');

        // Дополнительные поля для профессиональных мастеров
        if (userData.workerType === 'professional') {
          setAboutMe(userData.aboutMe || '');
          setSpecializations(userData.specializations || []);
          setWorkPhotos(userData.workPhotos || []);
        }

        // Поля для job_seeker
        if (userData.workerType === 'job_seeker') {
          console.log('[EditProfile] 📝 Загружаем данные job_seeker:', {
            education: userData.education,
            skills: userData.skills,
            workExperience: userData.workExperience,
            specializations: userData.specializations,
          });
          setAboutMe(userData.aboutMe || '');
          setEducation(userData.education || []);
          setSkills(userData.skills || []);
          setWorkExperience(userData.workExperience || []);
          setDesiredSalary(userData.desiredSalary ? userData.desiredSalary.toString() : '');
          setWillingToRelocate(userData.willingToRelocate || false);
          setSpecializations(userData.specializations || []);
        }
      } else {
        Alert.alert(tWorker('general_error'), tWorker('user_not_authorized'));
        navigation.goBack();
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      Alert.alert(tWorker('general_error'), tWorker('profile_load_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const locale = i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU';
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(tWorker('general_error'), tWorker('photo_access_needed'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1.0, // Максимальное качество, оптимизация будет в MediaService
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // Функции для работы с фотографиями работ (для профессиональных мастеров)
  const pickWorkPhoto = async () => {
    if (workPhotos.length >= MAX_WORK_PHOTOS) {
      Alert.alert(tWorker('general_error'), tWorker('max_work_photos_warning', { count: MAX_WORK_PHOTOS }));
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(tWorker('general_error'), tWorker('gallery_access_required'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_WORK_PHOTOS - workPhotos.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotoUris = result.assets.map(asset => asset.uri);
        setWorkPhotos(prev => [...prev, ...newPhotoUris]);
      }
    } catch (error) {
      console.error('Ошибка выбора фото:', error);
      Alert.alert(tWorker('general_error'), tWorker('photo_selection_error'));
    }
  };

  const removeWorkPhoto = (index: number) => {
    Alert.alert(
      tWorker('delete_photo_title'),
      tWorker('delete_photo_message'),
      [
        { text: tWorker('cancel'), style: 'cancel' },
        {
          text: tWorker('delete_photo_confirm'),
          style: 'destructive',
          onPress: () => {
            setWorkPhotos(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  // Функция для переключения специализации
  const toggleSpecialization = (specId: string) => {
    const spec = SPECIALIZATIONS.find(s => s.id === specId);
    if (!spec) return;

    const exists = specializations.find(s => s.id === specId);

    if (exists) {
      // Удаляем специализацию
      setSpecializations(prev => prev.filter(s => s.id !== specId));
    } else {
      // Добавляем специализацию
      // Новая специализация становится основной если:
      // 1. Это первая выбранная специализация
      // 2. Или среди уже выбранных нет основной
      const hasPrimary = specializations.some(s => s.isPrimary);
      const newSpec: Specialization = {
        id: spec.id,
        name: spec.name,
        isPrimary: specializations.length === 0 || !hasPrimary,
      };
      setSpecializations(prev => [...prev, newSpec]);
    }
  };

  // Функция для установки основной специализации
  const setPrimarySpecialization = (specId: string) => {
    setSpecializations(prev =>
      prev.map(s => ({
        ...s,
        isPrimary: s.id === specId,
      }))
    );
  };

  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      Alert.alert(tWorker('general_error'), tWorker('enter_first_name'));
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert(tWorker('general_error'), tWorker('enter_last_name'));
      return false;
    }

    if (!birthDate) {
      Alert.alert(tWorker('general_error'), tWorker('select_birth_date'));
      return false;
    }

    // Проверка возраста (должен быть старше 16 лет)
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (age < 16 || (age === 16 && monthDiff < 0)) {
      Alert.alert(tWorker('general_error'), tWorker('age_minimum_16'));
      return false;
    }

    // Дополнительная валидация для профессиональных мастеров
    if (user?.workerType === 'professional') {
      if (aboutMe.trim().length < 20) {
        Alert.alert(tWorker('general_error'), tWorker('about_me_min_length'));
        return false;
      }

      if (specializations.length === 0) {
        Alert.alert(tWorker('general_error'), tWorker('select_specialization'));
        return false;
      }

      if (workPhotos.length === 0) {
        Alert.alert(tWorker('general_error'), tWorker('upload_work_photo'));
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) {
      return;
    }

    setIsSaving(true);

    try {
      // Проверяем, нужно ли загружать изображение
      const hasNewImage = profileImage && profileImage.startsWith('file://');

      if (hasNewImage) {
        setIsUploadingImage(true);
        console.log('[EditProfile] 🖼️ Загружаем новое изображение профиля...');
      }

      const updatedData: Partial<User> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate!.toISOString(),
        profileImage: profileImage || undefined,
        city: city || undefined,
      };

      // Если это профессиональный мастер, добавляем дополнительные поля
      if (user.workerType === 'professional') {
        updatedData.aboutMe = aboutMe.trim();
        updatedData.specializations = specializations;

        // Загружаем новые фото работ (только локальные файлы)
        const newWorkPhotos = workPhotos.filter(photo => photo.startsWith('file://'));
        const existingWorkPhotos = workPhotos.filter(photo => !photo.startsWith('file://'));

        if (newWorkPhotos.length > 0) {
          console.log('[EditProfile] 📸 Загружаем новые фото работ...');
          const uploadedUrls: string[] = [];

          for (let i = 0; i < newWorkPhotos.length; i++) {
            const result = await mediaService.uploadWorkPhoto(newWorkPhotos[i]);
            if (result.success && result.url) {
              uploadedUrls.push(result.url);
              console.log(`[EditProfile] Фото ${i + 1}/${newWorkPhotos.length} загружено`);
            } else {
              console.error(`[EditProfile] Ошибка загрузки фото ${i + 1}:`, result.error);
              Alert.alert(tWorker('general_error'), tWorker('photo_upload_failed', { index: i + 1 }));
              setIsSaving(false);
              setIsUploadingImage(false);
              return;
            }
          }

          updatedData.workPhotos = [...existingWorkPhotos, ...uploadedUrls];
        } else {
          updatedData.workPhotos = existingWorkPhotos;
        }
      }

      // Если это job_seeker, добавляем поля резюме
      if (user.workerType === 'job_seeker') {
        updatedData.aboutMe = aboutMe.trim();
        updatedData.education = education;
        updatedData.skills = skills;
        updatedData.workExperience = workExperience;
        updatedData.desiredSalary = desiredSalary ? parseInt(desiredSalary.replace(/\s/g, '')) : undefined;
        updatedData.willingToRelocate = willingToRelocate;
        updatedData.specializations = specializations;
      }

      const result = await authService.updateProfile(updatedData);

      if (result.success && result.user) {
        setUser(result.user);
        console.log('[EditProfile] ✅ Профиль успешно обновлен');

        const successMessage = hasNewImage
          ? tWorker('profile_photo_updated')
          : tWorker('profile_updated');

        // Закрываем экран редактирования и возвращаемся назад
        navigation.goBack();

        // Показываем сообщение об успехе после небольшой задержки
        setTimeout(() => {
          Alert.alert(tWorker('success'), successMessage);
        }, 300);
      } else {
        console.error('[EditProfile] ❌ Ошибка обновления профиля:', result.error);

        // Более детальные сообщения об ошибках
        let errorMessage = result.error || tWorker('profile_update_failed');
        if (result.error?.includes('Storage') || result.error?.includes('изображение')) {
          errorMessage = tWorker('photo_upload_error');
        }

        Alert.alert(tWorker('general_error'), errorMessage);
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      Alert.alert(tWorker('general_error'), tWorker('save_error_general'));
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

  const getInitials = (): string => {
    const first = firstName.charAt(0)?.toUpperCase() || '';
    const last = lastName.charAt(0)?.toUpperCase() || '';
    return first + last || 'У';
  };

  // Функция для получения стиля контейнера поля ввода с учетом фокуса
  const getInputContainerStyle = (isFocused: boolean) => [
    styles.inputContainer,
    isFocused && styles.inputFocused,
  ];

  const hasChanges = (): boolean => {
    if (!user) return false;

    const basicChanges =
      firstName.trim() !== (user.firstName || '') ||
      lastName.trim() !== (user.lastName || '') ||
      birthDate?.toISOString() !== user.birthDate ||
      profileImage !== user.profileImage ||
      city !== (user.city || '');

    // Проверяем изменения для профессиональных мастеров
    if (user.workerType === 'professional') {
      const professionalChanges =
        aboutMe.trim() !== (user.aboutMe || '') ||
        JSON.stringify(specializations) !== JSON.stringify(user.specializations || []) ||
        JSON.stringify(workPhotos) !== JSON.stringify(user.workPhotos || []);

      return basicChanges || professionalChanges;
    }

    // Проверяем изменения для job_seeker
    if (user.workerType === 'job_seeker') {
      const jobSeekerChanges =
        JSON.stringify(education) !== JSON.stringify(user.education || []) ||
        JSON.stringify(skills) !== JSON.stringify(user.skills || []) ||
        JSON.stringify(workExperience) !== JSON.stringify(user.workExperience || []) ||
        desiredSalary !== (user.desiredSalary ? user.desiredSalary.toString() : '') ||
        willingToRelocate !== (user.willingToRelocate || false);

      return basicChanges || jobSeekerChanges;
    }

    return basicChanges;
  };

  const isProfessional = user?.workerType === 'professional';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack title={tWorker('edit_profile_title')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{tWorker('loading_profile_edit')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack title={tWorker('edit_profile_title')} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{tWorker('profile_load_error_edit')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
            <Text style={styles.retryButtonText}>{tWorker('try_again_edit')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <HeaderWithBack title={tWorker('edit_profile_title')} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials()}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editPhotoButton} onPress={pickImage}>
              <PlusIcon size={16} color="#679B00" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Phone Number (non-editable) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tWorker('phone_number')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user.phone}
                editable={false}
                placeholder="+998 90 123 45 67"
                placeholderTextColor="#C7C7CC"
              />
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tWorker('last_name')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, lastNameFocused && { borderColor: '#679B00', backgroundColor: '#F0F8FF' }]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Султонов"
                placeholderTextColor="#C7C7CC"
                autoCapitalize="words"
                returnKeyType="next"
                editable={true}
                onFocus={() => setLastNameFocused(true)}
                onBlur={() => setLastNameFocused(false)}
              />
            </View>
          </View>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tWorker('first_name')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, firstNameFocused && { borderColor: '#679B00', backgroundColor: '#F0F8FF' }]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Амир"
                placeholderTextColor="#C7C7CC"
                autoCapitalize="words"
                returnKeyType="next"
                editable={true}
                onFocus={() => setFirstNameFocused(true)}
                onBlur={() => setFirstNameFocused(false)}
              />
            </View>
          </View>

          {/* Birth Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tWorker('birth_date')}</Text>
            <TouchableOpacity
              style={styles.dateInputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateInput}>
                {birthDate ? formatDate(birthDate) : tWorker('select_birth_date_placeholder')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* City */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tWorker('city')}</Text>
            <TouchableOpacity
              style={styles.dateInputContainer}
              onPress={() => setShowCityModal(true)}
            >
              <Text style={[styles.dateInput, !city && styles.placeholderText]}>
                {city ? getCityName(city) : tWorker('select_city')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Дополнительные поля для профессиональных мастеров */}
          {isProfessional && (
            <>
              {/* О себе */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{tWorker('about_me_label')}</Text>
                <Text style={styles.hint}>
                  {tWorker('about_me_hint')}
                </Text>
                <TextInput
                  style={styles.textArea}
                  value={aboutMe}
                  onChangeText={setAboutMe}
                  placeholder={tWorker('about_me_placeholder')}
                  placeholderTextColor="#C7C7CC"
                  multiline
                  numberOfLines={6}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.charCounter}>
                  {tWorker('char_counter', { current: aboutMe.length, max: 500 })}
                </Text>
              </View>

              {/* Специализации */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{tWorker('specializations_label', { count: specializations.length })}</Text>
                <Text style={styles.hint}>
                  {tWorker('specializations_hint')}
                </Text>
                <View style={styles.specializationsContainer}>
                  {specializations.map((spec, index) => {
                    const specializationData = getSpecializationById(spec.id);
                    return (
                      <TouchableOpacity
                        key={`spec-${spec.id}-${index}`}
                        style={[
                          styles.specChip,
                          spec.isPrimary && styles.specChipPrimary,
                        ]}
                        onPress={() => setPrimarySpecialization(spec.id)}
                        onLongPress={() => toggleSpecialization(spec.id)}
                      >
                        <CategoryIcon
                          icon={specializationData?.icon || '🔨'}
                          iconComponent={specializationData?.iconComponent}
                          size={16}
                          style={styles.specChipIconWrapper}
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
                          <Text style={styles.specChipStar}>★</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.addSpecButton}
                    onPress={() => setShowSpecializationModal(true)}
                  >
                    <Text style={styles.addSpecIcon}>+</Text>
                    <Text style={styles.addSpecText}>{tWorker('add_specialization')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Фото работ */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {workPhotos.length > 0 ? tWorker('work_photos_count', { count: workPhotos.length, max: MAX_WORK_PHOTOS }) : tWorker('work_photos_label')}
                </Text>
                <Text style={styles.hint}>
                  {tWorker('work_photos_hint')}
                </Text>
                <View style={styles.photosGrid}>
                  {workPhotos.map((uri, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.workPhotoContainer}
                      onPress={() => removeWorkPhoto(index)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri }} style={styles.workPhoto} />
                      <View style={styles.removePhotoButton}>
                        <Text style={styles.removePhotoText}>✕</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {workPhotos.length < MAX_WORK_PHOTOS && (
                    <TouchableOpacity
                      style={styles.addPhotoButton}
                      onPress={pickWorkPhoto}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addPhotoIcon}>+</Text>
                      <Text style={styles.addPhotoText}>{tWorker('add_photo')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </>
          )}

          {/* Job Seeker Section */}
          {user.workerType === 'job_seeker' && (
            <>
              {/* Заголовок секции */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>📝 Резюме</Text>
                <Text style={styles.sectionHeaderSubtitle}>Заполните информацию о себе</Text>
              </View>

              {/* О себе - карточка */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>👤 О себе</Text>
                <Text style={styles.cardHint}>
                  Расскажите о себе, своем опыте и профессиональных качествах
                </Text>
                <TextInput
                  style={styles.textArea}
                  value={aboutMe}
                  onChangeText={setAboutMe}
                  placeholder="Например: Ответственный специалист с опытом работы в сфере..."
                  placeholderTextColor="#C7C7CC"
                  multiline
                  numberOfLines={6}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.charCounter}>
                  {aboutMe.length} / 500
                </Text>
              </View>

              {/* Желаемая зарплата и готовность к переезду - карточка */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>💼 Пожелания к работе</Text>
                
                <Text style={styles.label}>Желаемая зарплата</Text>
                <TextInput
                  style={styles.input}
                  value={desiredSalary}
                  onChangeText={(text) => {
                    const numbers = text.replace(/\D/g, '');
                    setDesiredSalary(numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
                  }}
                  placeholder="5 000 000"
                  placeholderTextColor="#C7C7CC"
                  keyboardType="numeric"
                />
                <Text style={styles.hint}>Укажите желаемую зарплату в сумах</Text>

                {/* Готовность к переезду */}
                <TouchableOpacity
                  style={[styles.checkboxContainer, { marginTop: 16, paddingVertical: 0 }]}
                  onPress={() => setWillingToRelocate(!willingToRelocate)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, willingToRelocate && styles.checkboxChecked]}>
                    {willingToRelocate && <Text style={styles.checkboxIcon}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Готов к переездам</Text>
                </TouchableOpacity>
              </View>

              {/* Образование - карточка */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>🎓 Образование ({education.length})</Text>
                {education.map((edu, index) => (
                  <View key={index} style={styles.resumeEditItem}>
                    <TextInput
                      style={styles.input}
                      value={edu.institution}
                      onChangeText={(text) => {
                        const newEducation = [...education];
                        newEducation[index].institution = text;
                        setEducation(newEducation);
                      }}
                      placeholder="Название учебного заведения"
                      placeholderTextColor="#C7C7CC"
                    />
                    <TextInput
                      style={[styles.input, { marginTop: 8 }]}
                      value={edu.degree}
                      onChangeText={(text) => {
                        const newEducation = [...education];
                        newEducation[index].degree = text;
                        setEducation(newEducation);
                      }}
                      placeholder="Степень/специальность"
                      placeholderTextColor="#C7C7CC"
                    />
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={edu.yearStart}
                        onChangeText={(text) => {
                          const newEducation = [...education];
                          newEducation[index].yearStart = text;
                          setEducation(newEducation);
                        }}
                        placeholder="Год начала"
                        placeholderTextColor="#C7C7CC"
                        keyboardType="numeric"
                        maxLength={4}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={edu.yearEnd}
                        onChangeText={(text) => {
                          const newEducation = [...education];
                          newEducation[index].yearEnd = text;
                          setEducation(newEducation);
                        }}
                        placeholder="Год окончания"
                        placeholderTextColor="#C7C7CC"
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => setEducation(education.filter((_, i) => i !== index))}
                    >
                      <Text style={styles.removeButtonText}>Удалить</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setEducation([...education, { institution: '', degree: '', yearStart: '', yearEnd: '' }])}
                >
                  <Text style={styles.addButtonIcon}>+</Text>
                  <Text style={styles.addButtonText}>Добавить образование</Text>
                </TouchableOpacity>
              </View>

              {/* Опыт работы - карточка */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>💼 Опыт работы ({workExperience.length})</Text>
                {workExperience.map((exp, index) => (
                  <View key={index} style={styles.resumeEditItem}>
                    <TextInput
                      style={styles.input}
                      value={exp.company}
                      onChangeText={(text) => {
                        const newExperience = [...workExperience];
                        newExperience[index].company = text;
                        setWorkExperience(newExperience);
                      }}
                      placeholder="Название компании"
                      placeholderTextColor="#C7C7CC"
                    />
                    <TextInput
                      style={[styles.input, { marginTop: 8 }]}
                      value={exp.position}
                      onChangeText={(text) => {
                        const newExperience = [...workExperience];
                        newExperience[index].position = text;
                        setWorkExperience(newExperience);
                      }}
                      placeholder="Должность"
                      placeholderTextColor="#C7C7CC"
                    />
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={exp.yearStart}
                        onChangeText={(text) => {
                          const newExperience = [...workExperience];
                          newExperience[index].yearStart = text;
                          setWorkExperience(newExperience);
                        }}
                        placeholder="Год начала"
                        placeholderTextColor="#C7C7CC"
                        keyboardType="numeric"
                        maxLength={4}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={exp.yearEnd}
                        onChangeText={(text) => {
                          const newExperience = [...workExperience];
                          newExperience[index].yearEnd = text;
                          setWorkExperience(newExperience);
                        }}
                        placeholder="Год окончания"
                        placeholderTextColor="#C7C7CC"
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    </View>
                    <TextInput
                      style={[styles.textArea, { marginTop: 8 }]}
                      value={exp.description}
                      onChangeText={(text) => {
                        const newExperience = [...workExperience];
                        newExperience[index].description = text;
                        setWorkExperience(newExperience);
                      }}
                      placeholder="Описание обязанностей (опционально)"
                      placeholderTextColor="#C7C7CC"
                      multiline
                      numberOfLines={3}
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => setWorkExperience(workExperience.filter((_, i) => i !== index))}
                    >
                      <Text style={styles.removeButtonText}>Удалить</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setWorkExperience([...workExperience, { company: '', position: '', yearStart: '', yearEnd: '', description: '' }])}
                >
                  <Text style={styles.addButtonIcon}>+</Text>
                  <Text style={styles.addButtonText}>Добавить опыт работы</Text>
                </TouchableOpacity>
              </View>

              {/* Навыки - карточка */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>⚡ Навыки ({skills.length})</Text>
                <View style={styles.skillsContainer}>
                  {skills.map((skill, index) => (
                    <View key={index} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{skill}</Text>
                      <TouchableOpacity
                        onPress={() => setSkills(skills.filter((_, i) => i !== index))}
                      >
                        <Text style={styles.skillChipRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <View style={styles.skillInputContainer}>
                  <TextInput
                    style={styles.skillInput}
                    value={newSkill}
                    onChangeText={setNewSkill}
                    placeholder="Введите навык"
                    placeholderTextColor="#C7C7CC"
                    onSubmitEditing={() => {
                      const skill = newSkill.trim();
                      if (skill && !skills.includes(skill)) {
                        setSkills([...skills, skill]);
                        setNewSkill('');
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.addSkillButtonInside}
                    onPress={() => {
                      const skill = newSkill.trim();
                      if (skill && !skills.includes(skill)) {
                        setSkills([...skills, skill]);
                        setNewSkill('');
                      }
                    }}
                  >
                    <Text style={styles.addSkillButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.hint}>Добавьте навыки, которыми владеете</Text>
              </View>

              {/* Специализации - карточка */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>🎯 Специализации ({specializations.length})</Text>
                <Text style={styles.cardHint}>
                  Выберите интересующие вас специализации. Первая будет основной.
                </Text>
                <View style={styles.specializationsContainer}>
                  {specializations.map((spec, index) => {
                    const specializationData = getSpecializationById(spec.id);
                    return (
                      <View
                        key={`spec-${spec.id}-${index}`}
                        style={[
                          styles.specChip,
                          spec.isPrimary && styles.specChipPrimary,
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.specChipContent}
                          onPress={() => setPrimarySpecialization(spec.id)}
                          activeOpacity={0.7}
                        >
                          <CategoryIcon
                            icon={specializationData?.icon || '🔨'}
                            iconComponent={specializationData?.iconComponent}
                            size={16}
                            style={styles.specChipIconWrapper}
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
                            <Text style={styles.specChipStar}>★</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.specChipRemoveButton}
                          onPress={() => toggleSpecialization(spec.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <RemoveIcon width={12} height={12} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.addSpecButton}
                    onPress={() => setShowSpecializationModal(true)}
                  >
                    <Text style={styles.addSpecIcon}>+</Text>
                    <Text style={styles.addSpecText}>Добавить специализацию</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomSection, getContainerBottomStyle(insets)]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (isSaving || !hasChanges()) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={isSaving || !hasChanges()}
        >
          <Text style={styles.saveButtonText}>
            {isUploadingImage ? tWorker('uploading') : isSaving ? tWorker('saving') : tWorker('save')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <View style={styles.datePickerContainer}>
          {Platform.OS === 'ios' && (
            <View style={styles.datePickerHeader}>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.doneButtonText}>{tWorker('done')}</Text>
              </TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            value={birthDate || new Date()}
            mode="date"
            display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1950, 0, 1)}
            {...(Platform.OS === 'ios' && { locale: i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU' })}
          />
        </View>
      )}

      {/* Модальное окно выбора специализаций */}
      {showSpecializationModal && (isProfessional || user.workerType === 'job_seeker') && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{tWorker('choose_specializations_title')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowSpecializationModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {SPECIALIZATIONS.filter(spec => !spec.isParent).map((spec) => {
                const isSelected = specializations.some(s => s.id === spec.id);
                return (
                  <TouchableOpacity
                    key={spec.id}
                    style={[
                      styles.modalSpecItem,
                      isSelected && styles.modalSpecItemSelected,
                    ]}
                    onPress={() => toggleSpecialization(spec.id)}
                  >
                    <CategoryIcon
                      icon={spec.icon}
                      iconComponent={spec.iconComponent}
                      size={24}
                      style={styles.modalSpecIconWrapper}
                    />
                    <Text style={styles.modalSpecName}>{getTranslatedSpecializationName(spec.id, t)}</Text>
                    {isSelected && (
                      <Text style={styles.modalSpecCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowSpecializationModal(false)}
            >
              <Text style={styles.modalDoneText}>{tWorker('done_button')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* City Selection Modal */}
      {showCityModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{tWorker('select_city')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCityModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {getAllCities().map((cityItem) => (
                <TouchableOpacity
                  key={cityItem.id}
                  style={[
                    styles.modalCityItem,
                    city === cityItem.id && styles.modalCityItemSelected,
                  ]}
                  onPress={() => {
                    setCity(cityItem.id);
                    setShowCityModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalCityName,
                    city === cityItem.id && styles.modalCityNameSelected,
                  ]}>
                    {cityItem.name}
                  </Text>
                  {city === cityItem.id && (
                    <Text style={styles.modalCityCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
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
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },



  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: isSmallScreenUtil() ? 140 : 120,
  },

  // Photo Section
  photoSection: {
    alignItems: 'center',
    paddingVertical: isSmallScreenUtil() ? 20 : 30,
  },
  photoContainer: {
    position: 'relative',
  },
  profileImage: {
    width: isSmallScreenUtil() ? 100 : 120,
    height: isSmallScreenUtil() ? 100 : 120,
    borderRadius: isSmallScreenUtil() ? 50 : 60,
  },
  avatar: {
    width: isSmallScreenUtil() ? 100 : 120,
    height: isSmallScreenUtil() ? 100 : 120,
    borderRadius: isSmallScreenUtil() ? 50 : 60,
    backgroundColor: '#679B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: isSmallScreenUtil() ? 32 : 40,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },


  // Form
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: isSmallScreenUtil() ? 12 : 20,
  },
  // Карточки для job_seeker
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionHeaderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  cardHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: isSmallScreenUtil() ? 14 : 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: isSmallScreenUtil() ? 6 : 8,
  },
  inputContainer: {
    // Простой контейнер без стилей, чтобы не мешать фокусу
  },
  input: {
    flex: 1,
    fontSize: isSmallScreenUtil() ? 14 : 16,
    color: '#1A1A1A',
    paddingRight: 12,
    borderWidth: 1,
    borderColor: '#D5D7DA',
    borderRadius: 12,
    paddingHorizontal: isSmallScreenUtil() ? 12 : 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  inputFocused: {
    borderColor: '#679B00',
    backgroundColor: '#F0F8FF',
  },
  inputDisabled: {
    color: '#8E8E93',
    backgroundColor: 'transparent',
  },
  dateInputContainer: {
    borderWidth: 1,
    borderColor: '#D5D7DA',
    borderRadius: 12,
    paddingHorizontal: isSmallScreenUtil() ? 12 : 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  dateInput: {
    fontSize: isSmallScreenUtil() ? 14 : 16,
    color: '#1A1A1A',
  },

  // Bottom Section
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0, // Динамически устанавливается через getFixedBottomStyle
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    // Убираем тени для чистого вида
    elevation: 0, shadowOpacity: 0,
  },
  saveButton: {
    backgroundColor: '#679B00',
    borderRadius: 12,
    paddingVertical: isSmallScreenUtil() ? 12 : 16,
    alignItems: 'center',
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0, elevation: 0,
  },
  saveButtonText: {
    fontSize: isSmallScreenUtil() ? 14 : 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Date Picker
  datePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 0,
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  doneButton: {
    backgroundColor: '#679B00',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Дополнительные стили для профессиональных мастеров
  hint: {
    fontSize: isSmallScreenUtil() ? 12 : 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5D7DA',
    padding: isSmallScreenUtil() ? 12 : 16,
    fontSize: isSmallScreenUtil() ? 14 : 16,
    color: '#1A1A1A',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: 4,
  },

  // Специализации
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D5D7DA',
    maxWidth: '100%',
  },
  specChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
  },
  specChipPrimary: {
    backgroundColor: '#679B00',
    borderColor: '#679B00',
  },
  specChipIconWrapper: {
    marginRight: 6,
    flexShrink: 0,
  },
  specChipText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    flexShrink: 1,
  },
  specChipTextPrimary: {
    color: '#FFFFFF',
  },
  specChipStar: {
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 4,
    flexShrink: 0,
  },
  specChipRemoveButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    flexShrink: 0,
  },
  addSpecButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D5D7DA',
    borderStyle: 'dashed',
  },
  addSpecIcon: {
    fontSize: 16,
    color: '#679B00',
    marginRight: 4,
  },
  addSpecText: {
    fontSize: 14,
    color: '#679B00',
    fontWeight: '500',
  },

  // Фото работ
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  workPhotoContainer: {
    width: (screenWidth - 40 - 16) / 3,
    height: (screenWidth - 40 - 16) / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  workPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoButton: {
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
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: (screenWidth - 40 - 16) / 3,
    height: (screenWidth - 40 - 16) / 3,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#D5D7DA',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoIcon: {
    fontSize: 32,
    color: '#679B00',
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Модальное окно
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#1A1A1A',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalSpecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  modalSpecItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  modalSpecIconWrapper: {
    marginRight: 12,
  },
  modalSpecName: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalSpecCheck: {
    fontSize: 20,
    color: '#679B00',
    fontWeight: 'bold',
  },
  modalDoneButton: {
    backgroundColor: '#679B00',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Job Seeker Styles
  resumeEditItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#679B00',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  addButtonIcon: {
    fontSize: 24,
    color: '#679B00',
    marginRight: 8,
    fontWeight: 'bold',
  },
  addButtonText: {
    color: '#679B00',
    fontSize: 16,
    fontWeight: '600',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(103, 155, 0, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  skillChipText: {
    fontSize: 14,
    color: '#679B00',
    fontWeight: '500',
    marginRight: 6,
  },
  skillChipRemove: {
    fontSize: 16,
    color: '#679B00',
    fontWeight: 'bold',
  },
  skillInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5D7DA',
    marginTop: 8,
    paddingRight: 4,
  },
  skillInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  addSkillButtonInside: {
    width: 40,
    height: 40,
    backgroundColor: '#679B00',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSkillButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D5D7DA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#679B00',
    borderColor: '#679B00',
  },
  checkboxIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },

  // City Modal Styles
  placeholderText: {
    color: '#C7C7CC',
  },
  modalCityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  modalCityItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  modalCityName: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalCityNameSelected: {
    color: '#679B00',
    fontWeight: '600',
  },
  modalCityCheck: {
    fontSize: 20,
    color: '#679B00',
    fontWeight: 'bold',
  },
}); 