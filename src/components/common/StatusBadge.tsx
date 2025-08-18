import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants';
import { Order } from '../../types';

interface StatusBadgeProps {
  status: Order['status'];
  workerView?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, workerView = false }) => {
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
          color: theme.colors.text.secondary,
          backgroundColor: '#F3F4F6',
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <View style={[
      styles.statusPill,
      { backgroundColor: statusInfo.backgroundColor }
    ]}>
      <Text style={[
        styles.statusPillText,
        { color: statusInfo.color }
      ]}>
        {statusInfo.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
