import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import type { RootStackParamList } from '../../types';
import WorkerIcon from '../../../assets/engineer-worker.svg';
import UserIcon from '../../../assets/user-03.svg';

type UserRole = 'customer' | 'worker';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      console.log('Selected role:', selectedRole);

      if (selectedRole === 'customer') {
        navigation.navigate('CustomerTabs');
      } else if (selectedRole === 'worker') {
        navigation.navigate('WorkerTabs');
      }
    }
  };

  const RoleCard = ({
    role,
    title,
    description,
    isSelected,
    onPress
  }: {
    role: UserRole;
    title: string;
    description: string;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.roleCard,
        isSelected && styles.roleCardSelected
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        {role === 'worker' ? (
          <WorkerIcon width={32} height={32} fill={isSelected ? theme.colors.primary : '#666666'} />
        ) : (
          <UserIcon width={32} height={32} stroke={isSelected ? theme.colors.primary : '#666666'} />
        )}
      </View>
      <Text style={[
        styles.roleTitle,
        isSelected && styles.roleTitleSelected
      ]}>
        {title}
      </Text>
      <Text style={[
        styles.roleDescription,
        isSelected && styles.roleDescriptionSelected
      ]}>
        {description}
      </Text>
      {isSelected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Выберите вашу роль</Text>
          <Text style={styles.subtitle}>
            Как вы планируете использовать Osonish?
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          <RoleCard
            role="customer"
            title="Я заказчик"
            description="Ищу исполнителей для моих задач и проектов"
            isSelected={selectedRole === 'customer'}
            onPress={() => handleRoleSelect('customer')}
          />

          <RoleCard
            role="worker"
            title="Я исполнитель"
            description="Ищу работу и готов выполнять различные задачи"
            isSelected={selectedRole === 'worker'}
            onPress={() => handleRoleSelect('worker')}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedRole && styles.continueButtonTextDisabled
          ]}>
            Продолжить
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Вы сможете изменить роль позже в настройках
        </Text>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  rolesContainer: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  roleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    position: 'relative',
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}08`,
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: theme.colors.background,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  icon: {
    fontSize: 28,
  },
  roleTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  roleTitleSelected: {
    color: theme.colors.primary,
  },
  roleDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  roleDescriptionSelected: {
    color: theme.colors.text.primary,
  },
  checkmark: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 24,
    height: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.bold,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  continueButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },
  note: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 