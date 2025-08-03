import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { locationService, LocationCoords } from '../../services/locationService';
import { Order } from '../../types';
import { PriceConfirmationModal, ProposePriceModal, ModernActionButton } from '../../components/common';
import { ModernOrderCard } from '../../components/cards';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WorkerStackParamList } from '../../types/navigation';

type WorkerNavigationProp = NativeStackNavigationProp<WorkerStackParamList>;

// Отдельный компонент для карточки заказа
const JobCard: React.FC<{
  item: Order;
  onApply: (orderId: string) => void;
  hasApplied?: boolean;
  navigation: WorkerNavigationProp;
  userLocation?: LocationCoords;
}> = ({ item, onApply, hasApplied = false, navigation, userLocation }) => {
  const actionButton = (
    <ModernActionButton
      title={hasApplied ? 'Отклик отправлен' : 'Откликнуться'}
      onPress={hasApplied ? undefined : () => onApply(item.id)}
      disabled={hasApplied}
      variant={hasApplied ? 'disabled' : 'primary'}
      size="small"
    />
  );

  return (
    <ModernOrderCard
      order={item}
      onPress={() => navigation.navigate('JobDetails', { orderId: item.id })}
      showApplicantsCount={false}
      showCreateTime={false}
      actionButton={actionButton}
      userLocation={userLocation}
      workerView={true}
    />
  );
};

const WorkerJobsScreen: React.FC = () => {
  const navigation = useNavigation<WorkerNavigationProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>('Все');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [priceConfirmationVisible, setPriceConfirmationVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [userApplications, setUserApplications] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState<LocationCoords | undefined>(undefined);

  // Функция загрузки заказов
  const loadOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Используем новый метод который автоматически исключает заказы с откликами
      const [availableOrders, applications] = await Promise.all([
        orderService.getAvailableOrdersForWorker(),
        orderService.getUserApplications()
      ]);

      console.log(`[WorkerJobsScreen] Загружено ${availableOrders.length} доступных заказов (без тех, на которые уже отправлен отклик)`);
      console.log(`[WorkerJobsScreen] Найдено ${applications.size} откликов пользователя`);

      setOrders(availableOrders);
      setUserApplications(applications);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить заказы');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Загружаем заказы и местоположение при первом открытии экрана
  useEffect(() => {
    loadOrders();
    console.log('[WorkerJobsScreen] Используем только Supabase');

    // Получаем местоположение пользователя
    const getUserLocation = async () => {
      try {
        const coords = await locationService.getCurrentLocation();
        if (coords) {
          setUserLocation(coords);
          console.log('[WorkerJobsScreen] Местоположение пользователя получено:', coords);
        }
      } catch (error) {
        console.log('[WorkerJobsScreen] Не удалось получить местоположение:', error);
      }
    };

    getUserLocation();
  }, []);

  // Real-time обновления временно отключены
  // TODO: Реализовать real-time подписки через Supabase

  // Обновляем заказы при возвращении на экран
  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

  // Фильтрация заказов
  useEffect(() => {
    let filtered = orders.filter(order => {
      const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || selectedCategory === 'Все' || order.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    setFilteredOrders(filtered);
  }, [orders, searchQuery, selectedCategory]);

  // Получение категорий с счетчиками
  const getCategories = () => {
    const allCategories = [...new Set(orders.map(order => order.category))];
    const categories = [
      { label: 'Все', emoji: '📋', count: orders.length },
      ...allCategories.map(category => ({
        label: category,
        emoji: getCategoryEmoji(category),
        count: orders.filter(order => order.category === category).length
      }))
    ];
    return categories;
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      'Стройка': '🏗️',
      'Уборка': '🧹',
      'Сад': '🌳',
      'Общепит': '🍽️',
      'Переезд': '🚚',
      'Ремонт техники': '🔧',
      'Доставка': '🚴',
      'Красота': '💄',
      'Обучение': '📚',
      'Прочее': '✨'
    };
    return emojiMap[category] || '✨';
  };

  const handleApplyToJob = async (orderId: string) => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        Alert.alert('Ошибка', 'Необходимо войти в систему');
        return;
      }

      // Находим заказ для показа в модалке
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        Alert.alert('Ошибка', 'Заказ не найден');
        return;
      }

      // Показываем модалку подтверждения цены
      setSelectedOrder(order);
      setPriceConfirmationVisible(true);
    } catch (error) {
      console.error('Ошибка при открытии формы отклика:', error);
      Alert.alert('Ошибка', 'Произошла ошибка');
    }
  };

  const handleAcceptPrice = async () => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user || !selectedOrder) {
        Alert.alert('Ошибка', 'Необходимо войти в систему');
        return;
      }

      // Закрываем модалку подтверждения
      setPriceConfirmationVisible(false);

      // Создаем отклик с исходной ценой заказа
      const applicantCreated = await orderService.createApplicant({
        orderId: selectedOrder.id,
        workerId: authState.user.id,
        message: '',
        proposedPrice: selectedOrder.budget
      });

      if (applicantCreated) {
        // Добавляем заказ в список откликов пользователя
        setUserApplications(prev => new Set([...prev, selectedOrder.id]));

        // Мгновенно убираем заказ из списка доступных
        setOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
        setFilteredOrders(prev => prev.filter(order => order.id !== selectedOrder.id));

        Alert.alert(
          'Успешно!',
          'Отклик отправлен! Заказ перемещен в раздел "История".',
          [
            {
              text: 'ОК',
              onPress: () => {
                setSelectedOrder(null);
              }
            }
          ]
        );
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить отклик');
      }
    } catch (error) {
      console.error('Ошибка отклика на заказ:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при отправке отклика');
    }
  };

  const handleProposePrice = () => {
    // Закрываем модалку подтверждения и показываем модалку предложения цены
    setPriceConfirmationVisible(false);
    setModalVisible(true);
  };

  const handleSubmitProposal = async (proposedPrice: number, message: string) => {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user || !selectedOrder) {
        Alert.alert('Ошибка', 'Необходимо войти в систему');
        return;
      }

      // Создаем отклик с предложенной ценой
      const applicantCreated = await orderService.createApplicant({
        orderId: selectedOrder.id,
        workerId: authState.user.id,
        message: message,
        proposedPrice: proposedPrice
      });

      if (applicantCreated) {
        // Добавляем заказ в список откликов пользователя
        setUserApplications(prev => new Set([...prev, selectedOrder.id]));

        // Мгновенно убираем заказ из списка доступных
        setOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
        setFilteredOrders(prev => prev.filter(order => order.id !== selectedOrder.id));

        Alert.alert(
          'Успешно!',
          'Отклик отправлен! Заказ перемещен в раздел "История".',
          [
            {
              text: 'ОК',
              onPress: () => {
                setSelectedOrder(null);
              }
            }
          ]
        );
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить отклик');
      }
    } catch (error) {
      console.error('Ошибка отклика на заказ:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при отправке отклика');
    }
  };

  const renderJobCard = ({ item }: { item: Order }) => {
    const hasApplied = userApplications.has(item.id);
    return (
      <JobCard
        item={item}
        onApply={handleApplyToJob}
        hasApplied={hasApplied}
        navigation={navigation}
        userLocation={userLocation}
      />
    );
  };

  const categories = getCategories();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.content}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Загружаем заказы...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.title}>Доступные заказы</Text>
          <Text style={styles.subtitle}>
            {orders.length > 0 ? `Найдено ${orders.length} заказов` : 'Новых заказов пока нет'}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск заказов..."
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Улучшенная карусель категорий */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.label && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category.label)}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.label && styles.categoryChipTextActive
                ]}>
                  {category.label}
                </Text>
                <Text style={[
                  styles.categoryChipCount,
                  selectedCategory === category.label && styles.categoryChipCountActive
                ]}>
                  ({category.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredOrders}
          renderItem={renderJobCard}
          keyExtractor={(item) => item.id}
          style={styles.jobsList}
          contentContainerStyle={styles.jobsListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadOrders(true)}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📋</Text>
              <Text style={styles.emptyStateTitle}>Нет заказов</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery || selectedCategory !== 'Все'
                  ? 'По вашему запросу заказы не найдены'
                  : 'Пока нет доступных заказов.\nПотяните вниз, чтобы обновить.'}
              </Text>
            </View>
          }
        />
      </SafeAreaView>

      {/* Модалка подтверждения цены */}
      <PriceConfirmationModal
        visible={priceConfirmationVisible}
        onClose={() => {
          setPriceConfirmationVisible(false);
          setSelectedOrder(null);
        }}
        onAcceptPrice={handleAcceptPrice}
        onProposePrice={handleProposePrice}
        orderPrice={selectedOrder?.budget || 0}
        orderTitle={selectedOrder?.title || ''}
      />

      {/* Модалка предложения цены */}
      <ProposePriceModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleSubmitProposal}
        originalPrice={selectedOrder?.budget || 0}
        orderTitle={selectedOrder?.title || ''}
      />
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
  },
  contentHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoriesSection: {
    marginBottom: theme.spacing.md,
  },
  categoriesContainer: {
    paddingLeft: theme.spacing.lg,
  },
  categoriesContent: {
    paddingRight: theme.spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  categoryChipText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs,
  },
  categoryChipTextActive: {
    color: theme.colors.background,
  },
  categoryChipCount: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
  },
  categoryChipCountActive: {
    color: theme.colors.background,
  },
  jobsList: {
    flex: 1,
  },
  jobsListContent: {
    paddingTop: theme.spacing.sm,
  },
  jobCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  jobTitle: {
    flex: 1,
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  jobBudget: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  categoryContainer: {
    marginBottom: theme.spacing.sm,
  },
  jobCategory: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
  jobDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  jobDetailsLayout: {
    marginBottom: theme.spacing.md,
  },
  locationCard: {
    marginBottom: theme.spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCard: {
    flex: 1,
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicantsText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  appliedButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  applyButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.background,
  },
  appliedButtonText: {
    color: theme.colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyStateTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export { WorkerJobsScreen }; 