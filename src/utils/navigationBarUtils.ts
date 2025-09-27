import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

/**
 * Утилиты для управления Android Navigation Bar
 * Обновлено для совместимости с Edge-to-Edge режимом Android 15+
 */

/**
 * Проверяет, поддерживается ли Edge-to-Edge режим
 */
const isEdgeToEdgeSupported = (): boolean => {
  return Platform.OS === 'android' && Platform.Version >= 28; // Android 9.0+
};

/**
 * Настраивает navigation bar для Edge-to-Edge режима
 * В Edge-to-Edge режиме setBackgroundColorAsync не поддерживается
 */
export const setupTransparentNavigationBar = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    if (isEdgeToEdgeSupported()) {
      // В Edge-to-Edge режиме navigation bar автоматически прозрачный
      // Используем только настройку стиля
      await NavigationBar.setVisibilityAsync('visible');
      console.log('[NavigationBar] ✅ Edge-to-Edge режим: navigation bar настроен автоматически');
    } else {
      // Для старых версий Android используем прозрачный фон
      await NavigationBar.setBackgroundColorAsync('transparent');
      console.log('[NavigationBar] ✅ Navigation bar установлен как прозрачный (legacy режим)');
    }
  } catch (error) {
    console.warn('[NavigationBar] ⚠️ Настройка navigation bar пропущена (Edge-to-Edge режим):', error.message);
  }
};

/**
 * Устанавливает цвет navigation bar с поддержкой Edge-to-Edge
 */
export const setNavigationBarColor = async (color: string, light: boolean = true): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    if (isEdgeToEdgeSupported()) {
      // В Edge-to-Edge режиме цвет navigation bar управляется системой
      console.log(`[NavigationBar] ℹ️ Edge-to-Edge режим: цвет navigation bar управляется системой`);
      return;
    }

    // Для старых версий Android устанавливаем цвет
    await NavigationBar.setBackgroundColorAsync(color);
    console.log(`[NavigationBar] ✅ Navigation bar цвет установлен: ${color} (legacy режим)`);
  } catch (error) {
    console.warn(`[NavigationBar] ⚠️ Установка цвета navigation bar пропущена (Edge-to-Edge режим):`, error.message);
  }
};

/**
 * Скрывает navigation bar (для полноэкранного режима)
 */
export const hideNavigationBar = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await NavigationBar.setVisibilityAsync('hidden');
    console.log('[NavigationBar] ✅ Navigation bar скрыт');
  } catch (error) {
    console.error('[NavigationBar] ❌ Ошибка скрытия navigation bar:', error);
  }
};

/**
 * Показывает navigation bar
 */
export const showNavigationBar = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await NavigationBar.setVisibilityAsync('visible');
    console.log('[NavigationBar] ✅ Navigation bar показан');
  } catch (error) {
    console.error('[NavigationBar] ❌ Ошибка показа navigation bar:', error);
  }
};
