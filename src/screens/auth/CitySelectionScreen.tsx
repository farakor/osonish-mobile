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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import type { RootStackParamList, City } from '../../types';
import { LogoOsonish, AnimatedIcon } from '../../components/common';
import { useAuthTranslation, useErrorsTranslation, useCommonTranslation } from '../../hooks/useTranslation';

// Импортируем анимированную иконку пина
const PinAnimation = require('../../../assets/pin.json');

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

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CitySelectionRouteProp = RouteProp<RootStackParamList, 'CitySelection'>;

export const CitySelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CitySelectionRouteProp>();
  const { role } = route.params;
  const t = useAuthTranslation();
  const tError = useErrorsTranslation();
  const tCommon = useCommonTranslation();

  // Доступные города (пока только Самарканд)
  const AVAILABLE_CITIES: City[] = [
    {
      id: 'samarkand',
      name: t('samarkand_city'),
      isAvailable: true,
    },
  ];

  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const handleCitySelect = (city: City) => {
    if (city.isAvailable) {
      setSelectedCity(city);
    }
  };

  const handleContinue = async () => {
    if (!selectedCity) return;

    try {
      // Получаем данные профиля из временного хранилища
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const profileDataString = await AsyncStorage.default.getItem('@temp_profile_data');

      if (!profileDataString) {
        Alert.alert(tError('error'), t('profile_data_not_found'));
        return;
      }

      const profileData = JSON.parse(profileDataString);

      // Завершаем регистрацию с выбранным городом
      const { authService } = await import('../../services/authService');
      const result = await authService.completeRegistration({
        ...profileData,
        role: role,
        city: selectedCity.name,
      });

      if (result.success && result.user) {
        // Сохраняем выбранный город
        await AsyncStorage.default.setItem('@selected_city', JSON.stringify(selectedCity));

        // Очищаем временные данные
        await AsyncStorage.default.removeItem('@temp_profile_data');

        // Переходим в приложение в зависимости от роли
        if (role === 'customer') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'CustomerTabs' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'WorkerTabs' }],
          });
        }
      } else {
        Alert.alert(tError('error'), result.error || t('registration_failed'));
      }
    } catch (error) {
      console.error('Ошибка завершения регистрации:', error);
      Alert.alert(tError('error'), t('registration_error'));
    }
  };

  const CityCard = ({
    city,
    isSelected,
    onPress
  }: {
    city: City;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.cityCard,
        isSelected && styles.cityCardSelected,
        !city.isAvailable && styles.cityCardDisabled
      ]}
      onPress={onPress}
      activeOpacity={city.isAvailable ? 0.8 : 1}
      disabled={!city.isAvailable}
    >
      <View style={styles.iconContainer}>
        <AnimatedIcon
          source={PinAnimation}
          width={isSmallScreen ? 32 : 40}
          height={isSmallScreen ? 32 : 40}
          loop={true}
          autoPlay={false}
          speed={0.8}
          isSelected={isSelected && city.isAvailable}
        />
      </View>
      <View style={styles.cityInfo}>
        <Text style={[
          styles.cityName,
          isSelected && styles.cityNameSelected,
          !city.isAvailable && styles.cityNameDisabled
        ]}>
          {city.name}
        </Text>
        {!city.isAvailable && (
          <Text style={styles.unavailableText}>
            {t('coming_soon')}
          </Text>
        )}
      </View>
      {isSelected && city.isAvailable && (
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
          <Text style={styles.title}>{t('city_selection_title')}</Text>
          <Text style={styles.subtitle}>
            {t('city_selection_subtitle')}
          </Text>
        </View>

        <View style={styles.noticeContainer}>
          <Text style={styles.noticeText}>
            {t('city_notice')}
          </Text>
        </View>

        <View style={styles.citiesContainer}>
          {AVAILABLE_CITIES.map((city) => (
            <CityCard
              key={city.id}
              city={city}
              isSelected={selectedCity?.id === city.id}
              onPress={() => handleCitySelect(city)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedCity && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedCity}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedCity && styles.continueButtonTextDisabled
          ]}>
            {tCommon('continue')}
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
    paddingTop: theme.spacing.xl + getAndroidStatusBarHeight(),
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
  noticeContainer: {
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
  },
  noticeText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  citiesContainer: {
    gap: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    marginBottom: isSmallScreen ? theme.spacing.xl : theme.spacing.xxl,
  },
  cityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0, },
  cityCardSelected: {
    backgroundColor: `${theme.colors.primary}08`,
    borderWidth: 0, borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0, },
  cityCardDisabled: {
    backgroundColor: '#F5F5F5',
    shadowOpacity: 0, elevation: 0, },
  iconContainer: {
    width: isSmallScreen ? 48 : 56,
    height: isSmallScreen ? 48 : 56,
    backgroundColor: 'transparent',
    borderRadius: isSmallScreen ? 24 : 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cityNameSelected: {
    color: '#1A1A1A',
  },
  cityNameDisabled: {
    color: theme.colors.text.disabled,
  },
  unavailableText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: theme.spacing.xs,
  },
  checkmark: {
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
