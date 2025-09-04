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
import { noElevationStyles } from '../../utils/noShadowStyles';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import CalendarDateIcon from '../../../assets/calendar-date.svg';
import NoImagePlaceholder from '../../../assets/no-image-placeholder.svg';
import PlusIcon from '../../../assets/plus.svg';
import PaperIcon from '../../../assets/paper.svg';
import { useAuthTranslation, useCommonTranslation } from '../../hooks/useTranslation';


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
import { WebViewModal, LogoOsonish } from '../../components/common';

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
const StepCounter: React.FC<{ currentStep: number; totalSteps: number; t: any }> = ({ currentStep, totalSteps, t }) => {
  return (
    <View style={styles.stepCounterContainer}>
      <Text style={styles.progressText}>{t('profile_step_counter', { current: currentStep, total: totalSteps })}</Text>
    </View>
  );
};

export const ProfileInfoStepByStepScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { phone } = route.params as { phone: string };
  const t = useAuthTranslation();
  const tCommon = useCommonTranslation();

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
  const [webViewModal, setWebViewModal] = useState<{
    visible: boolean;
    url: string;
    title: string;
  }>({
    visible: false,
    url: '',
    title: '',
  });

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

  const handleOpenWebView = (url: string, title: string) => {
    setWebViewModal({
      visible: true,
      url,
      title,
    });
  };

  const handleCloseWebView = () => {
    setWebViewModal({
      visible: false,
      url: '',
      title: '',
    });
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
    if (!date) return t('select_birth_date');
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(tCommon('error'), t('photo_permission_error'));
      return;
    }

    Alert.alert(
      t('add_profile_photo'),
      t('choose_source'),
      [
        {
          text: t('take_photo'),
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(t('camera_permission_error'));
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
          text: t('choose_from_gallery'),
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
        { text: tCommon('cancel'), style: 'cancel' },
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
                <Text style={styles.stepTitle}>{t('profile_step_photo_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 1} delay={150} resetKey={`${animationResetKey}-step-1`}>
                <Text style={styles.stepSubtitle}>
                  {t('profile_step_photo_subtitle')}
                </Text>
              </AnimatedField>

              <AnimatedInteractiveContainer isActive={currentStep === 1} delay={200} resetKey={`${animationResetKey}-step-1`}>
                <View style={styles.photoSection}>
                  <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.profileImage} />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <NoImagePlaceholder
                          width={isSmallScreen ? 100 : 120}
                          height={isSmallScreen ? 100 : 120}
                        />
                        <View style={styles.addPhotoButton}>
                          <PlusIcon width={24} height={24} />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                  {!profileImage && (
                    <TouchableOpacity style={styles.addPhotoTextButton} onPress={pickImage}>
                      <Text style={styles.addPhotoTextButtonText}>{t('add_photo')}</Text>
                    </TouchableOpacity>
                  )}
                  {profileImage && (
                    <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
                      <Text style={styles.changePhotoButtonText}>{t('change_photo')}</Text>
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
                <Text style={styles.stepTitle}>{t('profile_step_lastname_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 2} delay={150} resetKey={`${animationResetKey}-step-2`}>
                <Text style={styles.stepSubtitle}></Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 2} delay={200} resetKey={`${animationResetKey}-step-2`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(lastNameFocused)}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder={t('lastname_placeholder')}
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
                <Text style={styles.stepTitle}>{t('profile_step_firstname_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 3} delay={150} resetKey={`${animationResetKey}-step-3`}>
                <Text style={styles.stepSubtitle}></Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 3} delay={200} resetKey={`${animationResetKey}-step-3`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(firstNameFocused)}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder={t('firstname_placeholder')}
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
                <Text style={styles.stepTitle}>{t('profile_step_middlename_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 4} delay={150} resetKey={`${animationResetKey}-step-4`}>
                <Text style={styles.stepSubtitle}>{t('profile_step_middlename_optional')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 4} delay={200} resetKey={`${animationResetKey}-step-4`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(middleNameFocused)}
                    value={middleName}
                    onChangeText={setMiddleName}
                    placeholder={t('middlename_placeholder')}
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
                <Text style={styles.stepTitle}>{t('profile_step_birthdate_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 5} delay={150} resetKey={`${animationResetKey}-step-5`}>
                <Text style={styles.stepSubtitle}></Text>
              </AnimatedField>

              <AnimatedInteractiveContainer isActive={currentStep === 5} delay={200} resetKey={`${animationResetKey}-step-5`}>
                <View style={styles.inputContainer}>
                  <TouchableOpacity
                    style={styles.dateSelector}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <View style={{ marginRight: theme.spacing.md }}>
                      <CalendarDateIcon width={20} height={20} stroke={theme.colors.text.secondary} />
                    </View>
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
                <Text style={styles.stepTitle}>{t('profile_step_privacy_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 6} delay={150} resetKey={`${animationResetKey}-step-6`}>
                <Text style={styles.stepSubtitle}>{t('profile_step_privacy_subtitle')}</Text>
              </AnimatedField>

              <AnimatedInteractiveContainer isActive={currentStep === 6} delay={200} resetKey={`${animationResetKey}-step-6`}>
                <View style={styles.privacySection}>
                  <TouchableOpacity
                    style={styles.privacyDocumentButton}
                    onPress={() => handleOpenWebView('https://oson-ish.uz/privacy-policy.html', t('privacy_document_title'))}
                  >
                    <View style={styles.privacyDocumentIconContainer}>
                      <PaperIcon
                        width={isSmallScreen ? 28 : 32}
                        height={isSmallScreen ? 28 : 32}
                        fill={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.privacyDocumentContent}>
                      <Text style={styles.privacyDocumentTitle}>{t('privacy_document_title')}</Text>
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
                        {t('privacy_agreement_text')}
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
            <View style={styles.logoContainer}>
              <LogoOsonish
                width={isSmallScreen ? 120 : 160}
                height={isSmallScreen ? 22 : 29}
              />
            </View>
          </View>

          {/* Progress */}
          <AnimatedProgressBar progress={currentStep} total={totalSteps} />
          <StepCounter currentStep={currentStep} totalSteps={totalSteps} t={t} />

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
                <Text style={styles.secondaryButtonText}>{tCommon('back')}</Text>
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
                  <Text style={styles.primaryButtonText}>{tCommon('next')}</Text>
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
                <Text style={styles.loadingText}>{t('saving_data')}</Text>
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
                    <Text style={styles.doneButtonText}>{t('done')}</Text>
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
          <WebViewModal
            visible={webViewModal.visible}
            url={webViewModal.url}
            title={webViewModal.title}
            onClose={handleCloseWebView}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing.md + getAndroidStatusBarHeight(),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  logoContainer: {
    alignItems: 'center',
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
    backgroundColor: '#F6F7F9',
    borderWidth: 2,
    borderColor: '#F6F7F9',
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
    borderColor: '#679B00',
    backgroundColor: '#F0F8FF',
    shadowColor: '#679B00',
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
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
    bottom: -20, // Опускаем кнопку вниз, чтобы она наполовину выпирала из круга
    left: '50%',
    transform: [{ translateX: -20 }], // Половина ширины кнопки для центрирования
    width: isSmallScreen ? 32 : 40,
    height: isSmallScreen ? 32 : 40,
    borderRadius: isSmallScreen ? 16 : 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0, borderColor: theme.colors.background,
  },

  addPhotoTextButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    paddingHorizontal: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
    marginTop: theme.spacing.lg, // Добавляем отступ сверху, чтобы опустить кнопку ниже
  },
  addPhotoTextButtonText: {
    color: theme.colors.white,
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  changePhotoButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 0, borderColor: theme.colors.primary,
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
    borderWidth: 0, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  privacyDocumentIconContainer: {
    width: isSmallScreen ? 44 : 48,
    height: isSmallScreen ? 44 : 48,
    backgroundColor: 'transparent',
    borderRadius: isSmallScreen ? 22 : 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  privacyDocumentContent: {
    flex: 1,
  },
  privacyDocumentTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  privacyDocumentSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  privacyDocumentArrow: {
    fontSize: 24,
    color: '#8E8E93',
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
    borderWidth: 0, borderColor: theme.colors.border,
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
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
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
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },
});
