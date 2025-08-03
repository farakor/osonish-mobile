import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Animated,
} from 'react-native';
import { theme } from '../../constants/theme';

interface ProposePriceModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (proposedPrice: number, message: string) => void;
  originalPrice: number;
  orderTitle: string;
}

export const ProposePriceModal: React.FC<ProposePriceModalProps> = ({
  visible,
  onClose,
  onSubmit,
  originalPrice,
  orderTitle,
}) => {
  const [proposedPrice, setProposedPrice] = useState(originalPrice);
  const [message, setMessage] = useState('');
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(400)).current;

  // Обновляем proposedPrice когда изменяется originalPrice
  useEffect(() => {
    setProposedPrice(originalPrice);
  }, [originalPrice]);

  const handleAnimatedClose = (shouldResetMessage = true) => {
    setIsClosing(true);
    setAnimationComplete(false);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsClosing(false);
      // Сбрасываем сообщение только если это обычное закрытие
      if (shouldResetMessage) {
        setMessage('');
      }
      onClose();
    });
  };

  useEffect(() => {
    if (visible && !isClosing) {
      // Сброс начальных значений перед анимацией
      overlayOpacity.setValue(0);
      modalTranslateY.setValue(400);
      setAnimationComplete(false);

      // Анимация появления
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
          toValue: 400,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, isClosing]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('uz-UZ');
  };

  const increasePrice = () => {
    setProposedPrice(prev => prev + 50000);
  };

  const decreasePrice = () => {
    setProposedPrice(prev => Math.max(50000, prev - 50000));
  };

  const handleSubmit = () => {
    onSubmit(proposedPrice, message);
    // Сбрасываем сообщение после отправки и закрываем без повторного сброса
    setMessage('');
    handleAnimatedClose(false);
  };

  const handleClose = () => {
    // Используем анимированное закрытие для кнопки "Отмена"
    handleAnimatedClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={handleClose}
    >
      <Animated.View style={[
        styles.overlay,
        {
          opacity: overlayOpacity,
        }
      ]}>
        <SafeAreaView style={styles.container}>
          <Animated.View style={[
            styles.modalContent,
            {
              transform: [{ translateY: modalTranslateY }],
            }
          ]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Отправить предложение</Text>
              <TouchableOpacity onPress={handleAnimatedClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Order title */}
            <Text style={styles.orderTitle} numberOfLines={2}>
              {orderTitle}
            </Text>

            {/* Price section */}
            <View style={styles.priceSection}>
              <Text style={styles.sectionTitle}>Ваша цена</Text>
              <View style={styles.priceContainer}>
                <TouchableOpacity
                  style={[
                    styles.priceButton,
                    !animationComplete && styles.buttonDisabled
                  ]}
                  onPress={animationComplete ? decreasePrice : undefined}
                  disabled={!animationComplete || proposedPrice <= 50000}
                >
                  <Text style={[
                    styles.priceButtonText,
                    (proposedPrice <= 50000 || !animationComplete) && styles.disabledButton
                  ]}>−</Text>
                </TouchableOpacity>

                <View style={styles.priceDisplay}>
                  <Text style={styles.priceText}>
                    {formatPrice(proposedPrice)}
                  </Text>
                  <Text style={styles.currencyText}>сум</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.priceButton,
                    !animationComplete && styles.buttonDisabled
                  ]}
                  onPress={animationComplete ? increasePrice : undefined}
                  disabled={!animationComplete}
                >
                  <Text style={[
                    styles.priceButtonText,
                    !animationComplete && styles.disabledButton
                  ]}>+</Text>
                </TouchableOpacity>
              </View>

              {proposedPrice !== originalPrice && (
                <Text style={styles.priceChangeNote}>
                  {proposedPrice > originalPrice ? 'Выше' : 'Ниже'} исходной цены на{' '}
                  {formatPrice(Math.abs(proposedPrice - originalPrice))} сум
                </Text>
              )}
            </View>

            {/* Comment section */}
            <View style={styles.commentSection}>
              <Text style={styles.sectionTitle}>Комментарии</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Напишите что нибудь..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !animationComplete && styles.buttonDisabled
                ]}
                onPress={animationComplete ? handleSubmit : undefined}
                disabled={!animationComplete}
              >
                <Text style={[
                  styles.submitButtonText,
                  !animationComplete && styles.disabledButtonText
                ]}>Откликнуться</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  !animationComplete && styles.buttonDisabled
                ]}
                onPress={animationComplete ? handleClose : undefined}
                disabled={!animationComplete}
              >
                <Text style={[
                  styles.cancelButtonText,
                  !animationComplete && styles.disabledButtonText
                ]}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
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
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  orderTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    lineHeight: 22,
  },
  priceSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  priceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  priceButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  disabledButton: {
    color: '#ccc',
  },
  priceDisplay: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  priceText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  currencyText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priceChangeNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  commentSection: {
    marginBottom: 32,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f8f9fa',
    minHeight: 100,
  },
  actionButtons: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
}); 