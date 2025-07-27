import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';

interface HeaderWithBackProps {
  title?: string;
  rightAction?: {
    text: string;
    color?: string;
    onPress: () => void;
  };
  backAction?: () => void;
}

export const HeaderWithBack: React.FC<HeaderWithBackProps> = ({
  title,
  rightAction,
  backAction
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (backAction) {
      backAction();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {title && <Text style={styles.headerTitle}>{title}</Text>}

      {rightAction ? (
        <TouchableOpacity onPress={rightAction.onPress}>
          <Text style={[
            styles.rightActionText,
            { color: rightAction.color || theme.colors.primary }
          ]}>
            {rightAction.text}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg, // Единый отступ для всех экранов
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  rightActionText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  placeholder: {
    width: 40,
  },
}); 