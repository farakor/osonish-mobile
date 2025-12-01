import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { theme } from '../../constants';
import { VacancyApplication } from '../../types';

interface VacancyApplicationCardProps {
  application: VacancyApplication;
  onPress?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onViewResume?: () => void;
  showActions?: boolean;
}

export const VacancyApplicationCard: React.FC<VacancyApplicationCardProps> = ({
  application,
  onPress,
  onAccept,
  onReject,
  onViewResume,
  showActions = false,
}) => {
  const getStatusBadge = () => {
    const statusConfig = {
      pending: { label: 'Ожидает', color: '#F59E0B', bgColor: '#FEF3C7' },
      accepted: { label: 'Принят', color: '#10B981', bgColor: '#D1FAE5' },
      rejected: { label: 'Отклонен', color: '#EF4444', bgColor: '#FEE2E2' },
      withdrawn: { label: 'Отозван', color: '#6B7280', bgColor: '#F3F4F6' },
    };

    const config = statusConfig[application.status];

    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.applicantInfo}>
          {application.applicantAvatar ? (
            <Image source={{ uri: application.applicantAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {application.applicantName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{application.applicantName}</Text>
            <Text style={styles.appliedDate}>
              Откликнулся {new Date(application.appliedAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>
        </View>
        {getStatusBadge()}
      </View>

      {application.coverLetter && (
        <View style={styles.coverLetterContainer}>
          <Text style={styles.coverLetterTitle}>Сопроводительное письмо:</Text>
          <Text style={styles.coverLetterText} numberOfLines={3}>
            {application.coverLetter}
          </Text>
        </View>
      )}

      {application.applicantSkills && application.applicantSkills.length > 0 && (
        <View style={styles.skillsContainer}>
          <Text style={styles.skillsTitle}>Навыки:</Text>
          <View style={styles.skillsChips}>
            {application.applicantSkills.slice(0, 4).map((skill, index) => (
              <View key={index} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {application.applicantSkills.length > 4 && (
              <View style={styles.skillChip}>
                <Text style={styles.skillText}>+{application.applicantSkills.length - 4}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Кнопка просмотра резюме - показываем всегда */}
      {onViewResume && (
        <TouchableOpacity
          style={styles.viewResumeButton}
          onPress={onViewResume}
          activeOpacity={0.7}
        >
          <Text style={styles.viewResumeButtonText}>📄 Просмотреть резюме</Text>
        </TouchableOpacity>
      )}

      {showActions && application.status === 'pending' && onAccept && onReject && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={onReject}
            activeOpacity={0.7}
          >
            <Text style={styles.rejectButtonText}>Отклонить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={onAccept}
            activeOpacity={0.7}
          >
            <Text style={styles.acceptButtonText}>Принять</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.white,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  appliedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  coverLetterContainer: {
    marginBottom: 12,
  },
  coverLetterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  coverLetterText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  skillsContainer: {
    marginBottom: 12,
  },
  skillsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  skillsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  viewResumeButton: {
    backgroundColor: '#F0F7FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  viewResumeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
});

