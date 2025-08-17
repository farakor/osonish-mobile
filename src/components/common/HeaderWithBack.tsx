import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { DropdownMenu, DropdownMenuItem } from './DropdownMenu';

interface HeaderWithBackProps {
  title?: string;
  rightAction?: {
    text: string;
    color?: string;
    backgroundColor?: string;
    buttonStyle?: boolean; // новый параметр для кнопочного стиля
    onPress: () => void;
  };
  dropdownMenu?: DropdownMenuItem[];
  backAction?: () => void;
}

export const HeaderWithBack: React.FC<HeaderWithBackProps> = ({
  title,
  rightAction,
  dropdownMenu,
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
        <TouchableOpacity
          style={rightAction.buttonStyle ? [
            styles.rightActionButton,
            { backgroundColor: rightAction.backgroundColor || '#DC2626' }
          ] : undefined}
          onPress={rightAction.onPress}
          activeOpacity={0.8}
        >
          <Text style={[
            rightAction.buttonStyle ? styles.rightActionButtonText : styles.rightActionText,
            rightAction.buttonStyle
              ? { color: rightAction.color || '#FFFFFF' }
              : { color: rightAction.color || theme.colors.primary }
          ]}>
            {rightAction.text}
          </Text>
        </TouchableOpacity>
      ) : dropdownMenu && dropdownMenu.length > 0 ? (
        <DropdownMenu items={dropdownMenu} />
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
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  backButtonText: {
    fontSize: theme.fonts.sizes.xl,
    color: theme.colors.text.primary,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  rightActionText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
  },
  rightActionButton: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rightActionButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
}); 