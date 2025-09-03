import { Platform, StatusBar } from 'react-native';

// Безопасный импорт библиотеки
let NavigationBar: any = null;
try {
  // Пробуем разные способы импорта
  const navigationBarModule = require('react-native-navigation-bar-color');
  NavigationBar = navigationBarModule.default || navigationBarModule;

  // Если это именованный экспорт
  if (!NavigationBar && navigationBarModule.setNavigationBarColor) {
    NavigationBar = navigationBarModule;
  }
} catch (error) {
  console.warn('[NavigationBar] ⚠️ Библиотека react-native-navigation-bar-color не найдена или не совместима:', error);
}

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

  if (!NavigationBar || typeof NavigationBar.setNavigationBarColor !== 'function') {
    console.warn('[NavigationBar] ⚠️ setNavigationBarColor недоступен, используем fallback');
    // Fallback: используем StatusBar API для базовой настройки
    try {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent', true);
      console.log('[NavigationBar] ✅ Использован fallback через StatusBar API');
    } catch (fallbackError) {
      console.error('[NavigationBar] ❌ Fallback также не работает:', fallbackError);
    }
    return;
  }

  try {
    // Делаем navigation bar прозрачным
    await NavigationBar.setNavigationBarColor('transparent', true, true);
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

  if (!NavigationBar || typeof NavigationBar.setNavigationBarColor !== 'function') {
    console.warn('[NavigationBar] ⚠️ setNavigationBarColor недоступен, используем fallback');
    // Fallback: используем StatusBar API
    try {
      if (color === 'transparent') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor('transparent', true);
      } else {
        StatusBar.setBackgroundColor(color, light);
      }
      console.log(`[NavigationBar] ✅ Использован fallback через StatusBar API: ${color}`);
    } catch (fallbackError) {
      console.error('[NavigationBar] ❌ Fallback также не работает:', fallbackError);
    }
    return;
  }

  try {
    await NavigationBar.setNavigationBarColor(color, light, true);
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

  if (!NavigationBar || typeof NavigationBar.hideNavigationBar !== 'function') {
    console.warn('[NavigationBar] ⚠️ hideNavigationBar недоступен');
    return;
  }

  try {
    await NavigationBar.hideNavigationBar();
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

  if (!NavigationBar || typeof NavigationBar.showNavigationBar !== 'function') {
    console.warn('[NavigationBar] ⚠️ showNavigationBar недоступен');
    return;
  }

  try {
    await NavigationBar.showNavigationBar();
    console.log('[NavigationBar] ✅ Navigation bar показан');
  } catch (error) {
    console.error('[NavigationBar] ❌ Ошибка показа navigation bar:', error);
  }
};
