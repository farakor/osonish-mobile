import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { HeaderWithBack } from '../../components/common';
import { VacancyApplicationCard } from '../../components/vacancy';
import {
  useVacancyDetails,
  useVacancyApplications,
  useUpdateVacancyApplicationStatus,
} from '../../hooks/queries/useVacancyQueries';
import {
  getExperienceLevelLabel,
  getEmploymentTypeLabel,
  getWorkFormatLabel,
  getWorkScheduleLabel,
  getSalaryPeriodLabel,
  getSalaryTypeLabel,
  getPaymentFrequencyLabel,
  getLanguageLabel,
} from '../../constants/vacancyOptions';
import { getCityName } from '../../utils/cityUtils';
import { VacancyApplication } from '../../types';

type VacancyDetailsCustomerRouteProp = RouteProp<
  { VacancyDetailsCustomer: { vacancyId: string } },
  'VacancyDetailsCustomer'
>;

export const VacancyDetailsCustomerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<VacancyDetailsCustomerRouteProp>();
  const { vacancyId } = route.params;

  const { data: vacancy, isLoading } = useVacancyDetails(vacancyId);
  const { data: applications = [], refetch: refetchApplications } = useVacancyApplications(vacancyId);
  const updateStatusMutation = useUpdateVacancyApplicationStatus();

  const [selectedTab, setSelectedTab] = useState<'info' | 'applications'>('info');

  const handleAcceptApplication = async (application: VacancyApplication) => {
    Alert.alert(
      'Принять отклик',
      `Вы хотите принять отклик от ${application.applicantName}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Принять',
          onPress: async () => {
            const result = await updateStatusMutation.mutateAsync({
              applicationId: application.id,
              status: 'accepted',
            });

            if (result.success) {
              Alert.alert('Успешно', 'Отклик принят');
              refetchApplications();
            } else {
              Alert.alert('Ошибка', result.error || 'Не удалось принять отклик');
            }
          },
        },
      ]
    );
  };

  const handleRejectApplication = async (application: VacancyApplication) => {
    Alert.alert(
      'Отклонить отклик',
      `Вы хотите отклонить отклик от ${application.applicantName}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отклонить',
          style: 'destructive',
          onPress: async () => {
            const result = await updateStatusMutation.mutateAsync({
              applicationId: application.id,
              status: 'rejected',
            });

            if (result.success) {
              Alert.alert('Отклик отклонен');
              refetchApplications();
            } else {
              Alert.alert('Ошибка', result.error || 'Не удалось отклонить отклик');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !vacancy) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderWithBack title="Моя вакансия" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const formatSalary = () => {
    if (vacancy.salaryFrom && vacancy.salaryTo) {
      const period = vacancy.salaryPeriod ? getSalaryPeriodLabel(vacancy.salaryPeriod) : '';
      const type = vacancy.salaryType ? ` (${getSalaryTypeLabel(vacancy.salaryType)})` : '';
      return `${vacancy.salaryFrom.toLocaleString()} - ${vacancy.salaryTo.toLocaleString()} сум ${period}${type}`.toLowerCase();
    }
    return 'Договорная';
  };

  const pendingApplications = applications.filter((app) => app.status === 'pending');
  const acceptedApplications = applications.filter((app) => app.status === 'accepted');
  const rejectedApplications = applications.filter((app) => app.status === 'rejected');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <HeaderWithBack title="Моя вакансия" />

      {/* Табы */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'info' && styles.tabActive]}
          onPress={() => setSelectedTab('info')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'info' && styles.tabTextActive]}>
            Информация
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'applications' && styles.tabActive]}
          onPress={() => setSelectedTab('applications')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'applications' && styles.tabTextActive]}>
            Отклики {applications.length > 0 && `(${applications.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'info' ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Заголовок и зарплата */}
          <View style={styles.header}>
            <Text style={styles.title}>{vacancy.jobTitle || vacancy.title}</Text>
            <Text style={styles.salary}>{formatSalary()}</Text>
          </View>

          {/* Основная информация */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Основная информация</Text>

            {vacancy.city && <InfoRow icon="📍" label="Город" value={getCityName(vacancy.city)} />}
            {vacancy.experienceLevel && (
              <InfoRow icon="💼" label="Опыт" value={getExperienceLevelLabel(vacancy.experienceLevel)} />
            )}
            {vacancy.employmentType && (
              <InfoRow icon="⏰" label="Занятость" value={getEmploymentTypeLabel(vacancy.employmentType)} />
            )}
            {vacancy.workFormat && (
              <InfoRow icon="🏢" label="Формат" value={getWorkFormatLabel(vacancy.workFormat)} />
            )}
            {vacancy.workSchedule && (
              <InfoRow icon="📅" label="График" value={getWorkScheduleLabel(vacancy.workSchedule)} />
            )}
            {vacancy.paymentFrequency && (
              <InfoRow
                icon="💰"
                label="Выплаты"
                value={getPaymentFrequencyLabel(vacancy.paymentFrequency)}
              />
            )}
          </View>

          {/* Описание */}
          {vacancy.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Описание вакансии</Text>
              <Text style={styles.description}>{vacancy.description}</Text>
            </View>
          )}

          {/* Навыки */}
          {vacancy.skills && vacancy.skills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Требуемые навыки</Text>
              <View style={styles.skillsContainer}>
                {vacancy.skills.map((skill, index) => (
                  <View key={index} style={styles.skillChip}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Языки */}
          {vacancy.languages && vacancy.languages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Языки</Text>
              <View style={styles.languagesContainer}>
                {vacancy.languages.map((langId, index) => (
                  <View key={index} style={styles.languageChip}>
                    <Text style={styles.languageText}>{getLanguageLabel(langId)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Адрес */}
          {vacancy.location && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Адрес</Text>
              <Text style={styles.locationText}>{vacancy.location}</Text>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      ) : (
        <View style={styles.applicationsContainer}>
          {/* Статистика */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{pendingApplications.length}</Text>
              <Text style={styles.statLabel}>Ожидают</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{acceptedApplications.length}</Text>
              <Text style={styles.statLabel}>Приняты</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{rejectedApplications.length}</Text>
              <Text style={styles.statLabel}>Отклонены</Text>
            </View>
          </View>

          {applications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📭</Text>
              <Text style={styles.emptyStateTitle}>Нет откликов</Text>
              <Text style={styles.emptyStateText}>
                Когда кто-то откликнется на вашу вакансию, отклики появятся здесь
              </Text>
            </View>
          ) : (
            <FlatList
              data={applications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <VacancyApplicationCard
                  application={item}
                  showActions={item.status === 'pending'}
                  onAccept={() => handleAcceptApplication(item)}
                  onReject={() => handleRejectApplication(item)}
                />
              )}
              contentContainerStyle={styles.applicationsList}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

// Компонент для строки информации
const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabel}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabelText}>{label}:</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5FC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  salary: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoLabelText: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'right',
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#F0F7FF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageChip: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F59E0B',
  },
  locationText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  bottomSpacer: {
    height: 40,
  },
  applicationsContainer: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  applicationsList: {
    padding: 16,
    paddingBottom: 100,
  },
});

