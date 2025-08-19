import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../constants';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';


import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';
import {
  AnimatedProgressBar,
  AnimatedStepContainer,
  AnimatedField,
  AnimatedNavigationButton,
  AnimatedInteractiveContainer,
} from '../../components/common/AnimatedComponents';
import { CustomPrivacyModal } from '../../components/common';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

// Компонент для отображения номера шага с анимацией
const StepCounter: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  return (
    <View style={styles.stepCounterContainer}>
      <Text style={styles.progressText}>{currentStep} из {totalSteps}</Text>
    </View>
  );
};

export const ProfileInfoStepByStepScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { phone } = route.params as { phone: string };

  const [currentStep, setCurrentStep] = useState(1);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [animationResetKey, setAnimationResetKey] = useState(0);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Состояния фокуса для полей ввода
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [middleNameFocused, setMiddleNameFocused] = useState(false);

  const totalSteps = 6;

  // Функция для получения стиля поля ввода с учетом фокуса
  const getInputStyle = (isFocused: boolean) => [
    styles.stepInput,
    isFocused && styles.stepInputFocused,
  ];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Выберите дату рождения';
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

    Alert.alert(
      'Добавить фото профиля',
      'Выберите источник',
      [
        {
          text: 'Снять фото',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Нет доступа к камере');
              return;
            }
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1.0, // Максимальное качество, оптимизация будет в MediaService
            });
            if (!result.canceled) {
              setProfileImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Выбрать из галереи',
          onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1.0, // Максимальное качество, оптимизация будет в MediaService
            });
            if (!result.canceled) {
              setProfileImage(result.assets[0].uri);
            }
          },
        },
        { text: 'Отмена', style: 'cancel' },
      ]
    );
  };

  // Проверка валидности текущего шага без показа Alert'ов
  const isCurrentStepValid = (): boolean => {
    switch (currentStep) {
      case 1: // Фото профиля (необязательно)
        return true;
      case 2: // Фамилия
        return lastName.trim().length > 0;
      case 3: // Имя
        return firstName.trim().length > 0;
      case 4: // Отчество (необязательно)
        return true;
      case 5: // Дата рождения
        return birthDate !== null;
      case 6: // Согласие с ПД
        return privacyAccepted;
      default:
        return true;
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Фото профиля (необязательно)
        return true;
      case 2: // Фамилия
        if (!lastName.trim()) {
          Alert.alert('Заполните поле', 'Введите фамилию');
          return false;
        }
        return true;
      case 3: // Имя
        if (!firstName.trim()) {
          Alert.alert('Заполните поле', 'Введите имя');
          return false;
        }
        return true;
      case 4: // Отчество (необязательно)
        return true;
      case 5: // Дата рождения
        if (!birthDate) {
          Alert.alert('Выберите дату', 'Выберите дату рождения');
          return false;
        }
        return true;
      case 6: // Согласие с ПД
        if (!privacyAccepted) {
          Alert.alert('Согласие необходимо', 'Необходимо согласиться с обработкой персональных данных');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!lastName.trim() || !firstName.trim() || !birthDate || !privacyAccepted) {
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

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Фото профиля';
      case 2: return 'Фамилия';
      case 3: return 'Имя';
      case 4: return 'Отчество';
      case 5: return 'Дата рождения';
      case 6: return 'Согласие';
      default: return '';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <AnimatedStepContainer isActive={currentStep === 1} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 1} delay={0} resetKey={`${animationResetKey}-step-1`}>
                <Text style={styles.stepTitle}>Добавьте фото профиля</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 1} delay={150} resetKey={`${animationResetKey}-step-1`}>
                <Text style={styles.stepSubtitle}>
                  Добавьте фото профиля чтобы повысить{'\n'}шансы одобрения заказчиком (необязательно)
                </Text>
              </AnimatedField>

              <AnimatedInteractiveContainer isActive={currentStep === 1} delay={200} resetKey={`${animationResetKey}-step-1`}>
                <View style={styles.photoSection}>
                  <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.profileImage} />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <View style={styles.photoIcon}>
                          <Svg width={48} height={48} viewBox="0 0 18 20" fill="none">
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
                  {!profileImage && (
                    <TouchableOpacity style={styles.addPhotoTextButton} onPress={pickImage}>
                      <Text style={styles.addPhotoTextButtonText}>Добавить фото</Text>
                    </TouchableOpacity>
                  )}
                  {profileImage && (
                    <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
                      <Text style={styles.changePhotoButtonText}>Изменить фото</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </AnimatedInteractiveContainer>
            </View>
          </AnimatedStepContainer>
        );

      case 2:
        return (
          <AnimatedStepContainer isActive={currentStep === 2} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 2} delay={0} resetKey={`${animationResetKey}-step-2`}>
                <Text style={styles.stepTitle}>Введите фамилию</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 2} delay={150} resetKey={`${animationResetKey}-step-2`}>
                <Text style={styles.stepSubtitle}>Укажите вашу фамилию</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 2} delay={200} resetKey={`${animationResetKey}-step-2`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(lastNameFocused)}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Например: Султонов"
                    placeholderTextColor={theme.colors.text.secondary}
                    autoFocus
                    onFocus={() => setLastNameFocused(true)}
                    onBlur={() => setLastNameFocused(false)}
                  />
                </View>
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 3:
        return (
          <AnimatedStepContainer isActive={currentStep === 3} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 3} delay={0} resetKey={`${animationResetKey}-step-3`}>
                <Text style={styles.stepTitle}>Введите имя</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 3} delay={150} resetKey={`${animationResetKey}-step-3`}>
                <Text style={styles.stepSubtitle}>Укажите ваше имя</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 3} delay={200} resetKey={`${animationResetKey}-step-3`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(firstNameFocused)}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Например: Амир"
                    placeholderTextColor={theme.colors.text.secondary}
                    autoFocus
                    onFocus={() => setFirstNameFocused(true)}
                    onBlur={() => setFirstNameFocused(false)}
                  />
                </View>
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 4:
        return (
          <AnimatedStepContainer isActive={currentStep === 4} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 4} delay={0} resetKey={`${animationResetKey}-step-4`}>
                <Text style={styles.stepTitle}>Введите отчество</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 4} delay={150} resetKey={`${animationResetKey}-step-4`}>
                <Text style={styles.stepSubtitle}>Укажите ваше отчество (необязательно)</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 4} delay={200} resetKey={`${animationResetKey}-step-4`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(middleNameFocused)}
                    value={middleName}
                    onChangeText={setMiddleName}
                    placeholder="Например: Каримович"
                    placeholderTextColor={theme.colors.text.secondary}
                    autoFocus
                    onFocus={() => setMiddleNameFocused(true)}
                    onBlur={() => setMiddleNameFocused(false)}
                  />
                </View>
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 5:
        return (
          <AnimatedStepContainer isActive={currentStep === 5} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 5} delay={0} resetKey={`${animationResetKey}-step-5`}>
                <Text style={styles.stepTitle}>Дата рождения</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 5} delay={150} resetKey={`${animationResetKey}-step-5`}>
                <Text style={styles.stepSubtitle}>Выберите дату вашего рождения</Text>
              </AnimatedField>

              <AnimatedInteractiveContainer isActive={currentStep === 5} delay={200} resetKey={`${animationResetKey}-step-5`}>
                <View style={styles.inputContainer}>
                  <TouchableOpacity
                    style={styles.dateSelector}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.calendarIcon}>📅</Text>
                    <Text style={[
                      styles.dateText,
                      !birthDate && styles.dateTextPlaceholder
                    ]}>
                      {formatDate(birthDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </AnimatedInteractiveContainer>
            </View>
          </AnimatedStepContainer>
        );

      case 6:
        return (
          <AnimatedStepContainer isActive={currentStep === 6} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 6} delay={0} resetKey={`${animationResetKey}-step-6`}>
                <Text style={styles.stepTitle}>Согласие с обработкой данных</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 6} delay={150} resetKey={`${animationResetKey}-step-6`}>
                <Text style={styles.stepSubtitle}>Ознакомьтесь с условиями обработки персональных данных и дайте согласие</Text>
              </AnimatedField>

              <AnimatedInteractiveContainer isActive={currentStep === 6} delay={200} resetKey={`${animationResetKey}-step-6`}>
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
              </AnimatedInteractiveContainer>
            </View>
          </AnimatedStepContainer>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRight} />
            <Text style={styles.headerTitle}>{getStepTitle()}</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Progress */}
          <AnimatedProgressBar progress={currentStep} total={totalSteps} />
          <StepCounter currentStep={currentStep} totalSteps={totalSteps} />

          {/* Content */}
          <View style={styles.mainContent}>
            {renderStep()}
          </View>

          {/* Navigation */}
          <View style={styles.navigation}>
            {currentStep > 1 && (
              <AnimatedNavigationButton
                variant="secondary"
                onPress={prevStep}
                isVisible={currentStep > 1}
                delay={0}
                resetKey={`${animationResetKey}-step-${currentStep}`}
              >
                <Text style={styles.secondaryButtonText}>Назад</Text>
              </AnimatedNavigationButton>
            )}

            <View style={styles.navigationSpacer} />

            {currentStep < totalSteps ? (
              isCurrentStepValid() && (
                <AnimatedNavigationButton
                  variant="primary"
                  onPress={nextStep}
                  isVisible={currentStep < totalSteps && isCurrentStepValid()}
                  delay={0}
                  resetKey={`${animationResetKey}-step-${currentStep}`}
                >
                  <Text style={styles.primaryButtonText}>Далее</Text>
                </AnimatedNavigationButton>
              )
            ) : (
              <AnimatedNavigationButton
                variant="primary"
                onPress={handleSubmit}
                disabled={isLoading || !privacyAccepted}
                isVisible={currentStep === totalSteps}
                delay={0}
                resetKey={`${animationResetKey}-step-${currentStep}`}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Сохраняем...' : 'Готово'}
                </Text>
              </AnimatedNavigationButton>
            )}
          </View>

          {/* Simple Loading Indicator */}
          <Modal
            visible={isLoading}
            transparent={true}
            animationType="fade"
          >
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Сохраняем данные...</Text>
              </View>
            </View>
          </Modal>

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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing.md + getAndroidStatusBarHeight(),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },


  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  stepCounterContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  progressText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
  },
  stepTitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.xl : theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
    lineHeight: isSmallScreen ? 18 : 22,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
  },
  stepInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    paddingVertical: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    fontSize: isSmallScreen ? theme.fonts.sizes.md : theme.fonts.sizes.lg,
    color: theme.colors.text.primary,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
  stepInputFocused: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
  },
  photoContainer: {
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
  },
  photoPlaceholder: {
    width: isSmallScreen ? 100 : 120,
    height: isSmallScreen ? 100 : 120,
    borderRadius: isSmallScreen ? 50 : 60,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photoIcon: {
    width: isSmallScreen ? 100 : 120,
    height: isSmallScreen ? 100 : 120,
    borderRadius: isSmallScreen ? 50 : 60,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIconText: {
    fontSize: 48,
    color: '#999',
  },
  profileImage: {
    width: isSmallScreen ? 100 : 120,
    height: isSmallScreen ? 100 : 120,
    borderRadius: isSmallScreen ? 50 : 60,
  },
  addPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: isSmallScreen ? 32 : 40,
    height: isSmallScreen ? 32 : 40,
    borderRadius: isSmallScreen ? 16 : 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  addPhotoButtonText: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  addPhotoTextButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    paddingHorizontal: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
  },
  addPhotoTextButtonText: {
    color: theme.colors.white,
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  changePhotoButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    paddingHorizontal: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
  },
  changePhotoButtonText: {
    color: theme.colors.primary,
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  dateSelector: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  dateText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  dateTextPlaceholder: {
    color: theme.colors.text.secondary,
  },
  privacySection: {
    paddingHorizontal: theme.spacing.md,
  },
  privacyDocumentButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  privacyDocumentIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  privacyDocumentContent: {
    flex: 1,
  },
  privacyDocumentTitle: {
    fontSize: theme.fonts.sizes.md,
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
    fontSize: 24,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  privacyCheckboxContainer: {
    marginTop: theme.spacing.lg,
  },
  privacyCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyCheckboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 6,
    marginRight: theme.spacing.md,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacyCheckboxText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
    fontWeight: theme.fonts.weights.medium,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  navigationSpacer: {
    flex: 1,
  },
  secondaryButtonText: {
    color: theme.colors.text.primary,
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
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
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },
});
