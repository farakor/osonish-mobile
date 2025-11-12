import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../../constants';

export const OrderCardSkeleton: React.FC = () => {
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
        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={[styles.title, { opacity }]} />
          <Animated.View style={[styles.budget, { opacity }]} />
        </View>

        {/* Category */}
        <Animated.View style={[styles.category, { opacity }]} />

        {/* Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Animated.View style={[styles.detailItem, { opacity }]} />
            <Animated.View style={[styles.detailItem, { opacity }]} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Animated.View style={[styles.status, { opacity }]} />
          <Animated.View style={[styles.time, { opacity }]} />
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  title: {
    flex: 1,
    height: 20,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginRight: theme.spacing.md,
  },
  budget: {
    width: 80,
    height: 24,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
  category: {
    width: 120,
    height: 24,
    backgroundColor: '#E1E4E8',
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  details: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  detailItem: {
    flex: 1,
    height: 40,
    backgroundColor: '#E1E4E8',
    borderRadius: theme.borderRadius.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  status: {
    width: 80,
    height: 20,
    backgroundColor: '#E1E4E8',
    borderRadius: theme.borderRadius.sm,
  },
  time: {
    width: 100,
    height: 16,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
});









