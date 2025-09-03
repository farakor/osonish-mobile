import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isDeleting,
  title,
  message,
  confirmText,
  cancelText,
}) => {
  // Не рендерим модальное окно если нет заголовка или сообщения
  if (!title || !message || !confirmText || !cancelText) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isDeleting}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0, },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 0, borderColor: theme.colors.border,
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  confirmButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: '#FFFFFF',
  },
});
