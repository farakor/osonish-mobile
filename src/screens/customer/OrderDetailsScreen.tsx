import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { theme } from '../../constants';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CustomerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CalendarDateIcon from '../../../assets/calendar-date.svg';
import { VideoView, useVideoPlayer } from 'expo-video';

type OrderDetailsRouteProp = RouteProp<CustomerStackParamList, 'OrderDetails'>;
type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

interface MediaFile {
  uri: string;
  type: 'image' | 'video';
  name: string;
  size: number;
}

interface OrderData {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  workersCount: number;
  date: string;
  location: string;
  status: 'active' | 'completed';
  createdAt: string;
  applicantsCount: number;
  mediaFiles: MediaFile[];
}

interface Applicant {
  id: string;
  name: string;
  rating: number;
  completedJobs: number;
  avatar?: string;
  message: string;
  appliedAt: string;
}

// Компонент для превью видео
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

// Моковые данные заказа
const mockOrder: OrderData = {
  id: '1',
  title: 'Уборка 2-комнатной квартиры',
  description: 'Нужно сделать генеральную уборку двухкомнатной квартиры. Помыть полы, окна, пропылесосить ковры, убрать кухню и ванную комнату.',
  category: 'Уборка',
  budget: '150 000',
  workersCount: 2,
  date: '2024-01-15',
  location: 'Ташкент, Юнусабад',
  status: 'active',
  createdAt: '2 часа назад',
  applicantsCount: 5,
  mediaFiles: [
    {
      uri: 'https://example.com/image1.jpg',
      type: 'image',
      name: 'room1.jpg',
      size: 1024
    },
    {
      uri: 'https://example.com/image2.jpg',
      type: 'image',
      name: 'room2.jpg',
      size: 2048
    }
  ]
};

// Моковые данные откликов
const mockApplicants: Applicant[] = [
  {
    id: '1',
    name: 'Анна Петрова',
    rating: 4.8,
    completedJobs: 42,
    message: 'Здравствуйте! Имею большой опыт в уборке квартир. Могу выполнить заказ качественно и в срок.',
    appliedAt: '1 час назад'
  },
  {
    id: '2',
    name: 'Мария Сидорова',
    rating: 4.6,
    completedJobs: 28,
    message: 'Готова приступить к работе сегодня. Все необходимые средства для уборки есть.',
    appliedAt: '2 часа назад'
  },
  {
    id: '3',
    name: 'Елена Иванова',
    rating: 4.9,
    completedJobs: 67,
    message: 'Профессиональная уборка с гарантией качества. Работаю быстро и аккуратно.',
    appliedAt: '3 часа назад'
  },
  {
    id: '4',
    name: 'Ольга Козлова',
    rating: 4.7,
    completedJobs: 35,
    message: 'Здравствуйте! Готова выполнить уборку в удобное для вас время.',
    appliedAt: '4 часа назад'
  },
  {
    id: '5',
    name: 'Татьяна Смирнова',
    rating: 4.5,
    completedJobs: 19,
    message: 'Опытный работник, все делаю качественно и в срок.',
    appliedAt: '5 часов назад'
  }
];

export const OrderDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OrderDetailsRouteProp>();
  const { orderId } = route.params;

  const [showApplicants, setShowApplicants] = useState(false);
  const [order] = useState<OrderData>(mockOrder);
  const [applicants] = useState<Applicant[]>(mockApplicants);

  const getStatusColor = (status: OrderData['status']) => {
    switch (status) {
      case 'active':
        return theme.colors.primary;
      case 'completed':
        return '#6B7280';
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusText = (status: OrderData['status']) => {
    switch (status) {
      case 'active':
        return 'Активный';
      case 'completed':
        return 'Завершен';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDeleteOrder = () => {
    Alert.alert(
      'Удалить заказ',
      'Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: API запрос для удаления заказа
              await new Promise(resolve => setTimeout(resolve, 1000));
              Alert.alert('Успешно', 'Заказ удален');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить заказ');
            }
          }
        }
      ]
    );
  };

  const renderApplicant = ({ item }: { item: Applicant }) => (
    <View style={styles.applicantCard}>
      <View style={styles.applicantHeader}>
        <View style={styles.applicantInfo}>
          <Text style={styles.applicantName}>{item.name}</Text>
          <View style={styles.applicantStats}>
            <Text style={styles.applicantRating}>⭐ {item.rating}</Text>
            <Text style={styles.applicantJobs}>• {item.completedJobs} заказов</Text>
          </View>
        </View>
        <Text style={styles.applicantTime}>{item.appliedAt}</Text>
      </View>
      <Text style={styles.applicantMessage}>{item.message}</Text>
      <View style={styles.applicantActions}>
        <TouchableOpacity style={styles.acceptButton}>
          <Text style={styles.acceptButtonText}>Принять</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectButton}>
          <Text style={styles.rejectButtonText}>Отклонить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Назад</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteOrder}>
            <Text style={styles.deleteButton}>Удалить</Text>
          </TouchableOpacity>
        </View>

        {/* Order Title and Status */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{order.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация о заказе</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Категория:</Text>
            <Text style={styles.infoValue}>{order.category}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Бюджет:</Text>
            <Text style={styles.infoValue}>{order.budget} сум</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Работников:</Text>
            <Text style={styles.infoValue}>{order.workersCount}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Дата:</Text>
            <View style={styles.dateValue}>
              <CalendarDateIcon width={16} height={16} stroke={theme.colors.text.primary} />
              <Text style={styles.infoValue}>{formatDate(order.date)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Местоположение:</Text>
            <Text style={styles.infoValue}>{order.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Создан:</Text>
            <Text style={styles.infoValue}>{order.createdAt}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.description}>{order.description}</Text>
        </View>

        {/* Media Files */}
        {order.mediaFiles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Фото и видео</Text>
            <View style={styles.mediaGrid}>
              {order.mediaFiles.map((file, index) => (
                <View key={index} style={styles.mediaItem}>
                  {file.type === 'image' ? (
                    <Image source={{ uri: file.uri }} style={styles.mediaImage} resizeMode="cover" />
                  ) : (
                    <VideoPreview uri={file.uri} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Applicants Section */}
        <View style={styles.section}>
          <View style={styles.applicantsHeader}>
            <Text style={styles.sectionTitle}>Отклики ({order.applicantsCount})</Text>
            <TouchableOpacity
              style={styles.viewApplicantsButton}
              onPress={() => setShowApplicants(true)}
            >
              <Text style={styles.viewApplicantsText}>Посмотреть все</Text>
            </TouchableOpacity>
          </View>

          {applicants.slice(0, 2).map((applicant) => (
            <View key={applicant.id} style={styles.applicantPreview}>
              <View style={styles.applicantHeader}>
                <View style={styles.applicantInfo}>
                  <Text style={styles.applicantName}>{applicant.name}</Text>
                  <View style={styles.applicantStats}>
                    <Text style={styles.applicantRating}>⭐ {applicant.rating}</Text>
                    <Text style={styles.applicantJobs}>• {applicant.completedJobs} заказов</Text>
                  </View>
                </View>
                <Text style={styles.applicantTime}>{applicant.appliedAt}</Text>
              </View>
              <Text style={styles.applicantMessage} numberOfLines={2}>
                {applicant.message}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Applicants Modal */}
      <Modal
        visible={showApplicants}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Отклики ({applicants.length})</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowApplicants(false)}
            >
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={applicants}
            renderItem={renderApplicant}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.applicantsList}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  deleteButton: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.medium,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.md,
  },
  statusBadge: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  dateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: theme.spacing.xs,
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  applicantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewApplicantsButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  viewApplicantsText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  applicantPreview: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  applicantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  applicantStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantRating: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  applicantJobs: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  applicantTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  applicantMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  closeButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  applicantsList: {
    padding: theme.spacing.lg,
  },
  applicantCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  applicantActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rejectButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
}); 