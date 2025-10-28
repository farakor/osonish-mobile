import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { useWorkerTranslation } from '../../hooks/useTranslation';
import PhoneIcon from '../../../assets/phone-call-01.svg';

const { height: screenHeight } = Dimensions.get('window');

interface CustomerPhoneModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
  onCall?: () => void | Promise<void>; // Новый callback для логирования звонка
  customerPhone: string;
  customerName: string;
}

export const CustomerPhoneModal: React.FC<CustomerPhoneModalProps> = ({
  visible,
  onClose,
  onContinue,
  onCall,
  customerPhone,
  customerName,
}) => {
  const insets = useSafeAreaInsets();
  const tWorker = useWorkerTranslation();
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
      overlayOpacity.setValue(0);
      modalTranslateY.setValue(300);
      setAnimationComplete(false);

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
        setAnimationComplete(true);
      });
    } else if (!visible && !isClosing && (overlayOpacity as any)._value > 0) {
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

  const handleCallCustomer = async () => {
    try {
      // Вызываем callback для логирования звонка, если он передан
      if (onCall) {
        await onCall();
      }
      
      // Открываем диалер
      const phoneUrl = `tel:${customerPhone}`;
      await Linking.openURL(phoneUrl);
    } catch (err) {
      console.error('Ошибка при открытии диалера:', err);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="none">
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <View
          style={[
            styles.container,
            { paddingBottom: insets.bottom + (Platform.OS === 'android' ? 120 : 0) },
          ]}
        >
          <Animated.View
            style={[
              styles.modal,
              {
                transform: [{ translateY: modalTranslateY }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{tWorker('customer_contact')}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleAnimatedClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>{tWorker('customer_phone_info')}</Text>
            </View>

            {/* Phone Display */}
            <View style={styles.phoneContainer}>
              <View style={styles.phoneInfo}>
                <Text style={styles.customerName}>{customerName}</Text>
                <Text style={styles.phoneNumber}>{customerPhone}</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.callButton,
                  !animationComplete && styles.buttonDisabled,
                ]}
                onPress={animationComplete ? handleCallCustomer : undefined}
                disabled={!animationComplete}
              >
                <PhoneIcon width={20} height={20} color={theme.colors.white} />
                <Text
                  style={[
                    styles.callButtonText,
                    !animationComplete && styles.disabledButtonText,
                  ]}
                >
                  {tWorker('call_customer')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.continueButton,
                  !animationComplete && styles.buttonDisabled,
                ]}
                onPress={animationComplete ? onContinue : undefined}
                disabled={!animationComplete}
              >
                <Text
                  style={[
                    styles.continueButtonText,
                    !animationComplete && styles.disabledButtonText,
                  ]}
                >
                  {tWorker('continue_response')}
                </Text>
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
    maxHeight: '60%',
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
  infoSection: {
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneContainer: {
    backgroundColor: '#F6F7F9',
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  phoneInfo: {
    alignItems: 'center',
  },
  customerName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  phoneNumber: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  actionButtons: {
    gap: theme.spacing.md,
  },
  button: {
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  callButton: {
    backgroundColor: theme.colors.primary,
    gap: theme.spacing.sm,
  },
  callButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.white,
  },
  continueButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 0,
    borderColor: theme.colors.border,
  },
  continueButtonText: {
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


