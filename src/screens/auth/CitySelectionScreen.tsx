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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '../../constants';
import { noElevationStyles, borderButtonStyles } from '../../utils/noShadowStyles';
import type { RootStackParamList, City } from '../../types';
import { LogoOsonish, AnimatedIcon, HeaderWithBack } from '../../components/common';
import { useAuthTranslation, useErrorsTranslation, useCommonTranslation } from '../../hooks/useTranslation';
import { UZBEKISTAN_CITIES, getCityName } from '../../utils/cityUtils';

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

  // Доступные города Узбекистана
  const AVAILABLE_CITIES: City[] = UZBEKISTAN_CITIES.map(cityId => ({
    id: cityId,
    name: getCityName(cityId),
    isAvailable: true, // Все города теперь доступны
  }));

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

      // Переходим на экран загрузки с данными
      navigation.navigate('Loading', {
        profileData,
        role,
        selectedCity,
      });
    } catch (error) {
      console.error('Ошибка получения данных профиля:', error);
      Alert.alert(tError('error'), t('general_error_try_again'));
    }
  };

  const handleBackPress = () => {
    // Возвращаемся к экрану выбора роли
    navigation.navigate('RoleSelection');
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
          width={isSmallScreen ? 24 : 28}
          height={isSmallScreen ? 24 : 28}
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
      {city.isAvailable && (
        <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
          {isSelected && (
            <View style={styles.radioButtonInner} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBack title={t('city_selection_title')} backAction={handleBackPress} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            {t('city_selection_subtitle')}
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
      </ScrollView>

      <View style={styles.buttonContainer}>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  subtitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 22,
  },
  citiesContainer: {
    gap: isSmallScreen ? 8 : 10,
  },
  cityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: isSmallScreen ? 12 : 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#DAE3EC',
    ...noElevationStyles,
  },
  cityCardSelected: {
    backgroundColor: `${theme.colors.primary}08`,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...noElevationStyles,
  },
  cityCardDisabled: {
    backgroundColor: '#F5F5F5',
    ...noElevationStyles,
  },
  iconContainer: {
    width: isSmallScreen ? 36 : 40,
    height: isSmallScreen ? 36 : 40,
    backgroundColor: 'transparent',
    borderRadius: isSmallScreen ? 18 : 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isSmallScreen ? 8 : 10,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: isSmallScreen ? 15 : 16,
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
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E5E7',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    alignItems: 'center',
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
