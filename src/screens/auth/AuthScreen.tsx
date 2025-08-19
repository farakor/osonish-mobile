import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, SafeAreaView, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';

const { height: screenHeight } = Dimensions.get('window');

// Определяем маленький экран для Android (высота меньше 1080px)
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

export function AuthScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>LOGO</Text>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Добро пожаловать!</Text>
          <Text style={styles.welcomeSubtitle}>
            Присоединяйтесь к нашему сообществу и найдите идеальную работу или исполнителя
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => {
              navigation.navigate('Registration' as never);
            }}
          >
            <Text style={styles.primaryButtonText}>Зарегистрироваться</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              navigation.navigate('Login' as never);
            }}
          >
            <Text style={styles.secondaryButtonText}>Уже есть аккаунт? Войти</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Продолжая, вы соглашаетесь с нашими{' '}
            <Text style={styles.linkText}>условиями использования</Text>
            {' '}и{' '}
            <Text style={styles.linkText}>политикой конфиденциальности</Text>
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
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.lg : theme.spacing.xxl,
  },
  logoPlaceholder: {
    width: isSmallScreen ? 200 : 280,
    height: isSmallScreen ? 200 : 280,
    backgroundColor: '#E5E5E5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  logoText: {
    fontSize: isSmallScreen ? 20 : 28,
    fontWeight: 'bold',
    color: '#888',
    letterSpacing: 2,
  },
  logoTextOld: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  tagline: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? theme.spacing.xl : theme.spacing.xxxl,
  },
  welcomeTitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.xl : theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: isSmallScreen ? theme.fonts.sizes.sm : theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 20 : 24,
  },
  buttonSection: {
    marginBottom: isSmallScreen ? theme.spacing.xl : theme.spacing.xxxl,
  },
  button: {
    paddingVertical: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 12,
    marginBottom: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isSmallScreen ? 48 : 56,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  primaryButtonText: {
    fontSize: isSmallScreen ? theme.fonts.sizes.md : theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.background,
  },
  secondaryButtonText: {
    fontSize: isSmallScreen ? theme.fonts.sizes.md : theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: theme.spacing.lg,
  },
  footerText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: theme.colors.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
}); 