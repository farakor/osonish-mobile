import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';
import { theme } from '../../constants';
import type { RootStackParamList } from '../../types';
import { useTranslation } from 'react-i18next';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AuthRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

/**
 * Bottom Sheet модальное окно, которое появляется когда гостевой пользователь
 * пытается выполнить действие, требующее авторизации
 */
export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  visible,
  onClose,
  message,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible) {
      // Анимация появления снизу
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      // Запускаем Lottie анимацию
      lottieRef.current?.play();
    } else {
      // Анимация исчезновения вниз
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleLogin = () => {
    onClose();
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    onClose();
    navigation.navigate('Registration');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            {/* Handle (полоска сверху для свайпа) */}
            <View style={styles.handle} />

            <View style={styles.content}>
              {/* Иконка */}
              <View style={styles.iconContainer}>
                <LottieView
                  ref={lottieRef}
                  source={require('../../../assets/login.json')}
                  style={styles.lottieAnimation}
                  loop={true}
                  autoPlay={false}
                />
              </View>

              {/* Заголовок */}
              <Text style={styles.title}>
                {t('auth.auth_required_title', 'Требуется авторизация')}
              </Text>

              {/* Сообщение */}
              <Text style={styles.message}>
                {message || t('auth.auth_required_message', 'Для выполнения этого действия необходимо войти в систему или зарегистрироваться')}
              </Text>

              {/* Кнопки */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleRegister}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>
                    {t('auth.register', 'Регистрация')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>
                    {t('auth.login', 'Войти')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    minHeight: screenHeight * 0.4, // 40% экрана минимум
    maxHeight: screenHeight * 0.6, // 60% экрана максимум
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.white,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});

