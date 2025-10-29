import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { theme } from '../../constants/theme';
import { Order } from '../../types';
import { locationService, LocationCoords } from '../../services/locationService';
import { getCategoryEmoji, getCategoryLabel } from '../../utils/categoryUtils';
import { getCategoryAnimation } from '../../utils/categoryIconUtils';
import { getCityName } from '../../utils/cityUtils';
import { useCustomerTranslation } from '../../hooks/useTranslation';
import { useTranslation } from 'react-i18next';
import { getStatusInfo } from '../../utils/statusUtils';
import { getSpecializationIcon, getTranslatedSpecializationName, getSpecializationIconComponent } from '../../constants/specializations';
import { CategoryIcon } from '../common';

// Константа для цвета иконок в деталях карточки
const DETAIL_ICON_COLOR = '#5F6368';
const VIEWS_COLOR = '#9AA0A6'; // Цвет для счетчика просмотров

// SVG импорты
import OtklikiIcon from '../../../assets/card-icons/otkliki.svg';
import EyeIcon from '../../../assets/eye.svg';
import MarkerIcon from '../../../assets/marker-pin-06.svg';

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
  const t = useCustomerTranslation();
  const { t: translate } = useTranslation();
  const formatBudget = (amount: number) => {
    return `${amount.toLocaleString('ru-RU')} ${t('currency_sum')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} ${t('at_time')} ${timeStr}`;
  };

  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return t('minutes_ago_full', { count: diffInMinutes });
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return t('hours_ago_full', { count: hours });
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return t('days_ago_full', { count: days });
    }
  };




  // Функция для получения данных о локации и дистанции
  const getLocationData = () => {
    // Если у пользователя и заказа есть координаты, показываем дистанцию
    if (userLocation && order.latitude && order.longitude) {
      const distance = locationService.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        order.latitude,
        order.longitude
      );
      const formattedDistance = locationService.formatDistance(distance);
      return {
        address: order.location,
        distance: formattedDistance,
        hasDistance: true
      };
    }

    // Иначе показываем только адрес
    return {
      address: order.location,
      distance: null,
      hasDistance: false
    };
  };

  // Получаем только дистанцию для отображения в header
  const getDistanceText = () => {
    const locationData = getLocationData();
    return locationData.hasDistance ? locationData.distance : null;
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
              {order.specializationId ? (
                <CategoryIcon
                  icon={getSpecializationIcon(order.specializationId)}
                  iconComponent={getSpecializationIconComponent(order.specializationId)}
                  size={28}
                />
              ) : (
                <LottieView
                  source={getCategoryAnimation(order.category || 'other')}
                  style={styles.categoryLottieIcon}
                  autoPlay={false}
                  loop={false}
                  progress={0.5}
                />
              )}
            </View>
            <View style={styles.categoryTextContainer}>
              <Text style={styles.categoryText} numberOfLines={1} ellipsizeMode="tail">
                {order.specializationId 
                  ? getTranslatedSpecializationName(order.specializationId, translate)
                  : getCategoryLabel(order.category || 'other', translate)}
              </Text>
              <Text style={styles.dateUnderCategory} numberOfLines={1} ellipsizeMode="tail">
                {formatDate(order.serviceDate)}
              </Text>
            </View>
          </View>
          <View style={styles.rightColumn}>
            {/* Distance */}
            {getDistanceText() && (
              <Text style={styles.distanceText}>{getDistanceText()}</Text>
            )}
            {/* City and Views in one row */}
            <View style={styles.cityViewsRow}>
              {/* City */}
              {order.customerCity && (
                <View style={styles.cityContainer}>
                  <MarkerIcon width={12} height={12} stroke={VIEWS_COLOR} strokeWidth={1.5} />
                  <Text style={styles.cityText}>{getCityName(order.customerCity)}</Text>
                </View>
              )}
              {/* Views Count */}
              <View style={styles.viewsContainer}>
                <EyeIcon width={14} height={14} stroke={VIEWS_COLOR} strokeWidth={1.5} />
                <Text style={styles.viewsText}>{order.viewsCount || 0}</Text>
              </View>
            </View>
            {/* Response Received Badge */}
            {!workerView && (order.pendingApplicantsCount || 0) > 0 && (
              <View style={styles.responseBadge}>
                <Text style={styles.responseBadgeText}>{t('response_received_badge')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Time Info */}
        {showCreateTime && (
          <View style={styles.timeInfo}>
            <Text style={styles.timeInfoText} numberOfLines={1} ellipsizeMode="tail">
              {formatCreatedAt(order.createdAt)}
            </Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {order.title}
        </Text>

        {/* Details Grid */}
        {showApplicantsCount && (
          <View style={styles.detailsGrid}>
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <View style={styles.iconWrapper}>
                  <OtklikiIcon
                    width={20}
                    height={20}
                    color={DETAIL_ICON_COLOR}
                    style={styles.detailIcon}
                  />
                </View>
                <Text style={styles.detailText}>{t('applications_count', { count: order.applicantsCount })}</Text>
              </View>
            </View>
          </View>
        )}



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
    borderWidth: 2,
    borderColor: '#F6F7F9',
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
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  categoryIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryLottieIcon: {
    width: 28,
    height: 28,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryTextContainer: {
    flex: 1,
    flexShrink: 1,
  },
  categoryText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
    flexShrink: 1,
  },
  dateUnderCategory: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.regular,
    color: DETAIL_ICON_COLOR,
    marginTop: 2,
    flexShrink: 1,
  },
  timeInfo: {
    marginBottom: theme.spacing.sm,
  },
  timeInfoText: {
    fontSize: theme.fonts.sizes.sm,
    color: '#9AA0A6',
    fontWeight: theme.fonts.weights.regular,
    flexShrink: 1,
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cityViewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2, // Уменьшен отступ между городом и просмотрами
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  cityText: {
    fontSize: 11,
    color: VIEWS_COLOR,
    fontWeight: '500',
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  viewsText: {
    fontSize: 12,
    color: VIEWS_COLOR,
    fontWeight: '500',
  },
  responseBadge: {
    backgroundColor: '#E10000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    lineHeight: 28,
    marginBottom: theme.spacing.sm,
  },
  detailsGrid: {
    marginBottom: theme.spacing.sm,
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
  iconWrapper: {
    marginRight: theme.spacing.sm,
    color: DETAIL_ICON_COLOR,
  },
  detailIcon: {
    // Явно задаем цвет для SVG иконок, чтобы избежать нежелательного наследования
    color: DETAIL_ICON_COLOR,
  },
  detailText: {
    fontSize: theme.fonts.sizes.sm,
    color: DETAIL_ICON_COLOR,
    fontWeight: theme.fonts.weights.medium,
    flex: 1,
    flexShrink: 1,
  },
  distanceText: {
    fontSize: 14,
    color: '#E10000',
    fontWeight: '600',
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
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