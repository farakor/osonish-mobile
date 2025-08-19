import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';

const { height: screenHeight } = Dimensions.get('window');

// Определяем маленький экран для Android (высота меньше 1080px)
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

interface PriceConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onAcceptPrice: () => void;
  onProposePrice: () => void;
  orderPrice: number;
  orderTitle: string;
}

export const PriceConfirmationModal: React.FC<PriceConfirmationModalProps> = ({
  visible,
  onClose,
  onAcceptPrice,
  onProposePrice,
  orderPrice,
  orderTitle,
}) => {
  const insets = useSafeAreaInsets();
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(300)).current;
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleAnimatedClose = () => {
    setIsClosing(true);
    setAnimationComplete(false);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsClosing(false);
      onClose();
    });
  };

  useEffect(() => {
    if (visible && !isClosing) {
      // Сброс начальных значений перед анимацией
      overlayOpacity.setValue(0);
      modalTranslateY.setValue(300);
      setAnimationComplete(false);

      // Анимация появления с небольшой задержкой для overlay
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(modalTranslateY, {
          toValue: 0,
          tension: 60,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Анимация завершена, активируем кнопки
        setAnimationComplete(true);
      });
    } else if (!visible && !isClosing && (overlayOpacity as any)._value > 0) {
      // Анимация скрытия только если модалка была видна и не закрывается программно
      setAnimationComplete(false);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslateY, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, isClosing]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('uz-UZ');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
    >
      <Animated.View style={[
        styles.overlay,
        {
          opacity: overlayOpacity,
        }
      ]}>
        <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'android' ? 120 : 0) }]}>
          <Animated.View style={[
            styles.modal,
            {
              transform: [{ translateY: modalTranslateY }],
            }
          ]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Подтверждение отклика</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleAnimatedClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Price info */}
            <View style={styles.orderInfo}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Цена заказа:</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(orderPrice)} сум
                </Text>
              </View>
            </View>

            {/* Question */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>
                Вы согласны с ценой {formatPrice(orderPrice)} сум?
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.acceptButton,
                  !animationComplete && styles.buttonDisabled
                ]}
                onPress={animationComplete ? onAcceptPrice : undefined}
                disabled={!animationComplete}
              >
                <Text style={[
                  styles.acceptButtonText,
                  !animationComplete && styles.disabledButtonText
                ]}>Согласен</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.proposeButton,
                  !animationComplete && styles.buttonDisabled
                ]}
                onPress={animationComplete ? onProposePrice : undefined}
                disabled={!animationComplete}
              >
                <Text style={[
                  styles.proposeButtonText,
                  !animationComplete && styles.disabledButtonText
                ]}>Предложить свою цену</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '50%',
  },
  modal: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
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
  orderInfo: {
    marginBottom: theme.spacing.lg,
  },
  orderTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 12,
  },
  priceLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  priceValue: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  questionSection: {
    marginBottom: theme.spacing.xl,
  },
  questionText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actionButtons: {
    gap: theme.spacing.md,
  },
  button: {
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
  },
  acceptButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.background,
  },
  proposeButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  proposeButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
}); 