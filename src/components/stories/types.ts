import { ReactNode } from 'react';

export type StoryType = 
  | 'resume_progress'
  | 'apply_vacancies'
  | 'application_status'
  | 'profile_views'
  | 'articles'
  | 'career_tips';

export interface StoryCardData {
  id: string;
  type: StoryType;
  title: string;
  subtitle?: string;
  actionText?: string;
  icon?: ReactNode;
  iconBackgroundColor?: string;
  progress?: number; // 0-100 для circular progress
  progressText?: string; // Например "3/10"
  count?: number;
  externalUrl?: string;
  onPress?: () => void;
  visible?: boolean;
}

export interface StoriesSectionProps {
  stories: StoryCardData[];
  onStoryPress?: (story: StoryCardData) => void;
}

export interface StoryCardProps extends StoryCardData {
  onPress?: () => void;
}

