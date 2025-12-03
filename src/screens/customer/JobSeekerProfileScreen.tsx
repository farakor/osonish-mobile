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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme, getSpecializationById, getTranslatedSpecializationNameSingular } from '../../constants';
import type { CustomerStackParamList } from '../../types';
import { CategoryIcon } from '../../components/common';
import {
  professionalMasterService,
  ProfessionalMaster,
} from '../../services/professionalMasterService';
import { LinearGradient } from 'expo-linear-gradient';
import CVBadge from '../../../assets/cv_badge.svg';
import ShareIcon from '../../../assets/share-01.svg';
import PhoneIcon from '../../../assets/phone-call-01-white.svg';
import ArrowBackIcon from '../../../assets/arrow-narrow-left.svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ProfessionalMasterProfileSkeleton } from '../../components/skeletons';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { AuthRequiredModal } from '../../components/auth/AuthRequiredModal';
import { useTranslation, useCustomerTranslation, useAuthTranslation } from '../../hooks/useTranslation';
import { getCityName } from '../../utils/cityUtils';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;
type ScreenRouteProp = RouteProp<CustomerStackParamList, 'JobSeekerProfile'>;

export const JobSeekerProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { masterId } = route.params;
  const { t } = useTranslation();
  const tCustomer = useCustomerTranslation();
  const tAuth = useAuthTranslation();
  
  // Hook для проверки авторизации
  const { requireAuth, isAuthModalVisible, hideAuthModal } = useRequireAuth();

  const [master, setMaster] = useState<ProfessionalMaster | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    loadMaster();
  }, [masterId]);

  const loadMaster = async () => {
    try {
      setIsLoading(true);
      const data = await professionalMasterService.getMasterById(masterId);
      
      console.log('[JobSeekerProfile] Загружен профиль:', {
        id: data?.id,
        name: data ? `${data.firstName} ${data.lastName}` : null,
        workerType: data?.workerType,
        education: data?.education,
        educationCount: data?.education?.length || 0,
        workExperience: data?.workExperience,
        workExperienceCount: data?.workExperience?.length || 0,
        skills: data?.skills,
        skillsCount: data?.skills?.length || 0,
        desiredSalary: data?.desiredSalary,
        willingToRelocate: data?.willingToRelocate,
      });
      
      setMaster(data);

      // Увеличиваем счетчик просмотров профиля
      if (data) {
        await professionalMasterService.incrementProfileViews(masterId);
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      Alert.alert(tCustomer('error'), tCustomer('profile_load_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (!master) return;

    // Проверяем авторизацию перед звонком
    requireAuth(() => {
      // Если пользователь авторизован, совершаем звонок
      if (master.phone) {
        Linking.openURL(`tel:${master.phone}`);
      } else {
        Alert.alert(tCustomer('error'), tCustomer('phone_not_available'));
      }
    });
  };

  const handleShare = async () => {
    try {
      if (!viewShotRef.current?.capture) return;

      const uri = await viewShotRef.current.capture();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: tCustomer('share_master_profile'),
        });
      }
    } catch (error) {
      console.error('Ошибка при создании скриншота:', error);
      Alert.alert(tCustomer('error'), tCustomer('share_error'));
    }
  };

  if (isLoading) {
    return <ProfessionalMasterProfileSkeleton />;
  }

  if (!master) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{tCustomer('master_not_found')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const primarySpecialization = master.specializations && Array.isArray(master.specializations) 
    ? master.specializations.find(s => s.isPrimary)
    : null;
  const spec = primarySpecialization ? getSpecializationById(primarySpecialization.id) : null;

  return (
    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Компактный Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowBackIcon width={24} height={24} stroke="#1F2937" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Профиль кандидата</Text>
          
          <TouchableOpacity 
            onPress={handleShare} 
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <ShareIcon width={24} height={24} stroke="#1F2937" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

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
              {master.profileImage ? (
                <Image
                  source={{ uri: master.profileImage }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {master.firstName.charAt(0)}{master.lastName.charAt(0)}
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
                {master.firstName} {master.lastName}
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

              {master.city && (
                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText}>{getCityName(master.city)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* О себе */}
        {master.aboutMe && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👤 О себе</Text>
            <Text style={styles.aboutText}>{master.aboutMe}</Text>
          </View>
        )}

        {/* Дополнительная информация: зарплата и готовность к переезду */}
        {(master.desiredSalary || master.willingToRelocate) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💼 Пожелания к работе</Text>
            <View style={styles.preferencesGrid}>
              {master.desiredSalary && (
                <View style={styles.preferenceItem}>
                  <View style={styles.preferenceIconBox}>
                    <Text style={styles.preferenceEmoji}>💰</Text>
                  </View>
                  <View style={styles.preferenceContent}>
                    <Text style={styles.preferenceLabel}>Желаемая зарплата</Text>
                    <Text style={styles.preferenceValue}>
                      {master.desiredSalary.toLocaleString('ru-RU')} сум
                    </Text>
                  </View>
                </View>
              )}
              
              {master.willingToRelocate && (
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
        {master.specializations && Array.isArray(master.specializations) && master.specializations.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 {tAuth('specialization_selection_title')}</Text>
            <View style={styles.specializationsGrid}>
              {master.specializations.map((spec, index) => {
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
        {master.workExperience && Array.isArray(master.workExperience) && master.workExperience.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💼 {tAuth('experience_section')}</Text>
            {master.workExperience.map((work, index) => (
              <View 
                key={index} 
                style={[
                  styles.experienceItem,
                  index !== master.workExperience!.length - 1 && styles.experienceItemBorder
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
        {master.education && Array.isArray(master.education) && master.education.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎓 {tAuth('education_section')}</Text>
            {master.education.map((edu, index) => (
              <View 
                key={index} 
                style={[
                  styles.educationItem,
                  index !== master.education!.length - 1 && styles.educationItemBorder
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
        {master.skills && Array.isArray(master.skills) && master.skills.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚡️ {tAuth('my_skills')}</Text>
            <View style={styles.skillsGrid}>
              {master.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        </ScrollView>

        {/* Кнопки действий */}
        <SafeAreaView edges={['bottom']} style={styles.actionBar}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <PhoneIcon width={20} height={20} style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>{tCustomer('call_master')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <ShareIcon width={20} height={20} stroke={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        {/* Auth Required Modal */}
        <AuthRequiredModal 
          visible={isAuthModalVisible}
          onClose={hideAuthModal}
          message={tCustomer('call_master_auth_message')}
        />
      </ViewShot>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
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
    borderWidth: 1,
    borderColor: '#DAE3EC',
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
    borderWidth: 1,
    borderColor: '#DAE3EC',
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
    borderTopColor: '#DAE3EC',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

