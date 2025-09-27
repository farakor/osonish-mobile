import React from 'react';
import { Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet, ScrollView,
  StatusBar,
  Platform, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  visible,
  onClose,
}) => {
  const termsText = `УСЛОВИЯ ИСПОЛЬЗОВАНИЯ СЕРВИСА "ОСОНИШ"

1. ОБЩИЕ ПОЛОЖЕНИЯ

1.1. Настоящие Условия использования (далее — Условия) регулируют отношения между Обществом с ограниченной ответственностью "ОСОНИШ" (далее — Компания) и пользователями мобильного приложения "Осониш" (далее — Приложение).

1.2. Использование Приложения означает полное согласие с настоящими Условиями.

1.3. Если вы не согласны с какими-либо положениями настоящих Условий, не используйте Приложение.

2. ОПИСАНИЕ СЕРВИСА

2.1. Приложение "Осониш" представляет собой платформу для поиска и предоставления различных услуг.

2.2. Компания предоставляет техническую платформу для взаимодействия между заказчиками и исполнителями услуг.

2.3. Компания не является стороной договоров между заказчиками и исполнителями.

3. РЕГИСТРАЦИЯ И АККАУНТ

3.1. Для использования Приложения необходимо пройти регистрацию.

3.2. При регистрации пользователь обязуется предоставить достоверную информацию.

3.3. Пользователь несет ответственность за сохранность данных своего аккаунта.

3.4. Запрещается создание нескольких аккаунтов одним лицом.

4. ПРАВА И ОБЯЗАННОСТИ ПОЛЬЗОВАТЕЛЕЙ

4.1. Пользователи имеют право:
• Размещать заказы на услуги (заказчики)
• Откликаться на заказы (исполнители)
• Оценивать качество услуг
• Получать техническую поддержку

4.2. Пользователи обязуются:
• Соблюдать законодательство Республики Узбекистан
• Предоставлять достоверную информацию
• Не нарушать права других пользователей
• Не использовать Приложение в мошеннических целях

5. ЗАПРЕЩЕННЫЕ ДЕЙСТВИЯ

5.1. Запрещается:
• Размещение незаконного контента
• Спам и массовая рассылка
• Попытки взлома системы
• Использование автоматизированных средств
• Нарушение авторских прав

6. ОПЛАТА И КОМИССИИ

6.1. Использование базового функционала Приложения бесплатно.

6.2. Компания может взимать комиссию с выполненных заказов.

6.3. Размер комиссии указывается в Приложении.

7. ОТВЕТСТВЕННОСТЬ

7.1. Компания не несет ответственности за:
• Качество предоставляемых услуг
• Действия пользователей
• Убытки от использования Приложения

7.2. Максимальная ответственность Компании ограничена суммой комиссии по конкретному заказу.

8. ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ

8.1. Все права на Приложение принадлежат Компании.

8.2. Запрещается копирование, изменение или распространение Приложения без разрешения.

9. ИЗМЕНЕНИЕ УСЛОВИЙ

9.1. Компания имеет право изменять настоящие Условия.

9.2. Изменения вступают в силу с момента публикации в Приложении.

10. ПРЕКРАЩЕНИЕ ИСПОЛЬЗОВАНИЯ

10.1. Пользователь может прекратить использование Приложения в любое время.

10.2. Компания может заблокировать аккаунт при нарушении Условий.

11. КОНТАКТНАЯ ИНФОРМАЦИЯ

По вопросам использования Приложения обращайтесь:
Email: support@osonish.uz
Телефон: +998 (71) 123-45-67
Адрес: г. Ташкент, ул. Примерная, д. 123

12. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ

12.1. Настоящие Условия регулируются законодательством Республики Узбекистан.

12.2. Споры разрешаются в судебном порядке по месту нахождения Компании.

12.3. Если какое-либо положение Условий признается недействительным, остальные положения сохраняют силу.

Дата последнего обновления: 15 декабря 2024 года`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Условия использования</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <Text style={styles.termsText}>{termsText}</Text>
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
    backgroundColor: theme.colors.background,
    ...Platform.select({
      ios: {
        shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, },
      android: {
        elevation: 0, },
    }),
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  termsText: {
    fontSize: theme.fonts.sizes.sm,
    lineHeight: 20,
    color: theme.colors.text.primary,
    textAlign: 'left',
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    backgroundColor: theme.colors.background,
  },
  closeFooterButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  closeFooterButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
});
