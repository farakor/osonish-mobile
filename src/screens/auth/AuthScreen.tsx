import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { useAuthTranslation } from '../../hooks/useTranslation';
import { LogoOsonish, WebViewModal } from '../../components/common';
import { EdgeToEdgeStatusBar } from '../../components/common/EdgeToEdgeStatusBar';
import { usePlatformSafeAreaInsets } from '../../utils/safeAreaUtils';

const { height: screenHeight } = Dimensions.get('window');

// Определяем маленький экран для Android (высота меньше 1080px)
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

export function AuthScreen() {
  const navigation = useNavigation();
  const t = useAuthTranslation();
  const insets = usePlatformSafeAreaInsets();
  const [webViewModal, setWebViewModal] = useState<{
    visible: boolean;
    url: string;
    title: string;
  }>({
    visible: false,
    url: '',
    title: '',
  });

  const handleOpenWebView = (url: string, title: string) => {
    setWebViewModal({
      visible: true,
      url,
      title,
    });
  };

  const handleCloseWebView = () => {
    setWebViewModal({
      visible: false,
      url: '',
      title: '',
    });
  };

  const handleTermsPress = () => {
    handleOpenWebView('https://oson-ish.uz/terms-of-service.html', t('terms_of_service_title'));
  };

  const handlePrivacyPress = () => {
    if (Platform.OS === 'android') {
      (navigation as any).navigate('DocumentWebView', {
        url: 'https://oson-ish.uz/privacy-policy.html',
        title: t('privacy_policy_title'),
      });
    } else {
      handleOpenWebView('https://oson-ish.uz/privacy-policy.html', t('privacy_policy_title'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <EdgeToEdgeStatusBar style="dark" />

      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <LogoOsonish
            width={isSmallScreen ? 240 : 320}
            height={isSmallScreen ? 43 : 58}
          />
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>{t('welcome_title')}</Text>
          <Text style={styles.welcomeSubtitle}>
            {t('welcome_subtitle')}
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
            <Text style={styles.primaryButtonText}>{t('register')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              navigation.navigate('Login' as never);
            }}
          >
            <Text style={styles.secondaryButtonText}>{t('go_to_login')}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerText}>
              {t('terms_agreement')}{' '}
            </Text>
            <TouchableOpacity onPress={handleTermsPress}>
              <Text style={[styles.footerText, styles.linkText]}>{t('terms_of_use')}</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}>
              {' '}{t('and')}{' '}
            </Text>
            <TouchableOpacity onPress={handlePrivacyPress}>
              <Text style={[styles.footerText, styles.linkText]}>{t('privacy_policy')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* WebView Modal */}
      <WebViewModal
        visible={webViewModal.visible}
        url={webViewModal.url}
        title={webViewModal.title}
        onClose={handleCloseWebView}
      />
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
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  secondaryButton: {
    backgroundColor: '#F6F7F9',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
  footerTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
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