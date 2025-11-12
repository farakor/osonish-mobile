import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants';
import { Order } from '../../types';
import {
  getExperienceLevelLabel,
  getEmploymentTypeLabel,
  getWorkFormatLabel,
  getSalaryPeriodLabel,
} from '../../constants/vacancyOptions';
import { getCityName } from '../../utils/cityUtils';

interface VacancyCardProps {
  vacancy: Order;
  onPress: () => void;
}

export const VacancyCard: React.FC<VacancyCardProps> = ({ vacancy, onPress }) => {
  const formatSalary = () => {
    if (vacancy.salaryFrom && vacancy.salaryTo) {
      const period = vacancy.salaryPeriod ? getSalaryPeriodLabel(vacancy.salaryPeriod) : '';
      return `${vacancy.salaryFrom.toLocaleString()} - ${vacancy.salaryTo.toLocaleString()} сум ${period}`.toLowerCase();
    }
    if (vacancy.salaryFrom) {
      const period = vacancy.salaryPeriod ? getSalaryPeriodLabel(vacancy.salaryPeriod) : '';
      return `от ${vacancy.salaryFrom.toLocaleString()} сум ${period}`.toLowerCase();
    }
    return 'Договорная';
  };

  const cityName = vacancy.city ? getCityName(vacancy.city) : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {vacancy.jobTitle || vacancy.title}
        </Text>
        <Text style={styles.salary}>{formatSalary()}</Text>
      </View>

      <View style={styles.details}>
        {cityName && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{cityName}</Text>
          </View>
        )}
        
        {vacancy.experienceLevel && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>💼</Text>
            <Text style={styles.detailText}>
              {getExperienceLevelLabel(vacancy.experienceLevel)}
            </Text>
          </View>
        )}
        
        {vacancy.employmentType && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>⏰</Text>
            <Text style={styles.detailText}>
              {getEmploymentTypeLabel(vacancy.employmentType)}
            </Text>
          </View>
        )}
        
        {vacancy.workFormat && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>🏢</Text>
            <Text style={styles.detailText}>
              {getWorkFormatLabel(vacancy.workFormat)}
            </Text>
          </View>
        )}
      </View>

      {vacancy.description && (
        <Text style={styles.description} numberOfLines={2}>
          {vacancy.description}
        </Text>
      )}

      {vacancy.skills && vacancy.skills.length > 0 && (
        <View style={styles.skillsContainer}>
          {vacancy.skills.slice(0, 3).map((skill, index) => (
            <View key={index} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {vacancy.skills.length > 3 && (
            <View style={styles.skillChip}>
              <Text style={styles.skillText}>+{vacancy.skills.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.date}>
          {new Date(vacancy.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
          })}
        </Text>
        {vacancy.viewsCount !== undefined && vacancy.viewsCount > 0 && (
          <Text style={styles.views}>👁 {vacancy.viewsCount}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: theme.spacing.lg, // Отступы от краёв экрана
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  salary: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  skillChip: {
    backgroundColor: '#F0F7FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  views: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

