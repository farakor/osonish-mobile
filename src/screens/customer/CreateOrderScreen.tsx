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
} from 'react-native';
import { theme } from '../../constants';

export const CreateOrderScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [workersCount, setWorkersCount] = useState('1');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Показываем только 6 категорий
  const categories = [
    'Уборка дома',
    'Ремонт техники',
    'Доставка',
    'Репетиторство',
    'Красота',
    'Строительство'
  ];

  const handleDatePress = () => {
    // Для простоты используем Alert для выбора даты
    // В реальном приложении здесь будет DatePicker
    Alert.alert(
      'Выбор даты',
      'Выберите дату выполнения заказа:',
      [
        { text: 'Сегодня', onPress: () => setSelectedDate(new Date()) },
        {
          text: 'Завтра', onPress: () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setSelectedDate(tomorrow);
          }
        },
        {
          text: 'Через 3 дня', onPress: () => {
            const threeDays = new Date();
            threeDays.setDate(threeDays.getDate() + 3);
            setSelectedDate(threeDays);
          }
        },
        {
          text: 'Через неделю', onPress: () => {
            const oneWeek = new Date();
            oneWeek.setDate(oneWeek.getDate() + 7);
            setSelectedDate(oneWeek);
          }
        },
        { text: 'Отмена', style: 'cancel' },
      ]
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Выберите дату';
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category || !budget.trim()) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: API запрос для создания заказа
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Успешно', 'Заказ создан! Исполнители скоро увидят его.');
      // Очистка формы
      setTitle('');
      setDescription('');
      setCategory('');
      setBudget('');
      setWorkersCount('1');
      setSelectedDate(null);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать заказ. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Создать заказ</Text>
          <Text style={styles.subtitle}>Опишите, что вам нужно</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Название заказа *</Text>
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
            <Text style={styles.label}>Категория *</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipSelected
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextSelected
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Описание *</Text>
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

          {/* Budget */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Бюджет (сум) *</Text>
            <TextInput
              style={styles.input}
              value={budget}
              onChangeText={setBudget}
              placeholder="100000"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="numeric"
            />
          </View>

          {/* Workers Count */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Количество работников *</Text>
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
            <Text style={styles.label}>Дата выполнения</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={handleDatePress}
            >
              <Text style={[
                styles.dateButtonText,
                !selectedDate && styles.dateButtonPlaceholder
              ]}>
                📅  {formatDate(selectedDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Создаем заказ...' : 'Опубликовать заказ'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            * - обязательные поля
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
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
}); 