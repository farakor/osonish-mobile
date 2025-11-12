import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { theme, getSpecializationIcon, getTranslatedSpecializationNameSingular } from '../../constants';
import ProBadge from '../../../assets/pro_badge.svg';
import CVBadge from '../../../assets/cv_badge.svg';
import EyeIcon from '../../../assets/eye.svg';
import { lightElevationStyles } from '../../utils/noShadowStyles';
import { ProfessionalMaster } from '../../services/professionalMasterService';
import { useTranslation } from 'react-i18next';

const VIEWS_COLOR = '#9AA0A6'; // Цвет для счетчика просмотров

interface ProfessionalMasterCardProps {
  master: ProfessionalMaster;
  onPress: () => void;
}

export const ProfessionalMasterCard: React.FC<ProfessionalMasterCardProps> = ({
  master,
  onPress,
}) => {
  const { t } = useTranslation();
  
  // Получаем основную специализацию
  const primarySpecialization = master.specializations.find(s => s.isPrimary);
  const specIcon = primarySpecialization
    ? getSpecializationIcon(primarySpecialization.id)
    : '🔨';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Фото профиля слева */}
      <View style={styles.imageContainer}>
        {master.profileImage ? (
          <Image
            source={{ uri: master.profileImage }}
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>
              {master.firstName.charAt(0)}{master.lastName.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      {/* Информация справа */}
      <View style={styles.infoContainer}>
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {master.firstName} {master.lastName}
          </Text>
          {/* Бейдж в зависимости от типа исполнителя */}
          {master.workerType === 'professional' && (
            <View style={styles.proBadgeContainer}>
              <ProBadge width={44} height={18} />
            </View>
          )}
          {master.workerType === 'job_seeker' && (
            <View style={styles.proBadgeContainer}>
              <CVBadge width={58} height={24} />
            </View>
          )}
        </View>

        {primarySpecialization && (
          <Text style={styles.specialization} numberOfLines={1}>
            {getTranslatedSpecializationNameSingular(primarySpecialization.id, t)}
          </Text>
        )}

        {/* Views Count */}
        <View style={styles.viewsContainer}>
          <EyeIcon width={14} height={14} stroke={VIEWS_COLOR} strokeWidth={1.5} />
          <Text style={styles.viewsText}>{master.profileViewsCount || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...lightElevationStyles,
  },
  imageContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginRight: 6,
  },
  proBadgeContainer: {
    marginTop: 2,
  },
  specialization: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 12,
    color: VIEWS_COLOR,
    fontWeight: '500',
  },
});

