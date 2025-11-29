import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../../constants';

export const ApplicantCardSkeleton: React.FC = () => {
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
          <View style={styles.leftSection}>
            <Animated.View style={[styles.avatar, { opacity }]} />
            <View style={styles.info}>
              <Animated.View style={[styles.name, { opacity }]} />
              <Animated.View style={[styles.rating, { opacity }]} />
            </View>
          </View>
          <Animated.View style={[styles.price, { opacity }]} />
        </View>

        {/* Message */}
        <View style={styles.message}>
          <Animated.View style={[styles.messageLine, { opacity }]} />
          <Animated.View style={[styles.messageLine, { opacity, width: '80%' }]} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Animated.View style={[styles.time, { opacity }]} />
          <Animated.View style={[styles.button, { opacity }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  leftSection: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E1E4E8',
    marginRight: theme.spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    height: 20,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
    width: '70%',
  },
  rating: {
    height: 16,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    width: '40%',
  },
  price: {
    width: 80,
    height: 28,
    backgroundColor: '#E1E4E8',
    borderRadius: theme.borderRadius.md,
    marginLeft: theme.spacing.md,
  },
  message: {
    marginBottom: theme.spacing.md,
  },
  messageLine: {
    height: 16,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    width: 80,
    height: 14,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
  button: {
    width: 100,
    height: 36,
    backgroundColor: '#E1E4E8',
    borderRadius: theme.borderRadius.md,
  },
});




















