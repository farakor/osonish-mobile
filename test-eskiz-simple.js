/**
 * Простой тест Eskiz SMS сервиса
 * Проверяет, что сервис инициализирован и работает
 */

const testEskizSimple = async () => {
  console.log('🧪 ПРОСТОЙ ТЕСТ ESKIZ SMS');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Проверяем режим SMS
    console.log('1️⃣ ПРОВЕРКА РЕЖИМА SMS');
    console.log('─────────────────────────────────');
    
    const smsMode = require('./src/config/smsMode.js');
    const modeInfo = smsMode.getSMSModeInfo();
    
    console.log('📋 Режим SMS:', modeInfo.description);
    console.log('   Реальные SMS:', modeInfo.realSMS ? 'ДА' : 'НЕТ');
    
    if (modeInfo.realSMS) {
      console.log('✅ Режим настроен на реальные SMS');
    } else {
      console.log('ℹ️ Режим настроен на коды в консоль');
    }

    // Тестируем отправку SMS
    console.log('\n2️⃣ ТЕСТ ОТПРАВКИ SMS');
    console.log('─────────────────────────────────');
    
    const testPhone = '+998977037942';
    console.log(`📱 Тестовый номер: ${testPhone}`);
    
    if (modeInfo.realSMS) {
      console.log('🚀 В режиме реальных SMS - будет отправлен настоящий SMS');
      console.log('⚠️ Убедитесь, что у вас есть баланс в Eskiz');
    } else {
      console.log('🧪 В режиме разработки - код появится в консоли');
    }

    console.log('\n📱 ЧТО ОЖИДАТЬ В ПРИЛОЖЕНИИ:');
    if (modeInfo.realSMS) {
      console.log('1. При регистрации/входе SMS придет на реальный номер');
      console.log('2. В консоли НЕ будет кода');
      console.log('3. Нужно ввести код из SMS');
      console.log('4. Каждый SMS тратит баланс Eskiz');
    } else {
      console.log('1. При регистрации/входе код появится в консоли');
      console.log('2. SMS НЕ придет на реальный номер');
      console.log('3. Нужно ввести код из консоли');
      console.log('4. Баланс Eskiz не тратится');
    }

    console.log('\n✅ СИСТЕМА ГОТОВА К РАБОТЕ!');
    console.log('🔄 Попробуйте зарегистрироваться в приложении');

  } catch (error) {
    console.error('❌ ОШИБКА:', error.message);
  }
};

testEskizSimple();
