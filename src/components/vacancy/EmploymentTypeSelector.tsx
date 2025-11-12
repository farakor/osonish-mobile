import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants';
import { EMPLOYMENT_TYPES } from '../../constants/vacancyOptions';

interface EmploymentTypeSelectorProps {
  selectedType?: string;
  onSelect: (typeId: string) => void;
}

export const EmploymentTypeSelector: React.FC<EmploymentTypeSelectorProps> = ({
  selectedType,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      {EMPLOYMENT_TYPES.map((type) => (
        <TouchableOpacity
          key={type.id}
          style={[
            styles.option,
            selectedType === type.id && styles.optionSelected,
          ]}
          onPress={() => onSelect(type.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.optionText,
              selectedType === type.id && styles.optionTextSelected,
            ]}
          >
            {type.label}
          </Text>
          {selectedType === type.id && (
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

