import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants';
import type { RootStackParamList } from '../../types';

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

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [isResendAvailable, setIsResendAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    // Автоматически фокусируем первый инпут при открытии экрана
    setTimeout(() => {
      inputRefs.current[0]?.focus();
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

  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Автоматический переход к следующему полю
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Автоматическая проверка при заполнении всех полей
    if (newCode.every(digit => digit !== '') && value) {
      verifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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
        Alert.alert('Ошибка', result.error || 'Неверный код подтверждения');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось проверить код. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResendAvailable(false);
    setTimer(60);
    setCode(['', '', '', '', '', '']);

    try {
      const { authService } = await import('../../services/authService');
      const result = await authService.startRegistration(phone);

      if (result.success) {
        Alert.alert('Успешно', 'SMS код отправлен повторно');
        inputRefs.current[0]?.focus();

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
        Alert.alert('Ошибка', result.error || 'Не удалось отправить SMS');
        setIsResendAvailable(true);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить SMS. Попробуйте еще раз.');
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
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Введите код из SMS</Text>
          <Text style={styles.subtitle}>
            Мы отправили код подтверждения на номер{'\n'}
            <Text style={styles.phoneNumber}>{phone}</Text>
          </Text>
        </View>

        {/* SMS Code Input */}
        <View style={styles.codeSection}>
          <View style={styles.codeInputs}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { if (ref) inputRefs.current[index] = ref; }}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled
                ]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <Text style={styles.codeHint}>
            Введите 6-значный код для подтверждения
          </Text>
        </View>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          {isResendAvailable ? (
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={styles.resendButton}>
                Отправить код повторно
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              Отправить повторно через {formatTime(timer)}
            </Text>
          )}
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingSection}>
            <Text style={styles.loadingText}>Проверяем код...</Text>
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpText}>
            Не получили SMS?{' '}
            <Text style={styles.helpLink}>Проверьте настройки</Text>
          </Text>
        </View>
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
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
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
    fontSize: theme.fonts.sizes.xl,
    color: theme.colors.text.primary,
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
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
  },
  codeInput: {
    width: isSmallScreen ? 42 : 48,
    height: isSmallScreen ? 48 : 56,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    fontSize: isSmallScreen ? theme.fonts.sizes.lg : theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    marginHorizontal: isSmallScreen ? 2 : 4,
  },
  codeInputFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  codeHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
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
  helpSection: {
    alignItems: 'center',
    paddingBottom: theme.spacing.lg,
  },
  helpText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  helpLink: {
    color: theme.colors.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
}); 