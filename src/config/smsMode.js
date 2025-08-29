/**
 * Конфигурация режима SMS для мобильного приложения (JavaScript версия)
 * Простое переключение между dev и production режимами
 */

// 🔧 НАСТРОЙКА РЕЖИМА SMS
// Измените эту переменную для переключения режимов:
// true = реальные SMS через Eskiz.uz
// false = коды в консоль (режим разработки)
const FORCE_PRODUCTION_SMS = true;

/**
 * Определяет, должны ли отправляться реальные SMS
 */
const shouldSendRealSMS = () => {
  // В продакшн сборке всегда отправляем реальные SMS
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return true;
  }

  // В dev сборке проверяем флаг принудительного включения
  return FORCE_PRODUCTION_SMS;
};

/**
 * Получение информации о текущем режиме
 */
const getSMSModeInfo = () => {
  const realSMS = shouldSendRealSMS();
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
  
  return {
    mode: realSMS ? 'production' : 'development',
    realSMS,
    description: realSMS 
      ? 'Реальные SMS через Eskiz.uz' 
      : 'Коды в консоль (разработка)',
    isDev,
    forceProduction: FORCE_PRODUCTION_SMS
  };
};

// Логируем текущий режим при загрузке модуля
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  const modeInfo = getSMSModeInfo();
  console.log('[SMSMode] 🔧 Режим SMS:', modeInfo.description);
  console.log('[SMSMode] 📋 Настройки:', {
    isDev: modeInfo.isDev,
    forceProduction: modeInfo.forceProduction,
    realSMS: modeInfo.realSMS
  });
}

module.exports = {
  FORCE_PRODUCTION_SMS,
  shouldSendRealSMS,
  getSMSModeInfo
};
