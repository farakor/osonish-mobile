import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useWorkerTranslation } from '../../hooks/useTranslation';
import { borderButtonStyles, lightElevationStyles } from '../../utils/noShadowStyles';

interface OrderStatsWidgetProps {
  pendingCount: number;
  inProgressCount: number;
  onPendingPress: () => void;
  onInProgressPress: () => void;
}

export const OrderStatsWidget: React.FC<OrderStatsWidgetProps> = ({
  pendingCount,
  inProgressCount,
  onPendingPress,
  onInProgressPress,
}) => {
  const tWorker = useWorkerTranslation();

  return (
    <View style={styles.container}>
      {/* Карточка "В ожидании" */}
      <TouchableOpacity
        style={styles.fullWidthCard}
        onPress={onPendingPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.textRow}>
            <Text style={styles.number}>{pendingCount}</Text>
            <Text style={styles.label}>{tWorker('pending_status')}</Text>
          </View>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      {/* Карточка "В работе" */}
      <TouchableOpacity
        style={styles.fullWidthCard}
        onPress={onInProgressPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.textRow}>
            <Text style={styles.number}>{inProgressCount}</Text>
            <Text style={styles.label}>{tWorker('in_progress_status')}</Text>
          </View>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 24,
    width: '100%',
  },
  fullWidthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    flex: 1,
    ...Platform.select({
      android: borderButtonStyles,
      ios: lightElevationStyles,
    }),
  },
  cardContent: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  number: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#679B00',
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  arrow: {
    fontSize: 18,
    color: '#666666',
    fontWeight: 'bold',
  },
});