import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { theme } from '../../constants';

export interface StatItem {
  id: string;
  icon: string;
  value: string | number;
  label: string;
  color?: string;
  onPress?: () => void;
}

interface StatsWidgetProps {
  stats: StatItem[];
  variant?: 'default' | 'cards' | 'gradient';
  animated?: boolean;
  style?: ViewStyle;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({
  stats,
  variant = 'gradient',
  animated = true,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, fadeAnim, scaleAnim]);

  const renderDefaultVariant = () => (
    <Animated.View
      style={[
        styles.defaultContainer,
        style,
        animated && {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {stats.map((stat, index) => (
        <React.Fragment key={stat.id}>
          <TouchableOpacity
            style={styles.defaultStatItem}
            onPress={stat.onPress}
            activeOpacity={stat.onPress ? 0.7 : 1}
            disabled={!stat.onPress}
          >
            <Text style={styles.defaultStatIcon}>{stat.icon}</Text>
            <Text style={[styles.defaultStatNumber, stat.color && { color: stat.color }]}>
              {stat.value}
            </Text>
            <Text style={styles.defaultStatLabel}>{stat.label}</Text>
          </TouchableOpacity>
          {index < stats.length - 1 && <View style={styles.defaultDivider} />}
        </React.Fragment>
      ))}
    </Animated.View>
  );

  const renderCardsVariant = () => (
    <View style={[styles.cardsContainer, style]}>
      {stats.map((stat, index) => (
        <Animated.View
          key={stat.id}
          style={[
            styles.cardItem,
            animated && {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={stat.onPress}
            activeOpacity={stat.onPress ? 0.7 : 1}
            disabled={!stat.onPress}
          >
            <View style={styles.cardInner}>
              <Text style={styles.cardIcon}>{stat.icon}</Text>
              <Text style={[styles.cardNumber, stat.color && { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.cardLabel}>{stat.label}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );

  const renderGradientVariant = () => (
    <View style={[styles.gradientContainer, style]}>
      {stats.map((stat, index) => (
        <Animated.View
          key={stat.id}
          style={[
            styles.gradientCard,
            animated && {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.gradientContent}
            onPress={stat.onPress}
            activeOpacity={stat.onPress ? 0.7 : 1}
            disabled={!stat.onPress}
          >
            <View style={styles.gradientIconContainer}>
              <Text style={styles.gradientIcon}>{stat.icon}</Text>
            </View>
            <View style={styles.gradientTextContainer}>
              <Text style={[styles.gradientNumber, stat.color && { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.gradientLabel}>{stat.label}</Text>
            </View>
            {stat.onPress && (
              <View style={styles.gradientArrow}>
                <Text style={styles.gradientArrowText}>→</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );

  switch (variant) {
    case 'cards':
      return renderCardsVariant();
    case 'gradient':
      return renderGradientVariant();
    default:
      return renderDefaultVariant();
  }
};

const styles = StyleSheet.create({
  // Default variant styles
  defaultContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  defaultStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  defaultStatIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  defaultStatNumber: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  defaultStatLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  defaultDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },

  // Cards variant styles
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cardItem: {
    flex: 1,
  },
  cardContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 3,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    aspectRatio: 1,
  },
  cardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: -20,
  },
  cardIcon: {
    fontSize: 28,
    textAlign: 'center',
  },
  cardNumber: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: theme.fonts.weights.medium,
    lineHeight: 16,
  },

  // Gradient variant styles
  gradientContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  gradientCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    elevation: 4,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}10`,
  },
  gradientContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  gradientIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  gradientIcon: {
    fontSize: 24,
  },
  gradientTextContainer: {
    flex: 1,
  },
  gradientNumber: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  gradientLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
  gradientArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientArrowText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.fonts.weights.bold,
  },
}); 