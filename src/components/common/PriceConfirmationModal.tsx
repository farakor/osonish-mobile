import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { theme } from '../../constants/theme';

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
  const formatPrice = (price: number) => {
    return price.toLocaleString('uz-UZ');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Подтверждение отклика</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Order info */}
            <View style={styles.orderInfo}>
              <Text style={styles.orderTitle} numberOfLines={2}>
                {orderTitle}
              </Text>
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
                style={[styles.button, styles.acceptButton]}
                onPress={onAcceptPrice}
              >
                <Text style={styles.acceptButtonText}>Согласен</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.proposeButton]}
                onPress={onProposePrice}
              >
                <Text style={styles.proposeButtonText}>Предложить свою цену</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
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
    paddingBottom: theme.spacing.xl,
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
}); 