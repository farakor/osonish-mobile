import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { LogoOsonish } from '../../components/common';
import { RootStackParamList } from '../../types/navigation';

// Импортируем SVG флаги
import UzbekFlag from '../../../assets/UZ.svg';
import RussianFlag from '../../../assets/RU.svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

// Определяем маленький экран для Android (высота меньше 1080px)
const isSmallScreen = Platform.OS === 'android' && height < 1080;

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  FlagComponent: React.ComponentType<any>;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'uz',
    name: '',
    nativeName: 'O\'zbekcha',
    FlagComponent: UzbekFlag,
  },
  {
    code: 'ru',
    name: '',
    nativeName: 'Русский',
    FlagComponent: RussianFlag,
  },
];

export const LanguageSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { changeLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  const handleContinue = async () => {
    if (!selectedLanguage) return;

    setIsLoading(true);
    try {
      await changeLanguage(selectedLanguage);
      navigation.navigate('Auth');
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const LanguageCard: React.FC<{ option: LanguageOption; isSelected: boolean; onPress: () => void }> = ({
    option,
    isSelected,
    onPress,
  }) => (
    <TouchableOpacity
      style={[styles.languageCard, isSelected && styles.languageCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
      {...(Platform.OS === 'android' && {
        android_ripple: { color: 'transparent' },
        background: null,
      })}
    >
      <View style={styles.languageCardContent}>
        <View style={styles.flagContainer}>
          <option.FlagComponent width={32} height={32} />
        </View>
        <View style={styles.languageInfo}>
          <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
            {option.nativeName}
          </Text>
        </View>
        <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <LogoOsonish
            width={isSmallScreen ? 160 : 200}
            height={isSmallScreen ? 29 : 36}
          />
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>
            {selectedLanguage === 'uz' ? 'Tilni tanlang' : 'Выберите язык'}
          </Text>
          <Text style={styles.subtitle}>
            {selectedLanguage === 'uz'
              ? 'Ilova interfeysi uchun kerakli tilni tanlang'
              : 'Выберите предпочитаемый язык для интерфейса приложения'
            }
          </Text>
        </View>

        {/* Language Options */}
        <View style={styles.languageSection}>
          {LANGUAGE_OPTIONS.map((option) => (
            <LanguageCard
              key={option.code}
              option={option}
              isSelected={selectedLanguage === option.code}
              onPress={() => handleLanguageSelect(option.code)}
            />
          ))}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedLanguage && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedLanguage || isLoading}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.continueButtonText,
              !selectedLanguage && styles.continueButtonTextDisabled,
            ]}>
              {isLoading
                ? (selectedLanguage === 'uz' ? 'Yuklanmoqda...' : 'Загрузка...')
                : (selectedLanguage === 'uz' ? 'Davom etish' : 'Продолжить')
              }
            </Text>
          </TouchableOpacity>
        </View>


      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.lg : theme.spacing.xxl,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.xl : theme.spacing.xxxl,
  },
  title: {
    fontSize: isSmallScreen ? theme.fonts.sizes.xl : theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 20 : 24,
  },
  languageSection: {
    marginBottom: isSmallScreen ? theme.spacing.xl : theme.spacing.xxxl,
  },
  languageCard: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    marginBottom: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  languageCardSelected: {
    backgroundColor: 'transparent',
    borderColor: '#4CAF50',
    borderWidth: 2,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  languageCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: isSmallScreen ? 56 : 64,
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
    fontSize: isSmallScreen ? theme.fonts.sizes.md : theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  languageNameSelected: {
    color: '#4CAF50',
    fontWeight: theme.fonts.weights.bold,
  },
  languageSubname: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  languageSubnameSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
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
    borderColor: '#4CAF50',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  buttonSection: {
    marginBottom: isSmallScreen ? theme.spacing.xl : theme.spacing.xxxl,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isSmallScreen ? 48 : 56,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  continueButtonText: {
    fontSize: isSmallScreen ? theme.fonts.sizes.md : theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.background,
  },
  continueButtonTextDisabled: {
    color: theme.colors.text.secondary,
  },
});
