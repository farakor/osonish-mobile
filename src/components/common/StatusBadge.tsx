import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants';
import { Order } from '../../types';
import { useCustomerTranslation } from '../../hooks/useTranslation';
import { getStatusInfo } from '../../utils/statusUtils';

interface StatusBadgeProps {
  status: Order['status'];
  workerView?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, workerView = false }) => {
  const t = useCustomerTranslation();
  const statusInfo = getStatusInfo(status, t, workerView);

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

