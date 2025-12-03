import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from './BottomSheet';
import { theme } from '../../constants';
import CalendarOneDayIcon from '../../../assets/cats/calendar-one-day.svg';
import DocumentIcon from '../../../assets/document.svg';

interface JobTypeBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectDailyJob: () => void;
  onSelectVacancy: () => void;
}

export const JobTypeBottomSheet: React.FC<JobTypeBottomSheetProps> = ({
  visible,
  onClose,
  onSelectDailyJob,
  onSelectVacancy,
}) => {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={380}
      title="Выберите тип работы"
    >
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.jobTypeOption}
          onPress={onSelectDailyJob}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <CalendarOneDayIcon width={32} height={32} />
          </View>
          <View style={styles.jobTypeOptionContent}>
            <Text style={styles.jobTypeOptionTitle}>Дневная работа</Text>
            <Text style={styles.jobTypeOptionDescription}>
              Разовые задачи, работа на один день
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.jobTypeOption}
          onPress={onSelectVacancy}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <DocumentIcon width={32} height={32} />
          </View>
          <View style={styles.jobTypeOptionContent}>
            <Text style={styles.jobTypeOptionTitle}>Вакансия</Text>
            <Text style={styles.jobTypeOptionDescription}>
              Постоянная работа, долгосрочная вакансия
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  optionsContainer: {
    flex: 1,
  },
  jobTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: '#F8F9FA',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  jobTypeOptionContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  jobTypeOptionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  jobTypeOptionDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
});

