import React, { useEffect, useRef } from 'react';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Функция для получения высоты статус-бара на Android
const getStatusBarHeight = () => {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight || 24;
  }
  return 0;
};

interface CustomPrivacyModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
  privacyAccepted?: boolean;
}

export const CustomPrivacyModal: React.FC<CustomPrivacyModalProps> = ({
  visible,
  onClose,
  onAccept,
  privacyAccepted,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Анимация появления
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Анимация скрытия
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  // Обработка кнопки назад на Android
  useEffect(() => {
    if (visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        onClose();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [visible, onClose]);

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

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Modal Content with SafeAreaView */}
      <SafeAreaView style={styles.safeAreaContainer}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Согласие на обработку ПД</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.contentContainer}>
              <Text style={styles.legalText}>{legalText}</Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeFooterButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeFooterButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  safeAreaContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
    maxHeight: '90%',
    flex: 1,
    marginTop: '10%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  legalText: {
    fontSize: theme.fonts.sizes.sm,
    lineHeight: 22,
    color: theme.colors.text.primary,
    textAlign: 'justify',
  },
  footer: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.sm + 10 : theme.spacing.sm,
  },
  closeFooterButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12, // Фиксированный небольшой отступ
    alignItems: 'center',
    minHeight: 40, // Уменьшенная минимальная высота
  },
  closeFooterButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
  },
});
