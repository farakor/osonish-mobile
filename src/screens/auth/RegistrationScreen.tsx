import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar, KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { usePlatformSafeAreaInsets, getImprovedFixedBottomStyle } from '../../utils/safeAreaUtils';
import type { RootStackParamList } from '../../types';
import { useAuthTranslation, useErrorsTranslation, useCommonTranslation } from '../../hooks/useTranslation';
import { LogoOsonish } from '../../components/common';
import ArrowBackIcon from '../../../assets/arrow-narrow-left.svg';

const { height: screenHeight } = Dimensions.get('window');

// Определяем маленький экран для Android (высота меньше 1080px)
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

// Функция для получения высоты статус-бара на Android
const getAndroidStatusBarHeight = () => {
  if (Platform.OS === 'android') {
    try {
      return StatusBar.currentHeight || 24; // fallback 24px для Android
    } catch (error) {
      return 24; // стандартная высота статус-бара на Android
    }
  }
  return 0;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function RegistrationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = usePlatformSafeAreaInsets();
  const t = useAuthTranslation();
  const tError = useErrorsTranslation();
  const tCommon = useCommonTranslation();
  const [phoneNumber, setPhoneNumber] = useState('+998');
  const [isLoading, setIsLoading] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  const handlePhoneChange = (text: string) => {
    // Если пользователь удаляет до '+998' или меньше, всегда оставлять только '+998'
    if (!text || text.length <= 4 || !text.startsWith('+998')) {
      setPhoneNumber('+998');
      return;
    }
    // Оставляем только цифры после +998
    let digits = text.slice(4).replace(/\D/g, '');
    // Ограничиваем длину (9 цифр после +998)
    digits = digits.slice(0, 9);
    setPhoneNumber('+998' + digits);
  };

  const validatePhoneNumber = () => {
    // +998 и 9 цифр
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length === 12 && cleaned.startsWith('998');
  };

  const handleContinue = async () => {
    if (!validatePhoneNumber()) {
      Alert.alert(tError('error'), t('invalid_phone'));
      return;
    }

    setIsLoading(true);

    try {
      const { authService } = await import('../../services/authService');
      const result = await authService.startRegistration(phoneNumber);

      if (result.success) {
        // Переходим к экрану верификации
        navigation.navigate('SmsVerification', { phone: phoneNumber });
      } else {
        Alert.alert(tError('error'), result.error || t('sms_send_error'));
      }
    } catch (error) {
      Alert.alert(tError('error'), t('general_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowBackIcon width={20} height={20} stroke={theme.colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <LogoOsonish
                width={isSmallScreen ? 120 : 160}
                height={isSmallScreen ? 22 : 29}
              />
            </View>
            <View style={styles.headerRight} />
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{t('register_title')}</Text>
            <Text style={styles.subtitle}>
              {t('register_subtitle')}
            </Text>
          </View>

          {/* Phone Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>{t('phone_number')}</Text>
            <TextInput
              style={[
                styles.phoneInput,
                isPhoneFocused && styles.phoneInputFocused
              ]}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              placeholder={t('phone_placeholder')}
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="phone-pad"
              maxLength={20}
              autoFocus
              onFocus={() => setIsPhoneFocused(true)}
              onBlur={() => setIsPhoneFocused(false)}
            />
            <Text style={styles.inputHint}>
              {t('phone_hint')}
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!validatePhoneNumber() || isLoading) && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!validatePhoneNumber() || isLoading}
          >
            <Text style={[
              styles.continueButtonText,
              (!validatePhoneNumber() || isLoading) && styles.continueButtonTextDisabled
            ]}>
              {isLoading ? t('sending_sms') : tCommon('continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: getAndroidStatusBarHeight(),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },

  titleSection: {
    marginBottom: isSmallScreen ? theme.spacing.xl : theme.spacing.xxxl,
  },
  title: {
    fontSize: isSmallScreen ? theme.fonts.sizes.xl : theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
  },
  subtitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    lineHeight: isSmallScreen ? 20 : 24,
  },
  inputSection: {
    marginBottom: isSmallScreen ? theme.spacing.xl : theme.spacing.xxxl,
  },
  inputLabel: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  phoneInput: {
    height: isSmallScreen ? 48 : 56,
    borderWidth: 2,
    borderColor: '#F6F7F9',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    fontSize: isSmallScreen ? theme.fonts.sizes.md : theme.fonts.sizes.lg,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
  },
  phoneInputFocused: {
    borderColor: '#679B00',
    shadowColor: '#679B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  inputHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isSmallScreen ? 48 : 56,
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.surface,
    shadowOpacity: 0, elevation: 0,
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