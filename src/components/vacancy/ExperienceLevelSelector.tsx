import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants';
import { EXPERIENCE_LEVELS } from '../../constants/vacancyOptions';

interface ExperienceLevelSelectorProps {
  value?: string; // Добавляем поддержку value
  selectedLevel?: string;
  onSelect: (levelId: string) => void;
}

export const ExperienceLevelSelector: React.FC<ExperienceLevelSelectorProps> = ({
  value,
  selectedLevel,
  onSelect,
}) => {
  const currentValue = value || selectedLevel; // Используем value если есть, иначе selectedLevel
  
  return (
    <View style={styles.container}>
      {EXPERIENCE_LEVELS.map((level) => (
        <TouchableOpacity
          key={level.id}
          style={[
            styles.option,
            currentValue === level.id && styles.optionSelected,
          ]}
          onPress={() => onSelect(level.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.optionText,
              currentValue === level.id && styles.optionTextSelected,
            ]}
          >
            {level.label}
          </Text>
          {currentValue === level.id && (
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

