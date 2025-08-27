import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import type { RootStackParamList } from '../../types';
import WorkerIcon from '../../../assets/engineer-worker.svg';
import UserIcon from '../../../assets/user-03.svg';
import { LogoOsonish } from '../../components/common';
import { useAuthTranslation, useErrorsTranslation, useCommonTranslation } from '../../hooks/useTranslation';

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

type UserRole = 'customer' | 'worker';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const t = useAuthTranslation();
  const tError = useErrorsTranslation();
  const tCommon = useCommonTranslation();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;

    try {
      // Проверяем наличие данных профиля
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const profileDataString = await AsyncStorage.default.getItem('@temp_profile_data');

      if (!profileDataString) {
        Alert.alert(tError('error'), t('profile_data_not_found'));
        return;
      }

      // Переходим к экрану выбора города
      navigation.navigate('CitySelection', { role: selectedRole });
    } catch (error) {
      console.error('Ошибка перехода к выбору города:', error);
      Alert.alert(tError('error'), t('general_error_try_again'));
    }
  };

  const RoleCard = ({
    role,
    title,
    description,
    isSelected,
    onPress
  }: {
    role: UserRole;
    title: string;
    description: string;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.roleCard,
        isSelected && styles.roleCardSelected
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        {role === 'worker' ? (
          <WorkerIcon width={32} height={32} fill={isSelected ? theme.colors.primary : '#666666'} />
        ) : (
          <UserIcon width={32} height={32} stroke={isSelected ? theme.colors.primary : '#666666'} />
        )}
      </View>
      <Text style={[
        styles.roleTitle,
        isSelected && styles.roleTitleSelected
      ]}>
        {title}
      </Text>
      <Text style={[
        styles.roleDescription,
        isSelected && styles.roleDescriptionSelected
      ]}>
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
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <LogoOsonish
            width={isSmallScreen ? 120 : 160}
            height={isSmallScreen ? 22 : 29}
          />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{t('role_selection_title')}</Text>
          <Text style={styles.subtitle}>
            {t('role_selection_subtitle')}
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          <RoleCard
            role="customer"
            title={t('customer_role_title')}
            description={t('customer_role_description')}
            isSelected={selectedRole === 'customer'}
            onPress={() => handleRoleSelect('customer')}
          />

          <RoleCard
            role="worker"
            title={t('worker_role_title')}
            description={t('worker_role_description')}
            isSelected={selectedRole === 'worker'}
            onPress={() => handleRoleSelect('worker')}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedRole && styles.continueButtonTextDisabled
          ]}>
            {tCommon('continue')}
          </Text>
        </TouchableOpacity>


      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl + getAndroidStatusBarHeight(),
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.xl : theme.spacing.xxl,
  },
  title: {
    fontSize: isSmallScreen ? theme.fonts.sizes.xl : theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
  },
  subtitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 22,
  },
  rolesContainer: {
    gap: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    marginBottom: isSmallScreen ? theme.spacing.xl : theme.spacing.xxl,
  },
  roleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    position: 'relative',
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}08`,
  },
  iconContainer: {
    width: isSmallScreen ? 50 : 60,
    height: isSmallScreen ? 50 : 60,
    backgroundColor: theme.colors.background,
    borderRadius: isSmallScreen ? 25 : 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
  },
  icon: {
    fontSize: 28,
  },
  roleTitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.md : theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  roleTitleSelected: {
    color: theme.colors.primary,
  },
  roleDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 20,
  },
  roleDescriptionSelected: {
    color: theme.colors.text.primary,
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
    fontWeight: theme.fonts.weights.bold,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  continueButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },

}); 