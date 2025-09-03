import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  Alert,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { usePlatformSafeAreaInsets, getFixedBottomStyle, getContainerBottomStyle, isSmallScreen } from '../../utils/safeAreaUtils';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { HeaderWithBack, PlusIcon } from '../../components/common';
import { authService } from '../../services/authService';
import { User } from '../../types';
import { useWorkerTranslation } from '../../hooks/useTranslation';

const { height: screenHeight } = Dimensions.get('window');

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = usePlatformSafeAreaInsets();
  const tWorker = useWorkerTranslation();

  // Состояние загрузки и данных пользователя
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Состояние формы
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
        setMiddleName(userData.middleName || '');
        setBirthDate(userData.birthDate ? new Date(userData.birthDate) : null);
        setProfileImage(userData.profileImage || null);
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
    return date.toLocaleDateString('ru-RU', {
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
        middleName: middleName.trim() || undefined,
        birthDate: birthDate!.toISOString(),
        profileImage: profileImage || undefined,
      };

      const result = await authService.updateProfile(updatedData);

      if (result.success && result.user) {
        setUser(result.user);
        console.log('[EditProfile] ✅ Профиль успешно обновлен');

        const successMessage = hasNewImage
          ? tWorker('profile_photo_updated')
          : tWorker('profile_updated');

        Alert.alert(tWorker('success'), successMessage, [
          { text: tWorker('ok'), onPress: () => navigation.goBack() }
        ]);
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

  const hasChanges = (): boolean => {
    if (!user) return false;

    return (
      firstName.trim() !== (user.firstName || '') ||
      lastName.trim() !== (user.lastName || '') ||
      middleName.trim() !== (user.middleName || '') ||
      birthDate?.toISOString() !== user.birthDate ||
      profileImage !== user.profileImage
    );
  };

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
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <HeaderWithBack title={tWorker('edit_profile_title')} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              <PlusIcon size={16} color="#FFFFFF" />
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
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Иванов"
                placeholderTextColor="#C7C7CC"
              />
            </View>
          </View>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tWorker('first_name')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Иван"
                placeholderTextColor="#C7C7CC"
              />
            </View>
          </View>

          {/* Middle Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tWorker('middle_name')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={middleName}
                onChangeText={setMiddleName}
                placeholder="Иванович"
                placeholderTextColor="#C7C7CC"
              />
            </View>
          </View>

          {/* Birth Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tWorker('birth_date')}</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.input, styles.dateInput]}>
                {birthDate ? formatDate(birthDate) : tWorker('select_birth_date_placeholder')}
              </Text>
            </TouchableOpacity>
          </View>
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
            locale="ru-RU"
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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

  // Photo Section
  photoSection: {
    alignItems: 'center',
    paddingVertical: isSmallScreen() ? 20 : 30,
  },
  photoContainer: {
    position: 'relative',
  },
  profileImage: {
    width: isSmallScreen() ? 100 : 120,
    height: isSmallScreen() ? 100 : 120,
    borderRadius: isSmallScreen() ? 50 : 60,
  },
  avatar: {
    width: isSmallScreen() ? 100 : 120,
    height: isSmallScreen() ? 100 : 120,
    borderRadius: isSmallScreen() ? 50 : 60,
    backgroundColor: '#679B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: isSmallScreen() ? 32 : 40,
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
    backgroundColor: '#679B00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0, borderColor: 'transparent', },


  // Form
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: isSmallScreen() ? 12 : 20,
  },
  label: {
    fontSize: isSmallScreen() ? 14 : 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: isSmallScreen() ? 6 : 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: isSmallScreen() ? 12 : 16,
    paddingVertical: 16,
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0, },
  input: {
    flex: 1,
    fontSize: isSmallScreen() ? 14 : 16,
    color: '#1A1A1A',
    paddingRight: 12,
    paddingVertical: 0, // Убираем дефолтный padding чтобы высота совпадала с полем даты
  },
  inputDisabled: {
    color: '#8E8E93',
    backgroundColor: 'transparent',
  },
  dateInput: {
    // Поле даты использует тот же padding что и inputContainer, без дополнительного padding
    paddingVertical: 0,
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
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    // Убираем тени для чистого вида
    elevation: 0, shadowOpacity: 0, },
  saveButton: {
    backgroundColor: '#679B00',
    borderRadius: 12,
    paddingVertical: isSmallScreen() ? 12 : 16,
    alignItems: 'center',
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0, },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0, elevation: 0, },
  saveButtonText: {
    fontSize: isSmallScreen() ? 14 : 16,
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
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0, },
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
}); 