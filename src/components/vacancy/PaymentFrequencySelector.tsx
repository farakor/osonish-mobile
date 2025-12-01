import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants';
import { PAYMENT_FREQUENCIES } from '../../constants/vacancyOptions';

interface PaymentFrequencySelectorProps {
  value?: string; // Добавляем поддержку value
  selectedFrequency?: string;
  onSelect: (frequencyId: string) => void;
}

export const PaymentFrequencySelector: React.FC<PaymentFrequencySelectorProps> = ({
  value,
  selectedFrequency,
  onSelect,
}) => {
  const currentValue = value || selectedFrequency; // Используем value если есть, иначе selectedFrequency
  
  return (
    <View style={styles.container}>
      {PAYMENT_FREQUENCIES.map((frequency) => (
        <TouchableOpacity
          key={frequency.id}
          style={[
            styles.option,
            currentValue === frequency.id && styles.optionSelected,
          ]}
          onPress={() => onSelect(frequency.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.optionText,
              currentValue === frequency.id && styles.optionTextSelected,
            ]}
          >
            {frequency.label}
          </Text>
          {currentValue === frequency.id && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F7FF',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

