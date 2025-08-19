import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { usePlatformSafeAreaInsets, getScrollViewContentStyle } from '../../utils/safeAreaUtils';
import TelegramIcon from '../../../assets/telegram-icon.svg';
import PhoneCallIcon from '../../../assets/phone-call-01.svg';
import { HeaderWithBack } from '../../components/common';

export const SupportScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = usePlatformSafeAreaInsets();

  const handleTelegramPress = async () => {
    const telegramUrl = 'https://t.me/osonish';
    try {
      const supported = await Linking.canOpenURL(telegramUrl);
      if (supported) {
        await Linking.openURL(telegramUrl);
      } else {
        Alert.alert('Ошибка', 'Не удается открыть Telegram');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удается открыть Telegram');
    }
  };

  const handlePhonePress = async () => {
    const phoneUrl = 'tel:+998555000000';
    try {
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Ошибка', 'Не удается совершить звонок');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удается совершить звонок');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <HeaderWithBack title="Поддержка" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={getScrollViewContentStyle(insets, theme.spacing.lg)}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>LOGO</Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Telegram Support */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telegram поддержка</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={handleTelegramPress}>
              <View style={styles.supportIcon}>
                <TelegramIcon width={36} height={36} />
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>Свяжитесь с нами по Telegram</Text>
                <Text style={styles.supportDescription}>
                  Мы поможем Вам в любой ситуации
                </Text>
                <Text style={styles.supportContact}>@osonish</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Phone Support */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Телефонная поддержка</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={handlePhonePress}>
              <View style={styles.supportIcon}>
                <PhoneCallIcon width={36} height={36} />
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>Позвоните нам</Text>
                <Text style={styles.supportDescription}>
                  Пн-Вс | 09:00 - 20:00
                </Text>
                <Text style={styles.supportContact}>+998 (555) 000-0000</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Часы работы поддержки</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.infoText}>
                Понедельник - Воскресенье{'\n'}
                09:00 - 20:00 (GMT+5)
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Другие способы связи</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.infoText}>
                Email: <Text style={styles.emailLink} onPress={() => Linking.openURL('mailto:info@oson-ish.uz')}>info@oson-ish.uz</Text>{'\n'}
                Адрес: Samarqand viloyati, Samarqand tumani, Konigil MFY, Samarqand davozasi ko'chasi, 49-uy
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },



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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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