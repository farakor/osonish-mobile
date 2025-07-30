import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
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
    onClose();
  };

  const handleClose = () => {
    // Сбрасываем значения при закрытии
    setProposedPrice(originalPrice);
    setMessage('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Отправить предложение</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
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
                  style={styles.priceButton}
                  onPress={decreasePrice}
                  disabled={proposedPrice <= 50000}
                >
                  <Text style={[
                    styles.priceButtonText,
                    proposedPrice <= 50000 && styles.disabledButton
                  ]}>−</Text>
                </TouchableOpacity>

                <View style={styles.priceDisplay}>
                  <Text style={styles.priceText}>
                    {formatPrice(proposedPrice)}
                  </Text>
                  <Text style={styles.currencyText}>сум</Text>
                </View>

                <TouchableOpacity
                  style={styles.priceButton}
                  onPress={increasePrice}
                >
                  <Text style={styles.priceButtonText}>+</Text>
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
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Откликнуться</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
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
}); 