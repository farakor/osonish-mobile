import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../../constants';

export const MasterCardSkeleton: React.FC = () => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnimation]);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Фото профиля слева */}
        <Animated.View style={[styles.profileImage, { opacity }]} />

        {/* Информация справа */}
        <View style={styles.infoContainer}>
          {/* Имя с PRO бейджем */}
          <View style={styles.nameContainer}>
            <Animated.View style={[styles.name, { opacity }]} />
            <Animated.View style={[styles.proBadge, { opacity }]} />
          </View>

          {/* Специализация */}
          <Animated.View style={[styles.specialization, { opacity }]} />

          {/* Счетчик просмотров с иконкой */}
          <View style={styles.viewsContainer}>
            <Animated.View style={[styles.eyeIcon, { opacity }]} />
            <Animated.View style={[styles.viewsText, { opacity }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E1E4E8',
    marginRight: theme.spacing.md,
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
    width: 120,
    height: 18,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginRight: 6,
  },
  proBadge: {
    width: 44,
    height: 18,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
  specialization: {
    width: 100,
    height: 16,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eyeIcon: {
    width: 14,
    height: 14,
    backgroundColor: '#E1E4E8',
    borderRadius: 7,
  },
  viewsText: {
    width: 40,
    height: 12,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
});

