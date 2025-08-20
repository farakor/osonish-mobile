import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { theme } from '../../constants/theme';
import { Order } from '../../types';
import { locationService, LocationCoords } from '../../services/locationService';

// SVG импорты
import CalendarIcon from '../../../assets/card-icons/calendar.svg';
import LocationIcon from '../../../assets/card-icons/location.svg';
import CategoryIcon from '../../../assets/card-icons/category.svg';
import OtklikiIcon from '../../../assets/card-icons/otkliki.svg';

interface ModernOrderCardProps {
  order: Order;
  onPress: () => void;
  showApplicantsCount?: boolean;
  showCreateTime?: boolean;
  actionButton?: React.ReactNode;
  userLocation?: LocationCoords; // Местоположение пользователя для расчета дистанции
  workerView?: boolean; // Режим отображения для исполнителей
}

export const ModernOrderCard: React.FC<ModernOrderCardProps> = ({
  order,
  onPress,
  showApplicantsCount = true,
  showCreateTime = true,
  actionButton,
  userLocation,
  workerView = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const formatBudget = (amount: number) => {
    return `${amount.toLocaleString('ru-RU')} сум`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} минут назад`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} часов назад`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} дней назад`;
    }
  };

  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return {
          text: 'Новый',
          color: theme.colors.primary,
          backgroundColor: theme.colors.primary + '20',
        };
      case 'response_received':
        // Для исполнителей показываем как "Новый", для заказчиков - "Отклик получен"
        if (workerView) {
          return {
            text: 'Новый',
            color: theme.colors.primary,
            backgroundColor: theme.colors.primary + '20',
          };
        } else {
          return {
            text: 'Отклик получен',
            color: '#FFFFFF',
            backgroundColor: theme.colors.primary,
          };
        }
      case 'in_progress':
        return {
          text: 'В работе',
          color: '#F59E0B',
          backgroundColor: '#FEF3C7',
        };
      case 'completed':
        return {
          text: 'Завершен',
          color: '#6B7280',
          backgroundColor: '#F3F4F6',
        };
      case 'cancelled':
        return {
          text: 'Отменен',
          color: '#EF4444',
          backgroundColor: '#FEE2E2',
        };
      case 'rejected':
        return {
          text: 'Отклонен',
          color: '#EF4444',
          backgroundColor: '#FEE2E2',
        };
      default:
        return {
          text: status,
          color: '#6B7280',
          backgroundColor: '#F3F4F6',
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryMap: { [key: string]: string } = {
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
    return categoryMap[category] || '✨';
  };

  // Функция для получения строки с адресом и дистанцией
  const getLocationText = () => {
    // Если у пользователя и заказа есть координаты, показываем дистанцию
    if (userLocation && order.latitude && order.longitude) {
      const distance = locationService.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        order.latitude,
        order.longitude
      );
      const formattedDistance = locationService.formatDistance(distance);
      return `${order.location} (${formattedDistance})`;
    }

    // Иначе показываем только адрес
    return order.location;
  };

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={1}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <View
        style={[
          styles.card,
          // Показываем зеленый стиль только для заказчиков, не для исполнителей
          order.status === 'response_received' && !workerView && styles.cardResponseReceived,
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.categoryIconContainer}>
            <View style={styles.categoryIcon}>
              <Text style={styles.categoryIconText}>
                {getCategoryIcon(order.category)}
              </Text>
            </View>
            <Text style={styles.categoryText}>{order.category}</Text>
          </View>
          <View style={[
            styles.statusPill,
            {
              backgroundColor: getStatusInfo(order.status).backgroundColor
            }
          ]}>
            <Text style={[
              styles.statusPillText,
              {
                color: getStatusInfo(order.status).color
              }
            ]}>
              {getStatusInfo(order.status).text}
            </Text>
          </View>
        </View>

        {/* Time Info */}
        {showCreateTime && (
          <View style={styles.timeInfo}>
            <Text style={styles.timeInfoText}>
              {formatCreatedAt(order.createdAt)}
            </Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {order.title}
        </Text>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {workerView ? (
            <>
              {/* Режим для исполнителей */}
              {/* Первая строка: Только Дата */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <View style={styles.iconWrapper}>
                    <CalendarIcon
                      width={20}
                      height={20}
                      style={styles.detailIcon}
                    />
                  </View>
                  <Text style={styles.detailText}>{formatDate(order.serviceDate)}</Text>
                </View>
              </View>

              {/* Вторая строка: Локация на всю ширину */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItemFullWidth}>
                  <View style={styles.iconWrapper}>
                    <LocationIcon
                      width={20}
                      height={20}
                      style={styles.detailIcon}
                    />
                  </View>
                  <Text style={styles.detailText}>{getLocationText()}</Text>
                </View>
              </View>

              {/* Третья строка: Заявки (если показывается) */}
              {showApplicantsCount && (
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <View style={styles.iconWrapper}>
                      <OtklikiIcon
                        width={20}
                        height={20}
                        style={styles.detailIcon}
                      />
                    </View>
                    <Text style={styles.detailText}>{order.applicantsCount} заявок</Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Режим для заказчиков */}
              {/* Первая строка: Дата + Количество заявок */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <View style={styles.iconWrapper}>
                    <CalendarIcon
                      width={20}
                      height={20}
                      style={styles.detailIcon}
                    />
                  </View>
                  <Text style={styles.detailText}>{formatDate(order.serviceDate)}</Text>
                </View>
                {showApplicantsCount && (
                  <View style={styles.detailItem}>
                    <View style={styles.iconWrapper}>
                      <OtklikiIcon
                        width={20}
                        height={20}
                        style={styles.detailIcon}
                      />
                    </View>
                    <Text style={styles.detailText}>{order.applicantsCount} заявок</Text>
                  </View>
                )}
              </View>

              {/* Вторая строка: Локация на всю ширину */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItemFullWidth}>
                  <View style={styles.iconWrapper}>
                    <LocationIcon
                      width={20}
                      height={20}
                      style={styles.detailIcon}
                    />
                  </View>
                  <Text style={styles.detailText}>{getLocationText()}</Text>
                </View>
              </View>
            </>
          )}
        </View>



        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{formatBudget(order.budget)}</Text>
          </View>
          {actionButton && (
            <View style={styles.actionContainer}>
              {actionButton}
            </View>
          )}
        </View>

        {/* Белый overlay при нажатии */}
        {isPressed && (
          <View style={styles.pressOverlay} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    // Полностью отключаем inner shadow на Android
    ...Platform.select({
      android: {
        // Отключаем системные эффекты нажатия
        renderToHardwareTextureAndroid: false,
        // Предотвращаем inner shadow
        overflow: 'visible',
      },
    }),
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    // Отключаем системные эффекты нажатия на Android
    ...Platform.select({
      android: {
        // Предотвращаем inner shadow при нажатии
        overflow: 'hidden',
        // Отключаем стандартные эффекты
        needsOffscreenAlphaCompositing: false,
      },
    }),
  },
  cardResponseReceived: {
    // светлее, чем фон badge (#D1FAE5)
    backgroundColor: '#ECFDF5',
    // рамка в основном зеленом цвете
    borderColor: theme.colors.primary,
    borderWidth: 0.5,
    // легкий glow в зеленом цвете
    shadowColor: '#10B981',
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  timeInfo: {
    marginBottom: theme.spacing.sm,
  },
  timeInfoText: {
    fontSize: theme.fonts.sizes.sm,
    color: '#9AA0A6',
    fontWeight: theme.fonts.weights.regular,
  },
  statusPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 16,
    alignSelf: 'flex-end',
  },
  statusPillText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    lineHeight: 28,
    marginBottom: theme.spacing.md,
  },
  detailsGrid: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  detailItemFullWidth: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    width: '100%',
  },
  iconWrapper: {
    marginRight: theme.spacing.sm,
    color: '#5F6368',
  },
  detailIcon: {
    // SVG иконка наследует цвет от родительского элемента
  },
  detailText: {
    fontSize: theme.fonts.sizes.sm,
    color: '#5F6368',
    fontWeight: theme.fonts.weights.medium,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  priceContainer: {
    flex: 1,
  },
  priceText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  actionContainer: {
    marginLeft: theme.spacing.md,
  },
  pressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    pointerEvents: 'none',
  },
});