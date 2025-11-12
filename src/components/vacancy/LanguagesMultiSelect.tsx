import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants';
import { COMMON_LANGUAGES } from '../../constants/vacancyOptions';

interface LanguagesMultiSelectProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
}

export const LanguagesMultiSelect: React.FC<LanguagesMultiSelectProps> = ({
  selectedLanguages = [],
  onLanguagesChange,
}) => {
  const safeSelectedLanguages = selectedLanguages || [];

  const toggleLanguage = (languageId: string) => {
    if (safeSelectedLanguages.includes(languageId)) {
      onLanguagesChange(safeSelectedLanguages.filter((l) => l !== languageId));
    } else {
      onLanguagesChange([...safeSelectedLanguages, languageId]);
    }
  };

  return (
    <View style={styles.container}>
      {COMMON_LANGUAGES.map((language) => (
        <TouchableOpacity
          key={language.id}
          style={[
            styles.option,
            safeSelectedLanguages.includes(language.id) && styles.optionSelected,
          ]}
          onPress={() => toggleLanguage(language.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.optionText,
              safeSelectedLanguages.includes(language.id) && styles.optionTextSelected,
            ]}
          >
            {language.label}
          </Text>
          {safeSelectedLanguages.includes(language.id) && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F7FF',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

