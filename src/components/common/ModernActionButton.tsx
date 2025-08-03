import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../constants/theme';

interface ModernActionButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'disabled';
  size?: 'small' | 'medium';
}

export const ModernActionButton: React.FC<ModernActionButtonProps> = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  size = 'medium',
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];

    if (size === 'small') {
      baseStyle.push(styles.buttonSmall);
    }

    if (disabled || variant === 'disabled') {
      baseStyle.push(styles.buttonDisabled);
    } else if (variant === 'primary') {
      baseStyle.push(styles.buttonPrimary);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.buttonSecondary);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];

    if (size === 'small') {
      baseStyle.push(styles.textSmall);
    }

    if (disabled || variant === 'disabled') {
      baseStyle.push(styles.textDisabled);
    } else if (variant === 'primary') {
      baseStyle.push(styles.textPrimary);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.textSecondary);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.8}
    >
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 24,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonSmall: {
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    minHeight: 40,
  },
  buttonPrimary: {
    backgroundColor: '#1F2937',
  },
  buttonSecondary: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  buttonDisabled: {
    backgroundColor: '#F1F3F4',
  },
  text: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  textSmall: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.medium,
  },
  textPrimary: {
    color: theme.colors.white,
  },
  textSecondary: {
    color: '#1F2937',
  },
  textDisabled: {
    color: '#9AA0A6',
  },
});