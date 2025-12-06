import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { StoryCardProps } from './types';

const CARD_WIDTH = 140;
const CARD_HEIGHT = 150;
const ICON_SIZE = 48;
const PROGRESS_SIZE = 52;
const STROKE_WIDTH = 4;

// Основной зеленый цвет для иконок
const PRIMARY_GREEN = '#679B00';
const PRIMARY_GREEN_LIGHT = '#679B0018'; // 10% opacity для фона

interface CircularProgressProps {
  progress: number;
  progressText?: string;
  color?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  progressText,
  color = PRIMARY_GREEN,
}) => {
  const radius = (PROGRESS_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.progressContainer}>
      <Svg width={PROGRESS_SIZE} height={PROGRESS_SIZE}>
        {/* Background circle */}
        <Circle
          cx={PROGRESS_SIZE / 2}
          cy={PROGRESS_SIZE / 2}
          r={radius}
          stroke={PRIMARY_GREEN_LIGHT}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={PROGRESS_SIZE / 2}
          cy={PROGRESS_SIZE / 2}
          r={radius}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${PROGRESS_SIZE / 2}, ${PROGRESS_SIZE / 2}`}
        />
      </Svg>
      {progressText && (
        <View style={styles.progressTextContainer}>
          <Text style={[styles.progressText, { color }]}>{progressText}</Text>
        </View>
      )}
    </View>
  );
};

export const StoryCard: React.FC<StoryCardProps> = ({
  title,
  subtitle,
  actionText,
  icon,
  iconBackgroundColor,
  progress,
  progressText,
  onPress,
}) => {
  const hasProgress = progress !== undefined;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        {hasProgress ? (
          <CircularProgress
            progress={progress}
            progressText={progressText}
            color={iconBackgroundColor || PRIMARY_GREEN}
          />
        ) : (
          <View
            style={[
              styles.iconContainer,
              iconBackgroundColor && { backgroundColor: iconBackgroundColor },
            ]}
          >
            {icon}
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
      {actionText && (
        <Text style={styles.actionText} numberOfLines={1}>
          {actionText}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconWrapper: {
    marginBottom: 8,
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: PRIMARY_GREEN_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    width: PROGRESS_SIZE,
    height: PROGRESS_SIZE,
    position: 'relative',
  },
  progressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 18,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  actionText: {
    fontSize: 13,
    color: PRIMARY_GREEN,
    fontWeight: '500',
    marginTop: 'auto',
  },
});

