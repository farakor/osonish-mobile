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
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import type { RootStackParamList } from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { CustomPrivacyModal } from '../../components/common';

const { height: screenHeight } = Dimensions.get('window');

// Определяем маленький экран для Android (высота меньше 1080px)
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

// Функция для получения высоты статус-бара на Android
const getAndroidStatusBarHeight = () => {
  if (Platform.OS === 'android') {
    try {
      return StatusBar.currentHeight || 24; // fallback 24px для Android
    } catch (error) {
      return 24; // стандартная высота статус-бара на Android
    }
  }
  return 0;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ProfileInfoScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { phone } = route.params as { phone: string };

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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
      quality: 1.0, // Максимальное качество, оптимизация будет в MediaService
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !birthDate || !privacyAccepted) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля и согласитесь с условиями');
      return;
    }

    setIsLoading(true);

    try {
      // Сохраняем данные профиля во временном хранилище для использования после выбора роли
      const profileData = {
        phone,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: middleName?.trim(),
        birthDate: birthDate.toISOString(),
        profileImage
      };

      // Передаем данные в AsyncStorage для временного хранения
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('@temp_profile_data', JSON.stringify(profileData));

      // Переходим к выбору роли
      navigation.reset({
        index: 0,
        routes: [{ name: 'RoleSelection' }],
      });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить данные. Попробуйте еще раз.');
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
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Заполните свои данные</Text>
        </View>

        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <View style={styles.photoIcon}>
                  <Svg width={32} height={32} viewBox="0 0 18 20" fill="none">
                    <Path
                      d="M17 19C17 17.6044 17 16.9067 16.8278 16.3389C16.44 15.0605 15.4395 14.06 14.1611 13.6722C13.5933 13.5 12.8956 13.5 11.5 13.5H6.5C5.10444 13.5 4.40665 13.5 3.83886 13.6722C2.56045 14.06 1.56004 15.0605 1.17224 16.3389C1 16.9067 1 17.6044 1 19M13.5 5.5C13.5 7.98528 11.4853 10 9 10C6.51472 10 4.5 7.98528 4.5 5.5C4.5 3.01472 6.51472 1 9 1C11.4853 1 13.5 3.01472 13.5 5.5Z"
                      stroke="#999"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <View style={styles.addPhotoButton}>
                  <Text style={styles.addPhotoButtonText}>+</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.photoInfo}>
            <Text style={styles.photoTitle}>Фото профиля</Text>
            <Text style={styles.photoSubtitle}>
              Добавьте фото профиля чтобы{'\n'}повысить шансы одобрения{'\n'}заказчиком
            </Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Фамилия <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Султонов"
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
              placeholder="Амир"
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
              placeholder="Каримович"
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
                {formatDate(birthDate) || '01/05/1978'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Agreement */}
          <View style={styles.privacySection}>
            <TouchableOpacity
              style={styles.privacyDocumentButton}
              onPress={() => setShowPrivacyModal(true)}
            >
              <Text style={styles.privacyDocumentIcon}>📄</Text>
              <View style={styles.privacyDocumentContent}>
                <Text style={styles.privacyDocumentTitle}>Согласие на обработку персональных данных</Text>
              </View>
              <Text style={styles.privacyDocumentArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.privacyCheckboxContainer}>
              <TouchableOpacity
                style={styles.privacyCheckbox}
                onPress={() => setPrivacyAccepted(!privacyAccepted)}
              >
                <View style={[styles.privacyCheckboxBox, privacyAccepted && styles.privacyCheckboxChecked]}>
                  {privacyAccepted && (
                    <Text style={styles.privacyCheckboxTick}>✓</Text>
                  )}
                </View>
                <Text style={styles.privacyCheckboxText}>
                  Согласен с обработкой персональных данных
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitSection}>
        <TouchableOpacity
          style={[styles.submitButton, (isLoading || !privacyAccepted) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading || !privacyAccepted}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Сохраняем...' : 'Готово'}
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
            value={birthDate || new Date(1978, 4, 1)}
            mode="date"
            display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1950, 0, 1)}
            locale="ru-RU"
          />
        </View>
      )}

      {/* Privacy Policy Modal */}
      <CustomPrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onAccept={() => { }}
        privacyAccepted={privacyAccepted}
      />
    </SafeAreaView>
  );
}

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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md + getAndroidStatusBarHeight(),
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
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
  titleSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: isSmallScreen ? theme.fonts.sizes.xl : theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
  },
  photoContainer: {
    marginRight: theme.spacing.md,
  },
  photoPlaceholder: {
    width: isSmallScreen ? 60 : 80,
    height: isSmallScreen ? 60 : 80,
    borderRadius: isSmallScreen ? 30 : 40,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photoIcon: {
    width: isSmallScreen ? 60 : 80,
    height: isSmallScreen ? 60 : 80,
    borderRadius: isSmallScreen ? 30 : 40,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIconText: {
    fontSize: 32,
    color: '#999',
  },
  profileImage: {
    width: isSmallScreen ? 60 : 80,
    height: isSmallScreen ? 60 : 80,
    borderRadius: isSmallScreen ? 30 : 40,
  },
  addPhotoButton: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  addPhotoButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  photoInfo: {
    flex: 1,
  },
  photoTitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  photoSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: isSmallScreen ? 16 : 18,
  },
  form: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
  },
  inputGroup: {
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
  },
  label: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: 'red',
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.text.primary,
  },
  dateInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  dateText: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.text.primary,
  },
  datePlaceholder: {
    color: theme.colors.text.secondary,
  },
  privacySection: {
    marginTop: theme.spacing.lg,
  },
  privacyDocumentButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  privacyDocumentIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  privacyDocumentContent: {
    flex: 1,
  },
  privacyDocumentTitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  privacyDocumentSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  privacyDocumentArrow: {
    fontSize: 20,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  privacyCheckboxContainer: {
    marginTop: theme.spacing.md,
  },
  privacyCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyCheckboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  privacyCheckboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  privacyCheckboxTick: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  privacyCheckboxText: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    lineHeight: isSmallScreen ? 16 : 18,
  },
  submitSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    alignItems: 'center',
    marginTop: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  datePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
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