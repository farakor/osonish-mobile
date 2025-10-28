import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants';
import { noElevationStyles, borderButtonStyles } from '../../utils/noShadowStyles';
import type { RootStackParamList } from '../../types';
import { HeaderWithBack, AnimatedIcon } from '../../components/common';

// Импортируем анимированные иконки
const WorkerAnimation = require('../../../assets/worker.json');
const LaborSafetyAnimation = require('../../../assets/labor-safety.json');

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

type WorkerType = 'daily_worker' | 'professional';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const WorkerTypeSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<WorkerType | null>(null);

  const handleTypeSelect = (type: WorkerType) => {
    setSelectedType(type);
  };

  const handleContinue = async () => {
    if (!selectedType) return;

    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const profileDataString = await AsyncStorage.default.getItem('@temp_profile_data');

      if (!profileDataString) {
        Alert.alert(t('common.error'), t('auth.profile_data_not_found'));
        return;
      }

      // Сохраняем выбранный тип исполнителя
      const profileData = JSON.parse(profileDataString);
      profileData.workerType = selectedType;

      // Если выбран daily_worker, автоматически добавляем специализацию "one_day_job"
      if (selectedType === 'daily_worker') {
        profileData.specializations = [
          {
            id: 'one_day_job',
            name: 'Работа на 1 день',
            isPrimary: true
          }
        ];
      }

      await AsyncStorage.default.setItem('@temp_profile_data', JSON.stringify(profileData));

      if (selectedType === 'professional') {
        // Переходим к выбору специализаций
        navigation.navigate('SpecializationSelection');
      } else {
        // Переходим к выбору города (как обычно)
        navigation.navigate('CitySelection', { role: 'worker', workerType: 'daily_worker' });
      }
    } catch (error) {
      console.error('Ошибка:', error);
      Alert.alert(t('common.error'), t('auth.general_error_try_again'));
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const TypeCard = ({
    type,
    title,
    description,
    animationSource,
    isSelected,
    onPress,
  }: {
    type: WorkerType;
    title: string;
    description: string;
    animationSource: any;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.typeCard,
        isSelected && styles.typeCardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <AnimatedIcon
          source={animationSource}
          width={isSmallScreen ? 45 : 60}
          height={isSmallScreen ? 45 : 60}
          loop={true}
          autoPlay={false}
          speed={0.8}
          isSelected={isSelected}
        />
      </View>
      <Text style={[styles.typeTitle, isSelected && styles.typeTitleSelected]}>
        {title}
      </Text>
      <Text style={[styles.typeDescription, isSelected && styles.typeDescriptionSelected]}>
        {description}
      </Text>
      {isSelected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBack title={t('auth.worker_type_selection_title')} backAction={handleBackPress} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            {t('auth.worker_type_selection_subtitle')}
          </Text>
        </View>

        <View style={styles.typesContainer}>
          <TypeCard
            type="daily_worker"
            title={t('auth.daily_worker_title')}
            description={t('auth.daily_worker_description')}
            animationSource={WorkerAnimation}
            isSelected={selectedType === 'daily_worker'}
            onPress={() => handleTypeSelect('daily_worker')}
          />

          <TypeCard
            type="professional"
            title={t('auth.professional_master_title')}
            description={t('auth.professional_master_description')}
            animationSource={LaborSafetyAnimation}
            isSelected={selectedType === 'professional'}
            onPress={() => handleTypeSelect('professional')}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedType && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedType}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.continueButtonText,
              !selectedType && styles.continueButtonTextDisabled,
            ]}
          >
            {t('common.continue')}
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
  },
  subtitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 22,
  },
  typesContainer: {
    gap: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    marginBottom: isSmallScreen ? theme.spacing.xl : theme.spacing.xxl,
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
    alignItems: 'center',
    position: 'relative',
    ...borderButtonStyles,
  },
  typeCardSelected: {
    backgroundColor: `${theme.colors.primary}08`,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...noElevationStyles,
  },
  iconContainer: {
    width: isSmallScreen ? 80 : 100,
    height: isSmallScreen ? 80 : 100,
    backgroundColor: 'transparent',
    borderRadius: isSmallScreen ? 40 : 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.xs : theme.spacing.sm,
  },
  typeTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  typeTitleSelected: {
    color: theme.colors.primary,
  },
  typeDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 20,
  },
  typeDescriptionSelected: {
    color: '#1A1A1A',
  },
  checkmark: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 24,
    height: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: theme.fonts.weights.bold as any,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    minHeight: isSmallScreen ? 44 : 48,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold as any,
  },
  continueButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },
});

