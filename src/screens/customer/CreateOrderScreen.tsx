import React, { useState } from 'react';
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
import { CreateOrderRequest } from '../../types';
import { useNavigation } from '@react-navigation/native';


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

export const CreateOrderScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [workersCount, setWorkersCount] = useState('1');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<Array<{ uri: string; type: 'image' | 'video'; name: string; size: number }>>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [location, setLocation] = useState('');

  const navigation = useNavigation();

  // УДАЛЕНО: // Создаём массив videoPlayers для всех mediaFiles (только для видео)
  // const videoPlayers = mediaFiles.map(file =>
  //   file.type === 'video' ? useVideoPlayer(file.uri) : null
  // );

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
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Форматирование суммы с пробелами
  function formatBudgetInput(value: string) {
    // Удаляем все нецифры
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    // Форматируем с пробелами
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // Функция выбора фото/видео с логами и проверкой разрешений
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

  // Универсальная обработка результата выбора/съёмки
  const handleMediaResult = (result: any) => {
    // Логируем результат выбора
    console.log('ImagePicker result:', result);
    if (result.assets) {
      result.assets.forEach((asset: any) => console.log('asset:', asset));
    }
    if (!result.canceled) {
      let newFiles = result.assets
        .filter((asset: any) => {
          if (asset.fileSize && asset.fileSize > 20 * 1024 * 1024) {
            setMediaError('Файл превышает 20 МБ: ' + (asset.fileName || asset.uri));
            return false;
          }
          if (!['image', 'video'].includes(asset.type ?? '')) {
            setMediaError('Можно загружать только фото и видео');
            return false;
          }
          return true;
        })
        .map((asset: any) => ({
          uri: asset.uri,
          type: (asset.type ?? 'file') as 'image' | 'video',
          name: asset.fileName || asset.uri.split('/').pop() || 'file',
          size: asset.fileSize || 0,
        }));
      setMediaFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    }
  };

  // Удаление файла
  const removeMedia = (index: number) => {
    setMediaFiles(files => files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category || !budget.trim() || !selectedDate || !location.trim()) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля, включая местоположение и дату выполнения');
      return;
    }

    setIsLoading(true);
    try {
      // Подготавливаем данные для создания заказа
      const orderData: CreateOrderRequest = {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        budget: parseFloat(budget.replace(/[^\d]/g, '')), // убираем форматирование и преобразуем в число
        workersNeeded: parseInt(workersCount),
        serviceDate: selectedDate!.toISOString(),
        photos: mediaFiles.filter(file => file.type === 'image').map(file => file.uri),
      };

      // Создаем заказ
      const response = await orderService.createOrder(orderData);

      if (response.success) {
        Alert.alert(
          'Успешно!',
          'Заказ создан! Исполнители скоро увидят его.',
          [
            {
              text: 'ОК',
              onPress: () => {
                // Очистка формы
                setTitle('');
                setDescription('');
                setCategory('');
                setBudget('');
                setWorkersCount('1');
                setSelectedDate(null);
                setLocation('');
                setMediaFiles([]);

                // Возвращаемся на главный экран
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Ошибка', response.error || 'Не удалось создать заказ. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      Alert.alert('Ошибка', 'Не удалось создать заказ. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.contentHeader}>
            <Text style={styles.title}>Создать заказ</Text>
            <Text style={styles.subtitle}>Опишите, что вам нужно</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Название заказа <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Например: Уборка квартиры"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Категория <Text style={styles.required}>*</Text></Text>
              <View style={styles.categoriesGrid}>
                {categories.map((cat, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.categoryChip,
                      category === cat.label && styles.categoryChipSelected
                    ]}
                    onPress={() => setCategory(cat.label)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      category === cat.label && styles.categoryChipTextSelected
                    ]}>
                      {cat.emoji} {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Описание <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Подробно опишите, что нужно сделать..."
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Местоположение <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Например: Ташкент, Юнусабад"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>

            {/* Budget */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Сумма за одного работника <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={formatBudgetInput(budget)}
                onChangeText={text => setBudget(formatBudgetInput(text))}
                placeholder="100 000"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="numeric"
              />
            </View>

            {/* Workers Count */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Количество работников <Text style={styles.required}>*</Text></Text>
              <View style={styles.workersCountContainer}>
                <TouchableOpacity
                  style={styles.workersCountButton}
                  onPress={() => {
                    const count = Math.max(1, parseInt(workersCount) - 1);
                    setWorkersCount(count.toString());
                  }}
                >
                  <Text style={styles.workersCountButtonText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.workersCountInput}
                  value={workersCount}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    if (num >= 1 && num <= 20) {
                      setWorkersCount(text);
                    }
                  }}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.workersCountButton}
                  onPress={() => {
                    const count = Math.min(20, parseInt(workersCount) + 1);
                    setWorkersCount(count.toString());
                  }}
                >
                  <Text style={styles.workersCountButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Дата выполнения <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={showDatePickerHandler}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarDateIcon width={20} height={20} style={{ marginRight: theme.spacing.sm }} fill="none" stroke={theme.colors.text.primary} />
                  <Text style={[
                    styles.dateButtonText,
                    !selectedDate && styles.dateButtonPlaceholder
                  ]}>
                    {formatDate(selectedDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Media Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Фото и видео</Text>
              <View style={styles.mediaList}>
                {mediaFiles.map((file, idx) => (
                  <View key={file.uri} style={styles.mediaItem}>
                    {file.type === 'image' ? (
                      <Image source={{ uri: file.uri }} style={styles.mediaImage} resizeMode="cover" />
                    ) : (
                      <VideoPreview uri={file.uri} />
                    )}
                    <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia(idx)}>
                      <Text style={styles.removeMediaText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {mediaFiles.length < 5 && (
                  <TouchableOpacity style={styles.addMediaBtn} onPress={pickMedia}>
                    <ImageIcon width={28} height={28} />
                    <Text style={styles.addMediaText}>Добавить</Text>
                  </TouchableOpacity>
                )}
              </View>
              {mediaError && <Text style={styles.mediaError}>{mediaError}</Text>}
            </View>

            {/* Note */}
          </View>
        </ScrollView>

        {/* Fixed Submit Button */}
        {!showDatePicker && (
          <View style={styles.fixedButtonContainer}>
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Создаем заказ...' : 'Опубликовать заказ'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  form: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  textArea: {
    height: 100,
    paddingTop: theme.spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryChip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minWidth: '48%',
    alignItems: 'center',
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  categoryChipTextSelected: {
    color: theme.colors.white,
  },
  workersCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
  },
  workersCountButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workersCountButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  workersCountInput: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    minWidth: 100,
    textAlign: 'center',
  },
  dateButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  dateButtonPlaceholder: {
    color: theme.colors.text.secondary,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  note: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  datePickerContainer: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  doneButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  scrollContent: {
    paddingBottom: 120, // чтобы не перекрывать полями кнопку
  },
  fixedButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg + 8,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 10,
  },
  required: {
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.bold,
  },
  mediaList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  mediaItem: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
  mediaVideoWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  playIcon: {
    color: theme.colors.white,
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  removeMediaText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  addMediaBtn: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  addMediaText: {
    color: theme.colors.primary,
    fontSize: 12,
    marginTop: 4,
  },
  mediaError: {
    color: theme.colors.error || 'red',
    fontSize: 12,
    marginTop: 4,
  },
}); 