import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { HeaderWithBack, OrderLocationMap } from '../../components/common';
import { VacancyApplicationCard } from '../../components/vacancy';
import { getTranslatedSpecializationName, getSpecializationById } from '../../constants/specializations';
import { CategoryIcon } from '../../components/common/CategoryIcon';
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
import { MarkerPinIcon } from '../../components/common/MarkerPinIcon';
import { CalendarDateIcon } from '../../components/common/CalendarDateIcon';
import { HourglassIcon } from '../../components/common/HourglassIcon';
import { BuildingIcon } from '../../components/common/BuildingIcon';
import { ClockIcon } from '../../components/common/ClockIcon';
import { BankNoteIcon } from '../../components/common/BankNoteIcon';
import { vacancyService } from '../../services/vacancyService';
import { authService } from '../../services/authService';
import { useTranslation } from 'react-i18next';
import PencilIcon from '../../../assets/pencil-02.svg';

type VacancyDetailsCustomerRouteProp = RouteProp<
  { VacancyDetailsCustomer: { vacancyId: string } },
  'VacancyDetailsCustomer'
>;

export const VacancyDetailsCustomerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<VacancyDetailsCustomerRouteProp>();
  const { vacancyId } = route.params;
  const { t } = useTranslation();

  const { data: vacancy, isLoading } = useVacancyDetails(vacancyId);
  const { data: applications = [], refetch: refetchApplications } = useVacancyApplications(vacancyId);
  const updateStatusMutation = useUpdateVacancyApplicationStatus();

  const [selectedTab, setSelectedTab] = useState<'info' | 'applications'>('info');
  const [hasMarkedAsViewed, setHasMarkedAsViewed] = useState(false);

  // Проверяем, является ли текущий пользователь создателем вакансии
  const authState = authService.getAuthState();
  const isVacancyOwner = vacancy && authState.user && vacancy.customerId === authState.user.id;

  // Увеличиваем счетчик просмотров при открытии вакансии (только для владельца в первый раз)
  useEffect(() => {
    if (vacancy) {
      // Владелец вакансии тоже может просматривать свою вакансию, но это не увеличивает счетчик
      // Однако для статистики мы все равно можем его увеличивать
      vacancyService.incrementVacancyViews(vacancyId);
    }
  }, [vacancyId, vacancy]);

  // Отмечаем отклики вакансии как просмотренные при переключении на таб "applications"
  useEffect(() => {
    const markAsViewed = async () => {
      if (!isVacancyOwner || selectedTab !== 'applications' || applications.length === 0 || hasMarkedAsViewed) {
        return;
      }

      try {
        console.log('[VacancyDetailsCustomerScreen] Отмечаем отклики вакансии как просмотренные');
        await vacancyService.markVacancyApplicantsAsViewed(vacancyId);
        setHasMarkedAsViewed(true);
      } catch (error) {
        console.error('[VacancyDetailsCustomerScreen] Ошибка при отметке откликов как просмотренных:', error);
      }
    };

    markAsViewed();
  }, [isVacancyOwner, selectedTab, applications.length, hasMarkedAsViewed, vacancyId]);

  const handleViewResume = (application: VacancyApplication) => {
    // Переходим к экрану резюме кандидата
    navigation.navigate('ApplicantResume', { applicantId: application.applicantId });
  };

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

  const handleEditVacancy = () => {
    if (!vacancy) return;

    // Проверяем, что вакансия принадлежит текущему пользователю
    if (!isVacancyOwner) {
      Alert.alert('Ошибка', 'Вы не можете редактировать чужую вакансию');
      return;
    }

    // Проверяем, что вакансию можно редактировать
    if (vacancy.status !== 'new') {
      Alert.alert(
        'Редактирование невозможно',
        'Вакансию можно редактировать только со статусом "Новая"'
      );
      return;
    }

    // Переходим на экран редактирования вакансии
    navigation.navigate('EditVacancy', { vacancyId: vacancy.id });
  };

  if (isLoading || !vacancy) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderWithBack title="Вакансия" />
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

  // Компонент кнопки редактирования для header
  const renderEditButton = () => {
    if (!isVacancyOwner || vacancy.status !== 'new') {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.headerEditButton}
        onPress={handleEditVacancy}
        activeOpacity={0.7}
      >
        <PencilIcon width={20} height={20} stroke={theme.colors.primary} />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#FFFFFF"
      />
      <SafeAreaView style={styles.topContainer} edges={['top']}>
        <HeaderWithBack 
          title="Вакансия" 
          backgroundColor="#FFFFFF"
          rightComponent={renderEditButton()}
        />

      {/* Табы - показываем только для владельца вакансии */}
      {isVacancyOwner && (
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
            <View style={styles.tabContentWithBadge}>
              <Text style={[styles.tabText, selectedTab === 'applications' && styles.tabTextActive]}>
                Отклики {applications.length > 0 && `(${applications.length})`}
              </Text>
              {(vacancy.unreadApplicantsCount || 0) > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {vacancy.unreadApplicantsCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}
      </SafeAreaView>
      
      <SafeAreaView style={styles.container} edges={['bottom']}>

      {(selectedTab === 'info' || !isVacancyOwner) ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Заголовок и зарплата */}
          <View style={styles.header}>
            <Text style={styles.title}>{vacancy.jobTitle || vacancy.title}</Text>
            <Text style={styles.salary}>{formatSalary()}</Text>
            {vacancy.customerUserType === 'company' && vacancy.customerCompanyName && (
              <Text style={styles.companyName}>{vacancy.customerCompanyName}</Text>
            )}
          </View>

          {/* Карта с адресом */}
          {vacancy.location && vacancy.latitude && vacancy.longitude && (
            <OrderLocationMap
              latitude={vacancy.latitude}
              longitude={vacancy.longitude}
              address={vacancy.location}
              title="Место работы"
              containerStyle={{ marginHorizontal: 0 }}
            />
          )}

          {/* Адрес без карты (если нет координат) */}
          {vacancy.location && (!vacancy.latitude || !vacancy.longitude) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Адрес</Text>
              <Text style={styles.locationText}>{vacancy.location}</Text>
            </View>
          )}

          {/* Основная информация */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Основная информация</Text>

            {vacancy.specializationId && t && (() => {
              const spec = getSpecializationById(vacancy.specializationId);
              return spec && (
                <InfoRow 
                  icon={
                    <CategoryIcon
                      icon={spec.icon}
                      iconComponent={spec.iconComponent}
                      size={16}
                    />
                  } 
                  label="Специализация" 
                  value={getTranslatedSpecializationName(vacancy.specializationId, t)} 
                />
              );
            })()}
            {vacancy.city && <InfoRow icon={<MarkerPinIcon size={16} color="#6B7280" />} label="Город" value={getCityName(vacancy.city)} />}
            {vacancy.experienceLevel && (
              <InfoRow icon={<CalendarDateIcon size={16} color="#6B7280" />} label="Опыт" value={getExperienceLevelLabel(vacancy.experienceLevel)} />
            )}
            {vacancy.employmentType && (
              <InfoRow icon={<HourglassIcon size={16} color="#6B7280" />} label="Занятость" value={getEmploymentTypeLabel(vacancy.employmentType)} />
            )}
            {vacancy.workFormat && (
              <InfoRow icon={<BuildingIcon size={16} color="#6B7280" />} label="Формат" value={getWorkFormatLabel(vacancy.workFormat)} />
            )}
            {vacancy.workSchedule && (
              <InfoRow icon={<ClockIcon size={16} color="#6B7280" />} label="График" value={getWorkScheduleLabel(vacancy.workSchedule)} />
            )}
            {vacancy.paymentFrequency && (
              <InfoRow
                icon={<BankNoteIcon size={16} color="#6B7280" />}
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

          <View style={styles.bottomSpacer} />
        </ScrollView>
      ) : isVacancyOwner ? (
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
                  onViewResume={() => handleViewResume(item)}
                  onAccept={() => handleAcceptApplication(item)}
                  onReject={() => handleRejectApplication(item)}
                />
              )}
              contentContainerStyle={styles.applicationsList}
            />
          )}
        </View>
      ) : null}
    </SafeAreaView>
    </>
  );
};

// Компонент для строки информации
const InfoRow: React.FC<{ icon: string | React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabel}>
      {typeof icon === 'string' ? (
        <Text style={styles.infoIcon}>{icon}</Text>
      ) : (
        <View style={styles.infoIconContainer}>{icon}</View>
      )}
      <Text style={styles.infoLabelText}>{label}:</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  topContainer: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  tabContentWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  tabBadge: {
    backgroundColor: '#E10000',
    borderRadius: 50,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
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
    borderWidth: 1,
    borderColor: '#DAE3EC',
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
  companyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DAE3EC',
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
  infoIconContainer: {
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
    borderWidth: 1,
    borderColor: '#DAE3EC',
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
  headerEditButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
});

