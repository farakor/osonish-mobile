import React, { useMemo } from 'react';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { StoryCardData } from '../components/stories/types';
import type { User } from '../types';

// Иконки
import BriefcaseIcon from '../../assets/briefcase.svg';
import FileIcon from '../../assets/file-02.svg';
import BlogIcon from '../../assets/blog-pencil.svg';
import GraduationIcon from '../../assets/graduation-cap.svg';

const ICON_SIZE = 24;
const ICON_COLOR = '#679B00'; // Основной зелёный цвет для иконок
const ICON_BG_COLOR = '#679B0018'; // Светлый оттенок для фона

interface UseJobSeekerStoriesParams {
  user: User | null;
  applicationsCount?: number;
  pendingCount?: number;
  acceptedCount?: number;
}

interface UseJobSeekerStoriesResult {
  stories: StoryCardData[];
}

// Функция для расчета прогресса резюме
const calculateResumeProgress = (user: User | null): { progress: number; filled: number; total: number } => {
  if (!user || user.workerType !== 'job_seeker') {
    return { progress: 0, filled: 0, total: 5 };
  }

  let filledFields = 0;
  const totalFields = 5;

  // О себе
  if (user.aboutMe && user.aboutMe.trim().length > 0) filledFields++;

  // Образование
  if (user.education && user.education.length > 0) filledFields++;

  // Желаемая зарплата
  if (user.desiredSalary) filledFields++;

  // Опыт работы
  if (user.workExperience && user.workExperience.length > 0) filledFields++;

  // Навыки
  if (user.skills && user.skills.length > 0) filledFields++;

  return {
    progress: Math.round((filledFields / totalFields) * 100),
    filled: filledFields,
    total: totalFields,
  };
};

export const useJobSeekerStories = ({
  user,
  applicationsCount = 0,
  pendingCount = 0,
  acceptedCount = 0,
}: UseJobSeekerStoriesParams): UseJobSeekerStoriesResult => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const stories = useMemo<StoryCardData[]>(() => {
    const { progress, filled, total } = calculateResumeProgress(user);

    const storyItems: StoryCardData[] = [
      // 1. Прогресс заполнения резюме
      {
        id: 'resume_progress',
        type: 'resume_progress',
        title: t('stories.resume_progress_title', 'Заполните резюме'),
        actionText: t('stories.fill_resume', 'Заполнить'),
        progress,
        progressText: `${progress}%`,
        iconBackgroundColor: ICON_COLOR,
        visible: progress < 100,
        onPress: () => navigation.navigate('Profile'),
      },

      // 2. Откликнитесь на вакансии
      {
        id: 'apply_vacancies',
        type: 'apply_vacancies',
        title: t('stories.apply_vacancies_title', 'Откликнитесь на вакансии'),
        actionText: t('stories.find_vacancies', 'Найти'),
        icon: <BriefcaseIcon width={ICON_SIZE} height={ICON_SIZE} color={ICON_COLOR} />,
        iconBackgroundColor: ICON_BG_COLOR,
        visible: applicationsCount < 10,
        onPress: () => navigation.navigate('Vacancies'),
      },

      // 3. Статус откликов
      {
        id: 'application_status',
        type: 'application_status',
        title: pendingCount > 0 
          ? t('stories.pending_applications', '{{count}} на рассмотрении', { count: pendingCount })
          : acceptedCount > 0
            ? t('stories.accepted_applications', '{{count}} принято!', { count: acceptedCount })
            : t('stories.no_applications', 'Нет активных откликов'),
        actionText: t('stories.view_applications', 'Посмотреть'),
        icon: <FileIcon width={ICON_SIZE} height={ICON_SIZE} color={ICON_COLOR} />,
        iconBackgroundColor: ICON_BG_COLOR,
        visible: applicationsCount > 0,
        onPress: () => navigation.navigate('Applications'),
      },

      // 4. Полезные статьи
      {
        id: 'articles',
        type: 'articles',
        title: t('stories.articles_title', 'Полезные советы'),
        actionText: t('stories.read', 'Читать'),
        icon: <BlogIcon width={ICON_SIZE} height={ICON_SIZE} color={ICON_COLOR} />,
        iconBackgroundColor: ICON_BG_COLOR,
        visible: true,
        externalUrl: 'https://osonish.uz/blog/resume-tips',
        onPress: () => {
          Linking.openURL('https://osonish.uz/blog/resume-tips').catch(() => {});
        },
      },

      // 6. Карьерные советы / Курсы
      {
        id: 'career_tips',
        type: 'career_tips',
        title: t('stories.career_tips_title', 'Развивайте навыки'),
        actionText: t('stories.start', 'Начать'),
        icon: <GraduationIcon width={ICON_SIZE} height={ICON_SIZE} color={ICON_COLOR} />,
        iconBackgroundColor: ICON_BG_COLOR,
        visible: true,
        externalUrl: 'https://osonish.uz/courses',
        onPress: () => {
          Linking.openURL('https://osonish.uz/courses').catch(() => {});
        },
      },
    ];

    return storyItems;
  }, [user, applicationsCount, pendingCount, acceptedCount, t, navigation]);

  return { stories };
};

