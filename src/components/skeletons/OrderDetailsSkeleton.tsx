import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants';

export const OrderDetailsSkeleton: React.FC = () => {
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header placeholder */}
        <View style={styles.header}>
          <Animated.View style={[styles.headerBack, { opacity }]} />
          <Animated.View style={[styles.headerTitle, { opacity }]} />
          <Animated.View style={[styles.headerButton, { opacity }]} />
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <Animated.View style={[styles.avatar, { opacity }]} />
            <View style={styles.profileInfo}>
              <Animated.View style={[styles.profileName, { opacity }]} />
              <Animated.View style={[styles.profileRole, { opacity }]} />
            </View>
            <Animated.View style={[styles.profilePrice, { opacity }]} />
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Animated.View style={[styles.title, { opacity }]} />
          <Animated.View style={[styles.titleShort, { opacity }]} />
        </View>

        {/* Info Grid */}
        <View style={styles.infoSection}>
          <View style={styles.infoGrid}>
            <Animated.View style={[styles.infoCard, { opacity }]} />
            <Animated.View style={[styles.infoCard, { opacity }]} />
            <Animated.View style={[styles.infoCard, { opacity }]} />
            <Animated.View style={[styles.infoCard, { opacity }]} />
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Animated.View style={[styles.sectionTitle, { opacity }]} />
          <Animated.View style={[styles.detailsLine, { opacity }]} />
          <Animated.View style={[styles.detailsLine, { opacity }]} />
          <Animated.View style={[styles.detailsLineShort, { opacity }]} />
        </View>

        {/* Media Gallery */}
        <View style={styles.mediaSection}>
          <Animated.View style={[styles.sectionTitle, { opacity }]} />
          <View style={styles.mediaGrid}>
            <Animated.View style={[styles.mediaItem, { opacity }]} />
            <Animated.View style={[styles.mediaItem, { opacity }]} />
            <Animated.View style={[styles.mediaItem, { opacity }]} />
          </View>
        </View>

        {/* Applicants Section */}
        <View style={styles.applicantsSection}>
          <Animated.View style={[styles.sectionTitle, { opacity }]} />
          <View style={styles.applicantCard}>
            <View style={styles.applicantRow}>
              <Animated.View style={[styles.applicantAvatar, { opacity }]} />
              <View style={styles.applicantInfo}>
                <Animated.View style={[styles.applicantName, { opacity }]} />
                <Animated.View style={[styles.applicantRating, { opacity }]} />
              </View>
              <Animated.View style={[styles.applicantPrice, { opacity }]} />
            </View>
            <Animated.View style={[styles.applicantButton, { opacity }]} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E1E4E8',
  },
  headerTitle: {
    flex: 1,
    height: 20,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginHorizontal: theme.spacing.md,
  },
  headerButton: {
    width: 80,
    height: 36,
    backgroundColor: '#E1E4E8',
    borderRadius: theme.borderRadius.md,
  },
  profileSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E1E4E8',
    marginRight: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    width: 120,
    height: 18,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: 4,
  },
  profileRole: {
    width: 80,
    height: 14,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
  profilePrice: {
    width: 100,
    height: 24,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
  titleSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    width: '100%',
    height: 24,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: 8,
  },
  titleShort: {
    width: '70%',
    height: 24,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
  infoSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  infoCard: {
    flex: 1,
    minWidth: '45%',
    height: 80,
    backgroundColor: '#E1E4E8',
    borderRadius: theme.borderRadius.lg,
  },
  detailsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    width: 140,
    height: 20,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: theme.spacing.md,
  },
  detailsLine: {
    width: '100%',
    height: 16,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: 8,
  },
  detailsLineShort: {
    width: '60%',
    height: 16,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
  mediaSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  mediaGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  mediaItem: {
    flex: 1,
    height: 100,
    backgroundColor: '#E1E4E8',
    borderRadius: theme.borderRadius.md,
  },
  applicantsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  applicantCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  applicantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E1E4E8',
    marginRight: theme.spacing.md,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    width: 100,
    height: 18,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: 4,
  },
  applicantRating: {
    width: 60,
    height: 14,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
  applicantPrice: {
    width: 80,
    height: 24,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
  applicantButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#E1E4E8',
    borderRadius: theme.borderRadius.md,
  },
});









