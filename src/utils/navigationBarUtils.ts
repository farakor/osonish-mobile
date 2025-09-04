import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

/**
 * Утилиты для управления Android Navigation Bar
 */

/**
 * Настраивает прозрачный navigation bar для Android
 */
export const setupTransparentNavigationBar = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    // Делаем navigation bar прозрачным
    await NavigationBar.setBackgroundColorAsync('transparent');
    console.log('[NavigationBar] ✅ Navigation bar установлен как прозрачный');
  } catch (error) {
    console.error('[NavigationBar] ❌ Ошибка настройки navigation bar:', error);
  }
};

/**
 * Устанавливает цвет navigation bar
 */
export const setNavigationBarColor = async (color: string, light: boolean = true): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await NavigationBar.setBackgroundColorAsync(color);
    console.log(`[NavigationBar] ✅ Navigation bar цвет установлен: ${color}`);
  } catch (error) {
    console.error('[NavigationBar] ❌ Ошибка установки цвета navigation bar:', error);
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
