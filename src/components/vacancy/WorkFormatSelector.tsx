import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants';
import { WORK_FORMATS } from '../../constants/vacancyOptions';

interface WorkFormatSelectorProps {
  value?: string; // Добавляем поддержку value
  selectedFormat?: string;
  onSelect: (formatId: string) => void;
}

export const WorkFormatSelector: React.FC<WorkFormatSelectorProps> = ({
  value,
  selectedFormat,
  onSelect,
}) => {
  const currentValue = value || selectedFormat; // Используем value если есть, иначе selectedFormat
  
  return (
    <View style={styles.container}>
      {WORK_FORMATS.map((format) => (
        <TouchableOpacity
          key={format.id}
          style={[
            styles.option,
            currentValue === format.id && styles.optionSelected,
          ]}
          onPress={() => onSelect(format.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.optionText,
              currentValue === format.id && styles.optionTextSelected,
            ]}
          >
            {format.label}
          </Text>
          {currentValue === format.id && (
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

