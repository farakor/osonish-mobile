import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import type { RootStackParamList } from '../../types';
import { HeaderWithBack } from '../../components/common';
import { useAuthTranslation, useErrorsTranslation, useCommonTranslation } from '../../hooks/useTranslation';

const { height: screenHeight } = Dimensions.get('window');

// Определяем маленький экран для Android
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

type UserType = 'individual' | 'company';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const UserTypeSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [companyName, setCompanyName] = useState('');
  const t = useAuthTranslation();
  const tError = useErrorsTranslation();
  const tCommon = useCommonTranslation();

  const handleTypeSelect = (type: UserType) => {
    setSelectedType(type);
    if (type === 'individual') {
      setCompanyName(''); // Очищаем название компании для физ. лиц
    }
  };

  const handleContinue = async () => {
    if (!selectedType) return;

    // Проверка обязательного поля для юр. лица
    if (selectedType === 'company' && !companyName.trim()) {
      Alert.alert(tError('error'), t('company_name_required'));
      return;
    }

    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const profileDataString = await AsyncStorage.default.getItem('@temp_profile_data');

      if (!profileDataString) {
        Alert.alert(tError('error'), t('profile_data_not_found'));
        return;
      }

      // Сохраняем тип пользователя и название компании
      const profileData = JSON.parse(profileDataString);
      profileData.userType = selectedType;
      profileData.companyName = selectedType === 'company' ? companyName.trim() : null;
      await AsyncStorage.default.setItem('@temp_profile_data', JSON.stringify(profileData));

      // Переходим к выбору города
      navigation.navigate('CitySelection', { role: 'customer' });
    } catch (error) {
      console.error('Ошибка сохранения типа пользователя:', error);
      Alert.alert(tError('error'), t('general_error_try_again'));
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const isFormValid = selectedType === 'individual' || (selectedType === 'company' && companyName.trim().length > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderWithBack title={t('user_type_selection_title')} backAction={handleBackPress} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.subtitle}>
                {t('user_type_selection_subtitle')}
              </Text>
            </View>

            <View style={styles.typesContainer}>
              <TouchableOpacity
                style={[
                  styles.typeCard,
                  selectedType === 'individual' && styles.typeCardSelected,
                ]}
                onPress={() => handleTypeSelect('individual')}
                activeOpacity={0.7}
              >
                <View style={styles.typeContent}>
                  <View style={styles.typeIcon}>
                    <Text style={styles.typeEmoji}>👤</Text>
                  </View>
                  <View style={styles.typeTextContainer}>
                    <Text style={[
                      styles.typeTitle,
                      selectedType === 'individual' && styles.typeTitleSelected
                    ]}>
                      {t('individual_type_title')}
                    </Text>
                    <Text style={[
                      styles.typeDescription,
                      selectedType === 'individual' && styles.typeDescriptionSelected
                    ]}>
                      {t('individual_type_description')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeCard,
                  selectedType === 'company' && styles.typeCardSelected,
                ]}
                onPress={() => handleTypeSelect('company')}
                activeOpacity={0.7}
              >
                <View style={styles.typeContent}>
                  <View style={styles.typeIcon}>
                    <Text style={styles.typeEmoji}>🏢</Text>
                  </View>
                  <View style={styles.typeTextContainer}>
                    <Text style={[
                      styles.typeTitle,
                      selectedType === 'company' && styles.typeTitleSelected
                    ]}>
                      {t('company_type_title')}
                    </Text>
                    <Text style={[
                      styles.typeDescription,
                      selectedType === 'company' && styles.typeDescriptionSelected
                    ]}>
                      {t('company_type_description')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Поле ввода названия компании */}
            {selectedType === 'company' && (
              <View style={styles.companyInputContainer}>
                <Text style={styles.inputLabel}>{t('company_name_label')}</Text>
                <TextInput
                  style={styles.input}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder={t('company_name_placeholder')}
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                />
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.continueButton,
                !isFormValid && styles.continueButtonDisabled
              ]}
              onPress={handleContinue}
              disabled={!isFormValid}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.continueButtonText,
                !isFormValid && styles.continueButtonTextDisabled
              ]}>
                {tCommon('continue')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: isSmallScreen ? 16 : 24,
  },
  header: {
    marginBottom: isSmallScreen ? 20 : 32,
  },
  subtitle: {
    fontSize: isSmallScreen ? 15 : 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  typesContainer: {
    gap: 16,
    marginBottom: 24,
  },
  typeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    ...noElevationStyles,
  },
  typeCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  typeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  typeEmoji: {
    fontSize: 32,
  },
  typeTextContainer: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  typeTitleSelected: {
    color: theme.colors.primary,
  },
  typeDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  typeDescriptionSelected: {
    color: theme.colors.primary,
  },
  companyInputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
});

