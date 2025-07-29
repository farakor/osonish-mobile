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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { HeaderWithBack } from '../../components/common';

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
      <HeaderWithBack title="Поддержка" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>LOGO</Text>
            </View>
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
        <View style={styles.additionalInfo}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>О приложении</Text>
            <Text style={styles.infoText}>
              Oson Ish — современная платформа для поиска исполнителей и работы в Узбекистане.
              Мы помогаем людям находить друг друга и создавать полезные связи.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Часы работы поддержки</Text>
            <Text style={styles.infoText}>
              Понедельник - Воскресенье{'\n'}
              09:00 - 20:00 (GMT+5)
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Другие способы связи</Text>
            <Text style={styles.infoText}>
              Email: support@osonish.uz{'\n'}
              Адрес: г. Ташкент, ул. Мустақиллик, 1
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
  logoTextOld: {
    fontSize: 32,
    color: theme.colors.white,
  },
  logoPlaceholder: {
    width: 140,
    height: 140,
    backgroundColor: '#E5E5E5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
    letterSpacing: 1,
  },
  logoTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
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
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  supportDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  supportContact: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.primary,
  },
  additionalInfo: {
    paddingHorizontal: theme.spacing.lg,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
}); 