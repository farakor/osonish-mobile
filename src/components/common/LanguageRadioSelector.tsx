import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../constants';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import { isSmallScreen } from '../../utils/safeAreaUtils';

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
    name: 'Russian',
    nativeName: 'Русский',
    FlagComponent: RussianFlag,
  },
  {
    code: 'uz',
    name: 'Uzbek',
    nativeName: 'O\'zbekcha',
    FlagComponent: UzbekFlag,
  },
];

interface LanguageRadioSelectorProps {
  style?: any;
}

export const LanguageRadioSelector: React.FC<LanguageRadioSelectorProps> = ({
  style
}) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (language: Language) => {
    if (language === currentLanguage || isChanging) {
      return;
    }

    setIsChanging(true);
    try {
      await changeLanguage(language);
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
          <ActivityIndicator size="small" color="#679B00" />
          <Text style={styles.loadingText}>Изменяем язык...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container styles
  },
  languageList: {
    // Language list container
  },
  languageOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: isSmallScreen() ? 8 : 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  languageOptionSelected: {
    borderColor: '#679B00',
    backgroundColor: '#F0F8FF',
    borderWidth: 2,
  },
  languageOptionDisabled: {
    opacity: 0.6,
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen() ? 16 : 20,
    paddingVertical: isSmallScreen() ? 14 : 16,
  },
  flagContainer: {
    marginRight: isSmallScreen() ? 12 : 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: isSmallScreen() ? 16 : 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  languageNameSelected: {
    color: '#679B00',
    fontWeight: '700',
  },
  languageNameDisabled: {
    color: '#8E8E93',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioButtonSelected: {
    borderColor: '#679B00',
    backgroundColor: '#F0F8FF',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#679B00',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen() ? 8 : 12,
    marginTop: isSmallScreen() ? 8 : 12,
  },
  loadingText: {
    fontSize: isSmallScreen() ? 14 : 16,
    color: '#8E8E93',
    marginLeft: 8,
  },
});
