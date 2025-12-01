import React from 'react';
import { View,
  Text,
  StyleSheet, ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  StatusBar, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { usePlatformSafeAreaInsets, getTabScreenScrollViewContentStyle, getSafeAreaViewWithWhiteBackground, getAndroidNavigationBarBackground } from '../../utils/safeAreaUtils';
import TelegramIcon from '../../../assets/telegram-icon.svg';
import PhoneCallIcon from '../../../assets/phone-call-01.svg';
import { HeaderWithBack, LogoOsonish } from '../../components/common';
import { useWorkerTranslation } from '../../hooks/useTranslation';

export const SupportScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = usePlatformSafeAreaInsets();
  const tWorker = useWorkerTranslation();

  const handleTelegramPress = async () => {
    const telegramUrl = 'https://t.me/osonish_uzb';
    try {
      const supported = await Linking.canOpenURL(telegramUrl);
      if (supported) {
        await Linking.openURL(telegramUrl);
      } else {
        Alert.alert(tWorker('general_error'), tWorker('telegram_open_error'));
      }
    } catch (error) {
      Alert.alert(tWorker('general_error'), tWorker('telegram_open_error'));
    }
  };

  const handlePhonePress = async () => {
    const phoneUrl = 'tel:+998916480070';
    try {
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert(tWorker('general_error'), tWorker('phone_call_error'));
      }
    } catch (error) {
      Alert.alert(tWorker('general_error'), tWorker('phone_call_error'));
    }
  };

  return (
    <SafeAreaView style={getSafeAreaViewWithWhiteBackground(insets)}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <HeaderWithBack title={tWorker('support_title')} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={getTabScreenScrollViewContentStyle(insets, theme.spacing.lg)}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <LogoOsonish width={200} height={36} />
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Telegram Support */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tWorker('telegram_support')}</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={handleTelegramPress}>
              <View style={styles.supportIcon}>
                <TelegramIcon width={36} height={36} />
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>{tWorker('contact_telegram')}</Text>
                <Text style={styles.supportDescription}>
                  {tWorker('help_any_situation')}
                </Text>
                <Text style={styles.supportContact}>@osonish_uzb</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Phone Support */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tWorker('phone_support')}</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={handlePhonePress}>
              <View style={styles.supportIcon}>
                <PhoneCallIcon width={36} height={36} />
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>{tWorker('call_us')}</Text>
                <Text style={styles.supportDescription}>
                  {tWorker('working_hours_short')}
                </Text>
                <Text style={styles.supportContact}>+998 91-648-00-70</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tWorker('support_hours')}</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.infoText}>
                {tWorker('working_days')}{'\n'}
                {tWorker('working_time')}
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tWorker('other_contacts')}</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.infoText}>
                {tWorker('email_label')} <Text style={styles.emailLink} onPress={() => Linking.openURL('mailto:info@oson-ish.uz')}>info@oson-ish.uz</Text>{'\n'}
                {tWorker('address_label')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Белый фон под navigation bar на Android */}
      <View style={getAndroidNavigationBarBackground(insets)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#E5E5E5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
    letterSpacing: 1,
  },

  // Form (copied from EditProfileScreen)
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },

  // Support specific styles
  supportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  supportDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  supportContact: {
    fontSize: 14,
    fontWeight: '600',
    color: '#679B00',
  },

  // Info text
  infoText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 22,
  },
  emailLink: {
    color: '#679B00',
    textDecorationLine: 'underline',
  },
});