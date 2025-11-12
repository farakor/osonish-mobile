import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants';
import { SALARY_PERIODS, SALARY_TYPES } from '../../constants/vacancyOptions';

interface SalaryInputFieldsProps {
  salaryFrom?: string;
  salaryTo?: string;
  salaryPeriod?: string;
  salaryType?: string;
  onChangeSalaryFrom: (value: string) => void;
  onChangeSalaryTo: (value: string) => void;
  onChangeSalaryPeriod: (periodId: string) => void;
  onChangeSalaryType: (typeId: string) => void;
}

export const SalaryInputFields: React.FC<SalaryInputFieldsProps> = ({
  salaryFrom,
  salaryTo,
  salaryPeriod,
  salaryType,
  onChangeSalaryFrom,
  onChangeSalaryTo,
  onChangeSalaryPeriod,
  onChangeSalaryType,
}) => {
  return (
    <View style={styles.container}>
      {/* Диапазон зарплаты */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Диапазон зарплаты</Text>
        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>От</Text>
            <TextInput
              style={styles.input}
              value={salaryFrom}
              onChangeText={onChangeSalaryFrom}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <Text style={styles.separator}>—</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>До</Text>
            <TextInput
              style={styles.input}
              value={salaryTo}
              onChangeText={onChangeSalaryTo}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
      </View>

      {/* Период выплаты */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Период</Text>
        <View style={styles.optionsGrid}>
          {SALARY_PERIODS.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodOption,
                salaryPeriod === period.id && styles.periodOptionSelected,
              ]}
              onPress={() => onChangeSalaryPeriod(period.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodOptionText,
                  salaryPeriod === period.id && styles.periodOptionTextSelected,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Тип выплаты */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Тип выплаты</Text>
        <View style={styles.typeOptions}>
          {SALARY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeOption,
                salaryType === type.id && styles.typeOptionSelected,
              ]}
              onPress={() => onChangeSalaryType(type.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  salaryType === type.id && styles.typeOptionTextSelected,
                ]}
              >
                {type.label}
              </Text>
              {salaryType === type.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  separator: {
    fontSize: 20,
    color: '#9CA3AF',
    marginTop: 24,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  periodOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F7FF',
  },
  periodOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  periodOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  typeOptions: {
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F7FF',
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  typeOptionTextSelected: {
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

