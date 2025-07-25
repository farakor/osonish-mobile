import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';

export function RegistrationScreen() {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('+998');
  const [isLoading, setIsLoading] = useState(false);

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
      Alert.alert('Ошибка', 'Пожалуйста, введите корректный номер телефона');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Здесь будет API запрос для отправки SMS
      await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация запроса

      // Переходим к экрану верификации
      navigation.navigate('SmsVerification', { phone: phoneNumber } as never);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить SMS. Попробуйте еще раз.');
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
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Введите номер телефона</Text>
            <Text style={styles.subtitle}>
              Мы отправим вам SMS с кодом подтверждения
            </Text>
          </View>

          {/* Phone Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Номер телефона</Text>
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              placeholder="+998 (XX) XXX-XX-XX"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="phone-pad"
              maxLength={20}
              autoFocus
            />
            <Text style={styles.inputHint}>
              Введите номер телефона в формате +998
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
              {isLoading ? 'Отправляем SMS...' : 'Продолжить'}
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
    marginBottom: theme.spacing.xxxl,
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: theme.spacing.xxxl,
  },
  inputLabel: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  phoneInput: {
    height: 56,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
  },
  inputHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: theme.spacing.xl,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.surface,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.background,
  },
  continueButtonTextDisabled: {
    color: theme.colors.text.secondary,
  },
}); 