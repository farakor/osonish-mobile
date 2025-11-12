import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import { noElevationStyles, borderButtonStyles } from '../../utils/noShadowStyles';
import type { RootStackParamList } from '../../types';
import { HeaderWithBack } from '../../components/common';
import { useAuthTranslation, useCommonTranslation, useErrorsTranslation } from '../../hooks/useTranslation';

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const JobSeekerInfoScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const t = useAuthTranslation();
  const tCommon = useCommonTranslation();
  const tError = useErrorsTranslation();

  const [desiredSalary, setDesiredSalary] = useState('');
  const [workExperience, setWorkExperience] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [skills, setSkills] = useState('');

  // Состояния фокуса
  const [salaryFocused, setSalaryFocused] = useState(false);
  const [experienceFocused, setExperienceFocused] = useState(false);
  const [resumeFocused, setResumeFocused] = useState(false);
  const [skillsFocused, setSkillsFocused] = useState(false);

  // Рефы для полей
  const experienceInputRef = useRef<TextInput>(null);
  const resumeInputRef = useRef<TextInput>(null);
  const skillsInputRef = useRef<TextInput>(null);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const validateAndContinue = async () => {
    // Валидация
    if (!desiredSalary.trim()) {
      Alert.alert(tError('error'), t('desired_salary_label') + ' ' + tCommon('required_field'));
      return;
    }

    if (!workExperience.trim()) {
      Alert.alert(tError('error'), t('work_experience_label') + ' ' + tCommon('required_field'));
      return;
    }

    if (!resumeText.trim() || resumeText.trim().length < 50) {
      Alert.alert(tError('error'), 'Резюме должно содержать минимум 50 символов');
      return;
    }

    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const profileDataString = await AsyncStorage.default.getItem('@temp_profile_data');

      if (!profileDataString) {
        Alert.alert(tError('error'), t('profile_data_not_found_error'));
        return;
      }

      const profileData = JSON.parse(profileDataString);

      // Добавляем информацию о вакансии
      profileData.desiredSalary = parseInt(desiredSalary.replace(/\D/g, ''), 10);
      profileData.workExperience = workExperience.trim();
      profileData.resumeText = resumeText.trim();
      profileData.skills = skills.trim().split(',').map((skill) => skill.trim()).filter(Boolean);

      await AsyncStorage.default.setItem('@temp_profile_data', JSON.stringify(profileData));

      // Переходим к выбору города
      navigation.navigate('CitySelection', { role: 'worker', workerType: 'job_seeker' });
    } catch (error) {
      console.error('Ошибка сохранения данных:', error);
      Alert.alert(tError('error'), t('general_error_try_again'));
    }
  };

  const formatSalary = (text: string) => {
    // Удаляем все нецифровые символы
    const numbers = text.replace(/\D/g, '');
    // Форматируем с пробелами
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleSalaryChange = (text: string) => {
    setDesiredSalary(formatSalary(text));
  };

  const getInputStyle = (isFocused: boolean) => [
    styles.input,
    isFocused && styles.inputFocused,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBack title={t('job_seeker_info_title')} backAction={handleBackPress} />
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.subtitle}>{t('job_seeker_info_subtitle')}</Text>
          </View>

          {/* Желаемая зарплата */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('desired_salary_label')}</Text>
            <TextInput
              style={getInputStyle(salaryFocused)}
              value={desiredSalary}
              onChangeText={handleSalaryChange}
              placeholder={t('desired_salary_placeholder')}
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="numeric"
              returnKeyType="next"
              onFocus={() => setSalaryFocused(true)}
              onBlur={() => setSalaryFocused(false)}
              onSubmitEditing={() => experienceInputRef.current?.focus()}
            />
          </View>

          {/* Опыт работы */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('work_experience_label')}</Text>
            <TextInput
              ref={experienceInputRef}
              style={getInputStyle(experienceFocused)}
              value={workExperience}
              onChangeText={setWorkExperience}
              placeholder={t('work_experience_placeholder')}
              placeholderTextColor={theme.colors.text.secondary}
              returnKeyType="next"
              onFocus={() => setExperienceFocused(true)}
              onBlur={() => setExperienceFocused(false)}
              onSubmitEditing={() => resumeInputRef.current?.focus()}
            />
          </View>

          {/* Резюме */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('resume_text_label')}</Text>
            <TextInput
              ref={resumeInputRef}
              style={[getInputStyle(resumeFocused), styles.textArea]}
              value={resumeText}
              onChangeText={setResumeText}
              placeholder={t('resume_text_placeholder')}
              placeholderTextColor={theme.colors.text.secondary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              returnKeyType="next"
              onFocus={() => setResumeFocused(true)}
              onBlur={() => setResumeFocused(false)}
              onSubmitEditing={() => skillsInputRef.current?.focus()}
            />
            <Text style={styles.hint}>Минимум 50 символов</Text>
          </View>

          {/* Навыки */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('skills_label')}</Text>
            <TextInput
              ref={skillsInputRef}
              style={[getInputStyle(skillsFocused), styles.textArea]}
              value={skills}
              onChangeText={setSkills}
              placeholder={t('skills_placeholder')}
              placeholderTextColor={theme.colors.text.secondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="done"
              onFocus={() => setSkillsFocused(true)}
              onBlur={() => setSkillsFocused(false)}
            />
            <Text style={styles.hint}>Перечислите через запятую</Text>
          </View>
        </ScrollView>

        {/* Кнопка продолжить */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={validateAndContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>{tCommon('continue')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  subtitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 22,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: '#F6F7F9',
    borderWidth: 2,
    borderColor: '#F6F7F9',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    fontSize: isSmallScreen ? theme.fonts.sizes.md : theme.fonts.sizes.lg,
    color: theme.colors.text.primary,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F8FF',
  },
  textArea: {
    minHeight: 120,
    paddingTop: theme.spacing.md,
  },
  hint: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    alignItems: 'center',
    minHeight: isSmallScreen ? 44 : 48,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
});

