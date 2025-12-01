import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants';
import { WORK_SCHEDULES } from '../../constants/vacancyOptions';

interface WorkScheduleSelectorProps {
  value?: string; // Добавляем поддержку value
  selectedSchedule?: string;
  onSelect: (scheduleId: string) => void;
}

export const WorkScheduleSelector: React.FC<WorkScheduleSelectorProps> = ({
  value,
  selectedSchedule,
  onSelect,
}) => {
  const currentValue = value || selectedSchedule; // Используем value если есть, иначе selectedSchedule
  
  return (
    <View style={styles.container}>
      {WORK_SCHEDULES.map((schedule) => (
        <TouchableOpacity
          key={schedule.id}
          style={[
            styles.option,
            currentValue === schedule.id && styles.optionSelected,
          ]}
          onPress={() => onSelect(schedule.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.optionText,
              currentValue === schedule.id && styles.optionTextSelected,
            ]}
          >
            {schedule.label}
          </Text>
          {currentValue === schedule.id && (
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

