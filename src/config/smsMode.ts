/**
 * Конфигурация режима SMS для мобильного приложения
 * Простое переключение между dev и production режимами
 */

// 🔧 НАСТРОЙКА РЕЖИМА SMS
// Измените эту переменную для переключения режимов:
// true = реальные SMS через Eskiz.uz
// false = коды в консоль (режим разработки)
export const FORCE_PRODUCTION_SMS = true;

/**
 * Определяет, должны ли отправляться реальные SMS
 */
export const shouldSendRealSMS = (): boolean => {
  // В продакшн сборке всегда отправляем реальные SMS
  if (!__DEV__) {
    return true;
  }

  // В dev сборке проверяем флаг принудительного включения
  return FORCE_PRODUCTION_SMS;
};

/**
 * Получение информации о текущем режиме
 */
export const getSMSModeInfo = () => {
  const realSMS = shouldSendRealSMS();

  return {
    mode: realSMS ? 'production' : 'development',
    realSMS,
    description: realSMS
      ? 'Реальные SMS через Eskiz.uz'
      : 'Коды в консоль (разработка)',
    isDev: __DEV__,
    forceProduction: FORCE_PRODUCTION_SMS
  };
};

// Логируем текущий режим при загрузке модуля
if (__DEV__) {
  const modeInfo = getSMSModeInfo();
  console.log('[SMSMode] 🔧 Режим SMS:', modeInfo.description);
  console.log('[SMSMode] 📋 Настройки:', {
    isDev: modeInfo.isDev,
    forceProduction: modeInfo.forceProduction,
    realSMS: modeInfo.realSMS
  });
}
