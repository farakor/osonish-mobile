import React from 'react';
import { Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet, StatusBar,
  Platform,
  Dimensions, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { theme } from '../../constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

interface TestModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TestModal: React.FC<TestModalProps> = ({
  visible,
  onClose,
}) => {
  React.useEffect(() => {
    if (visible) {
      console.log('🧪 TestModal opened:', {
        screenHeight,
        screenWidth,
        isSmallScreen,
        statusBarHeight: StatusBar.currentHeight,
      });
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={false}
      hardwareAccelerated={true}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FF0000" />

        <View style={styles.content}>
          <Text style={styles.title}>Тестовое модальное окно</Text>
          <Text style={styles.subtitle}>
            Размер экрана: {screenWidth}x{screenHeight}
          </Text>
          <Text style={styles.subtitle}>
            Маленький экран: {isSmallScreen ? 'Да' : 'Нет'}
          </Text>
          <Text style={styles.subtitle}>
            Статус-бар: {StatusBar.currentHeight || 'Неизвестно'}px
          </Text>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF0000', // Красный фон для видимости
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
  },
  content: {
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    margin: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
});
