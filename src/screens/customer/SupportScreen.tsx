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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';

export const SupportScreen: React.FC = () => {
  const navigation = useNavigation();

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Поддержка</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/logo-osonish-vertical.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Support Options */}
        <View style={styles.supportOptions}>
          {/* Telegram Support */}
          <TouchableOpacity style={styles.supportCard} onPress={handleTelegramPress}>
            <View style={styles.supportIcon}>
              <Text style={styles.telegramIcon}>📱</Text>
            </View>
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>Свяжитесь с нами по Telegram</Text>
              <Text style={styles.supportDescription}>
                Мы поможем Вам в любой ситуации
              </Text>
              <Text style={styles.supportContact}>@osonish</Text>
            </View>
          </TouchableOpacity>

          {/* Phone Support */}
          <TouchableOpacity style={styles.supportCard} onPress={handlePhonePress}>
            <View style={styles.supportIcon}>
              <Text style={styles.phoneIcon}>📞</Text>
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

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>💬</Text>
            <Text style={styles.infoText}>
              Наша команда поддержки работает ежедневно и готова помочь вам с любыми вопросами по использованию приложения, заказам и оплате.
            </Text>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Часто задаваемые вопросы</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Как оформить заказ?</Text>
            <Text style={styles.faqAnswer}>
              Выберите нужную услугу, заполните детали заказа и дождитесь откликов от исполнителей.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Как происходит оплата?</Text>
            <Text style={styles.faqAnswer}>
              Оплата происходит через безопасную систему после выполнения работы исполнителем.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Что делать если возникли проблемы?</Text>
            <Text style={styles.faqAnswer}>
              Свяжитесь с нашей службой поддержки через Telegram или по телефону.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
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
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingBottom: theme.spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  logoText: {
    fontSize: 32,
    color: theme.colors.white,
  },
  logoImage: {
    width: 140,
    height: 140,
    marginBottom: theme.spacing.md,
  },
  logoTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  supportOptions: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  supportCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supportIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  telegramIcon: {
    fontSize: 24,
  },
  phoneIcon: {
    fontSize: 24,
  },
  supportContent: {
    flex: 1,
    justifyContent: 'center',
  },
  supportTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  supportDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  supportContact: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
  },
  infoSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${theme.colors.primary}08`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}20`,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  faqSection: {
    paddingHorizontal: theme.spacing.lg,
  },
  faqTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  faqItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  faqQuestion: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  faqAnswer: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
}); 