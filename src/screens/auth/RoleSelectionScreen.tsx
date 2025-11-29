import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity, Dimensions,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import { noElevationStyles, borderButtonStyles } from '../../utils/noShadowStyles';
import type { RootStackParamList } from '../../types';
import { LogoOsonish, AnimatedIcon, HeaderWithBack } from '../../components/common';

// Импортируем анимированные иконки
const DeliveryManAnimation = require('../../../assets/worker-2.json');
const OfficeWorkerAnimation = require('../../../assets/office-worker.json');
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

      // Сохраняем выбранную роль в данные профиля
      const profileData = JSON.parse(profileDataString);
      profileData.role = selectedRole;
      await AsyncStorage.default.setItem('@temp_profile_data', JSON.stringify(profileData));

      // Если выбран исполнитель, переходим к выбору типа исполнителя
      if (selectedRole === 'worker') {
        navigation.navigate('WorkerTypeSelection');
      } else {
        // Для заказчика переходим к выбору типа пользователя (физ./юр. лицо)
        navigation.navigate('UserTypeSelection');
      }
    } catch (error) {
      console.error('Ошибка перехода к следующему шагу:', error);
      Alert.alert(tError('error'), t('general_error_try_again'));
    }
  };

  const handleBackPress = async () => {
    try {
      // Получаем данные профиля для извлечения номера телефона
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const profileDataString = await AsyncStorage.default.getItem('@temp_profile_data');

      let phone = '';
      if (profileDataString) {
        const profileData = JSON.parse(profileDataString);
        phone = profileData.phone || '';
      }

      // Возвращаемся к экрану заполнения профиля
      navigation.navigate('ProfileInfo', { phone });
    } catch (error) {
      console.error('Ошибка при возврате к профилю:', error);
      // В случае ошибки просто переходим без номера телефона
      navigation.navigate('ProfileInfo', { phone: '' });
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
        <AnimatedIcon
          source={role === 'worker' ? DeliveryManAnimation : OfficeWorkerAnimation}
          width={isSmallScreen ? 45 : 60}
          height={isSmallScreen ? 45 : 60}
          loop={true}
          autoPlay={false}
          speed={0.8}
          isSelected={isSelected}
        />
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
      <HeaderWithBack title={t('role_selection_title')} backAction={handleBackPress} />
      <View style={styles.content}>

        <View style={styles.header}>
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
    paddingTop: theme.spacing.md,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
    alignItems: 'center',
    position: 'relative',
    ...borderButtonStyles,
  },
  roleCardSelected: {
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
  icon: {
    fontSize: 28,
  },
  roleTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  roleTitleSelected: {
    color: theme.colors.primary,
  },
  roleDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 20,
  },
  roleDescriptionSelected: {
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
    fontWeight: theme.fonts.weights.bold,
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
    fontWeight: theme.fonts.weights.semiBold,
  },
  continueButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },

}); 