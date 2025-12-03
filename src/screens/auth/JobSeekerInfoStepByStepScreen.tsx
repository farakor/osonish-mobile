import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  StatusBar,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import type { RootStackParamList, Education, WorkExperience } from '../../types';
import { HeaderWithBack } from '../../components/common';
import { useAuthTranslation, useCommonTranslation, useErrorsTranslation, useTranslation } from '../../hooks/useTranslation';
import { SPECIALIZATIONS, PARENT_CATEGORIES, getSubcategoriesByParentId, getTranslatedSpecializationName } from '../../constants/specializations';
import ChevronDownIcon from '../../../assets/chevron-down.svg';
import ChevronUpIcon from '../../../assets/chevron-up.svg';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import PlusIcon from '../../../assets/plus.svg';
import { Ionicons } from '@expo/vector-icons';

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Популярные навыки для выбора
const POPULAR_SKILLS = [
  'Microsoft Office',
  'Excel',
  'Word',
  'PowerPoint',
  '1C',
  'Английский язык',
  'Русский язык',
  'Узбекский язык',
  'Водительские права',
  'Работа с клиентами',
  'Продажи',
  'Коммуникабельность',
  'Ответственность',
  'Пунктуальность',
  'Командная работа',
  'Лидерство',
  'Организаторские способности',
  'Аналитическое мышление',
  'Креативность',
  'Быстрая обучаемость',
];

// Типы занятости
const EMPLOYMENT_TYPES = [
  { id: 'full_time', label: 'Полная занятость' },
  { id: 'part_time', label: 'Частичная занятость' },
  { id: 'project', label: 'Проектная работа' },
  { id: 'internship', label: 'Стажировка' },
];

// Графики работы
const WORK_SCHEDULES = [
  { id: 'full_day', label: 'Полный день' },
  { id: 'shift', label: 'Сменный график' },
  { id: 'flexible', label: 'Гибкий график' },
  { id: 'remote', label: 'Удаленная работа' },
];

// Простой прогресс-бар
const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const progress = (current / total) * 100;
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>
        Шаг {current} из {total}
      </Text>
    </View>
  );
};

export const JobSeekerInfoStepByStepScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const t = useAuthTranslation();
  const tCommon = useCommonTranslation();
  const tError = useErrorsTranslation();
  const { t: tCategories } = useTranslation(); // Для переводов категорий

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5; // Увеличено до 5 шагов

  // Шаг 1: Образование
  const [education, setEducation] = useState<Education[]>([]);
  const [newEducationInstitution, setNewEducationInstitution] = useState('');
  const [newEducationDegree, setNewEducationDegree] = useState('');
  const [newEducationYearStart, setNewEducationYearStart] = useState('');
  const [newEducationYearEnd, setNewEducationYearEnd] = useState('');
  const [showYearStartPicker, setShowYearStartPicker] = useState(false);
  const [showYearEndPicker, setShowYearEndPicker] = useState(false);
  const slideAnimYearStart = useState(new Animated.Value(500))[0];
  const slideAnimYearEnd = useState(new Animated.Value(500))[0];

  // Шаг 2: Навыки
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');

  // Шаг 3: Опыт работы
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [newWorkCompany, setNewWorkCompany] = useState('');
  const [newWorkPosition, setNewWorkPosition] = useState('');
  const [newWorkYearStart, setNewWorkYearStart] = useState('');
  const [newWorkYearEnd, setNewWorkYearEnd] = useState('');
  const [showWorkYearStartPicker, setShowWorkYearStartPicker] = useState(false);
  const [showWorkYearEndPicker, setShowWorkYearEndPicker] = useState(false);
  const slideAnimWorkYearStart = useState(new Animated.Value(500))[0];
  const slideAnimWorkYearEnd = useState(new Animated.Value(500))[0];

  // Шаг 4: Дополнительная информация
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  const [desiredSalary, setDesiredSalary] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>([]);
  const [selectedWorkSchedules, setSelectedWorkSchedules] = useState<string[]>([]);
  const [willingToTravel, setWillingToTravel] = useState(false);

  // Функция для форматирования числа с разделителями
  const formatSalary = (value: string): string => {
    // Удаляем все пробелы и нечисловые символы
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    
    // Форматируем с пробелами между тысячами
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Функция для получения чистого числа (без пробелов)
  const unformatSalary = (value: string): string => {
    return value.replace(/\s/g, '');
  };

  // Шаг 5: Специализация (обязательный)
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleBackPress = () => {
    if (currentStep === 1) {
      navigation.goBack();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  // Генерация списка годов (от текущего года до 1950)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1950; year--) {
      years.push(year.toString());
    }
    return years;
  };

  const years = generateYears();

  // Анимации для модальных окон
  useEffect(() => {
    if (showYearStartPicker) {
      Animated.spring(slideAnimYearStart, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnimYearStart.setValue(500);
    }
  }, [showYearStartPicker]);

  useEffect(() => {
    if (showYearEndPicker) {
      Animated.spring(slideAnimYearEnd, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnimYearEnd.setValue(500);
    }
  }, [showYearEndPicker]);

  useEffect(() => {
    if (showWorkYearStartPicker) {
      Animated.spring(slideAnimWorkYearStart, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnimWorkYearStart.setValue(500);
    }
  }, [showWorkYearStartPicker]);

  useEffect(() => {
    if (showWorkYearEndPicker) {
      Animated.spring(slideAnimWorkYearEnd, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnimWorkYearEnd.setValue(500);
    }
  }, [showWorkYearEndPicker]);

  // Шаг 1: Добавление образования
  const handleAddEducation = () => {
    if (!newEducationInstitution.trim()) {
      Alert.alert(tError('error'), 'Введите название учебного заведения');
      return;
    }

    const newEducation: Education = {
      institution: newEducationInstitution.trim(),
      degree: newEducationDegree.trim() || undefined,
      yearStart: newEducationYearStart || undefined,
      yearEnd: newEducationYearEnd || undefined,
    };

    setEducation([...education, newEducation]);
    setNewEducationInstitution('');
    setNewEducationDegree('');
    setNewEducationYearStart('');
    setNewEducationYearEnd('');
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Шаг 2: Навыки
  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    if (!customSkill.trim()) return;
    
    if (!selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills([...selectedSkills, customSkill.trim()]);
    }
    setCustomSkill('');
  };

  // Шаг 3: Добавление опыта работы
  const handleAddWorkExperience = () => {
    if (!newWorkCompany.trim()) {
      Alert.alert(tError('error'), 'Введите название компании');
      return;
    }
    if (!newWorkPosition.trim()) {
      Alert.alert(tError('error'), 'Введите должность');
      return;
    }

    const newWork: WorkExperience = {
      company: newWorkCompany.trim(),
      position: newWorkPosition.trim(),
      yearStart: newWorkYearStart || undefined,
      yearEnd: newWorkYearEnd || undefined,
    };

    setWorkExperience([...workExperience, newWork]);
    setNewWorkCompany('');
    setNewWorkPosition('');
    setNewWorkYearStart('');
    setNewWorkYearEnd('');
  };

  const handleRemoveWorkExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };

  // Шаг 4: Специализации
  const toggleCategory = (categoryId: string) => {
    const newExpandedCategories = new Set(expandedCategories);
    if (newExpandedCategories.has(categoryId)) {
      newExpandedCategories.delete(categoryId);
    } else {
      newExpandedCategories.add(categoryId);
    }
    setExpandedCategories(newExpandedCategories);
  };

  const toggleSpecialization = (specId: string) => {
    if (selectedSpecializations.includes(specId)) {
      setSelectedSpecializations(selectedSpecializations.filter(id => id !== specId));
    } else {
      setSelectedSpecializations([...selectedSpecializations, specId]);
    }
  };

  const handleContinue = async () => {
    // Шаг 1: Автоматически добавляем образование, если есть заполненные поля
    if (currentStep === 1) {
      if (newEducationInstitution.trim()) {
        const newEducation: Education = {
          institution: newEducationInstitution.trim(),
          degree: newEducationDegree.trim() || undefined,
          yearStart: newEducationYearStart || undefined,
          yearEnd: newEducationYearEnd || undefined,
        };
        setEducation([...education, newEducation]);
        setNewEducationInstitution('');
        setNewEducationDegree('');
        setNewEducationYearStart('');
        setNewEducationYearEnd('');
      }
      setCurrentStep(currentStep + 1);
      return;
    }

    // Шаг 3: Автоматически добавляем опыт работы, если есть заполненные поля
    if (currentStep === 3) {
      if (newWorkCompany.trim() || newWorkPosition.trim()) {
        // Проверяем обязательные поля
        if (!newWorkCompany.trim()) {
          Alert.alert(tError('error'), 'Введите название компании');
          return;
        }
        if (!newWorkPosition.trim()) {
          Alert.alert(tError('error'), 'Введите должность');
          return;
        }

        const newWork: WorkExperience = {
          company: newWorkCompany.trim(),
          position: newWorkPosition.trim(),
          yearStart: newWorkYearStart || undefined,
          yearEnd: newWorkYearEnd || undefined,
        };
        setWorkExperience([...workExperience, newWork]);
        setNewWorkCompany('');
        setNewWorkPosition('');
        setNewWorkYearStart('');
        setNewWorkYearEnd('');
      }
      setCurrentStep(currentStep + 1);
      return;
    }

    // Шаг 4: Дополнительная информация (желаемая зарплата и готовность к переезду)
    if (currentStep === 4) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Шаг 5 (специализация) - обязательный
    if (currentStep === 5) {
      if (selectedSpecializations.length === 0) {
        Alert.alert(tError('error'), 'Выберите хотя бы одну специализацию');
        return;
      }

      // Сохраняем данные
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        const profileDataString = await AsyncStorage.default.getItem('@temp_profile_data');

        if (!profileDataString) {
          Alert.alert(tError('error'), t('profile_data_not_found_error'));
          return;
        }

        const profileData = JSON.parse(profileDataString);

        // Добавляем данные job_seeker
        profileData.education = education.length > 0 ? education : undefined;
        profileData.skills = selectedSkills.length > 0 ? selectedSkills : undefined;
        profileData.workExperience = workExperience.length > 0 ? workExperience : undefined;
        profileData.willingToRelocate = willingToRelocate;
        // Сохраняем зарплату как число (убираем пробелы)
        profileData.desiredSalary = desiredSalary ? parseInt(unformatSalary(desiredSalary)) : undefined;
        // Дополнительные поля для резюме
        profileData.gender = gender || undefined;
        profileData.employmentTypes = selectedEmploymentTypes.length > 0 ? selectedEmploymentTypes : undefined;
        profileData.workSchedules = selectedWorkSchedules.length > 0 ? selectedWorkSchedules : undefined;
        profileData.willingToTravel = willingToTravel;
        
        // Преобразуем ID специализаций в объекты
        profileData.specializations = selectedSpecializations.map((specId, index) => {
          const spec = SPECIALIZATIONS.find(s => s.id === specId);
          return {
            id: specId,
            name: spec?.name || specId,
            isPrimary: index === 0, // Первая - основная
          };
        });

        await AsyncStorage.default.setItem('@temp_profile_data', JSON.stringify(profileData));

        // Переходим к выбору города
        navigation.navigate('CitySelection', { role: 'worker', workerType: 'job_seeker' });
      } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        Alert.alert(tError('error'), t('general_error_try_again'));
      }
    } else {
      // Переходим к следующему шагу (для шага 2 - навыки)
      setCurrentStep(currentStep + 1);
    }
  };

  const canSkip = currentStep !== 5; // Все шаги можно пропустить кроме специализации (шаг 5)

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderEducationStep();
      case 2:
        return renderSkillsStep();
      case 3:
        return renderWorkExperienceStep();
      case 4:
        return renderAdditionalInfoStep();
      case 5:
        return renderSpecializationsStep();
      default:
        return null;
    }
  };

  const renderEducationStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Где вы учились?</Text>
      <Text style={styles.stepSubtitle}>
        Добавьте учебные заведения, которые вы закончили
      </Text>

      {/* Список добавленных учебных заведений */}
      {education.map((edu, index) => (
        <View key={index} style={styles.addedItem}>
          <View style={styles.addedItemContent}>
            <Text style={styles.addedItemTitle}>{edu.institution}</Text>
            {edu.degree && <Text style={styles.addedItemSubtitle}>{edu.degree}</Text>}
            {(edu.yearStart || edu.yearEnd) && (
              <Text style={styles.addedItemYears}>
                {edu.yearStart || '?'} - {edu.yearEnd || 'н.в.'}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => handleRemoveEducation(index)}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Форма добавления */}
      <View style={styles.addForm}>
        <Text style={styles.inputLabel}>Учебное заведение *</Text>
        <TextInput
          style={styles.input}
          value={newEducationInstitution}
          onChangeText={setNewEducationInstitution}
          placeholder="Например: НУУз, ТАТУ"
          placeholderTextColor={theme.colors.text.secondary}
        />

        <Text style={styles.inputLabel}>Специальность</Text>
        <TextInput
          style={styles.input}
          value={newEducationDegree}
          onChangeText={setNewEducationDegree}
          placeholder="Например: Программист"
          placeholderTextColor={theme.colors.text.secondary}
        />

        <Text style={styles.inputLabel}>Годы обучения</Text>
        <View style={styles.yearsRow}>
          {/* Начало */}
          <View style={styles.yearColumn}>
            <Text style={styles.yearLabel}>Начало</Text>
            <TouchableOpacity
              style={styles.yearPicker}
              onPress={() => setShowYearStartPicker(true)}
            >
              <Text style={[styles.yearPickerText, !newEducationYearStart && styles.yearPickerPlaceholder]}>
                {newEducationYearStart || 'Выберите'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Окончание */}
          <View style={styles.yearColumn}>
            <Text style={styles.yearLabel}>Окончание</Text>
            <TouchableOpacity
              style={styles.yearPicker}
              onPress={() => setShowYearEndPicker(true)}
            >
              <Text style={[styles.yearPickerText, !newEducationYearEnd && styles.yearPickerPlaceholder]}>
                {newEducationYearEnd || 'Выберите'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddEducation}>
          <Ionicons name="add" size={24} color="#679B00" />
          <Text style={styles.addButtonText}>Добавить</Text>
        </TouchableOpacity>
      </View>

      {/* Модальное окно выбора года начала */}
      <Modal
        visible={showYearStartPicker}
        transparent
        animationType="none"
        onRequestClose={() => setShowYearStartPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearStartPicker(false)}
        >
          <Animated.View style={[styles.pickerContainer, { transform: [{ translateY: slideAnimYearStart }] }]}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Выберите год начала</Text>
              <TouchableOpacity onPress={() => setShowYearStartPicker(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerItem,
                    newEducationYearStart === year && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setNewEducationYearStart(year);
                    setShowYearStartPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      newEducationYearStart === year && styles.pickerItemTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Модальное окно выбора года окончания */}
      <Modal
        visible={showYearEndPicker}
        transparent
        animationType="none"
        onRequestClose={() => setShowYearEndPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearEndPicker(false)}
        >
          <Animated.View style={[styles.pickerContainer, { transform: [{ translateY: slideAnimYearEnd }] }]}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Выберите год окончания</Text>
              <TouchableOpacity onPress={() => setShowYearEndPicker(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerItem,
                    newEducationYearEnd === year && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setNewEducationYearEnd(year);
                    setShowYearEndPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      newEducationYearEnd === year && styles.pickerItemTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );

  const renderSkillsStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Какими навыками владеете?</Text>
      <Text style={styles.stepSubtitle}>
        Выберите навыки из списка или добавьте свои
      </Text>

      {/* Выбранные навыки */}
      {selectedSkills.length > 0 && (
        <View style={styles.selectedSkillsContainer}>
          <Text style={styles.selectedSkillsTitle}>Выбрано: {selectedSkills.length}</Text>
          <View style={styles.skillsGrid}>
            {selectedSkills.map((skill, index) => (
              <TouchableOpacity
                key={index}
                style={styles.selectedSkillChip}
                onPress={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}
              >
                <Text style={styles.selectedSkillText}>{skill}</Text>
                <Text style={styles.removeSkillIcon}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Популярные навыки */}
      <Text style={styles.sectionTitle}>Популярные навыки</Text>
      <View style={styles.skillsGrid}>
        {POPULAR_SKILLS.map((skill, index) => {
          const isSelected = selectedSkills.includes(skill);
          return (
            <TouchableOpacity
              key={index}
              style={[styles.skillChip, isSelected && styles.skillChipSelected]}
              onPress={() => toggleSkill(skill)}
            >
              <Text style={[styles.skillChipText, isSelected && styles.skillChipTextSelected]}>
                {skill}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Добавить свой навык */}
      <View style={styles.customSkillContainer}>
        <Text style={styles.inputLabel}>Добавить свой навык</Text>
        <View style={styles.customSkillRow}>
          <TextInput
            style={[styles.input, styles.customSkillInput]}
            value={customSkill}
            onChangeText={setCustomSkill}
            placeholder="Введите навык"
            placeholderTextColor={theme.colors.text.secondary}
            onSubmitEditing={handleAddCustomSkill}
          />
          <TouchableOpacity style={styles.addCustomSkillButton} onPress={handleAddCustomSkill}>
            <PlusIcon width={20} height={20} stroke={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderWorkExperienceStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Опыт работы</Text>
      <Text style={styles.stepSubtitle}>
        Добавьте места работы
      </Text>

      {/* Список добавленного опыта */}
      {workExperience.map((work, index) => (
        <View key={index} style={styles.addedItem}>
          <View style={styles.addedItemContent}>
            <Text style={styles.addedItemTitle}>{work.position}</Text>
            <Text style={styles.addedItemSubtitle}>{work.company}</Text>
            {(work.yearStart || work.yearEnd) && (
              <Text style={styles.addedItemYears}>
                {work.yearStart || '?'} - {work.yearEnd || 'н.в.'}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => handleRemoveWorkExperience(index)}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Форма добавления */}
      <View style={styles.addForm}>
        <Text style={styles.inputLabel}>Должность *</Text>
        <TextInput
          style={styles.input}
          value={newWorkPosition}
          onChangeText={setNewWorkPosition}
          placeholder="Например: Менеджер по продажам"
          placeholderTextColor={theme.colors.text.secondary}
        />

        <Text style={styles.inputLabel}>Компания *</Text>
        <TextInput
          style={styles.input}
          value={newWorkCompany}
          onChangeText={setNewWorkCompany}
          placeholder="Например: ООО 'Рога и копыта'"
          placeholderTextColor={theme.colors.text.secondary}
        />

        <Text style={styles.inputLabel}>Период работы</Text>
        <View style={styles.yearsRow}>
          {/* Начало */}
          <View style={styles.yearColumn}>
            <Text style={styles.yearLabel}>Начало</Text>
            <TouchableOpacity
              style={styles.yearPicker}
              onPress={() => setShowWorkYearStartPicker(true)}
            >
              <Text style={[styles.yearPickerText, !newWorkYearStart && styles.yearPickerPlaceholder]}>
                {newWorkYearStart || 'Выберите'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Окончание */}
          <View style={styles.yearColumn}>
            <Text style={styles.yearLabel}>Окончание</Text>
            <TouchableOpacity
              style={styles.yearPicker}
              onPress={() => setShowWorkYearEndPicker(true)}
            >
              <Text style={[styles.yearPickerText, !newWorkYearEnd && styles.yearPickerPlaceholder]}>
                {newWorkYearEnd || 'Выберите'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddWorkExperience}>
          <Ionicons name="add" size={24} color="#679B00" />
          <Text style={styles.addButtonText}>Добавить</Text>
        </TouchableOpacity>
      </View>

      {/* Модальное окно выбора года начала */}
      <Modal
        visible={showWorkYearStartPicker}
        transparent
        animationType="none"
        onRequestClose={() => setShowWorkYearStartPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWorkYearStartPicker(false)}
        >
          <Animated.View style={[styles.pickerContainer, { transform: [{ translateY: slideAnimWorkYearStart }] }]}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Выберите год начала</Text>
              <TouchableOpacity onPress={() => setShowWorkYearStartPicker(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerItem,
                    newWorkYearStart === year && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setNewWorkYearStart(year);
                    setShowWorkYearStartPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      newWorkYearStart === year && styles.pickerItemTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Модальное окно выбора года окончания */}
      <Modal
        visible={showWorkYearEndPicker}
        transparent
        animationType="none"
        onRequestClose={() => setShowWorkYearEndPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWorkYearEndPicker(false)}
        >
          <Animated.View style={[styles.pickerContainer, { transform: [{ translateY: slideAnimWorkYearEnd }] }]}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Выберите год окончания</Text>
              <TouchableOpacity onPress={() => setShowWorkYearEndPicker(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  newWorkYearEnd === 'По настоящее время' && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  setNewWorkYearEnd('По настоящее время');
                  setShowWorkYearEndPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    newWorkYearEnd === 'По настоящее время' && styles.pickerItemTextSelected,
                  ]}
                >
                  По настоящее время
                </Text>
              </TouchableOpacity>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerItem,
                    newWorkYearEnd === year && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setNewWorkYearEnd(year);
                    setShowWorkYearEndPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      newWorkYearEnd === year && styles.pickerItemTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );

  const renderAdditionalInfoStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Дополнительная информация</Text>
      <Text style={styles.stepSubtitle}>
        Укажите информацию для вашего резюме
      </Text>

      {/* Пол */}
      <View style={styles.genderSection}>
        <Text style={styles.inputLabel}>Пол</Text>
        <View style={styles.genderOptions}>
          <TouchableOpacity
            style={[styles.genderOption, gender === 'male' && styles.genderOptionSelected]}
            onPress={() => setGender('male')}
            activeOpacity={0.7}
          >
            <Text style={[styles.genderOptionText, gender === 'male' && styles.genderOptionTextSelected]}>
              Мужской
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderOption, gender === 'female' && styles.genderOptionSelected]}
            onPress={() => setGender('female')}
            activeOpacity={0.7}
          >
            <Text style={[styles.genderOptionText, gender === 'female' && styles.genderOptionTextSelected]}>
              Женский
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Желаемая зарплата */}
      <View style={styles.salarySection}>
        <Text style={styles.inputLabel}>Желаемая зарплата</Text>
        <View style={styles.salaryInputContainer}>
          <TextInput
            style={styles.salaryInput}
            value={desiredSalary}
            onChangeText={(text) => {
              // Форматируем введенное значение с пробелами
              const formatted = formatSalary(text);
              setDesiredSalary(formatted);
            }}
            placeholder="Например: 5 000 000"
            placeholderTextColor={theme.colors.text.secondary}
            keyboardType="numeric"
          />
          <Text style={styles.currencyLabel}>сум</Text>
        </View>
        <Text style={styles.hint}>Можете оставить пустым, если не хотите указывать</Text>
      </View>

      {/* Тип занятости */}
      <View style={styles.employmentSection}>
        <Text style={styles.inputLabel}>Тип занятости</Text>
        <View style={styles.optionsGrid}>
          {EMPLOYMENT_TYPES.map((type) => {
            const isSelected = selectedEmploymentTypes.includes(type.id);
            return (
              <TouchableOpacity
                key={type.id}
                style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                onPress={() => {
                  if (isSelected) {
                    setSelectedEmploymentTypes(selectedEmploymentTypes.filter(id => id !== type.id));
                  } else {
                    setSelectedEmploymentTypes([...selectedEmploymentTypes, type.id]);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* График работы */}
      <View style={styles.scheduleSection}>
        <Text style={styles.inputLabel}>График работы</Text>
        <View style={styles.optionsGrid}>
          {WORK_SCHEDULES.map((schedule) => {
            const isSelected = selectedWorkSchedules.includes(schedule.id);
            return (
              <TouchableOpacity
                key={schedule.id}
                style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                onPress={() => {
                  if (isSelected) {
                    setSelectedWorkSchedules(selectedWorkSchedules.filter(id => id !== schedule.id));
                  } else {
                    setSelectedWorkSchedules([...selectedWorkSchedules, schedule.id]);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}>
                  {schedule.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Готовность к переезду */}
      <View style={styles.relocateSection}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setWillingToRelocate(!willingToRelocate)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, willingToRelocate && styles.checkboxChecked]}>
            {willingToRelocate && (
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.checkboxTextContainer}>
            <Text style={styles.checkboxLabel}>Готов к переезду</Text>
            <Text style={styles.checkboxSubtitle}>
              Отметьте, если готовы рассматривать вакансии в других городах
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Готовность к командировкам */}
      <View style={styles.relocateSection}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setWillingToTravel(!willingToTravel)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, willingToTravel && styles.checkboxChecked]}>
            {willingToTravel && (
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.checkboxTextContainer}>
            <Text style={styles.checkboxLabel}>Готов к командировкам</Text>
            <Text style={styles.checkboxSubtitle}>
              Отметьте, если готовы ездить в командировки
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSpecializationsStep = () => {
    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Выберите специализации</Text>
        <Text style={styles.stepSubtitle}>
          Выберите специализации, которые вам интересны. Первая будет основной.
        </Text>
        <Text style={styles.selectedCount}>
          Выбрано: {selectedSpecializations.length}
        </Text>

        <View style={styles.specializationListContainer}>
          {/* Родительские категории с подкатегориями */}
          {PARENT_CATEGORIES.map((category) => {
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
                      {getTranslatedSpecializationName(category.id, tCategories)}
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
                    {subcategories.map((subcategory, index) => {
                      const isSelected = selectedSpecializations.includes(subcategory.id);
                      const isPrimary = selectedSpecializations[0] === subcategory.id;
                      const selectionOrder = selectedSpecializations.indexOf(subcategory.id) + 1;
                      
                      return (
                        <TouchableOpacity
                          key={subcategory.id}
                          style={[
                            styles.subcategoryItem,
                            isSelected && styles.subcategoryItemSelected,
                            isPrimary && styles.subcategoryItemPrimary,
                          ]}
                          onPress={() => toggleSpecialization(subcategory.id)}
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
                              isSelected && styles.subcategoryTextSelected,
                              isPrimary && styles.subcategoryTextPrimary,
                            ]}>
                              {getTranslatedSpecializationName(subcategory.id, tCategories)}
                            </Text>
                          </View>
                          {isSelected && (
                            <View style={styles.selectionBadge}>
                              <Text style={styles.selectionBadgeText}>
                                {isPrimary ? '★' : selectionOrder}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBack title="Информация о вакансии" backAction={handleBackPress} />
      
      <ProgressBar current={currentStep} total={totalSteps} />

      <View style={styles.content}>
        {renderStep()}
      </View>

      {/* Навигационные кнопки */}
      <View style={styles.navigation}>
        {canSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleContinue}
          >
            <Text style={styles.skipButtonText}>Пропустить</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.navigationSpacer} />

        <TouchableOpacity
          style={[
            styles.continueButton,
            currentStep === 5 && selectedSpecializations.length === 0 && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={currentStep === 5 && selectedSpecializations.length === 0}
        >
          <Text style={styles.continueButtonText}>
            {currentStep === totalSteps ? 'Завершить' : 'Далее'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  stepSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  addForm: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F6F7F9',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 8,
  },
  addedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addedItemContent: {
    flex: 1,
  },
  addedItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  addedItemSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  addedItemYears: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 16,
  },
  skillChip: {
    backgroundColor: '#F6F7F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  skillChipSelected: {
    backgroundColor: `${theme.colors.primary}15`,
    borderColor: theme.colors.primary,
  },
  skillChipText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  skillChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  selectedSkillsContainer: {
    marginBottom: 24,
  },
  selectedSkillsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  selectedSkillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedSkillText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginRight: 6,
  },
  removeSkillIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  customSkillContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  customSkillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customSkillInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  addCustomSkillButton: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    backgroundColor: theme.colors.background,
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F6F7F9',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  navigationSpacer: {
    flex: 1,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  yearsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  yearColumn: {
    flex: 1,
  },
  yearLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  yearPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F7F9',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  yearPickerText: {
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  yearPickerPlaceholder: {
    color: theme.colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F6F7F9',
  },
  pickerItemSelected: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  pickerItemText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  pickerItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  specializationListContainer: {
    marginTop: 8,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  parentCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  parentCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parentCategoryIcon: {
    marginRight: 12,
  },
  parentCategoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  chevronIcon: {
    marginLeft: 8,
  },
  subcategoriesContainer: {
    paddingLeft: 8,
    marginTop: 4,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F7F9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  subcategoryItemSelected: {
    backgroundColor: `${theme.colors.primary}10`,
    borderColor: theme.colors.primary,
  },
  subcategoryItemPrimary: {
    backgroundColor: `${theme.colors.primary}15`,
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  subcategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subcategoryIcon: {
    marginRight: 10,
  },
  subcategoryText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    flex: 1,
  },
  subcategoryTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  subcategoryTextPrimary: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  selectionBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  selectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Шаг 4: Дополнительная информация
  genderSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#F6F7F9',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: `${theme.colors.primary}15`,
    borderColor: theme.colors.primary,
  },
  genderOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  genderOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  salarySection: {
    marginBottom: 24,
  },
  salaryInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F7F9',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  salaryInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  currencyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginLeft: 8,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 8,
  },
  employmentSection: {
    marginBottom: 24,
  },
  scheduleSection: {
    marginBottom: 24,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionChip: {
    backgroundColor: '#F6F7F9',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  optionChipSelected: {
    backgroundColor: `${theme.colors.primary}15`,
    borderColor: theme.colors.primary,
  },
  optionChipText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  optionChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  relocateSection: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E5E5E7',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  checkboxSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
});

