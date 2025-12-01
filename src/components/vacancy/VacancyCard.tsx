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
import { getTranslatedSpecializationName, getSpecializationById } from '../../constants/specializations';
import { MarkerPinIcon } from '../common/MarkerPinIcon';
import { CalendarDateIcon } from '../common/CalendarDateIcon';
import { HourglassIcon } from '../common/HourglassIcon';
import { BuildingIcon } from '../common/BuildingIcon';
import { EyeIcon } from '../common/EyeIcon';
import { CategoryIcon } from '../common/CategoryIcon';
import { useCustomerTranslation } from '../../hooks/useTranslation';
import { useTranslation } from 'react-i18next';

interface VacancyCardProps {
  vacancy: Order;
  onPress: () => void;
  currentUserId?: string; // ID текущего пользователя для определения своих вакансий
}

export const VacancyCard: React.FC<VacancyCardProps> = ({ vacancy, onPress, currentUserId }) => {
  const tCustomer = useCustomerTranslation();
  const { t } = useTranslation();
  
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
  
  // Проверяем, является ли вакансия моей
  const isMyVacancy = currentUserId && vacancy.customerId === currentUserId;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {vacancy.jobTitle || vacancy.title}
        </Text>
        <Text style={styles.salary}>{formatSalary()}</Text>
        {vacancy.customerUserType === 'company' && vacancy.customerCompanyName && (
          <Text style={styles.companyName} numberOfLines={1}>
            {vacancy.customerCompanyName}
          </Text>
        )}
      </View>

      <View style={styles.details}>
        {vacancy.specializationId && t && (() => {
          const spec = getSpecializationById(vacancy.specializationId);
          return spec && (
            <View style={styles.detailItem}>
              <CategoryIcon
                icon={spec.icon}
                iconComponent={spec.iconComponent}
                size={16}
              />
              <Text style={styles.detailText} numberOfLines={1}>
                {getTranslatedSpecializationName(vacancy.specializationId, t)}
              </Text>
            </View>
          );
        })()}
        
        {cityName && (
          <View style={styles.detailItem}>
            <MarkerPinIcon size={16} color="#6B7280" />
            <Text style={styles.detailText}>{cityName}</Text>
          </View>
        )}
        
        {vacancy.experienceLevel && (
          <View style={styles.detailItem}>
            <CalendarDateIcon size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {getExperienceLevelLabel(vacancy.experienceLevel)}
            </Text>
          </View>
        )}
        
        {vacancy.employmentType && (
          <View style={styles.detailItem}>
            <HourglassIcon size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {getEmploymentTypeLabel(vacancy.employmentType)}
            </Text>
          </View>
        )}
        
        {vacancy.workFormat && (
          <View style={styles.detailItem}>
            <BuildingIcon size={16} color="#6B7280" />
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
        <View style={styles.footerRight}>
          {vacancy.viewsCount !== undefined && vacancy.viewsCount !== null && (
            <View style={styles.viewsContainer}>
              <EyeIcon size={14} color="#9CA3AF" />
              <Text style={styles.views}>{vacancy.viewsCount}</Text>
            </View>
          )}
          {/* Бейдж "Моя вакансия" */}
          {isMyVacancy && (
            <View style={styles.myVacancyBadge}>
              <Text style={styles.myVacancyBadgeText}>{tCustomer('my_vacancy_badge')}</Text>
            </View>
          )}
        </View>
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
    borderWidth: 1,
    borderColor: '#DAE3EC',
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
  companyName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
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
    flexShrink: 1,
    maxWidth: '100%',
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    flexShrink: 1,
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
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  views: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  myVacancyBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myVacancyBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

