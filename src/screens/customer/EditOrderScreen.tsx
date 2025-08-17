import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../constants';
import CalendarDateIcon from '../../../assets/calendar-date.svg';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import ImageIcon from '../../../assets/image-03.svg';
import { orderService } from '../../services/orderService';
import { mediaService } from '../../services/mediaService';
import { locationService, LocationCoords } from '../../services/locationService';
import { UpdateOrderRequest, Order } from '../../types';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CustomerStackParamList } from '../../types/navigation';
import { HeaderWithBack } from '../../components/common';

type EditOrderRouteProp = RouteProp<CustomerStackParamList, 'EditOrder'>;

// Отдельный компонент для превью видео
const VideoPreview: React.FC<{ uri: string }> = ({ uri }) => {
  const player = useVideoPlayer(uri);
  return (
    <VideoView
      player={player}
      style={styles.mediaImage}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

export const EditOrderScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EditOrderRouteProp>();
  const { orderId } = route.params;

  // Состояния для данных заказа
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);

  // Состояния формы
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

  // Состояния фокуса для полей ввода
  const [titleFocused, setTitleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [budgetFocused, setBudgetFocused] = useState(false);

  // Загружаем данные заказа при монтировании компонента
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoadingOrder(true);
        const orderData = await orderService.getOrderById(orderId);

        if (!orderData) {
          Alert.alert('Ошибка', 'Заказ не найден');
          navigation.goBack();
          return;
        }

        // Проверяем, что заказ можно редактировать
        if (!['new', 'response_received'].includes(orderData.status)) {
          Alert.alert(
            'Нельзя редактировать',
            'Заказ можно редактировать только пока он не находится в работе или не завершен.',
            [{ text: 'ОК', onPress: () => navigation.goBack() }]
          );
          return;
        }

        setOrder(orderData);

        // Заполняем форму данными заказа
        setTitle(orderData.title);
        setDescription(orderData.description);
        setCategory(orderData.category);
        setBudget(orderData.budget.toString());
        setWorkersCount(orderData.workersNeeded.toString());
        setSelectedDate(new Date(orderData.serviceDate));
        setLocation(orderData.location);

        if (orderData.latitude && orderData.longitude) {
          setCoordinates({
            latitude: orderData.latitude,
            longitude: orderData.longitude
          });
        }

        // Преобразуем фотографии в формат mediaFiles
        if (orderData.photos && orderData.photos.length > 0) {
          const mediaFilesFromPhotos = orderData.photos.map((uri, index) => ({
            uri,
            type: isVideoFile(uri) ? 'video' as const : 'image' as const,
            name: `media_${index}`,
            size: 0 // Размер неизвестен для существующих файлов
          }));
          setMediaFiles(mediaFilesFromPhotos);
        }
      } catch (error) {
        console.error('Ошибка загрузки заказа:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить данные заказа');
        navigation.goBack();
      } finally {
        setIsLoadingOrder(false);
      }
    };

    loadOrder();
  }, [orderId, navigation]);

  // Функция для определения видео файлов
  const isVideoFile = (uri: string): boolean => {
    return /\.(mp4|mov|avi|mkv|webm|m4v|3gp|flv|wmv)(\?|$)/i.test(uri) ||
      uri.includes('video') ||
      uri.includes('/video/') ||
      uri.includes('_video_');
  };

  // Функция для получения стиля поля ввода с учетом фокуса
  const getInputStyle = (isFocused: boolean, isTextArea: boolean = false) => [
    styles.input,
    isTextArea && styles.textArea,
    isFocused && styles.inputFocused,
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
    // Для Android закрываем picker после выбора
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

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Завтра';
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      setMediaError(null);

      console.log('[EditOrder] 🚀 Начинаем получение местоположения...');
      const coords = await locationService.getCurrentLocation();
      console.log('[EditOrder] 📍 Получены координаты:', coords);

      if (coords) {
        setCoordinates(coords);
        console.log('[EditOrder] ✅ Координаты сохранены в состоянии');

        // Получаем адрес по координатам
        console.log('[EditOrder] 🔄 Начинаем геокодирование...');
        const geocodeResult = await locationService.reverseGeocode(coords.latitude, coords.longitude);
        console.log('[EditOrder] 🏠 Результат геокодирования:', geocodeResult);

        if (geocodeResult) {
          console.log('[EditOrder] 📝 Устанавливаем адрес:', geocodeResult.address);
          setLocation(geocodeResult.address);
          console.log('[EditOrder] ✅ Местоположение получено:', geocodeResult.address);
        } else {
          const coordsString = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
          console.log('[EditOrder] 📝 Устанавливаем координаты как строку:', coordsString);
          setLocation(coordsString);
          console.log('[EditOrder] ✅ Координаты установлены как адрес');
        }
      } else {
        console.log('[EditOrder] ❌ Координаты не получены');
        setMediaError('Не удалось определить местоположение. Проверьте настройки геолокации в устройстве.');
      }
    } catch (error) {
      console.error('[EditOrder] ❌ Критическая ошибка получения местоположения:', error);
      setMediaError('Произошла ошибка при получении местоположения');
    } finally {
      console.log('[EditOrder] 🏁 Завершение получения местоположения');
      setIsGettingLocation(false);
    }
  };

  const handleAddMedia = async () => {
    try {
      setMediaError(null);

      // Проверяем лимит файлов
      if (mediaFiles.length >= 5) {
        setMediaError('Максимум 5 файлов');
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужно разрешение для доступа к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1.0, // Максимальное качество, оптимизация будет в MediaService
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Проверяем размер файла (максимум 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB в байтах
        if (asset.fileSize && asset.fileSize > maxSize) {
          setMediaError('Файл слишком большой (максимум 50MB)');
          return;
        }

        const newFile = {
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' as const : 'image' as const,
          name: asset.fileName || `media_${Date.now()}`,
          size: asset.fileSize || 0,
        };

        setMediaFiles(prev => [...prev, newFile]);
        console.log('[EditOrder] ✅ Медиа файл добавлен:', newFile.name);
      }
    } catch (error) {
      console.error('[EditOrder] ❌ Ошибка добавления медиа:', error);
      setMediaError('Ошибка при добавлении файла');
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaError(null);
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Введите название заказа');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Ошибка', 'Введите описание заказа');
      return false;
    }
    if (!category) {
      Alert.alert('Ошибка', 'Выберите категорию');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Ошибка', 'Введите адрес или получите текущее местоположение');
      return false;
    }
    if (!budget.trim() || isNaN(Number(budget)) || Number(budget) <= 0) {
      Alert.alert('Ошибка', 'Введите корректный бюджет');
      return false;
    }
    if (!workersCount.trim() || isNaN(Number(workersCount)) || Number(workersCount) <= 0) {
      Alert.alert('Ошибка', 'Введите количество исполнителей');
      return false;
    }
    if (!selectedDate) {
      Alert.alert('Ошибка', 'Выберите дату выполнения');
      return false;
    }

    // Проверяем, что дата не в прошлом
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      Alert.alert('Ошибка', 'Дата выполнения не может быть в прошлом');
      return false;
    }

    return true;
  };

  const handleUpdateOrder = async () => {
    if (!validateForm() || !order) return;

    try {
      setIsLoading(true);
      setMediaError(null);

      console.log('[EditOrder] 🔄 Начинаем обновление заказа...');

      // Загружаем новые медиа файлы
      let uploadedMediaUrls: string[] = [];

      if (mediaFiles.length > 0) {
        setIsUploadingMedia(true);
        console.log('[EditOrder] 📤 Загружаем медиа файлы...');

        // Разделяем файлы на существующие (с http URL) и новые (локальные)
        const existingFiles: string[] = [];
        const newFiles: Array<{ uri: string; type: 'image' | 'video'; name: string; size: number }> = [];

        mediaFiles.forEach(file => {
          if (file.uri.startsWith('http')) {
            // Существующий файл - просто добавляем его URL
            existingFiles.push(file.uri);
          } else {
            // Новый файл - нужно загрузить
            newFiles.push(file);
          }
        });

        console.log('[EditOrder] 📋 Существующих файлов:', existingFiles.length);
        console.log('[EditOrder] 📋 Новых файлов для загрузки:', newFiles.length);

        // Загружаем только новые файлы
        if (newFiles.length > 0) {
          console.log('[EditOrder] 📤 Вызываем mediaService.uploadMediaFiles...');
          const mediaUploadResult = await mediaService.uploadMediaFiles(newFiles);
          console.log('[EditOrder] 📥 Результат загрузки медиа:', mediaUploadResult);

          if (mediaUploadResult.success && mediaUploadResult.urls) {
            console.log('[EditOrder] ✅ Новые файлы загружены:', mediaUploadResult.urls);
            uploadedMediaUrls = [...existingFiles, ...mediaUploadResult.urls];
          } else {
            console.error('[EditOrder] ❌ Ошибка загрузки новых файлов:', mediaUploadResult.error);
            throw new Error(mediaUploadResult.error || 'Ошибка загрузки медиа файлов');
          }
        } else {
          // Только существующие файлы
          uploadedMediaUrls = existingFiles;
        }

        setIsUploadingMedia(false);
        console.log('[EditOrder] ✅ Все медиа файлы обработаны, итого:', uploadedMediaUrls.length);
      }

      // Подготавливаем данные для обновления
      const updateData: UpdateOrderRequest = {
        orderId: order.id,
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        budget: Number(budget),
        workersNeeded: Number(workersCount),
        photos: uploadedMediaUrls,
        // Примечание: serviceDate намеренно исключена - дату нельзя изменять
      };

      console.log('[EditOrder] 📝 Данные для обновления:', {
        ...updateData,
        photos: `${uploadedMediaUrls.length} файлов`
      });

      const result = await orderService.updateOrder(updateData);

      if (result.success) {
        console.log('[EditOrder] ✅ Заказ успешно обновлен');
        Alert.alert(
          'Успешно',
          'Заказ обновлен',
          [{ text: 'ОК', onPress: () => navigation.goBack() }]
        );
      } else {
        console.error('[EditOrder] ❌ Ошибка обновления заказа:', result.error);
        Alert.alert('Ошибка', result.error || 'Не удалось обновить заказ');
      }
    } catch (error) {
      console.error('[EditOrder] ❌ Критическая ошибка обновления заказа:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при обновлении заказа');
    } finally {
      setIsLoading(false);
      setIsUploadingMedia(false);
    }
  };

  // Показываем загрузку пока загружаются данные заказа
  if (isLoadingOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загружаем данные заказа...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Заказ не найден</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBack />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Редактировать заказ</Text>
            <Text style={styles.subtitle}>Внесите необходимые изменения</Text>
          </View>

          {/* Название заказа */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Название заказа</Text>
            <TextInput
              style={getInputStyle(titleFocused)}
              value={title}
              onChangeText={setTitle}
              placeholder="Например: Покрасить забор"
              placeholderTextColor={theme.colors.text.secondary}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
            />
          </View>

          {/* Описание */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Описание работы</Text>
            <TextInput
              style={getInputStyle(descriptionFocused, true)}
              value={description}
              onChangeText={setDescription}
              placeholder="Опишите подробно, что нужно сделать..."
              placeholderTextColor={theme.colors.text.secondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => setDescriptionFocused(true)}
              onBlur={() => setDescriptionFocused(false)}
            />
          </View>

          {/* Категория */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Категория</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.label}
                  style={[
                    styles.categoryCard,
                    category === cat.label && styles.categoryCardSelected,
                  ]}
                  onPress={() => setCategory(cat.label)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      category === cat.label && styles.categoryLabelSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Адрес */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Адрес выполнения</Text>
            <TextInput
              style={getInputStyle(locationFocused)}
              value={location}
              onChangeText={setLocation}
              placeholder="Введите адрес"
              placeholderTextColor={theme.colors.text.secondary}
              onFocus={() => setLocationFocused(true)}
              onBlur={() => setLocationFocused(false)}
            />
            <TouchableOpacity
              style={[styles.locationButton, isGettingLocation && styles.locationButtonDisabled]}
              onPress={handleGetCurrentLocation}
              disabled={isGettingLocation}
              activeOpacity={0.8}
            >
              <Text style={styles.locationButtonText}>
                {isGettingLocation ? '📍 Получаем...' : '📍 Мое местоположение'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Бюджет и количество исполнителей */}
          <View style={styles.row}>
            <View style={[styles.section, styles.halfWidth]}>
              <Text style={styles.sectionTitle}>Бюджет (сум)</Text>
              <TextInput
                style={getInputStyle(budgetFocused)}
                value={budget}
                onChangeText={setBudget}
                placeholder="10000"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="numeric"
                onFocus={() => setBudgetFocused(true)}
                onBlur={() => setBudgetFocused(false)}
              />
            </View>
            <View style={[styles.section, styles.halfWidth]}>
              <Text style={styles.sectionTitle}>Исполнителей</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => {
                    const current = parseInt(workersCount) || 1;
                    if (current > 1) {
                      setWorkersCount((current - 1).toString());
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{workersCount}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => {
                    const current = parseInt(workersCount) || 1;
                    if (current < 10) {
                      setWorkersCount((current + 1).toString());
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Дата выполнения - ТОЛЬКО ОТОБРАЖЕНИЕ, БЕЗ ВОЗМОЖНОСТИ ИЗМЕНЕНИЯ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Дата выполнения</Text>
            <View style={[styles.dateButton, styles.dateButtonDisabled]}>
              <CalendarDateIcon width={20} height={20} color={theme.colors.text.secondary} />
              <Text style={[styles.dateButtonText, styles.dateButtonTextDisabled]}>
                {formatDate(selectedDate)}
              </Text>
            </View>
            <Text style={styles.dateNote}>
              💡 Дату выполнения заказа нельзя изменить
            </Text>
          </View>

          {/* Медиа файлы */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Фото и видео (необязательно)</Text>
            <Text style={styles.sectionSubtitle}>
              Добавьте до 5 файлов, чтобы лучше показать задачу
            </Text>

            {/* Превью медиа файлов */}
            {mediaFiles.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreview}>
                {mediaFiles.map((file, index) => (
                  <View key={index} style={styles.mediaItem}>
                    {file.type === 'video' ? (
                      <VideoPreview uri={file.uri} />
                    ) : (
                      <Image source={{ uri: file.uri }} style={styles.mediaImage} />
                    )}
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={() => handleRemoveMedia(index)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.removeMediaButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Кнопка добавления медиа */}
            {mediaFiles.length < 5 && (
              <TouchableOpacity
                style={styles.addMediaButton}
                onPress={handleAddMedia}
                activeOpacity={0.8}
              >
                <ImageIcon width={24} height={24} color={theme.colors.primary} />
                <Text style={styles.addMediaButtonText}>Добавить фото/видео</Text>
              </TouchableOpacity>
            )}

            {/* Ошибка медиа */}
            {mediaError && (
              <Text style={styles.errorText}>{mediaError}</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Кнопка обновления */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.updateButton, (isLoading || isUploadingMedia) && styles.updateButtonDisabled]}
          onPress={handleUpdateOrder}
          disabled={isLoading || isUploadingMedia}
          activeOpacity={0.8}
        >
          <Text style={styles.updateButtonText}>
            {isUploadingMedia ? 'Загружаем файлы...' : isLoading ? 'Обновляем...' : 'Обновить заказ'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker для iOS */}
      {showDatePicker && Platform.OS === 'ios' && (
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={styles.datePickerCancel}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={styles.datePickerDone}>Готово</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            minimumDate={new Date()}
            locale="ru-RU"
          />
        </View>
      )}

      {/* Date Picker для Android */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120, // Отступ для кнопки
  },
  header: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryCardSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  categoryLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  categoryLabelSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semiBold,
  },
  locationButton: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  counterButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  counterButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
  },
  counterValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  dateButtonDisabled: {
    opacity: 0.6,
    backgroundColor: theme.colors.disabled,
  },
  dateButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  dateButtonTextDisabled: {
    color: theme.colors.text.secondary,
  },
  dateNote: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  mediaPreview: {
    marginBottom: theme.spacing.md,
  },
  mediaItem: {
    width: 80,
    height: 80,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMediaButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.fonts.weights.bold,
  },
  addMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    gap: theme.spacing.sm,
  },
  addMediaButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
  },
  errorText: {
    color: '#FF4444',
    fontSize: theme.fonts.sizes.sm,
    marginTop: theme.spacing.xs,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  updateButtonDisabled: {
    backgroundColor: theme.colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  updateButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  datePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  datePickerCancel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fonts.sizes.md,
  },
  datePickerDone: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
});
