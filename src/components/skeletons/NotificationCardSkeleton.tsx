import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../../constants';

export const NotificationCardSkeleton: React.FC = () => {
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
        <Animated.View style={[styles.icon, { opacity }]} />
        <View style={styles.content}>
          <Animated.View style={[styles.title, { opacity }]} />
          <Animated.View style={[styles.body, { opacity }]} />
          <Animated.View style={[styles.time, { opacity }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E1E4E8',
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    height: 18,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
    width: '70%',
  },
  body: {
    height: 16,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
    width: '90%',
  },
  time: {
    height: 14,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    width: '40%',
  },
});




















