import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { theme } from '../../constants';
import { AnimatedIcon } from '../../components/common';
import type { RootStackParamList } from '../../types';
import { useAuthTranslation, useErrorsTranslation } from '../../hooks/useTranslation';

// Импортируем анимацию Welcome
const WelcomeAnimation = require('../../../assets/Welcome.json');

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type LoadingRouteProp = RouteProp<RootStackParamList, 'Loading'>;

export const LoadingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LoadingRouteProp>();
  const { profileData, role, selectedCity } = route.params;
  const t = useAuthTranslation();
  const tError = useErrorsTranslation();

  useEffect(() => {
    const completeRegistration = async () => {
      try {
        // Минимальное время показа анимации (2 секунды)
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));

        // Завершаем регистрацию
        const { authService } = await import('../../services/authService');
        const registrationPromise = authService.completeRegistration({
          ...profileData,
          role: role,
          city: selectedCity.id, // Сохраняем ID вместо названия для универсальности
        });

        // Ждем завершения обеих операций
        const [, result] = await Promise.all([minLoadingTime, registrationPromise]);

        if (result.success && result.user) {
          // Сохраняем выбранный город (ID вместо названия для универсальности)
          const AsyncStorage = await import('@react-native-async-storage/async-storage');
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
          // В случае ошибки возвращаемся на экран выбора города
          navigation.goBack();
          Alert.alert(tError('error'), result.error || t('registration_failed'));
        }
      } catch (error) {
        console.error('Ошибка завершения регистрации:', error);
        // В случае ошибки возвращаемся на экран выбора города
        navigation.goBack();
        Alert.alert(tError('error'), t('registration_error'));
      }
    };

    completeRegistration();
  }, [navigation, profileData, role, selectedCity]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <View style={styles.animationContainer}>
        <AnimatedIcon
          source={WelcomeAnimation}
          width={screenWidth * 0.8} // 80% ширины экрана
          height={screenWidth * 0.8 * (123 / 428)} // Пропорциональная высота
          loop={true}
          autoPlay={true}
          speed={1}
          isSelected={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});
