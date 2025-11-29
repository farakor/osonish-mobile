import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { HeaderWithBack, OrderLocationMap } from '../../components/common';
import { useVacancyDetails, useHasAppliedToVacancy, useApplyToVacancy } from '../../hooks/queries/useVacancyQueries';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { AuthRequiredModal } from '../../components/auth/AuthRequiredModal';
import { authService } from '../../services/authService';
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
import { getTranslatedSpecializationName, getSpecializationById } from '../../constants/specializations';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { MarkerPinIcon } from '../../components/common/MarkerPinIcon';
import { CalendarDateIcon } from '../../components/common/CalendarDateIcon';
import { HourglassIcon } from '../../components/common/HourglassIcon';
import { BuildingIcon } from '../../components/common/BuildingIcon';
import { ClockIcon } from '../../components/common/ClockIcon';
import { BankNoteIcon } from '../../components/common/BankNoteIcon';
import { vacancyService } from '../../services/vacancyService';
import { useTranslation } from 'react-i18next';

type VacancyDetailsRouteProp = RouteProp<{ VacancyDetails: { vacancyId: string } }, 'VacancyDetails'>;

export const VacancyDetailsScreen: React.FC = () => {
  console.log('[VacancyDetailsScreen] 🚀 Компонент загружен!');
  
  const navigation = useNavigation();
  const route = useRoute<VacancyDetailsRouteProp>();
  const { vacancyId } = route.params;
  const { t } = useTranslation();
  
  console.log('[VacancyDetailsScreen] 📝 vacancyId:', vacancyId);
  
  const { data: vacancy, isLoading } = useVacancyDetails(vacancyId);
  const applyMutation = useApplyToVacancy();
  const { requireAuth, isAuthModalVisible, hideAuthModal } = useRequireAuth();

  // Проверяем авторизацию
  const authState = authService.getAuthState();
  const isAuthenticated = authState.isAuthenticated;
  const currentUserId = authState.user?.id;
  
  console.log('[VacancyDetailsScreen] 🔐 isAuthenticated:', isAuthenticated);
  console.log('[VacancyDetailsScreen] 👤 currentUserId:', currentUserId);
  
  // Используем хук только для авторизованных пользователей
  const { data: hasApplied } = useHasAppliedToVacancy(vacancyId);
  
  // Для неавторизованных всегда false
  const userHasApplied = isAuthenticated ? hasApplied : false;
  
  // Проверяем, является ли текущий пользователь автором вакансии
  const isMyVacancy = currentUserId && vacancy?.customerId === currentUserId;

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  // Логирование для отладки
  useEffect(() => {
    console.log('[VacancyDetails] ============ DEBUG START ============');
    console.log('[VacancyDetails] isAuthenticated:', isAuthenticated);
    console.log('[VacancyDetails] hasApplied:', hasApplied);
    console.log('[VacancyDetails] userHasApplied:', userHasApplied);
    console.log('[VacancyDetails] vacancyId:', vacancyId);
    console.log('[VacancyDetails] ============ DEBUG END ============');
  }, [isAuthenticated, hasApplied, userHasApplied, vacancyId]);

  // Увеличиваем счетчик просмотров при открытии вакансии
  useEffect(() => {
    if (vacancy) {
      vacancyService.incrementVacancyViews(vacancyId);
    }
  }, [vacancyId, vacancy]);

  const handleApply = async () => {
    const result = await applyMutation.mutateAsync({
      vacancyId,
      coverLetter: coverLetter.trim() || undefined,
    });

    if (result.success) {
      Alert.alert('Успешно', 'Ваш отклик отправлен работодателю');
      setShowApplyModal(false);
      setCoverLetter('');
    } else {
      Alert.alert('Ошибка', result.error || 'Не удалось отправить отклик');
    }
  };

  if (isLoading || !vacancy) {
    console.log('[VacancyDetailsScreen] ⏳ Загрузка... isLoading:', isLoading, 'vacancy:', !!vacancy);
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderWithBack title="Детали вакансии" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  console.log('[VacancyDetailsScreen] ✅ Данные загружены, отображаем вакансию');
  console.log('[VacancyDetailsScreen] 📊 userHasApplied:', userHasApplied);

  const formatSalary = () => {
    if (vacancy.salaryFrom && vacancy.salaryTo) {
      const period = vacancy.salaryPeriod ? getSalaryPeriodLabel(vacancy.salaryPeriod) : '';
      const type = vacancy.salaryType ? ` (${getSalaryTypeLabel(vacancy.salaryType)})` : '';
      return `${vacancy.salaryFrom.toLocaleString()} - ${vacancy.salaryTo.toLocaleString()} сум ${period}${type}`.toLowerCase();
    }
    return 'Договорная';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <HeaderWithBack title="Детали вакансии" />
      
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
          <View style={styles.section}>
            <OrderLocationMap
              latitude={vacancy.latitude}
              longitude={vacancy.longitude}
              address={vacancy.location}
              title="Место работы"
              containerStyle={{ marginHorizontal: 0, marginBottom: 0 }}
            />
          </View>
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
          {vacancy.city && (
            <InfoRow icon={<MarkerPinIcon size={16} color="#6B7280" />} label="Город" value={getCityName(vacancy.city)} />
          )}
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
            <InfoRow icon={<BankNoteIcon size={16} color="#6B7280" />} label="Выплаты" value={getPaymentFrequencyLabel(vacancy.paymentFrequency)} />
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

      {/* DEBUG: Показываем состояние */}
      {console.log('[VacancyDetails RENDER] userHasApplied:', userHasApplied, 'isAuthenticated:', isAuthenticated, 'hasApplied:', hasApplied, 'isMyVacancy:', isMyVacancy)}

      {/* Кнопка откликнуться - показываем только если это не моя вакансия */}
      {!isMyVacancy && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.applyButton,
              userHasApplied && styles.appliedBadge
            ]}
            onPress={() => {
              if (userHasApplied) return;
              console.log('[VacancyDetails] Button pressed! isAuthenticated:', isAuthenticated);
              requireAuth(() => setShowApplyModal(true));
            }}
            activeOpacity={0.8}
            disabled={userHasApplied}
          >
            <Text style={[
              styles.applyButtonText,
              userHasApplied && styles.appliedText
            ]}>
              {userHasApplied ? '✓ Вы откликнулись на эту вакансию' : 'Откликнуться на вакансию'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Модальное окно для авторизации */}
      <AuthRequiredModal
        visible={isAuthModalVisible}
        onClose={hideAuthModal}
      />

      {/* Модальное окно для отклика */}
      <Modal
        visible={showApplyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Отклик на вакансию</Text>
            <Text style={styles.modalSubtitle}>
              Расскажите, почему вы подходите на эту вакансию (необязательно)
            </Text>
            
            <TextInput
              style={styles.coverLetterInput}
              multiline
              numberOfLines={6}
              placeholder="Ваше сообщение работодателю..."
              placeholderTextColor="#9CA3AF"
              value={coverLetter}
              onChangeText={setCoverLetter}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowApplyModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton]}
                onPress={handleApply}
                activeOpacity={0.7}
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <Text style={styles.sendButtonText}>Отправить</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  container: {
    flex: 1,
    backgroundColor: '#F4F5FC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 100,
  },
  footer: {
    padding: 16,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.white,
  },
  appliedBadge: {
    backgroundColor: '#D1FAE5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  appliedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  coverLetterInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 150,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.white,
  },
});

