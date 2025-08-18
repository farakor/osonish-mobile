import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

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
            <Text style={styles.label}>В ожидании</Text>
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
            <Text style={styles.label}>В работе</Text>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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