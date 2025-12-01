import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CustomerStackParamList } from '../../types/navigation';
import { HeaderWithBack } from '../../components/common';
import { useCustomerTranslation, useErrorsTranslation, useCommonTranslation } from '../../hooks/useTranslation';
import { PARENT_CATEGORIES, getSubcategoriesByParentId, getTranslatedSpecializationName, SPECIALIZATIONS } from '../../constants/specializations';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { useTranslation } from 'react-i18next';
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
import { authService } from '../../services/authService';
import { Order } from '../../types';
import ChevronDownIcon from '../../../assets/chevron-down.svg';
import ChevronUpIcon from '../../../assets/chevron-up.svg';
import { useCloseVacancy } from '../../hooks/queries/useVacancyQueries';

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

type EditVacancyRouteProp = RouteProp<CustomerStackParamList, 'EditVacancy'>;

// Функция для очистки адреса от названия страны
const cleanAddressFromCountry = (address: string): string => {
  if (!address) return address;

  let cleanAddress = address;
  cleanAddress = cleanAddress.replace(/^Узбекистан,?\s*/i, '').replace(/,?\s*Узбекистан$/i, '');
  cleanAddress = cleanAddress.replace(/^Uzbekistan,?\s*/i, '').replace(/,?\s*Uzbekistan$/i, '');
  cleanAddress = cleanAddress.replace(/^,\s*/, '');

  return cleanAddress;
};

export function EditVacancyScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditVacancyRouteProp>();
  const { vacancyId } = route.params;
  const tCustomer = useCustomerTranslation();
  const tError = useErrorsTranslation();
  const tCommon = useCommonTranslation();
  const { t } = useTranslation();

  // Хук для завершения вакансии с автоматической инвалидацией кэша
  const closeVacancyMutation = useCloseVacancy();

  const [vacancy, setVacancy] = useState<Order | null>(null);
  const [isLoadingVacancy, setIsLoadingVacancy] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [jobTitle, setJobTitle] = useState('');
  const [description, setDescription] = useState('');
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
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // UI states
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | null>(null);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [isSpecializationDropdownOpen, setIsSpecializationDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  
  // Focus states для текстовых полей
  const [jobTitleFocused, setJobTitleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);

  // Загружаем данные вакансии при монтировании компонента
  useEffect(() => {
    const loadVacancy = async () => {
      try {
        setIsLoadingVacancy(true);
        const vacancyData = await vacancyService.getVacancyById(vacancyId);

        if (!vacancyData) {
          Alert.alert(tError('error'), 'Вакансия не найдена');
          navigation.goBack();
          return;
        }

        // Проверяем, что вакансия принадлежит текущему пользователю
        const authState = authService.getAuthState();
        if (!authState.isAuthenticated || !authState.user || vacancyData.customerId !== authState.user.id) {
          Alert.alert(
            tError('error'),
            'Вы не можете редактировать чужую вакансию',
            [{ text: tCommon('ok'), onPress: () => navigation.goBack() }]
          );
          return;
        }

        // Проверяем, что вакансию можно редактировать
        if (vacancyData.status !== 'new') {
          Alert.alert(
            'Редактирование невозможно',
            'Вакансию можно редактировать только со статусом "Новая"',
            [{ text: tCommon('ok'), onPress: () => navigation.goBack() }]
          );
          return;
        }

        setVacancy(vacancyData);

        // Заполняем форму данными вакансии
        setJobTitle(vacancyData.jobTitle || '');
        setDescription(vacancyData.description || '');
        setSpecializationId(vacancyData.specializationId || '');
        setExperienceLevel(vacancyData.experienceLevel || '');
        setEmploymentType(vacancyData.employmentType || '');
        setWorkFormat(vacancyData.workFormat || '');
        setWorkSchedule(vacancyData.workSchedule || '');
        setLocation(vacancyData.location || '');
        setCity(vacancyData.city || '');
        setSalaryFrom(vacancyData.salaryFrom ? vacancyData.salaryFrom.toString() : '');
        setSalaryTo(vacancyData.salaryTo ? vacancyData.salaryTo.toString() : '');
        setSalaryPeriod(vacancyData.salaryPeriod || 'per_month');
        setSalaryType(vacancyData.salaryType || 'before_tax');
        setPaymentFrequency(vacancyData.paymentFrequency || '');
        setSkills(vacancyData.skills || []);
        setLanguages(vacancyData.languages || []);

        if (vacancyData.latitude && vacancyData.longitude) {
          setCoords({
            latitude: vacancyData.latitude,
            longitude: vacancyData.longitude
          });
        }

        // Определяем родительскую категорию для подкатегорий
        if (vacancyData.specializationId) {
          const parentCategory = PARENT_CATEGORIES.find(cat => 
            getSubcategoriesByParentId(cat.id).some(sub => sub.id === vacancyData.specializationId)
          );
          if (parentCategory) {
            setSelectedParentCategory(parentCategory.id);
            setShowSubcategories(true);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки вакансии:', error);
        Alert.alert(tError('error'), 'Не удалось загрузить данные вакансии');
        navigation.goBack();
      } finally {
        setIsLoadingVacancy(false);
      }
    };

    loadVacancy();
  }, [vacancyId, navigation]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      const currentCoords = await locationService.getCurrentLocation();
      
      if (currentCoords) {
        setCoords(currentCoords);
        const geocodeResult = await locationService.reverseGeocode(currentCoords.latitude, currentCoords.longitude);
        
        if (geocodeResult) {
          const cleanedAddress = cleanAddressFromCountry(geocodeResult.address);
          setLocation(cleanedAddress);
          if (geocodeResult.city) {
            setCity(geocodeResult.city);
          }
        } else {
          const coordsString = `${currentCoords.latitude.toFixed(6)}, ${currentCoords.longitude.toFixed(6)}`;
          setLocation(coordsString);
        }
      } else {
        Alert.alert(tError('error'), 'Не удалось определить местоположение');
      }
    } catch (error) {
      console.error('Ошибка получения местоположения:', error);
      Alert.alert(tError('error'), 'Ошибка при определении местоположения');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const validateForm = () => {
    if (!jobTitle.trim()) {
      Alert.alert(tError('error'), 'Введите название вакансии');
      return false;
    }
    if (!specializationId) {
      Alert.alert(tError('error'), 'Выберите специализацию');
      return false;
    }
    if (!description.trim()) {
      Alert.alert(tError('error'), 'Введите описание вакансии');
      return false;
    }
    if (!city) {
      Alert.alert(tError('error'), 'Выберите город');
      return false;
    }
    if (!experienceLevel) {
      Alert.alert(tError('error'), 'Выберите требуемый опыт');
      return false;
    }
    if (!employmentType) {
      Alert.alert(tError('error'), 'Выберите тип занятости');
      return false;
    }
    if (!workFormat) {
      Alert.alert(tError('error'), 'Выберите формат работы');
      return false;
    }
    if (!workSchedule) {
      Alert.alert(tError('error'), 'Выберите график работы');
      return false;
    }
    if (!location.trim()) {
      Alert.alert(tError('error'), 'Укажите адрес');
      return false;
    }
    if (!paymentFrequency) {
      Alert.alert(tError('error'), 'Выберите частоту выплат');
      return false;
    }

    return true;
  };

  const handleUpdateVacancy = async () => {
    if (!validateForm() || !vacancy) return;

    try {
      setIsLoading(true);
      console.log('[EditVacancy] 🔄 Начинаем обновление вакансии...');

      const result = await vacancyService.updateVacancy({
        vacancyId: vacancy.id,
        jobTitle: jobTitle.trim(),
        description: description.trim(),
        specializationId,
        location: location.trim(),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        city,
        experienceLevel,
        employmentType,
        workFormat,
        workSchedule,
        salaryFrom: salaryFrom ? parseInt(salaryFrom.replace(/\s/g, '')) : undefined,
        salaryTo: salaryTo ? parseInt(salaryTo.replace(/\s/g, '')) : undefined,
        salaryPeriod,
        salaryType,
        paymentFrequency,
        skills,
        languages,
      });

      if (result.success) {
        console.log('[EditVacancy] ✅ Вакансия успешно обновлена');
        Alert.alert(
          tCommon('success'),
          'Вакансия успешно обновлена',
          [{ text: tCommon('ok'), onPress: () => navigation.goBack() }]
        );
      } else {
        console.error('[EditVacancy] ❌ Ошибка обновления вакансии:', result.error);
        Alert.alert(tError('error'), result.error || 'Не удалось обновить вакансию');
      }
    } catch (error) {
      console.error('[EditVacancy] ❌ Критическая ошибка обновления вакансии:', error);
      Alert.alert(tError('error'), 'Произошла ошибка при обновлении вакансии');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseVacancy = () => {
    Alert.alert(
      'Завершить вакансию',
      'Вы уверены, что хотите завершить (снять) эту вакансию? Она больше не будет отображаться для соискателей.',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Завершить',
          style: 'destructive',
          onPress: async () => {
            if (!vacancy) return;
            
            try {
              setIsLoading(true);

              // Используем мутацию с автоматической инвалидацией кэша
              const result = await closeVacancyMutation.mutateAsync(vacancy.id);

              if (result.success) {
                Alert.alert(
                  tCommon('success'),
                  'Вакансия успешно завершена',
                  [{ text: tCommon('ok'), onPress: () => navigation.goBack() }]
                );
              } else {
                Alert.alert(tError('error'), result.error || 'Не удалось завершить вакансию');
              }
            } catch (error) {
              console.error('[EditVacancy] Ошибка завершения вакансии:', error);
              Alert.alert(tError('error'), 'Произошла ошибка при завершении вакансии');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Показываем загрузку пока загружаются данные вакансии
  if (isLoadingVacancy) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack title="Редактирование вакансии" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Загружаем данные вакансии...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vacancy) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack title="Редактирование вакансии" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Вакансия не найдена</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allCities = getAllCities();

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBack title="Редактирование вакансии" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Редактирование вакансии</Text>
            <Text style={styles.subtitle}>Внесите необходимые изменения</Text>
          </View>

          {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
          <View style={styles.sectionGroup}>
            <View style={styles.sectionGroupHeader}>
              <Text style={styles.sectionGroupTitle}>📋 Основная информация</Text>
            </View>

            {/* Название вакансии */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Название вакансии *</Text>
              <TextInput
                style={[styles.input, jobTitleFocused && styles.inputFocused]}
                value={jobTitle}
                onChangeText={setJobTitle}
                placeholder="Например: Frontend-разработчик"
                placeholderTextColor={theme.colors.text.secondary}
                onFocus={() => setJobTitleFocused(true)}
                onBlur={() => setJobTitleFocused(false)}
              />
            </View>

          {/* Категория (Специализация) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Специализация *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setIsSpecializationDropdownOpen(!isSpecializationDropdownOpen)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownButtonContent}>
                {specializationId ? (
                  <>
                    {(() => {
                      const spec = SPECIALIZATIONS.find(s => s.id === specializationId);
                      return spec ? (
                        <>
                          <CategoryIcon
                            icon={spec.icon}
                            iconComponent={spec.iconComponent}
                            size={20}
                            style={styles.dropdownIcon}
                          />
                          <Text style={styles.dropdownButtonText}>
                            {getTranslatedSpecializationName(specializationId, t)}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.dropdownButtonPlaceholder}>Выберите специализацию</Text>
                      );
                    })()}
                  </>
                ) : (
                  <Text style={styles.dropdownButtonPlaceholder}>Выберите специализацию</Text>
                )}
              </View>
              {isSpecializationDropdownOpen ? (
                <ChevronUpIcon width={20} height={20} color={theme.colors.text.secondary} />
              ) : (
                <ChevronDownIcon width={20} height={20} color={theme.colors.text.secondary} />
              )}
            </TouchableOpacity>

            {isSpecializationDropdownOpen && (
              <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                {SPECIALIZATIONS.filter(spec => !spec.isParent).map((spec) => (
                  <TouchableOpacity
                    key={spec.id}
                    style={[
                      styles.dropdownItem,
                      specializationId === spec.id && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSpecializationId(spec.id);
                      setIsSpecializationDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <CategoryIcon
                      icon={spec.icon}
                      iconComponent={spec.iconComponent}
                      size={20}
                      style={styles.dropdownItemIcon}
                    />
                    <Text
                      style={[
                        styles.dropdownItemText,
                        specializationId === spec.id && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {getTranslatedSpecializationName(spec.id, t)}
                    </Text>
                    {specializationId === spec.id && (
                      <Text style={styles.dropdownItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Описание */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Описание вакансии *</Text>
            <TextInput
              style={[styles.input, styles.textArea, descriptionFocused && styles.inputFocused]}
              value={description}
              onChangeText={setDescription}
              placeholder="Опишите требования и обязанности..."
              placeholderTextColor={theme.colors.text.secondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              onFocus={() => setDescriptionFocused(true)}
              onBlur={() => setDescriptionFocused(false)}
            />
          </View>
        </View>

        {/* МЕСТОПОЛОЖЕНИЕ */}
        <View style={styles.sectionGroup}>
          <View style={styles.sectionGroupHeader}>
            <Text style={styles.sectionGroupTitle}>📍 Местоположение</Text>
          </View>

          {/* Город */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Город *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownButtonContent}>
                {city ? (
                  <Text style={styles.dropdownButtonText}>
                    {allCities.find(c => c.id === city)?.name || 'Выберите город'}
                  </Text>
                ) : (
                  <Text style={styles.dropdownButtonPlaceholder}>Выберите город</Text>
                )}
              </View>
              {isCityDropdownOpen ? (
                <ChevronUpIcon width={20} height={20} color={theme.colors.text.secondary} />
              ) : (
                <ChevronDownIcon width={20} height={20} color={theme.colors.text.secondary} />
              )}
            </TouchableOpacity>

            {isCityDropdownOpen && (
              <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                {allCities.map((cityItem) => (
                  <TouchableOpacity
                    key={cityItem.id}
                    style={[
                      styles.dropdownItem,
                      city === cityItem.id && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setCity(cityItem.id);
                      setIsCityDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        city === cityItem.id && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {cityItem.name}
                    </Text>
                    {city === cityItem.id && (
                      <Text style={styles.dropdownItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* ТРЕБОВАНИЯ К КАНДИДАТУ */}
        <View style={styles.sectionGroup}>
          <View style={styles.sectionGroupHeader}>
            <Text style={styles.sectionGroupTitle}>👤 Требования к кандидату</Text>
          </View>

          {/* Требуемый опыт */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Требуемый опыт *</Text>
            <ExperienceLevelSelector
              value={experienceLevel}
              onSelect={setExperienceLevel}
            />
          </View>

          {/* Навыки */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Требуемые навыки</Text>
            <SkillsMultiSelect selectedSkills={skills} onSkillsChange={setSkills} />
          </View>

          {/* Языки */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Требуемые языки</Text>
            <LanguagesMultiSelect selectedLanguages={languages} onLanguagesChange={setLanguages} />
          </View>
        </View>

        {/* УСЛОВИЯ РАБОТЫ */}
        <View style={styles.sectionGroup}>
          <View style={styles.sectionGroupHeader}>
            <Text style={styles.sectionGroupTitle}>💼 Условия работы</Text>
          </View>

          {/* Тип занятости */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Тип занятости *</Text>
            <EmploymentTypeSelector
              value={employmentType}
              onSelect={setEmploymentType}
            />
          </View>

          {/* Формат работы */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Формат работы *</Text>
            <WorkFormatSelector value={workFormat} onSelect={setWorkFormat} />
          </View>

          {/* График работы */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>График работы *</Text>
            <WorkScheduleSelector value={workSchedule} onSelect={setWorkSchedule} />
          </View>

          {/* Адрес */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Адрес *</Text>
            <TextInput
              style={[styles.input, locationFocused && styles.inputFocused]}
              value={location}
              onChangeText={setLocation}
              placeholder="Укажите адрес офиса"
              placeholderTextColor={theme.colors.text.secondary}
              onFocus={() => setLocationFocused(true)}
              onBlur={() => setLocationFocused(false)}
            />
            <TouchableOpacity
              style={[styles.locationButton, isGettingLocation && styles.locationButtonDisabled]}
              onPress={handleGetCurrentLocation}
              disabled={isGettingLocation}
              activeOpacity={0.8}
            >
              <Text style={styles.locationButtonText}>
                {isGettingLocation ? '📍 Получаем...' : '📍 Мое местоположение'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ЗАРПЛАТА */}
        <View style={styles.sectionGroup}>
          <View style={styles.sectionGroupHeader}>
            <Text style={styles.sectionGroupTitle}>💰 Зарплата</Text>
          </View>

          {/* Зарплата */}
          <View style={styles.section}>
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
          </View>

          {/* Частота выплат */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Частота выплат *</Text>
            <PaymentFrequencySelector
              value={paymentFrequency}
              onSelect={setPaymentFrequency}
            />
          </View>
        </View>
        </View>
      </ScrollView>

      {/* Кнопка обновления */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
          onPress={handleUpdateVacancy}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.updateButtonText}>
            {isLoading ? 'Обновление...' : 'Обновить вакансию'}
          </Text>
        </TouchableOpacity>
        
        {/* Кнопка завершения вакансии */}
        <TouchableOpacity
          style={[styles.closeButton, isLoading && styles.updateButtonDisabled]}
          onPress={handleCloseVacancy}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.closeButtonText}>
            Завершить вакансию
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
  },
  header: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionGroup: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  sectionGroupHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF4',
  },
  sectionGroupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: '#F0F7FF',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  categoryCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  subcategoriesList: {
    gap: 8,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subcategoryItemSelected: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  subcategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subcategoryIcon: {
    marginRight: 8,
  },
  subcategoryLabel: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  subcategoryLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  citiesList: {
    gap: 8,
    marginTop: 8,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cityItemSelected: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  cityLabel: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  cityLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  locationButton: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownIcon: {
    marginRight: 8,
  },
  dropdownButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  dropdownButtonPlaceholder: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
  },
  dropdownList: {
    maxHeight: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  dropdownItemIcon: {
    marginRight: 12,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  dropdownItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dropdownItemCheck: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  updateButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  closeButton: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  closeButtonText: {
    color: '#EF4444',
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
});

