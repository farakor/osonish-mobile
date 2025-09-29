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
  Keyboard,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../../constants';
import { noElevationStyles, lightElevationStyles, softButtonElevationStyles, borderButtonStyles } from '../../utils/noShadowStyles';
import { usePlatformSafeAreaInsets, getImprovedFixedBottomStyle } from '../../utils/safeAreaUtils';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import CalendarDateIcon from '../../../assets/calendar-date.svg';
import NoImagePlaceholder from '../../../assets/no-image-placeholder.svg';
import PlusIcon from '../../../assets/plus.svg';
import PaperIcon from '../../../assets/paper.svg';
import ArrowIcon from '../../../assets/arrow.svg';
import { useAuthTranslation, useCommonTranslation, useErrorsTranslation } from '../../hooks/useTranslation';


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
import {
  shouldUseKeyboardAvoidingView,
  createKeyboardListeners,
  createNavigationHandler,
  getKeyboardAwareStyles,
  KeyboardInfo
} from '../../utils/keyboardUtils';

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

// Простой статический прогресс-бар без анимации
const StaticProgressBar: React.FC<{ progress: number; total: number }> = ({ progress, total }) => {
  const progressPercentage = ((progress - 1) / (total - 1)) * 100;

  return (
    <View style={styles.staticProgressContainer}>
      <View style={styles.staticProgressTrack}>
        <View style={[styles.staticProgressFill, { width: `${progressPercentage}%` }]} />
      </View>
    </View>
  );
};

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
  const insets = usePlatformSafeAreaInsets();
  const t = useAuthTranslation();
  const tCommon = useCommonTranslation();
  const tError = useErrorsTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthDateFocused, setBirthDateFocused] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [animationResetKey, setAnimationResetKey] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
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
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);

  // Рефы для полей ввода
  const lastNameInputRef = React.useRef<TextInput>(null);

  // Состояние клавиатуры для Android
  const [keyboardInfo, setKeyboardInfo] = useState<KeyboardInfo>({
    visible: false,
    height: 0
  });

  // Анимированное значение для позиции навигации
  const navigationBottom = useSharedValue(0);

  // Отслеживаем предыдущее состояние клавиатуры для корректного сброса
  const [prevKeyboardVisible, setPrevKeyboardVisible] = useState(false);

  const totalSteps = 4;

  // Загружаем сохраненные данные при монтировании компонента
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        const profileDataString = await AsyncStorage.default.getItem('@temp_profile_data');

        if (profileDataString) {
          const profileData = JSON.parse(profileDataString);

          // Восстанавливаем данные
          if (profileData.firstName) setFirstName(profileData.firstName);
          if (profileData.lastName) setLastName(profileData.lastName);
          if (profileData.profileImage) setProfileImage(profileData.profileImage);
          if (profileData.birthDate) {
            // Конвертируем ISO дату обратно в формат dd.mm.yyyy
            const date = new Date(profileData.birthDate);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
            setBirthDate(formattedDate);
          }

          // Определяем текущий шаг на основе заполненных данных
          let step = 1;
          if (profileData.firstName && profileData.lastName) step = 3; // Переходим к дате рождения
          else if (profileData.profileImage) step = 2; // Переходим к имени

          setCurrentStep(step);
        }
      } catch (error) {
        console.error('Ошибка загрузки сохраненных данных:', error);
      } finally {
        // Отмечаем, что данные загружены (даже если их не было)
        setIsDataLoaded(true);
      }
    };

    loadSavedData();
  }, []);

  // Обработка клавиатуры для Android с использованием утилит
  useEffect(() => {
    const { setup, cleanup } = createKeyboardListeners(
      (info: KeyboardInfo) => {
        setKeyboardInfo(info);
        setPrevKeyboardVisible(true);
        // Анимируем позицию навигации над клавиатурой с дополнительным отступом
        if (Platform.OS === 'android') {
          navigationBottom.value = withTiming(info.height + 45, { duration: 250 });
        }
      },
      () => {
        setKeyboardInfo({ visible: false, height: 0 });
        setPrevKeyboardVisible(false);
        // Возвращаем навигацию в исходное положение
        if (Platform.OS === 'android') {
          navigationBottom.value = withTiming(0, { duration: 250 });
        }
      }
    );

    setup();
    return cleanup;
  }, []);

  // Дополнительный эффект для принудительного сброса позиции
  useEffect(() => {
    if (Platform.OS === 'android' && prevKeyboardVisible && !keyboardInfo.visible) {
      // Принудительно сбрасываем позицию через небольшую задержку
      setTimeout(() => {
        navigationBottom.value = 0;
      }, 300);
    }
  }, [keyboardInfo.visible, prevKeyboardVisible]);

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

  const handleOpenPrivacyModal = () => {
    if (Platform.OS === 'android') {
      // Для Android открываем отдельный экран
      navigation.navigate('DocumentWebView', {
        url: 'https://oson-ish.uz/privacy-policy.html',
        title: t('privacy_document_title'),
      });
    } else {
      // Для iOS используем модальное окно
      handleOpenWebView('https://oson-ish.uz/privacy-policy.html', t('privacy_document_title'));
    }
  };

  // Функция для форматирования даты при вводе
  const formatDateInput = (text: string) => {
    // Удаляем все нецифровые символы
    const numbers = text.replace(/\D/g, '');

    // Форматируем как dd.mm.yyyy
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 4)}.${numbers.slice(4, 8)}`;
    }
  };

  // Функция для валидации даты
  const validateDate = (dateString: string): { isValid: boolean; date?: Date; error?: string } => {
    if (!dateString || dateString.length !== 10) {
      return { isValid: false, error: t('invalid_date_format') };
    }

    const [day, month, year] = dateString.split('.').map(Number);

    if (!day || !month || !year) {
      return { isValid: false, error: t('invalid_date_error') };
    }

    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
      return { isValid: false, error: t('invalid_date_error') };
    }

    const date = new Date(year, month - 1, day);

    // Проверяем, что дата действительно существует
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return { isValid: false, error: t('date_not_exist') };
    }

    // Проверяем возраст (должно быть 18 лет или больше)
    const today = new Date();
    const age = today.getFullYear() - year;
    const monthDiff = today.getMonth() - (month - 1);
    const dayDiff = today.getDate() - day;

    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 18) {
      return { isValid: false, error: t('age_minimum_error') };
    }

    return { isValid: true, date };
  };

  const handleBirthDateChange = (text: string) => {
    const formatted = formatDateInput(text);
    setBirthDate(formatted);
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
              // Автоматически сохраняем данные при выборе фото
              setTimeout(saveCurrentData, 100);
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
              // Автоматически сохраняем данные при выборе фото
              setTimeout(saveCurrentData, 100);
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
      case 2: // Имя и фамилия
        return firstName.trim().length > 0 && lastName.trim().length > 0;
      case 3: // Дата рождения
        return birthDate.length === 10 && validateDate(birthDate).isValid;
      case 4: // Согласие с ПД
        return privacyAccepted;
      default:
        return true;
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Фото профиля (необязательно)
        return true;
      case 2: // Имя и фамилия
        if (!firstName.trim()) {
          Alert.alert(t('fill_field'), t('enter_name'));
          return false;
        }
        if (!lastName.trim()) {
          Alert.alert(t('fill_field'), t('enter_lastname'));
          return false;
        }
        return true;
      case 3: // Дата рождения
        if (!birthDate) {
          Alert.alert(t('select_date'), t('enter_birth_date'));
          return false;
        }
        const validation = validateDate(birthDate);
        if (!validation.isValid) {
          Alert.alert(t('validation_error'), validation.error || t('invalid_date_error'));
          return false;
        }
        return true;
      case 4: // Согласие с ПД
        if (!privacyAccepted) {
          Alert.alert(t('agreement_required'), t('privacy_agreement_required'));
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // Функция для сохранения текущих данных
  const saveCurrentData = async () => {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');

      // Создаем объект с текущими данными
      const currentData: any = {
        phone,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: '', // Убираем отчество
        profileImage,
      };

      // Если дата рождения заполнена и валидна, добавляем ее
      if (birthDate && birthDate.length === 10) {
        const validation = validateDate(birthDate);
        if (validation.isValid && validation.date) {
          currentData.birthDate = validation.date.toISOString();
        }
      }

      await AsyncStorage.default.setItem('@temp_profile_data', JSON.stringify(currentData));
    } catch (error) {
      console.error('Ошибка сохранения данных:', error);
    }
  };

  // Создаем обработчики навигации с автоматическим скрытием клавиатуры
  const nextStep = createNavigationHandler(async () => {
    if (validateCurrentStep()) {
      // Сохраняем данные перед переходом к следующему шагу
      await saveCurrentData();

      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  });

  const prevStep = createNavigationHandler(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  });

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !birthDate || !privacyAccepted) {
      Alert.alert(tError('error'), t('fill_required_fields'));
      return;
    }

    // Валидируем дату рождения
    const dateValidation = validateDate(birthDate);
    if (!dateValidation.isValid) {
      Alert.alert(t('validation_error'), dateValidation.error || t('invalid_date_error'));
      return;
    }

    setIsLoading(true);

    try {
      // Сохраняем данные профиля во временном хранилище для использования после выбора роли
      const profileData = {
        phone,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: '', // Убираем отчество
        birthDate: dateValidation.date!.toISOString(),
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
      Alert.alert(tError('error'), t('save_data_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return t('profile_photo');
      case 2: return t('profile_step_name_title');
      case 3: return t('birth_date');
      case 4: return t('agreement');
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
                <Text style={styles.stepTitle}>{t('profile_step_name_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 2} delay={150} resetKey={`${animationResetKey}-step-2`}>
                <Text style={styles.stepSubtitle}>{t('profile_step_name_subtitle')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 2} delay={200} resetKey={`${animationResetKey}-step-2`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(firstNameFocused)}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder={t('name_placeholder')}
                    placeholderTextColor={theme.colors.text.secondary}
                    autoFocus
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      // Фокусируемся на поле фамилии при нажатии "Далее"
                      lastNameInputRef.current?.focus();
                    }}
                    onFocus={() => {
                      setFirstNameFocused(true);
                      // Небольшая задержка для корректного позиционирования
                      if (Platform.OS === 'android') {
                        setTimeout(() => {
                          if (keyboardInfo.visible && keyboardInfo.height > 0) {
                            navigationBottom.value = withTiming(keyboardInfo.height + 45, { duration: 250 });
                          }
                        }, 100);
                      }
                    }}
                    onBlur={() => setFirstNameFocused(false)}
                  />
                </View>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 2} delay={250} resetKey={`${animationResetKey}-step-2`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={lastNameInputRef}
                    style={getInputStyle(lastNameFocused)}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder={t('lastname_placeholder_simple')}
                    placeholderTextColor={theme.colors.text.secondary}
                    returnKeyType="done"
                    onFocus={() => {
                      setLastNameFocused(true);
                      // Небольшая задержка для корректного позиционирования
                      if (Platform.OS === 'android') {
                        setTimeout(() => {
                          if (keyboardInfo.visible && keyboardInfo.height > 0) {
                            navigationBottom.value = withTiming(keyboardInfo.height + 45, { duration: 250 });
                          }
                        }, 100);
                      }
                    }}
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
                <Text style={styles.stepTitle}>{t('profile_step_birthdate_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 3} delay={150} resetKey={`${animationResetKey}-step-3`}>
                <Text style={styles.stepSubtitle}>{t('age_requirement_text')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 3} delay={200} resetKey={`${animationResetKey}-step-3`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(birthDateFocused)}
                    value={birthDate}
                    onChangeText={handleBirthDateChange}
                    placeholder={t('birthdate_placeholder')}
                    placeholderTextColor={theme.colors.text.secondary}
                    keyboardType="numeric"
                    maxLength={10}
                    autoFocus
                    onFocus={() => {
                      setBirthDateFocused(true);
                      // Небольшая задержка для корректного позиционирования
                      if (Platform.OS === 'android') {
                        setTimeout(() => {
                          if (keyboardInfo.visible && keyboardInfo.height > 0) {
                            navigationBottom.value = withTiming(keyboardInfo.height + 45, { duration: 250 });
                          }
                        }, 100);
                      }
                    }}
                    onBlur={() => setBirthDateFocused(false)}
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
                <Text style={styles.stepTitle}>{t('profile_step_privacy_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 4} delay={150} resetKey={`${animationResetKey}-step-4`}>
                <Text style={styles.stepSubtitle}>{t('profile_step_privacy_subtitle')}</Text>
              </AnimatedField>

              <AnimatedInteractiveContainer isActive={currentStep === 4} delay={200} resetKey={`${animationResetKey}-step-4`}>
                <View style={styles.privacySection}>
                  <TouchableOpacity
                    style={styles.privacyDocumentButton}
                    onPress={handleOpenPrivacyModal}
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
                    {/* Стрелка указывающая на чекбокс */}
                    <View style={styles.arrowContainer}>
                      <ArrowIcon
                        width={isSmallScreen ? 20 : 24}
                        height={isSmallScreen ? 40 : 48}
                        style={styles.arrowIcon}
                      />
                    </View>

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

  // Получаем стили с учетом состояния клавиатуры
  const keyboardAwareStyles = getKeyboardAwareStyles(keyboardInfo);
  const useKeyboardAvoiding = shouldUseKeyboardAvoidingView();

  // Анимированный стиль для навигации
  const animatedNavigationStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'android') {
      // Всегда применяем анимированную позицию на Android
      return {
        ...(keyboardInfo.visible && {
          position: 'absolute',
          bottom: navigationBottom.value,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E7',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        }),
        // Когда клавиатура скрыта, возвращаем к обычному позиционированию
        ...(!keyboardInfo.visible && {
          position: 'relative',
          bottom: 'auto',
        }),
      };
    }
    return {};
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {useKeyboardAvoiding ? (
          <KeyboardAvoidingView
            style={styles.content}
            behavior="padding"
            keyboardVerticalOffset={0}
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
            {isDataLoaded && <StaticProgressBar progress={currentStep} total={totalSteps} />}
            {isDataLoaded && <StepCounter currentStep={currentStep} totalSteps={totalSteps} t={t} />}

            {/* Content */}
            <View style={[
              styles.mainContent,
              keyboardAwareStyles.content
            ]}>
              {isDataLoaded && renderStep()}
            </View>

            {/* Navigation */}
            <Animated.View style={[
              styles.navigation,
              animatedNavigationStyle,
              !keyboardInfo.visible && getImprovedFixedBottomStyle(insets)
            ]}>
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
                    {isLoading ? t('saving') : t('done')}
                  </Text>
                </AnimatedNavigationButton>
              )}
            </Animated.View>

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

          </KeyboardAvoidingView>
        ) : (
          <View style={styles.content}>
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
            {isDataLoaded && <StaticProgressBar progress={currentStep} total={totalSteps} />}
            {isDataLoaded && <StepCounter currentStep={currentStep} totalSteps={totalSteps} t={t} />}

            {/* Content */}
            <View style={[
              styles.mainContent,
              keyboardAwareStyles.content
            ]}>
              {isDataLoaded && renderStep()}
            </View>

            {/* Navigation */}
            <Animated.View style={[
              styles.navigation,
              animatedNavigationStyle,
              !keyboardInfo.visible && getImprovedFixedBottomStyle(insets)
            ]}>
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
                    {isLoading ? t('saving') : t('done')}
                  </Text>
                </AnimatedNavigationButton>
              )}
            </Animated.View>

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

          </View>
        )}
      </SafeAreaView>

      {/* WebView Modal */}
      <WebViewModal
        visible={webViewModal.visible}
        url={webViewModal.url}
        title={webViewModal.title}
        onClose={handleCloseWebView}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    position: 'relative', // Убеждаемся, что позиционирование корректное
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
  staticProgressContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  staticProgressTrack: {
    height: 4,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  staticProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
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
    ...borderButtonStyles,
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
    marginTop: theme.spacing.lg + 20, // Опускаем раздел чекбокса на 20px вниз
    position: 'relative',
  },
  arrowContainer: {
    position: 'absolute',

    top: -45, // Позиционируем стрелку над чекбоксом
    left: 0, // Центрируем стрелку по чекбоксу (24px ширина чекбокса / 2 = 12px)
    zIndex: 1,
  },
  arrowIcon: {
    // Стрелка по умолчанию уже указывает вниз
  },
  privacyCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyCheckboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E10000',
    backgroundColor: '#FFFFFF',
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
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    // Минимальная высота для стабильности
    minHeight: 80,
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

