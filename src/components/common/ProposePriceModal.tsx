import React, { useState, useEffect, useRef } from 'react';
import { View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput, Animated,
  Platform,
  Dimensions,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { theme } from '../../constants/theme';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { useWorkerTranslation } from '../../hooks/useTranslation';

const { height: screenHeight } = Dimensions.get('window');

// Определяем маленький экран для Android (высота меньше 1080px)
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const tWorker = useWorkerTranslation();

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(400)).current;

  // Обновляем proposedPrice когда изменяется originalPrice
  useEffect(() => {
    setProposedPrice(originalPrice);
  }, [originalPrice]);

  // Слушатели событий клавиатуры - только для iOS поднимаем модалку
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          setKeyboardVisible(true);
          Animated.timing(modalTranslateY, {
            toValue: -100,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      );

      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setKeyboardVisible(false);
          Animated.timing(modalTranslateY, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      );

      return () => {
        keyboardDidShowListener?.remove();
        keyboardDidHideListener?.remove();
      };
    } else {
      // Для Android только отслеживаем состояние клавиатуры
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => setKeyboardVisible(true)
      );

      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => setKeyboardVisible(false)
      );

      return () => {
        keyboardDidShowListener?.remove();
        keyboardDidHideListener?.remove();
      };
    }
  }, [modalTranslateY]);

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
    setProposedPrice(prev => prev + 10000);
  };

  const decreasePrice = () => {
    setProposedPrice(prev => Math.max(10000, prev - 10000));
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

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <>
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
          <SafeAreaView style={[
            styles.container,
            keyboardVisible && Platform.OS === 'ios' && styles.containerKeyboardVisible
          ]}>
            {Platform.OS === 'android' ? (
              // Android - с KeyboardAvoidingView и ScrollView
              <KeyboardAvoidingView
                behavior="padding"
                style={styles.keyboardAvoidingView}
                keyboardVerticalOffset={0}
              >
                <Animated.View style={[
                  styles.modalContent,
                  {
                    transform: [{ translateY: modalTranslateY }],
                    maxHeight: '80%',
                  }
                ]}>
                  <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Header */}
                    <View style={styles.header}>
                      <Text style={styles.title}>{tWorker('send_proposal')}</Text>
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
                      <Text style={styles.sectionTitle}>{tWorker('your_price')}</Text>
                      <View style={styles.priceContainer}>
                        <TouchableOpacity
                          style={[
                            styles.priceButton,
                            !animationComplete && styles.buttonDisabled
                          ]}
                          onPress={animationComplete ? decreasePrice : undefined}
                          disabled={!animationComplete || proposedPrice <= 10000}
                        >
                          <Text style={[
                            styles.priceButtonText,
                            (proposedPrice <= 10000 || !animationComplete) && styles.disabledButton
                          ]}>−</Text>
                        </TouchableOpacity>

                        <View style={styles.priceDisplay}>
                          <Text style={styles.priceText}>
                            {formatPrice(proposedPrice)}
                          </Text>
                          <Text style={styles.currencyText}>{tWorker('currency_sum')}</Text>
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
                          {proposedPrice > originalPrice ? tWorker('higher_than_original') : tWorker('lower_than_original')} {tWorker('price_difference')}{' '}
                          {formatPrice(Math.abs(proposedPrice - originalPrice))} {tWorker('currency_sum')}
                        </Text>
                      )}
                    </View>

                    {/* Comment section */}
                    <View style={styles.commentSection}>
                      <Text style={styles.sectionTitle}>{tWorker('comments')}</Text>
                      <TextInput
                        style={styles.commentInput}
                        placeholder={tWorker('comment_placeholder')}
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
                        ]}>{tWorker('respond')}</Text>
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
                        ]}>{tWorker('cancel')}</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </Animated.View>
              </KeyboardAvoidingView>
            ) : (
              // iOS - простая структура с поднятием модалки
              <Animated.View style={[
                styles.modalContent,
                keyboardVisible && styles.modalContentKeyboardVisible,
                {
                  transform: [{ translateY: modalTranslateY }],
                }
              ]}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>{tWorker('send_proposal')}</Text>
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
                  <Text style={styles.sectionTitle}>{tWorker('your_price')}</Text>
                  <View style={styles.priceContainer}>
                    <TouchableOpacity
                      style={[
                        styles.priceButton,
                        !animationComplete && styles.buttonDisabled
                      ]}
                      onPress={animationComplete ? decreasePrice : undefined}
                      disabled={!animationComplete || proposedPrice <= 10000}
                    >
                      <Text style={[
                        styles.priceButtonText,
                        (proposedPrice <= 10000 || !animationComplete) && styles.disabledButton
                      ]}>−</Text>
                    </TouchableOpacity>

                    <View style={styles.priceDisplay}>
                      <Text style={styles.priceText}>
                        {formatPrice(proposedPrice)}
                      </Text>
                      <Text style={styles.currencyText}>{tWorker('currency_sum')}</Text>
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
                      {proposedPrice > originalPrice ? tWorker('higher_than_original') : tWorker('lower_than_original')} {tWorker('price_difference')}{' '}
                      {formatPrice(Math.abs(proposedPrice - originalPrice))} {tWorker('currency_sum')}
                    </Text>
                  )}
                </View>

                {/* Comment section */}
                <View style={styles.commentSection}>
                  <Text style={styles.sectionTitle}>{tWorker('comments')}</Text>
                  <TextInput
                    style={styles.commentInput}
                    placeholder={tWorker('comment_placeholder')}
                    placeholderTextColor="#999"
                    value={message}
                    onChangeText={setMessage}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                    returnKeyType="done"
                    onSubmitEditing={dismissKeyboard}
                    blurOnSubmit={true}
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
                    ]}>{tWorker('respond')}</Text>
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
                    ]}>{tWorker('cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </>
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
  containerKeyboardVisible: {
    justifyContent: 'center', // Только для iOS
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrollView: {
    maxHeight: '100%',
  },
  scrollContent: {
    paddingBottom: 0, // Убираем лишний отступ
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 20 : 32, // Уменьшаем отступ снизу для Android
    maxHeight: '80%',
  },
  modalContentKeyboardVisible: {
    // iOS - карточка по центру, Android - обычная модалка снизу
    maxHeight: Platform.OS === 'ios' ? '70%' : '85%',
    borderRadius: Platform.OS === 'ios' ? 16 : 0,
    paddingTop: Platform.OS === 'ios' ? 20 : 20, // Уменьшаем отступ сверху для Android
    marginHorizontal: Platform.OS === 'ios' ? 16 : 0,
    borderTopLeftRadius: Platform.OS === 'ios' ? 16 : 24,
    borderTopRightRadius: Platform.OS === 'ios' ? 16 : 24,
    borderBottomLeftRadius: Platform.OS === 'ios' ? 16 : 0,
    borderBottomRightRadius: Platform.OS === 'ios' ? 16 : 0,
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
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
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
    borderWidth: 0, borderColor: 'transparent', borderRadius: 12,
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