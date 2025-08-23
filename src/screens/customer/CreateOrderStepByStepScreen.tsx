import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../constants';
import CalendarDateIcon from '../../../assets/calendar-date.svg';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import ImageIcon from '../../../assets/image-03.svg';

import { orderService } from '../../services/orderService';
import { mediaService } from '../../services/mediaService';
import { locationService, LocationCoords } from '../../services/locationService';
import { CreateOrderRequest } from '../../types';
import { useNavigation } from '@react-navigation/native';
import {
  AnimatedProgressBar,
  AnimatedStepContainer,
  AnimatedField,
  AnimatedCategoryGrid,
  AnimatedNavigationButton,
  AnimatedInteractiveContainer,
  AnimatedSummaryGrid,
} from '../../components/common/AnimatedComponents';
import { HeaderWithBack } from '../../components/common';
import { useCustomerTranslation, useErrorsTranslation, useCommonTranslation } from '../../hooks/useTranslation';
import { useTranslatedCategories } from '../../utils/categoryUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Определяем маленький экран для Android (высота меньше 1080px)
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

// Логирование для отладки
console.log('[CreateOrderStepByStep] Screen dimensions:', {
  screenWidth,
  screenHeight,
  ratio: screenHeight / screenWidth,
  isSmallScreen
});

// Упрощенный компонент для превью видео с безопасной обработкой ошибок
const VideoPreview: React.FC<{ uri: string }> = ({ uri }) => {
  const [hasError, setHasError] = useState(false);

  console.log('[VideoPreview] Рендеринг видео:', uri);

  // Если есть ошибка, показываем placeholder
  if (hasError) {
    console.log('[VideoPreview] Показываем placeholder из-за ошибки');
    return (
      <View style={[styles.mediaImage, styles.videoErrorPlaceholder]}>
        <Text style={styles.videoErrorText}>📹</Text>
      </View>
    );
  }

  try {
    console.log('[VideoPreview] Создаем video player...');
    const player = useVideoPlayer(uri);

    console.log('[VideoPreview] Player создан, рендерим VideoView...');
    return (
      <VideoView
        player={player}
        style={styles.mediaImage}
        contentFit="cover"
        nativeControls={false}
      />
    );
  } catch (error) {
    console.error('[VideoPreview] Критическая ошибка при создании player:', error);
    // Немедленно показываем placeholder
    return (
      <View style={[styles.mediaImage, styles.videoErrorPlaceholder]}>
        <Text style={styles.videoErrorText}>📹</Text>
      </View>
    );
  }
};

// Компонент для отображения номера шага с анимацией
const StepCounter: React.FC<{ currentStep: number; totalSteps: number; t: any }> = ({ currentStep, totalSteps, t }) => {
  return (
    <View style={styles.stepCounterContainer}>
      <Text style={styles.progressText}>{t('step_counter', { current: currentStep, total: totalSteps })}</Text>
    </View>
  );
};



export const CreateOrderStepByStepScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [workersCount, setWorkersCount] = useState('1');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<Array<{ uri: string; type: 'image' | 'video'; name: string; size: number }>>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<LocationCoords | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [animationResetKey, setAnimationResetKey] = useState(0);
  const [locationUpdateKey, setLocationUpdateKey] = useState(0);
  const t = useCustomerTranslation();
  const tError = useErrorsTranslation();
  const tCommon = useCommonTranslation();
  const categories = useTranslatedCategories();

  // Ref для поля местоположения
  const locationInputRef = useRef<any>(null);

  // Состояния фокуса для полей ввода
  const [titleFocused, setTitleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [budgetFocused, setBudgetFocused] = useState(false);

  const navigation = useNavigation();

  const totalSteps = 9;

  // Отладка изменений location
  useEffect(() => {
    console.log('[CreateOrderStepByStep] 📍 location изменилось:', location);
  }, [location]);

  // Функция для получения стиля поля ввода с учетом фокуса
  const getInputStyle = (isFocused: boolean, isTextArea: boolean = false) => [
    styles.stepInput,
    isTextArea && styles.textArea,
    isFocused && styles.stepInputFocused,
  ];



  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const showDatePickerHandler = () => {
    setShowDatePicker(true);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return t('select_date');
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  function formatBudgetInput(value: string) {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  const pickMedia = async () => {
    setMediaError(null);
    if (mediaFiles.length >= 5) {
      setMediaError(t('max_files_error'));
      return;
    }
    Alert.alert(
      t('add_photo_video'),
      t('choose_source'),
      [
        {
          text: t('take_photo_video'),
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(t('no_camera_access'));
              return;
            }
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images', 'videos'],
              quality: 1.0, // Максимальное качество, оптимизация будет в MediaService
            });
            handleMediaResult(result);
          },
        },
        {
          text: t('choose_from_gallery'),
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(t('no_media_access'));
              return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images', 'videos'],
              allowsMultipleSelection: true,
              selectionLimit: 5 - mediaFiles.length,
              quality: 1.0, // Максимальное качество, оптимизация будет в MediaService
            });
            handleMediaResult(result);
          },
        },
        { text: tCommon('cancel'), style: 'cancel' },
      ]
    );
  };

  const handleMediaResult = (result: any) => {
    if (!result.canceled) {
      let validFiles = result.assets.filter((asset: any) => {
        if (!['image', 'video'].includes(asset.type ?? '')) {
          setMediaError('Можно загружать только фото и видео');
          return false;
        }
        return true;
      });

      let newFiles = validFiles.map((asset: any) => ({
        uri: asset.uri,
        type: (asset.type ?? 'file') as 'image' | 'video',
        name: asset.fileName || asset.uri.split('/').pop() || 'file',
        size: asset.fileSize || 0,
      }));

      const currentTotalSize = mediaFiles.reduce((sum: number, file: { uri: string; type: 'image' | 'video'; name: string; size: number }) => sum + file.size, 0);
      const newTotalSize = newFiles.reduce((sum: number, file: { uri: string; type: 'image' | 'video'; name: string; size: number }) => sum + file.size, 0);
      const maxTotalSize = 50 * 1024 * 1024; // 50 МБ

      if (currentTotalSize + newTotalSize > maxTotalSize) {
        const remainingSize = Math.max(0, maxTotalSize - currentTotalSize);
        const remainingSizeMB = (remainingSize / (1024 * 1024)).toFixed(1);
        setMediaError(`Превышен лимит в 50 МБ. Доступно: ${remainingSizeMB} МБ`);
        return;
      }

      const updatedFiles = [...mediaFiles, ...newFiles];
      if (updatedFiles.length > 5) {
        setMediaError('Максимум 5 файлов');
        return;
      }

      setMediaFiles(updatedFiles);
      setMediaError('');
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(files => files.filter((_, i) => i !== index));
  };

  // Функция получения текущего местоположения
  const getCurrentLocation = async () => {
    try {
      console.log('[getCurrentLocation] 🚀 Начинаем получение местоположения...');
      setIsGettingLocation(true);

      const coords = await locationService.getCurrentLocation();
      console.log('[getCurrentLocation] 📍 Получены координаты:', coords);

      if (coords) {
        setCoordinates(coords);
        console.log('[getCurrentLocation] ✅ Координаты сохранены в состоянии');

        // Получаем адрес по координатам
        console.log('[getCurrentLocation] 🔄 Начинаем геокодирование...');
        const geocodeResult = await locationService.reverseGeocode(coords.latitude, coords.longitude);
        console.log('[getCurrentLocation] 🏠 Результат геокодирования:', geocodeResult);

        if (geocodeResult) {
          console.log('[getCurrentLocation] 📝 Устанавливаем адрес:', geocodeResult.address);
          setLocation(geocodeResult.address);
          console.log('[getCurrentLocation] ✅ setLocation() вызван с адресом');

          // Принудительно обновляем компонент TextInput
          setLocationUpdateKey(prev => prev + 1);
        } else {
          const coordsString = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
          console.log('[getCurrentLocation] 📝 Устанавливаем координаты как строку:', coordsString);
          setLocation(coordsString);
          console.log('[getCurrentLocation] ✅ setLocation() вызван с координатами');

          // Принудительно обновляем компонент TextInput
          setLocationUpdateKey(prev => prev + 1);
        }

        Alert.alert(tCommon('success'), t('location_success'));
      } else {
        console.log('[getCurrentLocation] ❌ Координаты не получены');
        Alert.alert(tError('error'), t('location_error'));
      }
    } catch (error) {
      console.error('[getCurrentLocation] ❌ Ошибка получения местоположения:', error);
      Alert.alert(tError('error'), t('location_error'));
    } finally {
      console.log('[getCurrentLocation] 🏁 Завершение получения местоположения');
      setIsGettingLocation(false);
    }
  };

  // Проверка валидности текущего шага без показа Alert'ов
  const isCurrentStepValid = (): boolean => {
    switch (currentStep) {
      case 1: // Название
        return title.trim().length > 0;
      case 2: // Категория
        return category.length > 0;
      case 3: // Описание
        return description.trim().length > 0;
      case 4: // Местоположение
        return location.trim().length > 0;
      case 5: // Бюджет
        return budget.trim().length > 0;
      case 6: // Количество работников
        return !!workersCount && !isNaN(parseInt(workersCount)) && parseInt(workersCount) >= 1;
      case 7: // Дата
        return selectedDate !== null;
      case 8: // Медиа (необязательно)
        return true;
      case 9: // Подтверждение
        return true;
      default:
        return true;
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Название
        if (!title.trim()) {
          Alert.alert(tError('error'), t('fill_title_error'));
          return false;
        }
        return true;
      case 2: // Категория
        if (!category) {
          Alert.alert(tError('error'), t('select_category_error'));
          return false;
        }
        return true;
      case 3: // Описание
        if (!description.trim()) {
          Alert.alert(tError('error'), t('fill_description_error'));
          return false;
        }
        return true;
      case 4: // Местоположение
        if (!location.trim()) {
          Alert.alert(tError('error'), t('fill_location_error'));
          return false;
        }
        return true;
      case 5: // Бюджет
        if (!budget.trim()) {
          Alert.alert(tError('error'), t('fill_budget_error'));
          return false;
        }
        return true;
      case 6: // Количество работников
        if (!workersCount || parseInt(workersCount) < 1) {
          Alert.alert(tError('error'), t('select_workers_error'));
          return false;
        }
        return true;
      case 7: // Дата
        if (!selectedDate) {
          Alert.alert(tError('error'), t('select_date_error'));
          return false;
        }
        return true;
      case 8: // Медиа (необязательно)
        return true;
      case 9: // Подтверждение
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('[CreateOrder] 🚀 НАЧАЛО handleSubmit');

    try {
      console.log('[CreateOrder] 📋 Проверяем поля...');
      if (!title.trim() || !description.trim() || !category || !budget.trim() || !selectedDate || !location.trim()) {
        console.log('[CreateOrder] ❌ Не все поля заполнены');
        Alert.alert(tError('error'), t('fill_required_fields'));
        return;
      }
      console.log('[CreateOrder] ✅ Все поля заполнены');

      console.log('[CreateOrder] 🔄 Устанавливаем isLoading...');
      setIsLoading(true);

      console.log('[CreateOrder] 📁 Начинаем обработку медиа...');
      let mediaUrls: string[] = [];

      // Обработка медиа файлов с детальной обработкой ошибок
      if (mediaFiles.length > 0) {
        console.log('[CreateOrder] 📷 Начинаем загрузку медиа файлов:', mediaFiles.length);
        console.log('[CreateOrder] 🔄 Устанавливаем isUploadingMedia...');
        setIsUploadingMedia(true);

        try {
          console.log('[CreateOrder] 📤 Вызываем mediaService.uploadMediaFiles...');
          const mediaUploadResult = await mediaService.uploadMediaFiles(mediaFiles);
          console.log('[CreateOrder] 📥 Результат загрузки медиа:', mediaUploadResult);

          console.log('[CreateOrder] 🔄 Отключаем isUploadingMedia...');
          setIsUploadingMedia(false);

          if (!mediaUploadResult.success) {
            console.log('[CreateOrder] ⚠️ Загрузка неудачна, используем локальные URI');
            mediaUrls = mediaFiles.map(file => file.uri);
            console.log('[CreateOrder] 📱 Показываем Alert о локальных файлах...');
            Alert.alert(
              'Предупреждение',
              'Медиа файлы сохранены локально. Для полной функциональности настройте Supabase Storage.',
              [{ text: 'ОК' }]
            );
          } else {
            mediaUrls = mediaUploadResult.urls || [];
            console.log('[CreateOrder] ✅ Медиа загружены успешно, URLs:', mediaUrls.length);
          }
        } catch (mediaError) {
          console.error('[CreateOrder] ❌ Ошибка при загрузке медиа:', mediaError);
          console.log('[CreateOrder] 🔄 Отключаем isUploadingMedia после ошибки...');
          setIsUploadingMedia(false);
          // Продолжаем с локальными URI в случае ошибки
          mediaUrls = mediaFiles.map(file => file.uri);
          console.log('[CreateOrder] 📱 Показываем Alert об ошибке медиа...');
          Alert.alert(
            'Предупреждение',
            'Проблема с загрузкой медиа. Файлы сохранены локально.'
          );
        }
      } else {
        console.log('[CreateOrder] 📷 Медиа файлов нет, пропускаем загрузку');
      }

      console.log('[CreateOrder] 📊 Подготавливаем данные заказа...');
      const orderData: CreateOrderRequest = {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        budget: parseFloat(budget.replace(/[^\d]/g, '')),
        workersNeeded: parseInt(workersCount),
        serviceDate: selectedDate!.toISOString(),
        photos: mediaUrls,
      };

      console.log('[CreateOrder] 📋 Создаем заказ с данными:', {
        ...orderData,
        photos: `${mediaUrls.length} медиа файлов`
      });

      console.log('[CreateOrder] 🌐 Вызываем orderService.createOrder...');
      const response = await orderService.createOrder(orderData);
      console.log('[CreateOrder] 📥 Ответ сервера:', response);

      if (response.success) {
        console.log('[CreateOrder] ✅ Заказ создан успешно');
        console.log('[CreateOrder] 📱 Показываем Alert об успехе...');
        Alert.alert(
          t('order_created_success'),
          mediaFiles.length > 0
            ? t('order_created_with_media', { count: mediaFiles.length })
            : t('order_created_simple'),
          [
            {
              text: tCommon('ok'),
              onPress: () => {
                console.log('[CreateOrder] 🔙 Нажата кнопка ОК, начинаем очистку...');
                try {
                  console.log('[CreateOrder] 🧹 Очищаем форму...');
                  // Очистка формы
                  setTitle('');
                  setDescription('');
                  setCategory('');
                  setBudget('');
                  setWorkersCount('1');
                  setSelectedDate(null);
                  setLocation('');
                  setCoordinates(null);
                  setIsGettingLocation(false);
                  setMediaFiles([]);
                  setMediaError('');
                  setCurrentStep(1);
                  // Сброс ключа анимации для повторного срабатывания анимаций
                  setAnimationResetKey(prev => prev + 1);

                  console.log('[CreateOrder] ↩️ Возвращаемся назад...');
                  navigation.goBack();
                } catch (cleanupError) {
                  console.error('[CreateOrder] ❌ Ошибка при очистке:', cleanupError);
                  // Просто возвращаемся назад если очистка не удалась
                  console.log('[CreateOrder] ↩️ Возвращаемся назад после ошибки очистки...');
                  navigation.goBack();
                }
              }
            }
          ]
        );
      } else {
        console.error('[CreateOrder] ❌ Ошибка создания заказа:', response.error);
        console.log('[CreateOrder] 📱 Показываем Alert об ошибке...');
        Alert.alert(tError('error'), response.error || t('create_order_error'));
      }
    } catch (error) {
      console.error('[CreateOrder] ❌ Общая ошибка создания заказа:', error);
      console.log('[CreateOrder] 📱 Показываем Alert об общей ошибке...');
      Alert.alert(tError('error'), `${t('create_order_failed')}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      console.log('[CreateOrder] 🏁 ЗАВЕРШЕНИЕ handleSubmit - сбрасываем флаги...');
      setIsLoading(false);
      setIsUploadingMedia(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return t('header_step1');
      case 2: return t('header_step2');
      case 3: return t('header_step3');
      case 4: return t('header_step4');
      case 5: return t('header_step5');
      case 6: return t('header_step6');
      case 7: return t('header_step7');
      case 8: return t('header_step8');
      case 9: return t('header_step9');
      default: return '';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <AnimatedStepContainer isActive={currentStep === 1} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 1} delay={0} resetKey={`${animationResetKey}-step-1`}>
                <Text style={styles.stepTitle}>{t('step1_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 1} delay={150} resetKey={`${animationResetKey}-step-1`}>
                <Text style={styles.stepSubtitle}>{t('step1_subtitle')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 1} delay={200} resetKey={`${animationResetKey}-step-1`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(titleFocused)}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={t('title_placeholder')}
                    placeholderTextColor={theme.colors.text.secondary}
                    autoFocus
                    onFocus={() => setTitleFocused(true)}
                    onBlur={() => setTitleFocused(false)}
                  />
                </View>
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 2:
        return (
          <AnimatedStepContainer isActive={currentStep === 2} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 2} delay={0} resetKey={`${animationResetKey}-step-2`}>
                <Text style={styles.stepTitle}>{t('step2_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 2} delay={150} resetKey={`${animationResetKey}-step-2`}>
                <Text style={styles.stepSubtitle}>{t('step2_subtitle')}</Text>
              </AnimatedField>

              <AnimatedCategoryGrid
                categories={categories}
                selectedCategory={category}
                onSelectCategory={setCategory}
                isActive={currentStep === 2}
                resetKey={`${animationResetKey}-step-2`}
                isSmallScreen={isSmallScreen}
              />
            </View>
          </AnimatedStepContainer>
        );

      case 3:
        return (
          <AnimatedStepContainer isActive={currentStep === 3} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 3} delay={0} resetKey={`${animationResetKey}-step-3`}>
                <Text style={styles.stepTitle}>{t('step3_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 3} delay={150} resetKey={`${animationResetKey}-step-3`}>
                <Text style={styles.stepSubtitle}>{t('step3_subtitle')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 3} delay={200} resetKey={`${animationResetKey}-step-3`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(descriptionFocused, true)}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t('description_placeholder')}
                    placeholderTextColor={theme.colors.text.secondary}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    autoFocus
                    onFocus={() => setDescriptionFocused(true)}
                    onBlur={() => setDescriptionFocused(false)}
                  />
                </View>
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 4:
        return (
          <AnimatedStepContainer isActive={currentStep === 4} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 4} delay={0} resetKey={`${animationResetKey}-step-4`}>
                <Text style={styles.stepTitle}>{t('step4_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 4} delay={150} resetKey={`${animationResetKey}-step-4`}>
                <Text style={styles.stepSubtitle}>{t('step4_subtitle')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 4} delay={200} resetKey={`${animationResetKey}-step-4`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={locationInputRef}
                    key={`location-input-${locationUpdateKey}`}
                    style={getInputStyle(locationFocused)}
                    value={location}
                    onChangeText={setLocation}
                    placeholder={t('location_placeholder')}
                    placeholderTextColor={theme.colors.text.secondary}
                    onFocus={() => setLocationFocused(true)}
                    onBlur={() => setLocationFocused(false)}
                  />
                  <TouchableOpacity
                    style={styles.locationButton}
                    onPress={() => {
                      console.log('[Button] 🔘 Кнопка геолокации нажата');
                      getCurrentLocation();
                    }}
                    disabled={isGettingLocation}
                  >
                    <Text style={styles.locationButtonText}>
                      {isGettingLocation ? `📍 ${t('determining_location')}` : `📍 ${t('my_location')}`}
                    </Text>
                  </TouchableOpacity>

                </View>
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 5:
        return (
          <AnimatedStepContainer isActive={currentStep === 5} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 5} delay={0} resetKey={`${animationResetKey}-step-5`}>
                <Text style={styles.stepTitle}>{t('step5_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 5} delay={150} resetKey={`${animationResetKey}-step-5`}>
                <Text style={styles.stepSubtitle}>{t('step5_subtitle')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 5} delay={200} resetKey={`${animationResetKey}-step-5`}>
                <View style={styles.inputContainer}>
                  <Text style={styles.fieldLabel}>{t('amount_per_worker')}</Text>
                  <TextInput
                    style={getInputStyle(budgetFocused)}
                    value={formatBudgetInput(budget)}
                    onChangeText={text => setBudget(formatBudgetInput(text))}
                    placeholder={t('budget_placeholder')}
                    placeholderTextColor={theme.colors.text.secondary}
                    keyboardType="numeric"
                    autoFocus
                    onFocus={() => setBudgetFocused(true)}
                    onBlur={() => setBudgetFocused(false)}
                  />
                </View>
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 6:
        return (
          <AnimatedStepContainer isActive={currentStep === 6} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 6} delay={0} resetKey={`${animationResetKey}-step-6`}>
                <Text style={styles.stepTitle}>{t('step6_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 6} delay={150} resetKey={`${animationResetKey}-step-6`}>
                <Text style={styles.stepSubtitle}>{t('step6_subtitle')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 6} delay={200} resetKey={`${animationResetKey}-step-6`}>
                <View style={styles.inputContainer}>
                  <Text style={styles.fieldLabel}>{t('workers_count')}</Text>
                </View>
              </AnimatedField>

              <AnimatedInteractiveContainer isActive={currentStep === 6} delay={250} resetKey={`${animationResetKey}-step-6`}>
                <View style={styles.workersContainer}>
                  <TouchableOpacity
                    style={styles.workersButton}
                    onPress={() => {
                      const count = Math.max(1, parseInt(workersCount) - 1);
                      setWorkersCount(count.toString());
                    }}
                  >
                    <Text style={styles.workersButtonText}>−</Text>
                  </TouchableOpacity>
                  <View style={styles.workersDisplay}>
                    <Text style={styles.workersText}>{workersCount}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.workersButton}
                    onPress={() => {
                      const count = Math.min(20, parseInt(workersCount) + 1);
                      setWorkersCount(count.toString());
                    }}
                  >
                    <Text style={styles.workersButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </AnimatedInteractiveContainer>
            </View>
          </AnimatedStepContainer>
        );

      case 7:
        return (
          <AnimatedStepContainer isActive={currentStep === 7} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 7} delay={0} resetKey={`${animationResetKey}-step-7`}>
                <Text style={styles.stepTitle}>{t('step7_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 7} delay={150} resetKey={`${animationResetKey}-step-7`}>
                <Text style={styles.stepSubtitle}>{t('step7_subtitle')}</Text>
              </AnimatedField>

              <AnimatedInteractiveContainer isActive={currentStep === 7} delay={200} resetKey={`${animationResetKey}-step-7`}>
                <View style={styles.inputContainer}>
                  <TouchableOpacity
                    style={styles.dateSelector}
                    onPress={showDatePickerHandler}
                  >
                    <CalendarDateIcon width={24} height={24} stroke={theme.colors.primary} />
                    <Text style={[
                      styles.dateText,
                      !selectedDate && styles.dateTextPlaceholder
                    ]}>
                      {formatDate(selectedDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </AnimatedInteractiveContainer>
            </View>
          </AnimatedStepContainer>
        );

      case 8:
        return (
          <AnimatedStepContainer isActive={currentStep === 8} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 8} delay={0} resetKey={`${animationResetKey}-step-8`}>
                <Text style={styles.stepTitle}>{t('step8_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 8} delay={150} resetKey={`${animationResetKey}-step-8`}>
                <Text style={styles.stepSubtitle}>{t('step8_subtitle')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 8} delay={200} resetKey={`${animationResetKey}-step-8`}>
                <View style={styles.mediaContainer}>
                  {mediaFiles.map((file, idx) => (
                    <AnimatedField key={file.uri} isActive={currentStep === 8} delay={250 + idx * 50} resetKey={`${animationResetKey}-${file.uri}`}>
                      <View style={styles.mediaItem}>
                        {file.type === 'image' ? (
                          <Image source={{ uri: file.uri }} style={styles.mediaImage} resizeMode="cover" />
                        ) : (
                          <VideoPreview uri={file.uri} />
                        )}
                        <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia(idx)}>
                          <Text style={styles.removeMediaText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    </AnimatedField>
                  ))}
                  {mediaFiles.length < 5 && (
                    <AnimatedInteractiveContainer isActive={currentStep === 8} delay={300} resetKey={`${animationResetKey}-step-8`}>
                      <TouchableOpacity style={styles.addMediaButton} onPress={pickMedia}>
                        <ImageIcon width={32} height={32} stroke={theme.colors.primary} />
                        <Text style={styles.addMediaText}>{t('add_media')}</Text>
                      </TouchableOpacity>
                    </AnimatedInteractiveContainer>
                  )}
                </View>
              </AnimatedField>
              {mediaError && (
                <AnimatedField isActive={currentStep === 8} delay={200} resetKey={`${animationResetKey}-step-8`}>
                  <Text style={styles.mediaError}>{mediaError}</Text>
                </AnimatedField>
              )}
            </View>
          </AnimatedStepContainer>
        );

      case 9:
        return (
          <AnimatedStepContainer isActive={currentStep === 9} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 9} delay={0} resetKey={`${animationResetKey}-step-9`}>
                <Text style={styles.stepTitle}>{t('step9_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 9} delay={150} resetKey={`${animationResetKey}-step-9`}>
                <Text style={styles.stepSubtitle}>{t('step9_subtitle')}</Text>
              </AnimatedField>

              <View style={styles.summaryContainer}>
                <AnimatedSummaryGrid
                  items={(() => {
                    if (mediaFiles.length > 0) {
                      // Если есть медиа файлы, размещаем их в паре с датой
                      return [
                        { label: t('summary_title'), value: title },
                        { label: t('summary_category'), value: category },
                        { label: t('summary_description'), value: description },
                        { label: t('summary_location'), value: location },
                        { label: t('summary_budget'), value: `${formatBudgetInput(budget)} ${t('sum_per_person')}` },
                        { label: t('summary_workers'), value: `${workersCount} ${t('person_count')}` },
                        { label: t('summary_media'), value: `${mediaFiles.length} ${t('files_count')}` },
                        { label: t('summary_date'), value: formatDate(selectedDate) }
                      ];
                    } else {
                      // Если нет медиа файлов
                      return [
                        { label: t('summary_title'), value: title },
                        { label: t('summary_category'), value: category },
                        { label: t('summary_description'), value: description },
                        { label: t('summary_location'), value: location },
                        { label: t('summary_budget'), value: `${formatBudgetInput(budget)} ${t('sum_per_person')}` },
                        { label: t('summary_workers'), value: `${workersCount} ${t('person_count')}` },
                        { label: t('summary_date'), value: formatDate(selectedDate) }
                      ];
                    }
                  })()}
                  isActive={currentStep === 9}
                  resetKey={`${animationResetKey}-step-9`}
                />
              </View>
            </View>
          </AnimatedStepContainer>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <HeaderWithBack title={getStepTitle()} showBackButton={currentStep === 1} />

          {/* Progress */}
          <AnimatedProgressBar progress={currentStep} total={totalSteps} />
          <StepCounter currentStep={currentStep} totalSteps={totalSteps} t={t} />

          {/* Content */}
          <View style={styles.mainContent}>
            {renderStep()}
          </View>

          {/* Navigation */}
          <View style={styles.navigation}>
            {currentStep > 1 && (
              <AnimatedNavigationButton
                variant="secondary"
                onPress={prevStep}
                isVisible={currentStep > 1}
                delay={0}
                resetKey={`${animationResetKey}-step-${currentStep}`}
              >
                <Text style={styles.secondaryButtonText}>{tCommon('back')}</Text>
              </AnimatedNavigationButton>
            )}

            <View style={styles.navigationSpacer} />

            {currentStep < totalSteps ? (
              isCurrentStepValid() && (
                <AnimatedNavigationButton
                  variant="primary"
                  onPress={nextStep}
                  isVisible={currentStep < totalSteps && isCurrentStepValid()}
                  delay={0}
                  resetKey={`${animationResetKey}-step-${currentStep}`}
                >
                  <Text style={styles.primaryButtonText}>{tCommon('next')}</Text>
                </AnimatedNavigationButton>
              )
            ) : (
              <AnimatedNavigationButton
                variant="primary"
                onPress={handleSubmit}
                disabled={isLoading || isUploadingMedia}
                isVisible={currentStep === totalSteps}
                delay={0}
                resetKey={`${animationResetKey}-step-${currentStep}`}
              >
                <Text style={styles.primaryButtonText}>
                  {isUploadingMedia ? t('uploading_media') : isLoading ? t('creating_order') : t('publish_order')}
                </Text>
              </AnimatedNavigationButton>
            )}
          </View>

          {/* Simple Loading Indicator */}
          <Modal
            visible={isLoading || isUploadingMedia}
            transparent={true}
            animationType="fade"
          >
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>
                  {isUploadingMedia ? t('uploading_media_loading') : t('creating_order_loading')}
                </Text>
              </View>
            </View>
          </Modal>

          {/* Date Picker */}
          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              {Platform.OS === 'ios' && (
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.doneButtonText}>{tCommon('done')}</Text>
                  </TouchableOpacity>
                </View>
              )}
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                onChange={handleDateChange}
                minimumDate={new Date()}
                locale="ru-RU"
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },

  stepCounterContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  progressText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
  },

  stepContent: {
    flex: 1,
    paddingTop: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
    paddingBottom: isSmallScreen ? 100 : 0, // Дополнительное место для кнопки на маленьких экранах
  },
  stepTitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.xl : theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: isSmallScreen ? theme.spacing.xs : theme.spacing.sm,
  },
  stepSubtitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
    lineHeight: isSmallScreen ? 18 : 22,
  },
  inputContainer: {
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
  },
  stepInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    paddingVertical: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    fontSize: isSmallScreen ? theme.fonts.sizes.md : theme.fonts.sizes.lg,
    color: theme.colors.text.primary,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
  stepInputFocused: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: isSmallScreen ? 80 : 120,
    paddingTop: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  categoryTitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.md : theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
  },
  categoriesGrid: {
    paddingVertical: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  workersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
  },
  workersButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workersButtonText: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: theme.fonts.weights.bold,
  },
  workersDisplay: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
  },
  workersText: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  dateSelector: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.md,
    fontWeight: theme.fonts.weights.medium,
  },
  dateTextPlaceholder: {
    color: theme.colors.text.secondary,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  mediaItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  addMediaButton: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  addMediaText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.sm,
    marginTop: theme.spacing.xs,
    fontWeight: theme.fonts.weights.medium,
  },
  mediaError: {
    color: theme.colors.error || 'red',
    fontSize: theme.fonts.sizes.sm,
    marginTop: theme.spacing.sm,
  },
  summaryContainer: {
    paddingHorizontal: 0,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    paddingBottom: isSmallScreen ? theme.spacing.xs : theme.spacing.lg,
    paddingTop: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  navigationSpacer: {
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  secondaryButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: theme.colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
  },
  datePickerContainer: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  doneButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  videoErrorPlaceholder: {
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  videoErrorText: {
    fontSize: 32,
    opacity: 0.5,
  },
  locationButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
});