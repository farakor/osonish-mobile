import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { theme } from '../../constants';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  privacyAccepted: boolean;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  visible,
  onClose,
  onAccept,
  privacyAccepted,
}) => {
  const legalText = `СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ

1. ОБЩИЕ ПОЛОЖЕНИЯ

Настоящее Согласие на обработку персональных данных (далее — Согласие) дается Обществом с ограниченной ответственностью "ОСОНИШ" (далее — Оператор) в соответствии с требованиями Закона Республики Узбекистан "О персональных данных" от 2 июля 2019 года № ЗРУ-547.

2. СОСТАВ ПЕРСОНАЛЬНЫХ ДАННЫХ

Субъект персональных данных дает согласие на обработку следующих персональных данных:
• Фамилия, имя, отчество
• Дата рождения
• Номер мобильного телефона
• Фотография профиля
• Геолокационные данные
• Информация о заказах и услугах
• Рейтинги и отзывы

3. ЦЕЛИ ОБРАБОТКИ

Персональные данные обрабатываются в следующих целях:
• Регистрация и идентификация пользователей
• Предоставление услуг через мобильное приложение
• Поиск и подбор исполнителей для заказов
• Обеспечение безопасности и защиты пользователей
• Связь с пользователями по вопросам сервиса
• Улучшение качества предоставляемых услуг
• Соблюдение требований законодательства

4. СПОСОБЫ ОБРАБОТКИ

Оператор обрабатывает персональные данные следующими способами:
• Сбор, запись, систематизация, накопление, хранение
• Уточнение, обновление, изменение, извлечение
• Использование, передача, предоставление, доступ
• Блокирование, удаление, уничтожение

5. СРОКИ ОБРАБОТКИ

Персональные данные обрабатываются в течение всего периода использования сервиса и в течение 3 (трех) лет после прекращения отношений, если иное не предусмотрено законодательством.

6. ПРАВА СУБЪЕКТА

Субъект персональных данных имеет право:
• Получать информацию о факте обработки своих данных
• Требовать уточнения, блокирования или уничтожения данных
• Отзывать настоящее согласие
• Обращаться в государственные органы по вопросам защиты данных

7. БЕЗОПАСНОСТЬ

Оператор принимает необходимые правовые, организационные и технические меры для защиты персональных данных от неправомерного доступа, изменения, блокирования, копирования, предоставления, распространения, а также от иных неправомерных действий.

8. ПЕРЕДАЧА ТРЕТЬИМ ЛИЦАМ

Персональные данные могут передаваться третьим лицам только в случаях, предусмотренных законодательством, или с согласия субъекта данных.

9. ИЗМЕНЕНИЯ

Оператор имеет право вносить изменения в настоящее Согласие с уведомлением субъекта данных.

10. КОНТАКТНАЯ ИНФОРМАЦИЯ

По вопросам обработки персональных данных обращаться:
Email: privacy@osonish.uz
Телефон: +998 (71) 123-45-67
Адрес: г. Ташкент, ул. Примерная, д. 123

Даю согласие на обработку указанных персональных данных в соответствии с условиями, изложенными выше.`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Согласие на обработку ПД</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.legalText}>{legalText}</Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.closeFooterButton}
            onPress={onClose}
          >
            <Text style={styles.closeFooterButtonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: theme.colors.text.secondary,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  legalText: {
    fontSize: theme.fonts.sizes.sm,
    lineHeight: 20,
    color: theme.colors.text.primary,
    textAlign: 'justify',
  },
  footer: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl + theme.spacing.xl,
  },
  closeFooterButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  closeFooterButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
});
