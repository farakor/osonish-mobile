import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants';
import { LinearGradient } from 'expo-linear-gradient';

export const ProfessionalMasterProfileSkeleton: React.FC = () => {
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
      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.colors.primary, '#5a8200']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          {/* Back button */}
          <View style={styles.headerTopBar}>
            <Animated.View style={[styles.backButton, { opacity }]} />
          </View>

          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <Animated.View style={[styles.profileImage, { opacity }]} />
            <View style={styles.profileInfo}>
              <Animated.View style={[styles.profileName, { opacity }]} />
              <Animated.View style={[styles.profileRole, { opacity }]} />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Animated.View style={[styles.callButton, { opacity }]} />
            <Animated.View style={[styles.shareButton, { opacity }]} />
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Animated.View style={[styles.statValue, { opacity }]} />
              <Animated.View style={[styles.statLabel, { opacity }]} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Animated.View style={[styles.statValue, { opacity }]} />
              <Animated.View style={[styles.statLabel, { opacity }]} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Animated.View style={[styles.statValue, { opacity }]} />
              <Animated.View style={[styles.statLabel, { opacity }]} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Specializations Section */}
        <View style={styles.section}>
          <Animated.View style={[styles.sectionTitle, { opacity }]} />
          <View style={styles.specializationsRow}>
            <Animated.View style={[styles.specChip, { opacity }]} />
            <Animated.View style={[styles.specChip, { opacity }]} />
            <Animated.View style={[styles.specChipSmall, { opacity }]} />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Animated.View style={[styles.sectionTitle, { opacity }]} />
          <View style={styles.aboutCard}>
            <Animated.View style={[styles.aboutLine, { opacity }]} />
            <Animated.View style={[styles.aboutLine, { opacity }]} />
            <Animated.View style={[styles.aboutLineShort, { opacity }]} />
          </View>
        </View>

        {/* Portfolio Section */}
        <View style={styles.section}>
          <Animated.View style={[styles.sectionTitle, { opacity }]} />
          <View style={styles.portfolioGrid}>
            <Animated.View style={[styles.portfolioItem, { opacity }]} />
            <Animated.View style={[styles.portfolioItem, { opacity }]} />
            <Animated.View style={[styles.portfolioItem, { opacity }]} />
            <Animated.View style={[styles.portfolioItem, { opacity }]} />
            <Animated.View style={[styles.portfolioItem, { opacity }]} />
            <Animated.View style={[styles.portfolioItem, { opacity }]} />
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.section}>
          <Animated.View style={[styles.sectionTitle, { opacity }]} />
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Animated.View style={[styles.reviewAvatar, { opacity }]} />
                <View style={styles.reviewInfo}>
                  <Animated.View style={[styles.reviewName, { opacity }]} />
                  <Animated.View style={[styles.reviewDate, { opacity }]} />
                </View>
                <Animated.View style={[styles.reviewRating, { opacity }]} />
              </View>
              <Animated.View style={[styles.reviewText, { opacity }]} />
              <Animated.View style={[styles.reviewTextShort, { opacity }]} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingBottom: theme.spacing.md,
  },
  headerTopBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    width: 140,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 6,
  },
  profileRole: {
    width: 100,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  callButton: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: theme.borderRadius.lg,
  },
  shareButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: theme.borderRadius.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    width: 60,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 4,
  },
  statLabel: {
    width: 80,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    width: 140,
    height: 20,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: theme.spacing.md,
  },
  specializationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specChip: {
    width: 120,
    height: 36,
    backgroundColor: '#E1E4E8',
    borderRadius: 18,
  },
  specChipSmall: {
    width: 80,
    height: 36,
    backgroundColor: '#E1E4E8',
    borderRadius: 18,
  },
  aboutCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  aboutLine: {
    width: '100%',
    height: 16,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: 8,
  },
  aboutLineShort: {
    width: '70%',
    height: 16,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  portfolioItem: {
    width: '31%',
    height: 100,
    backgroundColor: '#E1E4E8',
    borderRadius: theme.borderRadius.md,
  },
  reviewCard: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E4E8',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E1E4E8',
    marginRight: theme.spacing.sm,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    width: 100,
    height: 16,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: 4,
  },
  reviewDate: {
    width: 80,
    height: 12,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
  reviewRating: {
    width: 60,
    height: 20,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
  reviewText: {
    width: '100%',
    height: 14,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
    marginBottom: 6,
  },
  reviewTextShort: {
    width: '80%',
    height: 14,
    backgroundColor: '#E1E4E8',
    borderRadius: 4,
  },
});




















