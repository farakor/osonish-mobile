import React, { useState, useEffect, useRef } from 'react';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar, Alert,
  Dimensions,
  Platform, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import type { RootStackParamList } from '../../types';
import { useAuthTranslation, useErrorsTranslation } from '../../hooks/useTranslation';
import { StableSmsInput, StableSmsInputRef, LogoOsonish } from '../../components/common';
import EnhancedSmsInput, { EnhancedSmsInputRef } from '../../components/common/EnhancedSmsInput';
import NativeSmsInput, { NativeSmsInputRef } from '../../components/common/NativeSmsInput';
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

export function SmsVerificationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { phone } = route.params as { phone: string };
  const t = useAuthTranslation();
  const tError = useErrorsTranslation();

  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(60);
  const [isResendAvailable, setIsResendAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const smsInputRef = useRef<NativeSmsInputRef>(null);

  useEffect(() => {
    // Автоматически фокусируем SMS input при открытии экрана
    setTimeout(() => {
      smsInputRef.current?.focus();
    }, 300); // небольшая задержка для корректной работы на Android
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setIsResendAvailable(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleCodeComplete = (completedCode: string) => {
    verifyCode(completedCode);
  };

  const verifyCode = async (smsCode: string) => {
    setIsLoading(true);

    try {
      const { authService } = await import('../../services/authService');
      const result = await authService.verifyRegistrationCode({
        phone: phone,
        code: smsCode
      });

      if (result.success) {
        // Переходим к экрану заполнения профиля
        navigation.reset({
          index: 0,
          routes: [{ name: 'ProfileInfo', params: { phone } }],
        });
      } else {
        Alert.alert(tError('error'), result.error || t('invalid_code'));
        setCode('');
        smsInputRef.current?.clear();
        smsInputRef.current?.focus();
      }
    } catch (error) {
      Alert.alert(tError('error'), t('code_verification_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResendAvailable(false);
    setTimer(60);
    setCode('');
    smsInputRef.current?.clear();

    try {
      const { authService } = await import('../../services/authService');
      const result = await authService.startRegistration(phone);

      if (result.success) {
        Alert.alert(tError('success'), t('sms_resent_success'));
        smsInputRef.current?.focus();

        // Запускаем таймер заново
        const interval = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              setIsResendAvailable(true);
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        Alert.alert(tError('error'), result.error || t('sms_send_error'));
        setIsResendAvailable(true);
      }
    } catch (error) {
      Alert.alert(tError('error'), t('general_error'));
      setIsResendAvailable(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

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
          <Text style={styles.title}>{t('sms_code_title')}</Text>
          <Text style={styles.subtitle}>
            {t('sms_code_subtitle')}{'\n'}
            <Text style={styles.phoneNumber}>{phone}</Text>
          </Text>
        </View>

        {/* SMS Code Input */}
        <View style={styles.codeSection}>
          <NativeSmsInput
            ref={smsInputRef}
            length={6}
            value={code}
            onCodeChange={handleCodeChange}
            onComplete={handleCodeComplete}
            disabled={isLoading}
            autoFocus={false} // Управляем фокусом вручную
            enableSmsRetriever={true}
            showAutoFillIndicator={true}
          />

          <Text style={styles.codeHint}>
            {t('sms_code_hint')}
          </Text>
        </View>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          {isResendAvailable ? (
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={styles.resendButton}>
                {t('resend_code')}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              {t('resend_in')} {formatTime(timer)}
            </Text>
          )}
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingSection}>
            <Text style={styles.loadingText}>{t('verifying_code')}</Text>
          </View>
        )}


      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },

  titleSection: {
    marginBottom: isSmallScreen ? theme.spacing.xl : theme.spacing.xxxl,
    alignItems: 'center',
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
  phoneNumber: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semiBold,
  },
  codeSection: {
    marginBottom: isSmallScreen ? theme.spacing.xl : theme.spacing.xxxl,
    alignItems: 'center',
  },
  codeHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
  },
  resendButton: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.primary,
  },
  timerText: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
  },
  loadingSection: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
  },
  loadingText: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },

}); 