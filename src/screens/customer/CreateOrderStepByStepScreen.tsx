import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet, TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
  ScrollView,
  FlatList,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
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
import { noElevationStyles } from '../../utils/noShadowStyles';
import { usePlatformSafeAreaInsets, getImprovedFixedBottomStyle } from '../../utils/safeAreaUtils';
import CalendarDateIcon from '../../../assets/calendar-date.svg';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import ImageIcon from '../../../assets/image-03.svg';

import { orderService } from '../../services/orderService';
import { mediaService } from '../../services/mediaService';
import { locationService, LocationCoords } from '../../services/locationService';
import { CreateOrderRequest } from '../../types';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CustomerTabParamList } from '../../types/navigation';
import {
  AnimatedProgressBar,
  AnimatedStepContainer,
  AnimatedField,
  AnimatedCategoryGrid,
  AnimatedNavigationButton,
  AnimatedInteractiveContainer,
  AnimatedSummaryGrid,
  HeaderWithBack,
  EmbeddedMapSelector,
} from '../../components/common';
import { useCustomerTranslation, useErrorsTranslation, useCommonTranslation, useCategoriesTranslation } from '../../hooks/useTranslation';
import { useTranslatedCategories, getCategoryLabel } from '../../utils/categoryUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Определяем маленький экран для Android (высота меньше 1080px)
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

type CreateOrderRouteProp = RouteProp<CustomerTabParamList, 'CreateOrder'>;

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

// Функция для получения оптимизированных отступов навигации
const getNavigationPadding = (insets: ReturnType<typeof usePlatformSafeAreaInsets>) => ({
  paddingTop: theme.spacing.md,
  paddingBottom: Platform.OS === 'android'
    ? 14
    : Math.max(insets.bottom, theme.spacing.sm),
});





// Функция для очистки адреса от названия страны
const cleanAddressFromCountry = (address: string): string => {
  if (!address) return address;

  let cleanAddress = address;
  // Убираем "Узбекистан" в начале или конце адреса
  cleanAddress = cleanAddress.replace(/^Узбекистан,?\s*/i, '').replace(/,?\s*Узбекистан$/i, '');
  // Убираем "Uzbekistan" в начале или конце адреса
  cleanAddress = cleanAddress.replace(/^Uzbekistan,?\s*/i, '').replace(/,?\s*Uzbekistan$/i, '');
  // Убираем лишние запятые в начале
  cleanAddress = cleanAddress.replace(/^,\s*/, '');

  return cleanAddress;
};

export const CreateOrderStepByStepScreen: React.FC = () => {
  const insets = usePlatformSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<CreateOrderRouteProp>();

  // Получаем параметры для повторения заказа
  const { repeatOrderData, startFromDateStep } = route.params || {};

  const [currentStep, setCurrentStep] = useState(startFromDateStep ? 8 : 1);
  const [title, setTitle] = useState(repeatOrderData?.title || '');
  const [description, setDescription] = useState(repeatOrderData?.description || '');
  const [category, setCategory] = useState(repeatOrderData?.category || '');
  const [budget, setBudget] = useState(repeatOrderData?.budget ? repeatOrderData.budget.toString() : '');
  const [workersCount, setWorkersCount] = useState(repeatOrderData?.workersNeeded ? repeatOrderData.workersNeeded.toString() : '1');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timePickerValue, setTimePickerValue] = useState<Date>(() => {
    const date = new Date();
    // Устанавливаем время в локальном часовом поясе
    date.setHours(9, 0, 0, 0);
    return date;
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<Array<{ uri: string; type: 'image' | 'video'; name: string; size: number }>>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [location, setLocation] = useState(repeatOrderData?.location || '');
  const [coordinates, setCoordinates] = useState<LocationCoords | null>(
    repeatOrderData?.latitude && repeatOrderData?.longitude
      ? { latitude: repeatOrderData.latitude, longitude: repeatOrderData.longitude }
      : null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [animationResetKey, setAnimationResetKey] = useState(0);
  const [locationUpdateKey, setLocationUpdateKey] = useState(0);
  const t = useCustomerTranslation();
  const tError = useErrorsTranslation();
  const tCommon = useCommonTranslation();
  const tCategories = useCategoriesTranslation();
  const categories = useTranslatedCategories();

  // Ref для поля местоположения
  const locationInputRef = useRef<any>(null);

  // Состояния фокуса для полей ввода
  const [titleFocused, setTitleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [budgetFocused, setBudgetFocused] = useState(false);

  // Состояния для дополнительных удобств
  const [transportPaid, setTransportPaid] = useState(repeatOrderData?.transportPaid || false);
  const [mealIncluded, setMealIncluded] = useState(repeatOrderData?.mealIncluded || false);
  const [mealPaid, setMealPaid] = useState(repeatOrderData?.mealPaid || false);

  const totalSteps = 10;

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

  // Функция для выбора сегодняшней даты
  const selectTodayDate = () => {
    const today = new Date();
    setSelectedDate(today);
  };

  // Функция для выбора завтрашней даты
  const selectTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
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



  const formatTime = (time: string | null) => {
    if (!time) return t('select_time');
    return time;
  };

  // Синхронизируем timePickerValue с selectedTime при открытии пикера
  useEffect(() => {
    if (showTimePicker) {
      if (selectedTime) {
        // Если время уже выбрано, используем его
        const [hours, minutes] = selectedTime.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        setTimePickerValue(date);
      } else {
        // Если время не выбрано, используем время по умолчанию (09:00)
        const date = new Date();
        date.setHours(9, 0, 0, 0);
        setTimePickerValue(date);
      }
    }
  }, [showTimePicker, selectedTime]);





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
            try {
              // Проверяем текущие разрешения
              const { status: currentStatus } = await ImagePicker.getCameraPermissionsAsync();

              let finalStatus = currentStatus;

              // Если разрешения нет, запрашиваем
              if (currentStatus !== 'granted') {
                const { status: newStatus } = await ImagePicker.requestCameraPermissionsAsync();
                finalStatus = newStatus;
              }

              if (finalStatus !== 'granted') {
                Alert.alert(
                  t('no_camera_access'),
                  'Пожалуйста, разрешите доступ к камере в настройках приложения',
                  [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Настройки', onPress: () => {
                        if (Platform.OS === 'ios') {
                          Linking.openURL('app-settings:');
                        } else {
                          Linking.openSettings();
                        }
                      }
                    }
                  ]
                );
                return;
              }

              let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images', 'videos'],
                quality: 1.0, // Максимальное качество, оптимизация будет в MediaService
                allowsEditing: false,
              });
              handleMediaResult(result);
            } catch (error) {
              console.error('Ошибка при работе с камерой:', error);
              Alert.alert('Ошибка', 'Не удалось открыть камеру');
            }
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

  // Функция для обработки выбора местоположения на карте
  const handleMapLocationSelect = (coords: LocationCoords, address?: string) => {
    console.log('[MapLocationSelect] 📍 Выбрано местоположение на карте:', coords, address);
    setCoordinates(coords);
    if (address) {
      // Очищаем адрес от названия страны
      const cleanAddress = cleanAddressFromCountry(address);
      console.log('[MapLocationSelect] 📝 Очищенный адрес:', cleanAddress);
      setLocation(cleanAddress);
      setLocationUpdateKey(prev => prev + 1);
    }
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
          console.log('[getCurrentLocation] 📝 Получен адрес:', geocodeResult.address);

          // Убираем название страны из адреса
          const cleanAddress = cleanAddressFromCountry(geocodeResult.address);

          console.log('[getCurrentLocation] 📝 Устанавливаем очищенный адрес:', cleanAddress);
          setLocation(cleanAddress);
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
        return title.trim().length > 0 && title.length <= theme.orderValidation.title.maxLength;
      case 2: // Категория (теперь необязательна)
        return true;
      case 3: // Описание (теперь необязательно)
        return true;
      case 4: // Местоположение
        return location.trim().length > 0;
      case 5: // Количество работников
        return !!workersCount && !isNaN(parseInt(workersCount)) && parseInt(workersCount) >= 1;
      case 6: // Бюджет
        return budget.trim().length > 0;
      case 7: // Дополнительные удобства (необязательно)
        return true;
      case 8: // Дата и время
        return selectedDate !== null && selectedTime !== null;
      case 9: // Медиа (необязательно)
        return true;
      case 10: // Подтверждение
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
        if (title.length > theme.orderValidation.title.maxLength) {
          Alert.alert(tError('error'), t('title_too_long_error'));
          return false;
        }
        return true;
      case 2: // Категория (теперь необязательна, можно пропустить)
        return true;
      case 3: // Описание (теперь необязательно, можно пропустить)
        return true;
      case 4: // Местоположение
        if (!location.trim()) {
          Alert.alert(tError('error'), t('fill_location_error'));
          return false;
        }
        return true;
      case 5: // Количество работников
        if (!workersCount || parseInt(workersCount) < 1) {
          Alert.alert(tError('error'), t('select_workers_error'));
          return false;
        }
        return true;
      case 6: // Бюджет
        if (!budget.trim()) {
          Alert.alert(tError('error'), t('fill_budget_error'));
          return false;
        }
        return true;
      case 7: // Дополнительные удобства (необязательно)
        return true;
      case 8: // Дата и время
        if (!selectedDate) {
          Alert.alert(tError('error'), t('select_date_error'));
          return false;
        }
        if (!selectedTime) {
          Alert.alert(tError('error'), t('select_time_error'));
          return false;
        }
        return true;
      case 9: // Медиа (необязательно)
        return true;
      case 10: // Подтверждение
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    // Специальная обработка для шага выбора категории
    if (currentStep === 2 && !category) {
      setCategory('other'); // Автоматически выбираем "Другое" если категория не выбрана
    }

    // Специальная обработка для шага описания работы
    if (currentStep === 3 && !description.trim()) {
      setDescription(tCommon('default_description')); // Автоматически устанавливаем стандартное описание
    }

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

  // Функция для пропуска шага выбора категории
  const skipCategoryStep = () => {
    setCategory('other'); // Автоматически выбираем категорию "Другое"
    setCurrentStep(currentStep + 1); // Переходим к следующему шагу
  };

  // Функция для пропуска шага описания работы
  const skipDescriptionStep = () => {
    setDescription(tCommon('default_description')); // Устанавливаем стандартное описание
    setCurrentStep(currentStep + 1); // Переходим к следующему шагу
  };

  const handleSubmit = async () => {
    console.log('[CreateOrder] 🚀 НАЧАЛО handleSubmit');

    try {
      console.log('[CreateOrder] 📋 Проверяем поля...');

      // Если категория не выбрана, автоматически устанавливаем "other"
      const finalCategory = category || 'other';

      // Если описание не заполнено, автоматически устанавливаем стандартное описание
      const finalDescription = description.trim() || tCommon('default_description');

      if (!title.trim() || !budget.trim() || !selectedDate || !selectedTime || !location.trim()) {
        console.log('[CreateOrder] ❌ Не все поля заполнены');
        Alert.alert(tError('error'), t('fill_required_fields'));
        return;
      }

      // Проверяем ограничения по длине
      if (title.length > theme.orderValidation.title.maxLength) {
        Alert.alert(tError('error'), t('title_too_long_error'));
        return;
      }

      if (description.length > theme.orderValidation.description.maxLength) {
        Alert.alert(tError('error'), t('description_too_long_error'));
        return;
      }

      console.log('[CreateOrder] ✅ Все поля заполнены и валидны');

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
        description: finalDescription,
        category: finalCategory,
        location: location.trim(),
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        budget: parseFloat(budget.replace(/[^\d]/g, '')),
        workersNeeded: parseInt(workersCount),
        serviceDate: (() => {
          const [hours, minutes] = selectedTime!.split(':').map(Number);
          const dateWithTime = new Date(selectedDate!);
          dateWithTime.setHours(hours, minutes, 0, 0);
          return dateWithTime.toISOString();
        })(),
        photos: mediaUrls,
        // Дополнительные удобства
        transportPaid,
        mealIncluded,
        mealPaid,
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
                  setSelectedTime(null);
                  const resetDate = new Date();
                  resetDate.setHours(9, 0, 0, 0);
                  setTimePickerValue(resetDate);
                  setLocation('');
                  setCoordinates(null);
                  setIsGettingLocation(false);
                  setMediaFiles([]);
                  setMediaError('');
                  setCurrentStep(1);
                  // Сброс дополнительных удобств
                  setTransportPaid(false);
                  setMealIncluded(false);
                  setMealPaid(false);
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
      case 1: return t('header_step1'); // Название
      case 2: return t('header_step2'); // Категория
      case 3: return t('header_step3'); // Описание
      case 4: return t('header_step4'); // Местоположение
      case 5: return t('header_step7'); // Количество работников
      case 6: return t('header_step5'); // Бюджет
      case 7: return t('header_step6'); // Дополнительные удобства
      case 8: return t('header_step8'); // Дата и время
      case 9: return t('header_step9'); // Медиа
      case 10: return t('header_step10'); // Подтверждение
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
                    maxLength={theme.orderValidation.title.maxLength}
                    autoFocus
                    onFocus={() => setTitleFocused(true)}
                    onBlur={() => setTitleFocused(false)}
                  />
                  <Text style={styles.characterCount}>
                    {title.length}/{theme.orderValidation.title.maxLength}
                  </Text>
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

              {/* Кнопка "Пропустить" на странице выбора категории (показывается только если категория не выбрана) */}
              {!category && (
                <AnimatedField isActive={currentStep === 2} delay={300} resetKey={`${animationResetKey}-step-2`}>
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={skipCategoryStep}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.skipButtonText}>{tCommon('skip')}</Text>
                  </TouchableOpacity>
                </AnimatedField>
              )}
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
                    maxLength={theme.orderValidation.description.maxLength}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    onFocus={() => setDescriptionFocused(true)}
                    onBlur={() => setDescriptionFocused(false)}
                  />
                  <Text style={styles.characterCount}>
                    {description.length}/{theme.orderValidation.description.maxLength}
                  </Text>
                </View>
              </AnimatedField>

              {/* Кнопка "Пропустить" на странице описания работы (показывается только если описание не заполнено) */}
              {!description.trim() && (
                <AnimatedField isActive={currentStep === 3} delay={300} resetKey={`${animationResetKey}-step-3`}>
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={skipDescriptionStep}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.skipButtonText}>{tCommon('skip')}</Text>
                  </TouchableOpacity>
                </AnimatedField>
              )}
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

              <AnimatedField isActive={currentStep === 4} delay={300} resetKey={`${animationResetKey}-step-4`}>
                <Text style={styles.mapSectionTitle}>{t('or_select_on_map')}</Text>
                <EmbeddedMapSelector
                  onLocationSelect={handleMapLocationSelect}
                  initialCoords={coordinates || undefined}
                  initialAddress={location}
                  location={location}
                />
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 5:
        return (
          <AnimatedStepContainer isActive={currentStep === 5} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 5} delay={0} resetKey={`${animationResetKey}-step-5`}>
                <Text style={styles.stepTitle}>{t('step7_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 5} delay={150} resetKey={`${animationResetKey}-step-5`}>
                <Text style={styles.stepSubtitle}>{t('step7_subtitle')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 5} delay={200} resetKey={`${animationResetKey}-step-5`}>
                <View style={styles.inputContainer}>
                  <Text style={styles.fieldLabel}>{t('workers_count')}</Text>
                </View>
              </AnimatedField>

              <AnimatedInteractiveContainer isActive={currentStep === 5} delay={250} resetKey={`${animationResetKey}-step-5`}>
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

      case 6:
        return (
          <AnimatedStepContainer isActive={currentStep === 6} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 6} delay={0} resetKey={`${animationResetKey}-step-6`}>
                <Text style={styles.stepTitle}>{t('step5_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 6} delay={150} resetKey={`${animationResetKey}-step-6`}>
                <Text style={styles.stepSubtitle}>{t('step5_subtitle')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 6} delay={200} resetKey={`${animationResetKey}-step-6`}>
                <View style={styles.inputContainer}>
                  <Text style={styles.fieldLabel}>{t('amount_per_worker')}</Text>
                  <View style={styles.budgetInputContainer}>
                    <TextInput
                      style={[getInputStyle(budgetFocused), styles.budgetInput]}
                      value={formatBudgetInput(budget)}
                      onChangeText={text => setBudget(formatBudgetInput(text))}
                      placeholder={t('budget_placeholder')}
                      placeholderTextColor={theme.colors.text.secondary}
                      keyboardType="numeric"
                      autoFocus
                      onFocus={() => setBudgetFocused(true)}
                      onBlur={() => setBudgetFocused(false)}
                    />
                    <Text style={styles.currencyLabel}>UZS</Text>
                  </View>
                </View>
              </AnimatedField>
            </View>
          </AnimatedStepContainer>
        );

      case 7:
        return (
          <AnimatedStepContainer isActive={currentStep === 7} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 7} delay={0} resetKey={`${animationResetKey}-step-7`}>
                <Text style={styles.stepTitle}>{t('step6_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 7} delay={150} resetKey={`${animationResetKey}-step-7`}>
                <Text style={styles.stepSubtitle}>{t('step6_subtitle')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 7} delay={200} resetKey={`${animationResetKey}-step-7`}>
                <View style={styles.inputContainer}>
                  <TouchableOpacity
                    style={[styles.checkboxContainer, transportPaid && styles.checkboxContainerActive]}
                    onPress={() => setTransportPaid(!transportPaid)}
                  >
                    <View style={[styles.checkbox, transportPaid && styles.checkboxActive]}>
                      {transportPaid && <Text style={styles.checkboxCheck}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>{t('transport_paid')}</Text>
                  </TouchableOpacity>
                </View>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 7} delay={250} resetKey={`${animationResetKey}-step-7`}>
                <View style={styles.inputContainer}>
                  <Text style={styles.sectionTitle}>{t('meal_section')}</Text>
                  <View style={styles.mealOptionsContainer}>
                    <TouchableOpacity
                      style={[styles.checkboxContainer, mealIncluded && styles.checkboxContainerActive]}
                      onPress={() => {
                        setMealIncluded(!mealIncluded);
                        if (!mealIncluded) {
                          setMealPaid(false); // Если включено, то не оплачивается
                        }
                      }}
                    >
                      <View style={[styles.checkbox, mealIncluded && styles.checkboxActive]}>
                        {mealIncluded && <Text style={styles.checkboxCheck}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxLabel}>{t('meal_included')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.checkboxContainer, mealPaid && styles.checkboxContainerActive]}
                      onPress={() => {
                        setMealPaid(!mealPaid);
                        if (!mealPaid) {
                          setMealIncluded(false); // Если оплачивается, то не включено
                        }
                      }}
                    >
                      <View style={[styles.checkbox, mealPaid && styles.checkboxActive]}>
                        {mealPaid && <Text style={styles.checkboxCheck}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxLabel}>{t('meal_paid')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </AnimatedField>
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

              <AnimatedInteractiveContainer isActive={currentStep === 8} delay={200} resetKey={`${animationResetKey}-step-8`}>
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

                  {/* Кнопки быстрого выбора даты */}
                  <View style={styles.quickDateContainer}>
                    <TouchableOpacity
                      style={styles.quickDateButton}
                      onPress={selectTodayDate}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.quickDateButtonText}>{t('today')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickDateButton}
                      onPress={selectTomorrowDate}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.quickDateButtonText}>{t('tomorrow')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </AnimatedInteractiveContainer>

              <AnimatedInteractiveContainer isActive={currentStep === 8} delay={250} resetKey={`${animationResetKey}-step-8`}>
                <View style={styles.inputContainer}>
                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() => {
                      // Сбрасываем время при открытии пикера для iOS
                      if (Platform.OS === 'ios' && !selectedTime) {
                        const resetDate = new Date();
                        resetDate.setHours(9, 0, 0, 0);
                        setTimePickerValue(resetDate);
                      }
                      setShowTimePicker(true);
                    }}
                  >
                    <CalendarDateIcon width={24} height={24} stroke={theme.colors.primary} />
                    <Text style={[
                      styles.timeText,
                      !selectedTime && styles.timeTextPlaceholder
                    ]}>
                      {formatTime(selectedTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </AnimatedInteractiveContainer>
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

              <AnimatedField isActive={currentStep === 9} delay={200} resetKey={`${animationResetKey}-step-9`}>
                <View style={styles.mediaContainer}>
                  {mediaFiles.map((file, idx) => (
                    <AnimatedField key={file.uri} isActive={currentStep === 9} delay={250 + idx * 50} resetKey={`${animationResetKey}-${file.uri}`}>
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
                    <AnimatedInteractiveContainer isActive={currentStep === 9} delay={300} resetKey={`${animationResetKey}-step-9`}>
                      <TouchableOpacity style={styles.addMediaButton} onPress={pickMedia}>
                        <ImageIcon width={32} height={32} stroke={theme.colors.primary} />
                        <Text style={styles.addMediaText}>{t('add_media')}</Text>
                      </TouchableOpacity>
                    </AnimatedInteractiveContainer>
                  )}
                </View>
              </AnimatedField>
              {mediaError && (
                <AnimatedField isActive={currentStep === 9} delay={200} resetKey={`${animationResetKey}-step-9`}>
                  <Text style={styles.mediaError}>{mediaError}</Text>
                </AnimatedField>
              )}
            </View>
          </AnimatedStepContainer>
        );

      case 10:
        return (
          <AnimatedStepContainer isActive={currentStep === 10} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 10} delay={0} resetKey={`${animationResetKey}-step-10`}>
                <Text style={styles.stepTitle}>{t('step10_title')}</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 10} delay={150} resetKey={`${animationResetKey}-step-10`}>
                <Text style={styles.stepSubtitle}>{t('step10_subtitle')}</Text>
              </AnimatedField>

              <View style={styles.summaryContainer}>
                <AnimatedSummaryGrid
                  items={(() => {
                    const baseItems = [
                      { label: t('summary_title'), value: title },
                      { label: t('summary_category'), value: getCategoryLabel(category, tCategories) },
                      { label: t('summary_description'), value: description },
                      { label: t('summary_location'), value: location },
                      { label: t('summary_budget'), value: `${formatBudgetInput(budget)} ${t('sum_per_person')}` },
                      { label: t('summary_workers'), value: `${workersCount} ${t('person_count')}` }
                    ];

                    // Добавляем информацию о дополнительных удобствах
                    if (transportPaid || mealIncluded || mealPaid) {
                      const transportText = transportPaid ? t('transport_paid_yes') : t('transport_paid_no');
                      baseItems.push({ label: t('transport_info'), value: transportText });

                      if (mealIncluded) {
                        baseItems.push({ label: t('meal_info'), value: t('meal_included_yes') });
                      } else if (mealPaid) {
                        baseItems.push({ label: t('meal_info'), value: t('meal_paid_yes') });
                      } else {
                        baseItems.push({ label: t('meal_info'), value: t('meal_included_no') });
                      }
                    }

                    // Добавляем медиа файлы если есть
                    if (mediaFiles.length > 0) {
                      baseItems.push({ label: t('summary_media'), value: `${mediaFiles.length} ${t('files_count')}` });
                    }

                    // Добавляем дату и время
                    const dateTimeValue = selectedTime ? `${formatDate(selectedDate)} ${t('at_time')} ${selectedTime}` : formatDate(selectedDate);
                    baseItems.push({ label: t('summary_date'), value: dateTimeValue });

                    return baseItems;
                  })()}
                  isActive={currentStep === 10}
                  resetKey={`${animationResetKey}-step-10`}
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
          <View style={[styles.navigation, getNavigationPadding(insets)]}>
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
              (isCurrentStepValid() || currentStep === 2 || currentStep === 3 || currentStep === 7) && (
                <AnimatedNavigationButton
                  variant="primary"
                  onPress={nextStep}
                  isVisible={currentStep < totalSteps && (isCurrentStepValid() || currentStep === 2 || currentStep === 3 || currentStep === 7)}
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

          {/* Time Picker */}
          {showTimePicker && (
            <View style={styles.timePickerContainer}>
              {Platform.OS === 'ios' && (
                <View style={styles.timePickerHeader}>
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => {
                      const hours = timePickerValue.getHours().toString().padStart(2, '0');
                      const minutes = timePickerValue.getMinutes().toString().padStart(2, '0');
                      setSelectedTime(`${hours}:${minutes}`);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={styles.doneButtonText}>{tCommon('done')}</Text>
                  </TouchableOpacity>
                </View>
              )}
              <DateTimePicker
                value={timePickerValue}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'android' ? 'default' : 'spinner'}
                onChange={(event, date) => {
                  if (Platform.OS === 'android') {
                    // На Android закрываем сразу после выбора
                    if (event.type === 'set' && date) {
                      const hours = date.getHours().toString().padStart(2, '0');
                      const minutes = date.getMinutes().toString().padStart(2, '0');
                      setSelectedTime(`${hours}:${minutes}`);
                      setTimePickerValue(date);
                    }
                    setShowTimePicker(false);
                  } else {
                    // На iOS только обновляем значение, не закрываем
                    if (date) {
                      // Создаем новую дату для избежания проблем с часовыми поясами
                      const newDate = new Date();
                      newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
                      setTimePickerValue(newDate);
                    }
                  }
                }}
                minuteInterval={15}
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
    paddingBottom: isSmallScreen ? theme.spacing.lg : 0, // Уменьшенный отступ для маленьких экранов
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
    backgroundColor: '#F6F7F9',
    borderWidth: 2,
    borderColor: '#F6F7F9',
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
    borderColor: '#679B00',
    backgroundColor: '#F0F8FF',
    shadowColor: '#679B00',
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
    borderWidth: 0, borderColor: theme.colors.border,
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
    borderWidth: 0, borderColor: theme.colors.border,
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
  timeSelector: {
    backgroundColor: theme.colors.surface,
    borderWidth: 0, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.md,
    fontWeight: theme.fonts.weights.medium,
  },
  timeTextPlaceholder: {
    color: theme.colors.text.secondary,
  },
  quickDateContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  quickDateButton: {
    flex: 1,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    minHeight: 48,
  },
  quickDateButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
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
    borderWidth: 0, borderColor: theme.colors.border,
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
    borderWidth: 0, borderColor: theme.colors.primary,
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
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  navigationSpacer: {
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 0, borderColor: theme.colors.border,
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
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  primaryButtonDisabled: {
    backgroundColor: theme.colors.disabled,
    shadowOpacity: 0, elevation: 0,
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled,
    shadowOpacity: 0, elevation: 0,
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
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  timePickerContainer: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : 0,
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  timePickerHeader: {
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
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
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
    borderWidth: 0, borderColor: theme.colors.border,
  },
  videoErrorText: {
    fontSize: 32,
    opacity: 0.5,
  },
  locationButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  locationButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  mapSectionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  characterCount: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  // Стили для дополнительных удобств
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 0, borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  checkboxContainerActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 0, borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  checkboxActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  checkboxCheck: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  mealOptionsContainer: {
    gap: theme.spacing.sm,
  },
  // Стили для кнопки "Пропустить" на странице категорий
  skipButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: theme.spacing.md, // Уменьшили отступ сверху для кнопки "Пропустить"
    marginBottom: theme.spacing.lg,
  },
  skipButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  // Стили для поля ввода бюджета с валютой
  budgetInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetInput: {
    flex: 1,
    paddingRight: 60, // Место для метки UZS
  },
  currencyLabel: {
    position: 'absolute',
    right: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    fontSize: isSmallScreen ? theme.fonts.sizes.md : theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.secondary,
    backgroundColor: 'transparent',
  },
});