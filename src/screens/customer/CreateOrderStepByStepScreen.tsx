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

const { width: screenWidth } = Dimensions.get('window');

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
const StepCounter: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  return (
    <View style={styles.stepCounterContainer}>
      <Text style={styles.progressText}>{currentStep} из {totalSteps}</Text>
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

  // Показываем только 6 категорий
  const categories = [
    { label: 'Стройка', emoji: '🏗️' },
    { label: 'Уборка', emoji: '🧹' },
    { label: 'Сад', emoji: '🌳' },
    { label: 'Общепит', emoji: '🍽️' },
    { label: 'Переезд', emoji: '🚚' },
    { label: 'Прочее', emoji: '✨' },
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
    if (!date) return 'Выберите дату';
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
      setMediaError('Можно загрузить максимум 5 файлов');
      return;
    }
    Alert.alert(
      'Добавить фото или видео',
      'Выберите источник',
      [
        {
          text: 'Снять фото/видео',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Нет доступа к камере');
              return;
            }
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images', 'videos'],
              quality: 0.8,
            });
            handleMediaResult(result);
          },
        },
        {
          text: 'Выбрать из галереи',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Нет доступа к фото/видео');
              return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images', 'videos'],
              allowsMultipleSelection: true,
              selectionLimit: 5 - mediaFiles.length,
              quality: 0.8,
            });
            handleMediaResult(result);
          },
        },
        { text: 'Отмена', style: 'cancel' },
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

        Alert.alert('Успешно!', 'Местоположение определено');
      } else {
        console.log('[getCurrentLocation] ❌ Координаты не получены');
        Alert.alert(
          'Ошибка',
          'Не удалось определить местоположение. Проверьте настройки геолокации в устройстве.'
        );
      }
    } catch (error) {
      console.error('[getCurrentLocation] ❌ Ошибка получения местоположения:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при определении местоположения');
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
          Alert.alert('Заполните поле', 'Введите название заказа');
          return false;
        }
        return true;
      case 2: // Категория
        if (!category) {
          Alert.alert('Выберите категорию', 'Выберите подходящую категорию');
          return false;
        }
        return true;
      case 3: // Описание
        if (!description.trim()) {
          Alert.alert('Заполните поле', 'Опишите, что нужно сделать');
          return false;
        }
        return true;
      case 4: // Местоположение
        if (!location.trim()) {
          Alert.alert('Заполните поле', 'Укажите местоположение');
          return false;
        }
        return true;
      case 5: // Бюджет
        if (!budget.trim()) {
          Alert.alert('Заполните поле', 'Укажите бюджет');
          return false;
        }
        return true;
      case 6: // Количество работников
        if (!workersCount || parseInt(workersCount) < 1) {
          Alert.alert('Укажите количество', 'Выберите количество работников');
          return false;
        }
        return true;
      case 7: // Дата
        if (!selectedDate) {
          Alert.alert('Выберите дату', 'Выберите дату выполнения заказа');
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
        Alert.alert('Ошибка', 'Заполните все обязательные поля');
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
          'Успешно!',
          mediaFiles.length > 0
            ? `Заказ создан с ${mediaFiles.length} медиа файлами! Исполнители скоро увидят его.`
            : 'Заказ создан! Исполнители скоро увидят его.',
          [
            {
              text: 'ОК',
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
        Alert.alert('Ошибка', response.error || 'Не удалось создать заказ. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('[CreateOrder] ❌ Общая ошибка создания заказа:', error);
      console.log('[CreateOrder] 📱 Показываем Alert об общей ошибке...');
      Alert.alert('Ошибка', `Не удалось создать заказ: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      console.log('[CreateOrder] 🏁 ЗАВЕРШЕНИЕ handleSubmit - сбрасываем флаги...');
      setIsLoading(false);
      setIsUploadingMedia(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Название заказа';
      case 2: return 'Категория работы';
      case 3: return 'Описание работы';
      case 4: return 'Местоположение';
      case 5: return 'Бюджет';
      case 6: return 'Команда';
      case 7: return 'Дата выполнения';
      case 8: return 'Фото и видео';
      case 9: return 'Подтверждение';
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
                <Text style={styles.stepTitle}>Как назовем заказ?</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 1} delay={150} resetKey={`${animationResetKey}-step-1`}>
                <Text style={styles.stepSubtitle}>Кратко опишите, что нужно сделать</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 1} delay={200} resetKey={`${animationResetKey}-step-1`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(titleFocused)}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Например: Уборка квартиры"
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
                <Text style={styles.stepTitle}>Выберите категорию</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 2} delay={150} resetKey={`${animationResetKey}-step-2`}>
                <Text style={styles.stepSubtitle}>Какой тип работы вам нужен?</Text>
              </AnimatedField>

              <AnimatedCategoryGrid
                categories={categories}
                selectedCategory={category}
                onSelectCategory={setCategory}
                isActive={currentStep === 2}
                resetKey={`${animationResetKey}-step-2`}
              />
            </View>
          </AnimatedStepContainer>
        );

      case 3:
        return (
          <AnimatedStepContainer isActive={currentStep === 3} direction="right">
            <View style={styles.stepContent}>
              <AnimatedField isActive={currentStep === 3} delay={0} resetKey={`${animationResetKey}-step-3`}>
                <Text style={styles.stepTitle}>Расскажите подробнее</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 3} delay={150} resetKey={`${animationResetKey}-step-3`}>
                <Text style={styles.stepSubtitle}>Опишите детали работы, требования и пожелания</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 3} delay={200} resetKey={`${animationResetKey}-step-3`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle(descriptionFocused, true)}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Подробно опишите, что нужно сделать, какие материалы использовать, сколько времени займет работа..."
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
                <Text style={styles.stepTitle}>Где выполнить?</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 4} delay={150} resetKey={`${animationResetKey}-step-4`}>
                <Text style={styles.stepSubtitle}>Укажите адрес или район</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 4} delay={200} resetKey={`${animationResetKey}-step-4`}>
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={locationInputRef}
                    key={`location-input-${locationUpdateKey}`}
                    style={getInputStyle(locationFocused)}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Например: Ташкент, Юнусабад, ул. Амира Темура 15"
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
                      {isGettingLocation ? '📍 Определение...' : '📍 Мое местоположение'}
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
                <Text style={styles.stepTitle}>Какой бюджет?</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 5} delay={150} resetKey={`${animationResetKey}-step-5`}>
                <Text style={styles.stepSubtitle}>Сколько готовы заплатить за одного работника?</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 5} delay={200} resetKey={`${animationResetKey}-step-5`}>
                <View style={styles.inputContainer}>
                  <Text style={styles.fieldLabel}>Сумма за одного работника</Text>
                  <TextInput
                    style={getInputStyle(budgetFocused)}
                    value={formatBudgetInput(budget)}
                    onChangeText={text => setBudget(formatBudgetInput(text))}
                    placeholder="100 000"
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
                <Text style={styles.stepTitle}>Сколько нужно людей?</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 6} delay={150} resetKey={`${animationResetKey}-step-6`}>
                <Text style={styles.stepSubtitle}>Выберите количество работников для выполнения задачи</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 6} delay={200} resetKey={`${animationResetKey}-step-6`}>
                <View style={styles.inputContainer}>
                  <Text style={styles.fieldLabel}>Количество работников</Text>
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
                <Text style={styles.stepTitle}>Когда нужно выполнить?</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 7} delay={150} resetKey={`${animationResetKey}-step-7`}>
                <Text style={styles.stepSubtitle}>Выберите удобную дату</Text>
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
                <Text style={styles.stepTitle}>Добавить фото или видео?</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 8} delay={150} resetKey={`${animationResetKey}-step-8`}>
                <Text style={styles.stepSubtitle}>Это поможет исполнителям лучше понять задачу</Text>
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
                        <Text style={styles.addMediaText}>Добавить</Text>
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
                <Text style={styles.stepTitle}>🎉 Все готово!</Text>
              </AnimatedField>

              <AnimatedField isActive={currentStep === 9} delay={150} resetKey={`${animationResetKey}-step-9`}>
                <Text style={styles.stepSubtitle}>Проверьте данные перед публикацией</Text>
              </AnimatedField>

              <View style={styles.summaryContainer}>
                <AnimatedSummaryGrid
                  items={(() => {
                    if (mediaFiles.length > 0) {
                      // Если есть медиа файлы, размещаем их в паре с датой
                      return [
                        { label: "Название", value: title },
                        { label: "Категория", value: category },
                        { label: "Описание", value: description },
                        { label: "Местоположение", value: location },
                        { label: "Бюджет", value: `${formatBudgetInput(budget)} сум/чел` },
                        { label: "Работников", value: `${workersCount} человек` },
                        { label: "Медиа файлы", value: `${mediaFiles.length} файла` },
                        { label: "Дата", value: formatDate(selectedDate) }
                      ];
                    } else {
                      // Если нет медиа файлов
                      return [
                        { label: "Название", value: title },
                        { label: "Категория", value: category },
                        { label: "Описание", value: description },
                        { label: "Местоположение", value: location },
                        { label: "Бюджет", value: `${formatBudgetInput(budget)} сум/чел` },
                        { label: "Работников", value: `${workersCount} человек` },
                        { label: "Дата", value: formatDate(selectedDate) }
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getStepTitle()}</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Progress */}
          <AnimatedProgressBar progress={currentStep} total={totalSteps} />
          <StepCounter currentStep={currentStep} totalSteps={totalSteps} />

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
                <Text style={styles.secondaryButtonText}>Назад</Text>
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
                  <Text style={styles.primaryButtonText}>Далее</Text>
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
                  {isUploadingMedia ? '⏳ Загружаем...' : isLoading ? '🚀 Создаем...' : '✨ Опубликовать'}
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
                  {isUploadingMedia ? 'Загружаем медиа...' : 'Создаем заказ...'}
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
                    <Text style={styles.doneButtonText}>Готово</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: theme.colors.text.primary,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  headerRight: {
    width: 40,
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
    paddingTop: theme.spacing.xl,
  },
  stepTitle: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  stepSubtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  stepInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    fontSize: theme.fonts.sizes.lg,
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
    height: 120,
    paddingTop: theme.spacing.lg,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  categoryTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  categoriesGrid: {
    paddingVertical: theme.spacing.lg,
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
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