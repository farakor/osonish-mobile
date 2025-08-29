/**
 * Тест режима SMS в контексте приложения
 * Проверяет, как работает логика переключения режимов
 */

// Имитируем окружение React Native
global.__DEV__ = true;

const testAppSMSMode = async () => {
  console.log('🧪 ТЕСТ РЕЖИМА SMS В ПРИЛОЖЕНИИ');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Импортируем модуль режима SMS
    const smsMode = require('./src/config/smsMode');
    
    console.log('📋 ИНФОРМАЦИЯ О РЕЖИМЕ:');
    const modeInfo = smsMode.getSMSModeInfo();
    console.log('Режим:', modeInfo.mode);
    console.log('Описание:', modeInfo.description);
    console.log('Реальные SMS:', modeInfo.realSMS ? 'ДА' : 'НЕТ');
    console.log('Dev сборка:', modeInfo.isDev ? 'ДА' : 'НЕТ');
    console.log('Принудительный продакшн:', modeInfo.forceProduction ? 'ДА' : 'НЕТ');

    console.log('\n🔍 ПРОВЕРКА ЛОГИКИ:');
    const shouldSend = smsMode.shouldSendRealSMS();
    console.log('Должны отправляться реальные SMS:', shouldSend ? 'ДА' : 'НЕТ');

    if (shouldSend) {
      console.log('\n🚀 РЕЖИМ: РЕАЛЬНЫЕ SMS');
      console.log('✅ SMS будут отправляться через Eskiz.uz');
      console.log('✅ Коды НЕ будут выводиться в консоль');
      console.log('⚠️ Каждый SMS тратит баланс');
    } else {
      console.log('\n🧪 РЕЖИМ: РАЗРАБОТКА');
      console.log('✅ SMS коды будут выводиться в консоль');
      console.log('✅ Реальные SMS НЕ отправляются');
      console.log('✅ Баланс не тратится');
    }

    console.log('\n📱 ЧТО ОЖИДАТЬ В ПРИЛОЖЕНИИ:');
    if (shouldSend) {
      console.log('1. При регистрации/входе SMS придет на реальный номер');
      console.log('2. В консоли НЕ будет кода');
      console.log('3. Нужно ввести код из SMS');
    } else {
      console.log('1. При регистрации/входе код появится в консоли');
      console.log('2. SMS НЕ придет на реальный номер');
      console.log('3. Нужно ввести код из консоли');
    }

    // Тестируем импорт в EskizSMSService
    console.log('\n🔧 ТЕСТ ИМПОРТА В ESKIZ SERVICE:');
    try {
      const eskizModule = require('./src/services/eskizSMSService');
      console.log('✅ EskizSMSService импортирован успешно');
      
      // Проверяем, что функция shouldSendRealSMS доступна
      const { shouldSendRealSMS } = require('./src/config/smsMode');
      console.log('✅ Функция shouldSendRealSMS доступна');
      console.log('📋 Результат shouldSendRealSMS():', shouldSendRealSMS());
      
    } catch (error) {
      console.error('❌ Ошибка импорта:', error.message);
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
    console.error('📋 Stack:', error.stack);
  }
};

testAppSMSMode();
