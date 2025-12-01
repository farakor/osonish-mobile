import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme, getSpecializationById, getTranslatedSpecializationNameSingular } from '../../constants';
import type { CustomerStackParamList, VacancyApplication } from '../../types';
import { CategoryIcon } from '../../components/common';
import {
  professionalMasterService,
  ProfessionalMaster,
} from '../../services/professionalMasterService';
import CVBadge from '../../../assets/cv_badge.svg';
import ShareIcon from '../../../assets/share-01.svg';
import PhoneIcon from '../../../assets/phone-call-01-white.svg';
import ArrowBackIcon from '../../../assets/arrow-narrow-left.svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useTranslation, useCustomerTranslation, useAuthTranslation } from '../../hooks/useTranslation';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;
type ScreenRouteProp = RouteProp<CustomerStackParamList, 'ApplicantResume'>;

export const ApplicantResumeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { applicantId } = route.params;
  const { t } = useTranslation();
  const tCustomer = useCustomerTranslation();
  const tAuth = useAuthTranslation();

  const [applicant, setApplicant] = useState<ProfessionalMaster | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    loadApplicant();
  }, [applicantId]);

  const loadApplicant = async () => {
    try {
      setIsLoading(true);
      const data = await professionalMasterService.getMasterById(applicantId);
      
      console.log('[ApplicantResume] Загружен профиль кандидата:', {
        id: data?.id,
        name: data ? `${data.firstName} ${data.lastName}` : null,
        workerType: data?.workerType,
        education: data?.education,
        workExperience: data?.workExperience,
        skills: data?.skills,
        phone: data?.phone,
      });
      
      setApplicant(data);
    } catch (error) {
      console.error('[ApplicantResume] Ошибка загрузки профиля кандидата:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить резюме кандидата');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (!applicant?.phone) {
      Alert.alert('Ошибка', 'Номер телефона недоступен');
      return;
    }
    
    Linking.openURL(`tel:${applicant.phone}`);
  };

  const handleShareAsPDF = async () => {
    try {
      if (!viewShotRef.current?.capture) {
        Alert.alert('Ошибка', 'Не удалось создать PDF');
        return;
      }

      setIsSharing(true);
      
      // Захватываем скриншот резюме
      const uri = await viewShotRef.current.capture();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Поделиться резюме кандидата',
          mimeType: 'image/png',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Ошибка', 'Функция отправки недоступна на этом устройстве');
      }
    } catch (error) {
      console.error('[ApplicantResume] Ошибка при создании PDF:', error);
      Alert.alert('Ошибка', 'Не удалось создать PDF резюме');
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowBackIcon width={24} height={24} stroke="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Резюме кандидата</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Загрузка резюме...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!applicant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowBackIcon width={24} height={24} stroke="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Резюме кандидата</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Резюме кандидата не найдено</Text>
        </View>
      </SafeAreaView>
    );
  }

  const primarySpecialization = applicant.specializations && Array.isArray(applicant.specializations) 
    ? applicant.specializations.find(s => s.isPrimary)
    : null;
  const spec = primarySpecialization ? getSpecializationById(primarySpecialization.id) : null;

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowBackIcon width={24} height={24} stroke="#1F2937" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Резюме кандидата</Text>
          
          <TouchableOpacity 
            onPress={handleShareAsPDF} 
            style={styles.headerButton}
            activeOpacity={0.7}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <ShareIcon width={24} height={24} stroke="#1F2937" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ViewShot 
        ref={viewShotRef} 
        options={{ format: 'png', quality: 0.9 }} 
        style={styles.viewShotContainer}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Карточка профиля */}
          <View style={styles.profileCard}>
            <View style={styles.profileCardContent}>
              {/* Аватар */}
              <View style={styles.avatarSection}>
                {applicant.profileImage ? (
                  <Image
                    source={{ uri: applicant.profileImage }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {applicant.firstName.charAt(0)}{applicant.lastName.charAt(0)}
                    </Text>
                  </View>
                )}
                
                {/* CV Badge */}
                <View style={styles.cvBadgeContainer}>
                  <CVBadge width={48} height={20} />
                </View>
              </View>
              
              {/* Основная информация */}
              <View style={styles.mainInfo}>
                <Text style={styles.fullName}>
                  {applicant.firstName} {applicant.lastName}
                </Text>
                
                {primarySpecialization && (
                  <View style={styles.primarySpecBadge}>
                    {spec?.iconComponent && (
                      <CategoryIcon
                        icon={spec.icon}
                        iconComponent={spec.iconComponent}
                        size={16}
                        style={styles.primarySpecIcon}
                      />
                    )}
                    <Text style={styles.primarySpecText}>
                      {getTranslatedSpecializationNameSingular(primarySpecialization.id, t as any)}
                    </Text>
                  </View>
                )}

                {applicant.city && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.locationText}>{applicant.city}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Контактная информация */}
          {applicant.phone && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📞 Контактная информация</Text>
              <View style={styles.contactItem}>
                <View style={styles.contactIconBox}>
                  <Text style={styles.contactEmoji}>📱</Text>
                </View>
                <View style={styles.contactContent}>
                  <Text style={styles.contactLabel}>Телефон</Text>
                  <Text style={styles.contactValue}>{applicant.phone}</Text>
                </View>
              </View>
            </View>
          )}

          {/* О себе */}
          {applicant.aboutMe && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>👤 О себе</Text>
              <Text style={styles.aboutText}>{applicant.aboutMe}</Text>
            </View>
          )}

          {/* Дополнительная информация: зарплата и готовность к переезду */}
          {(applicant.desiredSalary || applicant.willingToRelocate) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💼 Пожелания к работе</Text>
              <View style={styles.preferencesGrid}>
                {applicant.desiredSalary && (
                  <View style={styles.preferenceItem}>
                    <View style={styles.preferenceIconBox}>
                      <Text style={styles.preferenceEmoji}>💰</Text>
                    </View>
                    <View style={styles.preferenceContent}>
                      <Text style={styles.preferenceLabel}>Желаемая зарплата</Text>
                      <Text style={styles.preferenceValue}>
                        {applicant.desiredSalary.toLocaleString('ru-RU')} сум
                      </Text>
                    </View>
                  </View>
                )}
                
                {applicant.willingToRelocate && (
                  <View style={styles.preferenceItem}>
                    <View style={styles.preferenceIconBox}>
                      <Text style={styles.preferenceEmoji}>🚗</Text>
                    </View>
                    <View style={styles.preferenceContent}>
                      <Text style={styles.preferenceLabel}>Переезд</Text>
                      <Text style={styles.preferenceValue}>Готов к переезду</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Все специализации */}
          {applicant.specializations && Array.isArray(applicant.specializations) && applicant.specializations.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎯 {tAuth('specialization_selection_title')}</Text>
              <View style={styles.specializationsGrid}>
                {applicant.specializations.map((spec, index) => {
                  const specData = getSpecializationById(spec.id);
                  return (
                    <View 
                      key={spec.id} 
                      style={[
                        styles.specChip,
                        spec.isPrimary && styles.specChipPrimary
                      ]}
                    >
                      {specData?.iconComponent && (
                        <CategoryIcon
                          icon={specData.icon}
                          iconComponent={specData.iconComponent}
                          size={16}
                          style={styles.specChipIcon}
                        />
                      )}
                      <Text style={[
                        styles.specChipText,
                        spec.isPrimary && styles.specChipTextPrimary
                      ]}>
                        {getTranslatedSpecializationNameSingular(spec.id, t as any)}
                      </Text>
                      {spec.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>★</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Опыт работы */}
          {applicant.workExperience && Array.isArray(applicant.workExperience) && applicant.workExperience.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💼 {tAuth('experience_section')}</Text>
              {applicant.workExperience.map((work, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.experienceItem,
                    index !== applicant.workExperience!.length - 1 && styles.experienceItemBorder
                  ]}
                >
                  <View style={styles.experienceHeader}>
                    <View style={styles.experienceIconBox}>
                      <Text style={styles.experienceIcon}>💼</Text>
                    </View>
                    <View style={styles.experienceContent}>
                      <Text style={styles.experiencePosition}>{work.position}</Text>
                      <Text style={styles.experienceCompany}>{work.company}</Text>
                      {(work.yearStart || work.yearEnd) && (
                        <Text style={styles.experienceYears}>
                          {work.yearStart || '?'} - {work.yearEnd || 'н.в.'}
                        </Text>
                      )}
                      {work.description && (
                        <Text style={styles.experienceDescription}>{work.description}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Образование */}
          {applicant.education && Array.isArray(applicant.education) && applicant.education.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎓 {tAuth('education_section')}</Text>
              {applicant.education.map((edu, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.educationItem,
                    index !== applicant.education!.length - 1 && styles.educationItemBorder
                  ]}
                >
                  <View style={styles.educationHeader}>
                    <View style={styles.educationIconBox}>
                      <Text style={styles.educationIcon}>🎓</Text>
                    </View>
                    <View style={styles.educationContent}>
                      <Text style={styles.educationInstitution}>{edu.institution}</Text>
                      {edu.degree && (
                        <Text style={styles.educationDegree}>{edu.degree}</Text>
                      )}
                      {(edu.yearStart || edu.yearEnd) && (
                        <Text style={styles.educationYears}>
                          {edu.yearStart || '?'} - {edu.yearEnd || 'н.в.'}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Навыки */}
          {applicant.skills && Array.isArray(applicant.skills) && applicant.skills.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⚡️ {tAuth('my_skills')}</Text>
              <View style={styles.skillsGrid}>
                {applicant.skills.map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ViewShot>

      {/* Кнопки действий */}
      <SafeAreaView edges={['bottom']} style={styles.actionBar}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <PhoneIcon width={20} height={20} style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Позвонить</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleShareAsPDF}
            activeOpacity={0.8}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <ShareIcon width={20} height={20} stroke={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  viewShotContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Карточка профиля
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarSection: {
    marginRight: 16,
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#E8F5E9',
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#C7D2FE',
  },
  avatarPlaceholderText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6366F1',
  },
  cvBadgeContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  mainInfo: {
    flex: 1,
    paddingTop: 4,
  },
  fullName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 28,
  },
  primarySpecBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  primarySpecIcon: {
    marginRight: 6,
  },
  primarySpecText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Карточки секций
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  
  // Контактная информация
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactEmoji: {
    fontSize: 24,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Пожелания к работе
  preferencesGrid: {
    gap: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  preferenceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  preferenceEmoji: {
    fontSize: 24,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  preferenceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Специализации
  specializationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  specChipPrimary: {
    backgroundColor: '#ECFDF5',
    borderColor: '#86EFAC',
  },
  specChipIcon: {
    marginRight: 6,
  },
  specChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  specChipTextPrimary: {
    color: '#16A34A',
    fontWeight: '600',
  },
  primaryBadge: {
    marginLeft: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  
  // Опыт работы
  experienceItem: {
    paddingVertical: 12,
  },
  experienceItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  experienceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  experienceIcon: {
    fontSize: 20,
  },
  experienceContent: {
    flex: 1,
  },
  experiencePosition: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  experienceCompany: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
    marginBottom: 4,
  },
  experienceYears: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  experienceDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  
  // Образование
  educationItem: {
    paddingVertical: 12,
  },
  educationItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  educationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  educationIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  educationIcon: {
    fontSize: 20,
  },
  educationContent: {
    flex: 1,
  },
  educationInstitution: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  educationDegree: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  educationYears: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  
  // Навыки
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skillTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonIcon: {
    // styles for icon
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  bottomSpacer: {
    height: 40,
  },
});

