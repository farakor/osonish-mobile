import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { theme } from '../../constants';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';

// Импортируем SVG флаги
import UzbekFlag from '../../../assets/UZ.svg';
import RussianFlag from '../../../assets/RU.svg';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  FlagComponent: React.ComponentType<any>;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'ru',
    name: '',
    nativeName: 'Русский',
    FlagComponent: RussianFlag,
  },
  {
    code: 'uz',
    name: '',
    nativeName: 'O\'zbekcha',
    FlagComponent: UzbekFlag,
  },
];

interface LanguageSwitcherProps {
  showLabel?: boolean;
  style?: any;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  showLabel = true,
  style
}) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentOption = LANGUAGE_OPTIONS.find(option => option.code === currentLanguage);

  const handleLanguageChange = async (language: Language) => {
    if (language === currentLanguage) {
      setIsModalVisible(false);
      return;
    }

    setIsChanging(true);
    try {
      await changeLanguage(language);
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const LanguageOption: React.FC<{
    option: LanguageOption;
    isSelected: boolean;
    onPress: () => void;
    disabled?: boolean;
  }> = ({ option, isSelected, onPress, disabled }) => (
    <TouchableOpacity
      style={[
        styles.languageOption,
        isSelected && styles.languageOptionSelected,
        disabled && styles.languageOptionDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.languageOptionContent}>
        <View style={styles.flagContainer}>
          <option.FlagComponent width={24} height={24} />
        </View>
        <View style={styles.languageInfo}>
          <Text style={[
            styles.languageName,
            isSelected && styles.languageNameSelected,
            disabled && styles.languageNameDisabled,
          ]}>
            {option.nativeName}
          </Text>
        </View>
        <View style={[
          styles.radioButton,
          isSelected && styles.radioButtonSelected,
        ]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          {showLabel && (
            <Text style={styles.label}>{t('profile.language')}</Text>
          )}
          <View style={styles.currentLanguage}>
            <View style={styles.currentFlagContainer}>
              {currentOption?.FlagComponent && (
                <currentOption.FlagComponent width={20} height={20} />
              )}
            </View>
            <Text style={styles.currentName}>{currentOption?.nativeName}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('language.title')}</Text>
            <View style={styles.closeButton} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>{t('language.subtitle')}</Text>

            <View style={styles.languageList}>
              {LANGUAGE_OPTIONS.map((option) => (
                <LanguageOption
                  key={option.code}
                  option={option}
                  isSelected={currentLanguage === option.code}
                  onPress={() => handleLanguageChange(option.code)}
                  disabled={isChanging}
                />
              ))}
            </View>

            {isChanging && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container styles
  },
  trigger: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  triggerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },
  currentLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentFlagContainer: {
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentName: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    minWidth: 60,
  },
  closeButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  modalSubtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  languageList: {
    marginBottom: theme.spacing.xl,
  },
  languageOption: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  languageOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  languageOptionDisabled: {
    opacity: 0.6,
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  flagContainer: {
    marginRight: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  languageNameSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semiBold,
  },
  languageNameDisabled: {
    color: theme.colors.text.secondary,
  },
  languageSubname: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  languageSubnameSelected: {
    color: theme.colors.primary,
  },
  languageSubnameDisabled: {
    color: theme.colors.text.secondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
  },
});
