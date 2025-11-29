import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService } from '../services/authService';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UseRequireAuthReturn {
  isAuthModalVisible: boolean;
  showAuthModal: () => void;
  hideAuthModal: () => void;
  requireAuth: (action: () => void | Promise<void>) => Promise<void>;
  checkAuth: () => boolean;
}

/**
 * Hook для проверки авторизации перед выполнением защищенных действий
 * 
 * @example
 * const { requireAuth, isAuthModalVisible, hideAuthModal } = useRequireAuth();
 * 
 * const handleCreateOrder = async () => {
 *   await requireAuth(async () => {
 *     // Защищенное действие - создание заказа
 *     await createOrder();
 *   });
 * };
 */
export function useRequireAuth(): UseRequireAuthReturn {
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void | Promise<void>) | null>(null);
  const navigation = useNavigation<NavigationProp>();

  /**
   * Проверяет, авторизован ли пользователь
   */
  const checkAuth = useCallback((): boolean => {
    const authState = authService.getAuthState();
    return authState.isAuthenticated && !!authState.user;
  }, []);

  /**
   * Показывает модальное окно авторизации
   */
  const showAuthModal = useCallback(() => {
    console.log('[useRequireAuth] 📱 Показываем модальное окно авторизации');
    setIsAuthModalVisible(true);
  }, []);

  /**
   * Скрывает модальное окно авторизации
   */
  const hideAuthModal = useCallback(() => {
    console.log('[useRequireAuth] 📱 Скрываем модальное окно авторизации');
    setIsAuthModalVisible(false);
    setPendingAction(null);
  }, []);

  /**
   * Требует авторизацию перед выполнением действия
   * Если пользователь не авторизован, показывает модальное окно
   * После успешной авторизации выполняет отложенное действие
   */
  const requireAuth = useCallback(async (action: () => void | Promise<void>) => {
    console.log('[useRequireAuth] 🔍 Проверяем авторизацию перед выполнением действия');
    
    if (checkAuth()) {
      // Пользователь уже авторизован, выполняем действие
      console.log('[useRequireAuth] ✅ Пользователь авторизован, выполняем действие');
      await action();
    } else {
      // Пользователь не авторизован, показываем модальное окно
      console.log('[useRequireAuth] ❌ Пользователь не авторизован, показываем модальное окно');
      setPendingAction(() => action);
      showAuthModal();
    }
  }, [checkAuth, showAuthModal]);

  /**
   * Переход на экран авторизации
   */
  const navigateToAuth = useCallback(() => {
    hideAuthModal();
    navigation.navigate('Auth');
  }, [hideAuthModal, navigation]);

  /**
   * Переход на экран регистрации
   */
  const navigateToRegistration = useCallback(() => {
    hideAuthModal();
    navigation.navigate('Registration');
  }, [hideAuthModal, navigation]);

  return {
    isAuthModalVisible,
    showAuthModal,
    hideAuthModal,
    requireAuth,
    checkAuth,
  };
}




















