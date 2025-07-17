import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();

  // Состояние с текущими данными пользователя (позже можно подгружать из API)
  const [firstName, setFirstName] = useState('Фаррух');
  const [lastName, setLastName] = useState('Урипов');
  const [middleName, setMiddleName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(new Date(1985, 3, 15));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Номер телефона (не редактируемый)
  const phoneNumber = '+998 90 123 45 67';

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

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !birthDate) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: API запрос для обновления профиля
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert('Успешно', 'Профиль обновлен', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить профиль. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Редактировать профиль</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.avatarText}>
                  {firstName[0]?.toUpperCase()}{lastName[0]?.toUpperCase()}
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
                value={phoneNumber}
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
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveSection}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Сохраняем...' : 'Сохранить изменения'}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
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
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  photoSection: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
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
    fontWeight: theme.typography.fontWeight.bold,
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
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  form: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  phoneContainer: {
    position: 'relative',
  },
  phoneInput: {
    backgroundColor: theme.colors.border + '20',
    color: theme.colors.text.secondary,
    paddingRight: 100,
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
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.medium,
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
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  datePlaceholder: {
    color: theme.colors.text.secondary,
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
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
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
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
}); 