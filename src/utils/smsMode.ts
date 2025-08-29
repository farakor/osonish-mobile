/**
 * Утилита для управления режимами SMS отправки
 * Позволяет переключаться между dev и production режимами
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SMS_MODE_KEY = '@osonish_sms_mode';

export type SMSMode = 'development' | 'production';

interface SMSModeConfig {
  mode: SMSMode;
  forceProduction: boolean; // Принудительно включить продакшн даже в __DEV__
  allowRealSMS: boolean; // Разрешить реальную отправку SMS
}

class SMSModeManager {
  private currentConfig: SMSModeConfig = {
    mode: 'development',
    forceProduction: false,
    allowRealSMS: false
  };

  /**
   * Инициализация менеджера режимов
   */
  async init(): Promise<void> {
    try {
      const savedConfig = await AsyncStorage.getItem(SMS_MODE_KEY);

      if (savedConfig) {
        this.currentConfig = { ...this.currentConfig, ...JSON.parse(savedConfig) };
      }

      // В режиме разработки по умолчанию отключаем реальные SMS
      if (__DEV__ && !this.currentConfig.forceProduction) {
        this.currentConfig.mode = 'development';
        this.currentConfig.allowRealSMS = false;
      }

      console.log('[SMSMode] 🔧 Текущий режим SMS:', this.currentConfig);
    } catch (error) {
      console.error('[SMSMode] ❌ Ошибка инициализации режима SMS:', error);
    }
  }

  /**
   * Получение текущего режима
   */
  getCurrentMode(): SMSMode {
    return this.currentConfig.mode;
  }

  /**
   * Проверка, разрешена ли реальная отправка SMS
   */
  isRealSMSAllowed(): boolean {
    // В продакшене всегда разрешено
    if (!__DEV__) {
      return true;
    }

    // В разработке только если явно разрешено
    return this.currentConfig.allowRealSMS || this.currentConfig.forceProduction;
  }

  /**
   * Установка режима SMS
   */
  async setMode(mode: SMSMode, allowRealSMS: boolean = false): Promise<void> {
    try {
      this.currentConfig.mode = mode;
      this.currentConfig.allowRealSMS = allowRealSMS;

      if (mode === 'production') {
        this.currentConfig.forceProduction = true;
      }

      await AsyncStorage.setItem(SMS_MODE_KEY, JSON.stringify(this.currentConfig));

      console.log('[SMSMode] ✅ Режим SMS изменен:', {
        mode: this.currentConfig.mode,
        allowRealSMS: this.currentConfig.allowRealSMS,
        isDev: __DEV__
      });
    } catch (error) {
      console.error('[SMSMode] ❌ Ошибка сохранения режима SMS:', error);
    }
  }

  /**
   * Включение продакшн режима (реальные SMS)
   */
  async enableProductionMode(): Promise<void> {
    await this.setMode('production', true);
    console.log('[SMSMode] 🚀 Включен продакшн режим - реальные SMS будут отправляться!');
  }

  /**
   * Включение режима разработки (коды в консоль)
   */
  async enableDevelopmentMode(): Promise<void> {
    await this.setMode('development', false);
    console.log('[SMSMode] 🧪 Включен режим разработки - коды будут выводиться в консоль');
  }

  /**
   * Получение конфигурации для отображения в UI
   */
  getDisplayConfig() {
    return {
      currentMode: this.currentConfig.mode,
      isRealSMSEnabled: this.isRealSMSAllowed(),
      isDevelopmentBuild: __DEV__,
      canSwitchModes: __DEV__, // Переключение режимов только в dev сборке
      status: this.isRealSMSAllowed() ? 'Реальные SMS' : 'Тестовые коды'
    };
  }

  /**
   * Сброс настроек к значениям по умолчанию
   */
  async resetToDefault(): Promise<void> {
    await AsyncStorage.removeItem(SMS_MODE_KEY);

    this.currentConfig = {
      mode: __DEV__ ? 'development' : 'production',
      forceProduction: false,
      allowRealSMS: !__DEV__
    };

    console.log('[SMSMode] 🔄 Настройки SMS сброшены к значениям по умолчанию');
  }

  /**
   * Получение предупреждений о текущем режиме
   */
  getWarnings(): string[] {
    const warnings: string[] = [];

    if (__DEV__ && this.isRealSMSAllowed()) {
      warnings.push('⚠️ В режиме разработки включена отправка реальных SMS');
    }

    if (!__DEV__ && this.currentConfig.mode === 'development') {
      warnings.push('⚠️ В продакшн сборке установлен режим разработки');
    }

    return warnings;
  }
}

// Экспортируем синглтон
export const smsModeManager = new SMSModeManager();

// Утилитарные функции
export const initSMSMode = () => smsModeManager.init();
export const getCurrentSMSMode = () => smsModeManager.getCurrentMode();
export const isRealSMSEnabled = () => smsModeManager.isRealSMSAllowed();
export const enableProductionSMS = () => smsModeManager.enableProductionMode();
export const enableDevelopmentSMS = () => smsModeManager.enableDevelopmentMode();
export const getSMSModeStatus = () => smsModeManager.getDisplayConfig();
