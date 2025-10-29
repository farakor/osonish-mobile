import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { theme, SPECIALIZATIONS, SpecializationOption } from '../../constants';
import { noElevationStyles, borderButtonStyles } from '../../utils/noShadowStyles';
import type { RootStackParamList, Specialization } from '../../types';
import { HeaderWithBack, CategoryIcon } from '../../components/common';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SelectedSpecialization extends SpecializationOption {
  isPrimary: boolean;
}

export const SpecializationSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const [selectedSpecializations, setSelectedSpecializations] = useState<SelectedSpecialization[]>([]);

  const handleSpecializationToggle = (spec: SpecializationOption) => {
    const isAlreadySelected = selectedSpecializations.some(s => s.id === spec.id);

    if (isAlreadySelected) {
      // Убираем специализацию
      setSelectedSpecializations(prev => prev.filter(s => s.id !== spec.id));
    } else {
      if (selectedSpecializations.length >= 3) {
        Alert.alert(
          t('auth.max_specializations_title'),
          t('auth.max_specializations_message')
        );
        return;
      }

      // Добавляем специализацию
      // Новая специализация становится основной если:
      // 1. Это первая выбранная специализация
      // 2. Или среди уже выбранных нет основной
      const hasPrimary = selectedSpecializations.some(s => s.isPrimary);
      const isPrimary = selectedSpecializations.length === 0 || !hasPrimary;
      setSelectedSpecializations(prev => [...prev, { ...spec, isPrimary }]);
    }
  };

  const handleSetPrimary = (specId: string) => {
    setSelectedSpecializations(prev =>
      prev.map(s => ({
        ...s,
        isPrimary: s.id === specId,
      }))
    );
  };

  const handleContinue = async () => {
    if (selectedSpecializations.length === 0) {
      Alert.alert(
        t('auth.min_specializations_title'),
        t('auth.min_specializations_message')
      );
      return;
    }

    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const profileDataString = await AsyncStorage.default.getItem('@temp_profile_data');

      if (!profileDataString) {
        Alert.alert(t('common.error'), t('auth.profile_data_not_found'));
        return;
      }

      // Сохраняем специализации
      const profileData = JSON.parse(profileDataString);
      profileData.specializations = selectedSpecializations.map((s): Specialization => ({
        id: s.id,
        name: s.name,
        isPrimary: s.isPrimary,
      }));
      await AsyncStorage.default.setItem('@temp_profile_data', JSON.stringify(profileData));

      // Переходим к экрану "О себе"
      navigation.navigate('ProfessionalAboutMe');
    } catch (error) {
      console.error('Ошибка:', error);
      Alert.alert(t('common.error'), t('auth.general_error_try_again'));
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderSpecializationCard = ({ item }: { item: SpecializationOption }) => {
    const isSelected = selectedSpecializations.some(s => s.id === item.id);
    const selectedSpec = selectedSpecializations.find(s => s.id === item.id);
    const isPrimary = selectedSpec?.isPrimary || false;

    return (
      <TouchableOpacity
        style={[
          styles.specCard,
          isSelected && styles.specCardSelected,
          isPrimary && styles.specCardPrimary,
        ]}
        onPress={() => handleSpecializationToggle(item)}
        onLongPress={() => isSelected && !isPrimary && handleSetPrimary(item.id)}
        activeOpacity={0.8}
      >
        <CategoryIcon
          icon={item.icon}
          iconComponent={item.iconComponent}
          size={32}
          style={styles.specIcon}
        />
        <Text
          style={[
            styles.specName,
            isSelected && styles.specNameSelected,
            isPrimary && styles.specNamePrimary,
          ]}
          numberOfLines={2}
        >
          {t(`categories.${item.id}`)}
        </Text>
        {isSelected && (
          <View style={[styles.badge, isPrimary && styles.badgePrimary]}>
            <Text style={styles.badgeText}>
              {isPrimary ? '★' : '✓'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBack title={t('auth.specialization_selection_title')} backAction={handleBackPress} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            {t('auth.specialization_selection_subtitle')}
          </Text>
          {selectedSpecializations.length > 0 && (
            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>
                {t('auth.selected_count', { count: selectedSpecializations.length })}
              </Text>
            </View>
          )}
        </View>

        {selectedSpecializations.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedTitle}>{t('auth.your_specializations')}</Text>
            <View style={styles.selectedList}>
              {selectedSpecializations.map(spec => (
                <View key={spec.id} style={styles.selectedChip}>
                  <CategoryIcon
                    icon={spec.icon}
                    iconComponent={spec.iconComponent}
                    size={16}
                    style={styles.selectedChipIcon}
                  />
                  <Text style={styles.selectedChipText}>
                    {t(`categories.${spec.id}`)} {spec.isPrimary && '★'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <FlatList
          data={SPECIALIZATIONS.filter(spec => spec.id !== 'one_day_job' && !spec.isParent)}
          renderItem={renderSpecializationCard}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.specGrid}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
        />

        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedSpecializations.length === 0 && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedSpecializations.length === 0}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.continueButtonText,
              selectedSpecializations.length === 0 && styles.continueButtonTextDisabled,
            ]}
          >
            {t('common.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const cardWidth = (screenWidth - theme.spacing.lg * 2 - theme.spacing.sm * 2) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  counterContainer: {
    alignSelf: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
  },
  counterText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  selectedContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  selectedTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  selectedChipIcon: {
    marginRight: 4,
  },
  selectedChipText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  specGrid: {
    paddingBottom: theme.spacing.xl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  specCard: {
    width: cardWidth,
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...borderButtonStyles,
  },
  specCardSelected: {
    backgroundColor: `${theme.colors.primary}08`,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...noElevationStyles,
  },
  specCardPrimary: {
    backgroundColor: `${theme.colors.primary}15`,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  specIcon: {
    marginBottom: theme.spacing.xs,
  },
  specName: {
    fontSize: 11,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  specNameSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  specNamePrimary: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePrimary: {
    backgroundColor: '#FFD700',
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    minHeight: isSmallScreen ? 44 : 48,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold as any,
  },
  continueButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },
});

