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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { HeaderWithBack } from '../../components/common';
import { authService } from '../../services/authService';
import { User } from '../../types';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();

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
        Alert.alert('Ошибка', 'Пользователь не авторизован');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные профиля');
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
      Alert.alert('Ошибка', 'Нужен доступ к фотографиям');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      Alert.alert('Ошибка', 'Введите имя');
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert('Ошибка', 'Введите фамилию');
      return false;
    }

    if (!birthDate) {
      Alert.alert('Ошибка', 'Выберите дату рождения');
      return false;
    }

    // Проверка возраста (должен быть старше 16 лет)
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (age < 16 || (age === 16 && monthDiff < 0)) {
      Alert.alert('Ошибка', 'Возраст должен быть не менее 16 лет');
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
          ? 'Профиль и фото успешно обновлены'
          : 'Профиль обновлен';

        Alert.alert('Успешно', successMessage, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        console.error('[EditProfile] ❌ Ошибка обновления профиля:', result.error);

        // Более детальные сообщения об ошибках
        let errorMessage = result.error || 'Не удалось обновить профиль';
        if (result.error?.includes('Storage') || result.error?.includes('изображение')) {
          errorMessage = 'Не удалось загрузить фото. Попробуйте выбрать другое изображение или проверьте интернет-соединение.';
        }

        Alert.alert('Ошибка', errorMessage);
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при сохранении. Попробуйте еще раз.');
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
        <HeaderWithBack title="Редактировать профиль" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Загрузка профиля...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack title="Редактировать профиль" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ошибка загрузки профиля</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
            <Text style={styles.retryButtonText}>Попробовать снова</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <HeaderWithBack title="Редактировать профиль" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.avatarText}>
                  {getInitials()}
                </Text>
                <View style={styles.editPhotoButton}>
                  <Text style={styles.editPhotoButtonText}>✏️</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
            <Text style={styles.changePhotoText}>Изменить фото</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Phone Number (read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Номер телефона</Text>
            <View style={styles.phoneContainer}>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                value={user.phone}
                editable={false}
                placeholder="Номер телефона"
                placeholderTextColor={theme.colors.text.secondary}
              />
              <View style={styles.phoneVerified}>
                <Text style={styles.verifiedText}>✓ Подтвержден</Text>
              </View>
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Фамилия <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Введите фамилию"
              placeholderTextColor={theme.colors.text.secondary}
              maxLength={50}
            />
          </View>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Имя <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Введите имя"
              placeholderTextColor={theme.colors.text.secondary}
              maxLength={50}
            />
          </View>

          {/* Middle Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Отчество</Text>
            <TextInput
              style={styles.input}
              value={middleName}
              onChangeText={setMiddleName}
              placeholder="Введите отчество (необязательно)"
              placeholderTextColor={theme.colors.text.secondary}
              maxLength={50}
            />
          </View>

          {/* Birth Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Дата рождения <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.calendarIcon}>📅</Text>
              <Text style={[
                styles.dateText,
                !birthDate && styles.datePlaceholder
              ]}>
                {formatDate(birthDate) || 'Выберите дату'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* User Role Info */}
          <View style={styles.roleInfo}>
            <Text style={styles.roleTitle}>Роль: Исполнитель</Text>
            <Text style={styles.roleDescription}>
              Вы можете принимать заказы и зарабатывать на выполнении различных задач
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveSection}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (isSaving || !hasChanges()) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={isSaving || !hasChanges()}
        >
          <Text style={styles.saveButtonText}>
            {isUploadingImage ? 'Загружаем фото...' : isSaving ? 'Сохраняем...' : 'Сохранить изменения'}
          </Text>
        </TouchableOpacity>
        {!hasChanges() && (
          <Text style={styles.noChangesText}>Нет изменений для сохранения</Text>
        )}
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
                <Text style={styles.doneButtonText}>Готово</Text>
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
  photoSection: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  photoContainer: {
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.white,
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  editPhotoButtonText: {
    fontSize: 16,
  },
  changePhotoButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  changePhotoText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  form: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
  },
  phoneContainer: {
    position: 'relative',
  },
  phoneInput: {
    backgroundColor: theme.colors.border + '20',
    color: theme.colors.text.secondary,
    paddingRight: 120,
  },
  phoneVerified: {
    position: 'absolute',
    right: theme.spacing.sm,
    top: '50%',
    transform: [{ translateY: -10 }],
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  verifiedText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.success,
    fontWeight: theme.fonts.weights.medium,
  },
  dateInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  dateText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
  },
  datePlaceholder: {
    color: theme.colors.text.secondary,
  },
  roleInfo: {
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  roleTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  roleDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  saveSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  noChangesText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  datePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  doneButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
  },
}); 