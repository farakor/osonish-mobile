import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants';
import { usePlatformSafeAreaInsets } from '../../utils/safeAreaUtils';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../../types/navigation';
import {
  AnimatedProgressBar,
  AnimatedStepContainer,
  AnimatedField,
  AnimatedCategoryGrid,
  AnimatedNavigationButton,
  HeaderWithBack,
  EmbeddedMapSelector,
} from '../../components/common';
import { useCustomerTranslation, useErrorsTranslation, useCommonTranslation, useCategoriesTranslation } from '../../hooks/useTranslation';
import { PARENT_CATEGORIES, getSubcategoriesByParentId, getTranslatedSpecializationName } from '../../constants/specializations';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import {
  ExperienceLevelSelector,
  EmploymentTypeSelector,
  WorkFormatSelector,
  WorkScheduleSelector,
  SalaryInputFields,
  PaymentFrequencySelector,
  SkillsMultiSelect,
  LanguagesMultiSelect,
} from '../../components/vacancy';
import { vacancyService } from '../../services/vacancyService';
import { locationService, LocationCoords } from '../../services/locationService';
import { getAllCities } from '../../constants/cities';
import { useTranslation } from 'react-i18next';
import ChevronDownIcon from '../../../assets/chevron-down.svg';
import ChevronUpIcon from '../../../assets/chevron-up.svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Определяем маленький экран для Android (высота меньше 1080px)
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, 'CreateVacancy'>;

const TOTAL_STEPS = 13;

// Функция для очистки адреса от названия страны
const cleanAddressFromCountry = (address: string): string => {
  if (!address) return address;

  let cleanAddress = address;
  // Убираем "Узбекистан" в начале или конце адреса
  cleanAddress = cleanAddress.replace(/^Узбекистан,?\s*/i, '').replace(/,?\s*Узбекистан$/i, '');
  // Убираем "Uzbekistan" в начале или конце адреса
  cleanAddress = cleanAddress.replace(/^Uzbekistan,?\s*/i, '').replace(/,?\s*Uzbekistan$/i, '');
  // Убираем лишние запятые в начале
  cleanAddress = cleanAddress.replace(/^,\s*/, '');

  return cleanAddress;
};

export function CreateVacancyStepByStepScreen() {
  const navigation = useNavigation<NavigationProp>();
  const tCustomer = useCustomerTranslation();
  const tError = useErrorsTranslation();
  const tCommon = useCommonTranslation();
  const tCategories = useCategoriesTranslation();
  const { t } = useTranslation();
  const insets = usePlatformSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [animationResetKey, setAnimationResetKey] = useState(0);

  // Form states
  const [jobTitle, setJobTitle] = useState('');
  const [specializationId, setSpecializationId] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [workFormat, setWorkFormat] = useState('');
  const [workSchedule, setWorkSchedule] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [city, setCity] = useState('');
  const [salaryFrom, setSalaryFrom] = useState('');
  const [salaryTo, setSalaryTo] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState('per_month');
  const [salaryType, setSalaryType] = useState('before_tax');
  const [paymentFrequency, setPaymentFrequency] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Category management states
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Focus states
  const [jobTitleFocused, setJobTitleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);

  const progress = currentStep / TOTAL_STEPS;

  // Определяем категории для вакансий (исключаем "Работа на 1 день")
  const vacancyParentCategories = PARENT_CATEGORIES.filter(
    (cat) => cat.id !== 'one_day_job'
  );

  // Функции для работы с раскрытыми категориями
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleSpecializationSelect = (specId: string) => {
    setSpecializationId(specId);
  };

  // Функция получения текущего местоположения
  const getCurrentLocation = async () => {
    try {
      console.log('[getCurrentLocation] 🚀 Начинаем получение местоположения...');
      setIsGettingLocation(true);

      const locationCoords = await locationService.getCurrentLocation();
      console.log('[getCurrentLocation] 📍 Получены координаты:', locationCoords);

      if (locationCoords) {
        setCoords(locationCoords);
        console.log('[getCurrentLocation] ✅ Координаты сохранены в состоянии');

        // Получаем адрес по координатам
        console.log('[getCurrentLocation] 🔄 Начинаем геокодирование...');
        const geocodeResult = await locationService.reverseGeocode(locationCoords.latitude, locationCoords.longitude);
        console.log('[getCurrentLocation] 🏠 Результат геокодирования:', geocodeResult);

        if (geocodeResult) {
          console.log('[getCurrentLocation] 📝 Получен адрес:', geocodeResult.address);

          // Убираем название страны из адреса
          const cleanAddress = cleanAddressFromCountry(geocodeResult.address);

          console.log('[getCurrentLocation] 📝 Устанавливаем очищенный адрес:', cleanAddress);
          setLocation(cleanAddress);
          console.log('[getCurrentLocation] ✅ setLocation() вызван с адресом');
        } else {
          const coordsString = `${locationCoords.latitude.toFixed(6)}, ${locationCoords.longitude.toFixed(6)}`;
          console.log('[getCurrentLocation] 📝 Устанавливаем координаты как строку:', coordsString);
          setLocation(coordsString);
          console.log('[getCurrentLocation] ✅ setLocation() вызван с координатами');
        }

        Alert.alert(tCommon('success'), tCustomer('location_success'));
      } else {
        console.log('[getCurrentLocation] ❌ Координаты не получены');
        Alert.alert(tError('error'), tCustomer('location_error'));
      }
    } catch (error) {
      console.error('[getCurrentLocation] ❌ Ошибка получения местоположения:', error);
      Alert.alert(tError('error'), tCustomer('location_error'));
    } finally {
      console.log('[getCurrentLocation] 🏁 Завершение получения местоположения');
      setIsGettingLocation(false);
    }
  };

  // Функция для получения стиля поля ввода с учетом фокуса
  const getInputStyle = (isFocused: boolean, isTextArea: boolean = false) => [
    styles.stepInput,
    isTextArea && styles.textArea,
    isFocused && styles.stepInputFocused,
  ];

  const isCurrentStepValid = (): boolean => {
    switch (currentStep) {
      case 1: // Название вакансии
        return jobTitle.trim().length > 0;
      case 2: // Специализация
        return !!specializationId;
      case 3: // Опыт работы
        return !!experienceLevel;
      case 4: // Тип занятости
        return !!employmentType;
      case 5: // Формат работы
        return !!workFormat;
      case 6: // График работы
        return !!workSchedule;
      case 7: // Местоположение
        return location.trim().length > 0;
      case 8: // Город
        return !!city;
      case 9: // Оплата работы
        return !!salaryFrom || !!salaryTo;
      case 10: // Частота выплат
        return !!paymentFrequency;
      case 11: // Описание
        return description.trim().length > 0;
      case 12: // Навыки
        return skills && skills.length > 0;
      case 13: // Языки
        return languages && languages.length > 0;
      default:
        return false;
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!jobTitle.trim()) {
          Alert.alert(tError('error'), 'Введите название вакансии');
          return false;
        }
        return true;
      case 2:
        if (!specializationId) {
          Alert.alert(tError('error'), 'Выберите специализацию');
          return false;
        }
        return true;
      case 3:
        if (!experienceLevel) {
          Alert.alert(tError('error'), 'Выберите уровень опыта');
          return false;
        }
        return true;
      case 4:
        if (!employmentType) {
          Alert.alert(tError('error'), 'Выберите тип занятости');
          return false;
        }
        return true;
      case 5:
        if (!workFormat) {
          Alert.alert(tError('error'), 'Выберите формат работы');
          return false;
        }
        return true;
      case 6:
        if (!workSchedule) {
          Alert.alert(tError('error'), 'Выберите график работы');
          return false;
        }
        return true;
      case 7:
        if (!location.trim()) {
          Alert.alert(tError('error'), 'Выберите местоположение');
          return false;
        }
        return true;
      case 8:
        if (!city) {
          Alert.alert(tError('error'), 'Выберите город');
          return false;
        }
        return true;
      case 9:
        if (!salaryFrom && !salaryTo) {
          Alert.alert(tError('error'), 'Укажите зарплату');
          return false;
        }
        return true;
      case 10:
        if (!paymentFrequency) {
          Alert.alert(tError('error'), 'Выберите частоту выплат');
          return false;
        }
        return true;
      case 11:
        if (!description.trim()) {
          Alert.alert(tError('error'), 'Введите описание вакансии');
          return false;
        }
        return true;
      case 12:
        if (!skills || skills.length === 0) {
          Alert.alert(tError('error'), 'Выберите хотя бы один навык');
          return false;
        }
        return true;
      case 13:
        if (!languages || languages.length === 0) {
          Alert.alert(tError('error'), 'Выберите хотя бы один язык');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await vacancyService.createVacancy({
        jobTitle,
        description,
        specializationId,
        location,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        city,
        experienceLevel,
        employmentType,
        workFormat,
        workSchedule,
        salaryFrom: salaryFrom ? parseFloat(salaryFrom) : undefined,
        salaryTo: salaryTo ? parseFloat(salaryTo) : undefined,
        salaryPeriod,
        salaryType,
        paymentFrequency,
        skills,
        languages,
      });

      if (response.success) {
        Alert.alert('Успешно', 'Вакансия успешно создана!', [
          { 
            text: 'OK', 
            onPress: () => {
              // Возвращаемся на главный экран с табами
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }
          },
        ]);
      } else {
        Alert.alert(tError('error'), response.error || 'Не удалось создать вакансию');
      }
    } catch (error) {
      console.error('Error creating vacancy:', error);
      Alert.alert(tError('error'), 'Не удалось создать вакансию');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Название вакансии';
      case 2: return 'Специализация';
      case 3: return 'Опыт работы';
      case 4: return 'Тип занятости';
      case 5: return 'Формат работы';
      case 6: return 'График работы';
      case 7: return 'Местоположение';
      case 8: return 'Город';
      case 9: return 'Оплата работы';
      case 10: return 'Частота выплат';
      case 11: return 'Описание вакансии';
      case 12: return 'Навыки';
      case 13: return 'Языки';
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
                <Text style={styles.stepTitle}>Название вакансии</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 1} delay={150} resetKey={`${animationResetKey}-step-1`}>
                <Text style={styles.stepSubtitle}>Укажите название должности или позиции</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 1} delay={200} resetKey={`${animationResetKey}-step-1`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(jobTitleFocused)}
                    value={jobTitle}
                    onChangeText={setJobTitle}
                    placeholder="Например: Программист на React Native"
                    placeholderTextColor={theme.colors.text.secondary}
                    maxLength={100}
                    autoFocus
                    onFocus={() => setJobTitleFocused(true)}
                    onBlur={() => setJobTitleFocused(false)}
                  />
                  <Text style={styles.characterCount}>
                    {jobTitle.length}/100
                  </Text>
                </View>
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 2:
        return (
          <AnimatedStepContainer isActive={currentStep === 2} direction="right">
            <ScrollView 
              style={styles.stepScrollView}
              contentContainerStyle={styles.stepScrollContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              <View style={styles.stepContent}>
                <AnimatedField isActive={currentStep === 2} delay={0} resetKey={`${animationResetKey}-step-2`}>
                  <Text style={styles.stepTitle}>Специализация</Text>
                </AnimatedField>

                <AnimatedField isActive={currentStep === 2} delay={150} resetKey={`${animationResetKey}-step-2`}>
                  <Text style={styles.stepSubtitle}>Выберите специализацию для вакансии</Text>
                </AnimatedField>

                <AnimatedField isActive={currentStep === 2} delay={200} resetKey={`${animationResetKey}-step-2-list`}>
                  <View style={styles.specializationsList}>
                    {/* Родительские категории с подкатегориями */}
                    {vacancyParentCategories.map((category) => {
                      const subcategories = getSubcategoriesByParentId(category.id);
                      const isExpanded = expandedCategories.has(category.id);
                      
                      return (
                        <View key={category.id} style={styles.categoryContainer}>
                          {/* Родительская категория */}
                          <TouchableOpacity
                            style={styles.parentCategoryItem}
                            onPress={() => toggleCategory(category.id)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.parentCategoryContent}>
                              <CategoryIcon
                                icon={category.icon}
                                iconComponent={category.iconComponent}
                                size={24}
                                style={styles.parentCategoryIcon}
                              />
                              <Text style={styles.parentCategoryText}>
                                {getTranslatedSpecializationName(category.id, t)}
                              </Text>
                            </View>
                            <View style={styles.chevronIcon}>
                              {isExpanded ? (
                                <ChevronUpIcon width={20} height={20} stroke={theme.colors.text.secondary} />
                              ) : (
                                <ChevronDownIcon width={20} height={20} stroke={theme.colors.text.secondary} />
                              )}
                            </View>
                          </TouchableOpacity>

                          {/* Подкатегории */}
                          {isExpanded && subcategories.length > 0 && (
                            <View style={styles.subcategoriesContainer}>
                              {subcategories.map((subcategory) => (
                                <TouchableOpacity
                                  key={subcategory.id}
                                  style={[
                                    styles.subcategoryItem,
                                    specializationId === subcategory.id && styles.subcategoryItemSelected,
                                  ]}
                                  onPress={() => handleSpecializationSelect(subcategory.id)}
                                  activeOpacity={0.7}
                                >
                                  <View style={styles.subcategoryContent}>
                                    <CategoryIcon
                                      icon={subcategory.icon}
                                      iconComponent={subcategory.iconComponent}
                                      size={20}
                                      style={styles.subcategoryIcon}
                                    />
                                    <Text style={[
                                      styles.subcategoryText,
                                      specializationId === subcategory.id && styles.subcategoryTextSelected,
                                    ]}>
                                      {getTranslatedSpecializationName(subcategory.id, t)}
                                    </Text>
                                  </View>
                                  {specializationId === subcategory.id && (
                                    <View style={styles.selectedIndicator} />
                                  )}
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </AnimatedField>
              </View>
            </ScrollView>
          </AnimatedStepContainer>
        );

      case 3:
        return (
          <AnimatedStepContainer isActive={currentStep === 3} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 3} delay={0} resetKey={`${animationResetKey}-step-3`}>
                <Text style={styles.stepTitle}>Опыт работы</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 3} delay={150} resetKey={`${animationResetKey}-step-3`}>
                <Text style={styles.stepSubtitle}>Выберите требуемый уровень опыта</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 3} delay={200} resetKey={`${animationResetKey}-step-3`}>
                <ExperienceLevelSelector
                  selectedLevel={experienceLevel}
                  onSelect={setExperienceLevel}
                />
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 4:
        return (
          <AnimatedStepContainer isActive={currentStep === 4} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 4} delay={0} resetKey={`${animationResetKey}-step-4`}>
                <Text style={styles.stepTitle}>Тип занятости</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 4} delay={150} resetKey={`${animationResetKey}-step-4`}>
                <Text style={styles.stepSubtitle}>Укажите тип занятости для этой позиции</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 4} delay={200} resetKey={`${animationResetKey}-step-4`}>
                <EmploymentTypeSelector
                  selectedType={employmentType}
                  onSelect={setEmploymentType}
                />
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 5:
        return (
          <AnimatedStepContainer isActive={currentStep === 5} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 5} delay={0} resetKey={`${animationResetKey}-step-5`}>
                <Text style={styles.stepTitle}>Формат работы</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 5} delay={150} resetKey={`${animationResetKey}-step-5`}>
                <Text style={styles.stepSubtitle}>Выберите формат работы</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 5} delay={200} resetKey={`${animationResetKey}-step-5`}>
                <WorkFormatSelector
                  selectedFormat={workFormat}
                  onSelect={setWorkFormat}
                />
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 6:
        return (
          <AnimatedStepContainer isActive={currentStep === 6} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 6} delay={0} resetKey={`${animationResetKey}-step-6`}>
                <Text style={styles.stepTitle}>График работы</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 6} delay={150} resetKey={`${animationResetKey}-step-6`}>
                <Text style={styles.stepSubtitle}>Укажите график работы</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 6} delay={200} resetKey={`${animationResetKey}-step-6`}>
                <WorkScheduleSelector
                  selectedSchedule={workSchedule}
                  onSelect={setWorkSchedule}
                />
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 7:
        return (
          <AnimatedStepContainer isActive={currentStep === 7} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 7} delay={0} resetKey={`${animationResetKey}-step-7`}>
                <Text style={styles.stepTitle}>Местоположение</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 7} delay={150} resetKey={`${animationResetKey}-step-7`}>
                <Text style={styles.stepSubtitle}>Укажите адрес или выберите на карте</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 7} delay={200} resetKey={`${animationResetKey}-step-7`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(locationFocused)}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Например: Ташкент, ул. Амира Темура, 20"
                    placeholderTextColor={theme.colors.text.secondary}
                    onFocus={() => setLocationFocused(true)}
                    onBlur={() => setLocationFocused(false)}
                  />

                  <TouchableOpacity
                    style={styles.locationButton}
                    onPress={() => {
                      console.log('[Button] 🔘 Кнопка геолокации нажата');
                      getCurrentLocation();
                    }}
                    disabled={isGettingLocation}
                  >
                    <Text style={styles.locationButtonText}>
                      {isGettingLocation ? `📍 ${tCustomer('determining_location')}` : `📍 ${tCustomer('my_location')}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 7} delay={300} resetKey={`${animationResetKey}-step-7-map`}>
                <Text style={styles.mapSectionTitle}>Или выберите на карте</Text>
                <EmbeddedMapSelector
                  location={location}
                  onLocationSelect={(selectedCoords, address) => {
                    setCoords(selectedCoords);
                    if (address) {
                      setLocation(address);
                    }
                  }}
                  initialCoords={coords || undefined}
                  initialAddress={location}
                />
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 8:
        return (
          <AnimatedStepContainer isActive={currentStep === 8} direction="right">
            <ScrollView 
              style={styles.stepScrollView}
              contentContainerStyle={styles.stepScrollContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              <View style={styles.stepContent}>
                <AnimatedField isActive={currentStep === 8} delay={0} resetKey={`${animationResetKey}-step-8`}>
                  <Text style={styles.stepTitle}>Город</Text>
                </AnimatedField>

                <AnimatedField isActive={currentStep === 8} delay={150} resetKey={`${animationResetKey}-step-8`}>
                  <Text style={styles.stepSubtitle}>Выберите город, где находится вакансия</Text>
                </AnimatedField>

                <AnimatedField isActive={currentStep === 8} delay={200} resetKey={`${animationResetKey}-step-8`}>
                  <View style={styles.cityListContainer}>
                    {getAllCities().map((cityItem) => (
                      <TouchableOpacity
                        key={cityItem.id}
                        style={[
                          styles.cityItem,
                          city === cityItem.id && styles.cityItemSelected,
                        ]}
                        onPress={() => setCity(cityItem.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.cityItemText,
                          city === cityItem.id && styles.cityItemTextSelected,
                        ]}>
                          {cityItem.name}
                        </Text>
                        {city === cityItem.id && (
                          <View style={styles.selectedIndicator} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </AnimatedField>
              </View>
            </ScrollView>
          </AnimatedStepContainer>
        );

      case 9:
        return (
          <AnimatedStepContainer isActive={currentStep === 9} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 9} delay={0} resetKey={`${animationResetKey}-step-9`}>
                <Text style={styles.stepTitle}>Оплата работы</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 9} delay={150} resetKey={`${animationResetKey}-step-9`}>
                <Text style={styles.stepSubtitle}>Укажите диапазон зарплаты</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 9} delay={200} resetKey={`${animationResetKey}-step-9`}>
                <SalaryInputFields
                  salaryFrom={salaryFrom}
                  salaryTo={salaryTo}
                  salaryPeriod={salaryPeriod}
                  salaryType={salaryType}
                  onChangeSalaryFrom={setSalaryFrom}
                  onChangeSalaryTo={setSalaryTo}
                  onChangeSalaryPeriod={setSalaryPeriod}
                  onChangeSalaryType={setSalaryType}
                />
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 10:
        return (
          <AnimatedStepContainer isActive={currentStep === 10} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 10} delay={0} resetKey={`${animationResetKey}-step-10`}>
                <Text style={styles.stepTitle}>Частота выплат</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 10} delay={150} resetKey={`${animationResetKey}-step-10`}>
                <Text style={styles.stepSubtitle}>Как часто будет выплачиваться зарплата</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 10} delay={200} resetKey={`${animationResetKey}-step-10`}>
                <PaymentFrequencySelector
                  selectedValue={paymentFrequency}
                  onSelect={setPaymentFrequency}
                />
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 11:
        return (
          <AnimatedStepContainer isActive={currentStep === 11} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 11} delay={0} resetKey={`${animationResetKey}-step-11`}>
                <Text style={styles.stepTitle}>Описание вакансии</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 11} delay={150} resetKey={`${animationResetKey}-step-11`}>
                <Text style={styles.stepSubtitle}>Опишите обязанности и условия работы</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 11} delay={200} resetKey={`${animationResetKey}-step-11`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(descriptionFocused, true)}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Опишите обязанности, требования и условия работы"
                    placeholderTextColor={theme.colors.text.secondary}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    onFocus={() => setDescriptionFocused(true)}
                    onBlur={() => setDescriptionFocused(false)}
                  />
                  <Text style={styles.characterCount}>
                    {description.length}/2000
                  </Text>
                </View>
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 12:
        return (
          <AnimatedStepContainer isActive={currentStep === 12} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 12} delay={0} resetKey={`${animationResetKey}-step-12`}>
                <Text style={styles.stepTitle}>Навыки</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 12} delay={150} resetKey={`${animationResetKey}-step-12`}>
                <Text style={styles.stepSubtitle}>Выберите необходимые навыки для кандидата</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 12} delay={200} resetKey={`${animationResetKey}-step-12`}>
                <SkillsMultiSelect
                  selectedSkills={skills}
                  onSkillsChange={setSkills}
                />
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 13:
        return (
          <AnimatedStepContainer isActive={currentStep === 13} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 13} delay={0} resetKey={`${animationResetKey}-step-13`}>
                <Text style={styles.stepTitle}>Языки</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 13} delay={150} resetKey={`${animationResetKey}-step-13`}>
                <Text style={styles.stepSubtitle}>Выберите языки, которыми должен владеть кандидат</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 13} delay={200} resetKey={`${animationResetKey}-step-13`}>
                <LanguagesMultiSelect
                  selectedLanguages={languages}
                  onLanguagesChange={setLanguages}
                />
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <HeaderWithBack
            title={getStepTitle()}
            onBack={handleBack}
            rightComponent={
              <View style={styles.stepCounterContainer}>
                <Text style={styles.progressText}>
                  {currentStep}/{TOTAL_STEPS}
                </Text>
              </View>
            }
          />

          <AnimatedProgressBar progress={progress} total={TOTAL_STEPS} />

          <View style={styles.mainContent}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              {renderStep()}
            </ScrollView>
          </View>

          <View style={[styles.navigation, { 
            paddingTop: theme.spacing.md,
            paddingBottom: insets.bottom 
          }]}>
            {currentStep > 1 && (
              <AnimatedNavigationButton
                variant="secondary"
                onPress={handleBack}
                isVisible={currentStep > 1}
                delay={0}
              >
                <Text style={styles.secondaryButtonText}>{tCommon('back')}</Text>
              </AnimatedNavigationButton>
            )}

            <View style={styles.navigationSpacer} />

            {currentStep < TOTAL_STEPS ? (
              isCurrentStepValid() && (
                <AnimatedNavigationButton
                  variant="primary"
                  onPress={handleNext}
                  isVisible={currentStep < TOTAL_STEPS && isCurrentStepValid()}
                  delay={0}
                >
                  <Text style={styles.primaryButtonText}>{tCommon('next')}</Text>
                </AnimatedNavigationButton>
              )
            ) : (
              <AnimatedNavigationButton
                variant="primary"
                onPress={handleSubmit}
                disabled={isLoading}
                isVisible={currentStep === TOTAL_STEPS}
                delay={0}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Создание...' : 'Создать вакансию'}
                </Text>
              </AnimatedNavigationButton>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

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
  mainContent: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  stepCounterContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: theme.borderRadius.md,
  },
  progressText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold as any,
    color: theme.colors.text.primary,
  },
  stepScrollView: {
    flex: 1,
  },
  stepScrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  stepContent: {
    flex: 1,
    paddingTop: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
    paddingBottom: isSmallScreen ? theme.spacing.lg : 0,
  },
  stepTitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.xl : theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: isSmallScreen ? theme.spacing.xs : theme.spacing.sm,
  },
  stepSubtitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
    lineHeight: isSmallScreen ? 18 : 22,
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
    paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
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
  textArea: {
    height: isSmallScreen ? 80 : 120,
    paddingTop: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  mapSectionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  locationButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  locationButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  // Стили для списка специализаций
  specializationsList: {
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  categoryContainer: {
    marginBottom: theme.spacing.sm,
  },
  parentCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  parentCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parentCategoryIcon: {
    marginRight: theme.spacing.md,
  },
  parentCategoryText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  chevronIcon: {
    marginLeft: theme.spacing.sm,
  },
  subcategoriesContainer: {
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.md,
    paddingLeft: theme.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.border,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.sm + 4,
    paddingLeft: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  subcategoryItemSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.primary + '08',
  },
  subcategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subcategoryIcon: {
    marginRight: theme.spacing.sm,
  },
  subcategoryText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  subcategoryTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semiBold,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  // Стили для списка городов
  cityListContainer: {
    marginTop: theme.spacing.md,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cityItemSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.primary + '10',
  },
  cityItemText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },
  cityItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semiBold,
  },
  // Навигация
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  navigationSpacer: {
    flex: 1,
  },
  secondaryButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
  },
});

