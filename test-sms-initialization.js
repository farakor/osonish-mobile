/**
 * Тест инициализации SMS сервисов
 * Проверяет, что все сервисы инициализируются правильно
 */

// Имитируем окружение React Native
global.__DEV__ = true;

const testSMSInitialization = async () => {
  console.log('🧪 ТЕСТ ИНИЦИАЛИЗАЦИИ SMS СЕРВИСОВ');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Тестируем конфигурацию
    console.log('1️⃣ ТЕСТ КОНФИГУРАЦИИ');
    console.log('─────────────────────────────────');
    
    const { smsConfig, validateSMSConfig } = require('./src/config/smsConfig.js');
    
    console.log('📋 Конфигурация SMS:');
    console.log('   Провайдер:', smsConfig.provider);
    console.log('   Отправитель:', smsConfig.senderName);
    console.log('   Eskiz email:', smsConfig.eskiz?.email);
    console.log('   Eskiz настроен:', !!smsConfig.eskiz?.email);

    const validation = validateSMSConfig();
    console.log('✅ Валидация:', validation.isValid ? 'ПРОШЛА' : 'НЕ ПРОШЛА');
    if (!validation.isValid) {
      console.log('❌ Ошибки:', validation.errors);
    }

    // 2. Тестируем режим SMS
    console.log('\n2️⃣ ТЕСТ РЕЖИМА SMS');
    console.log('─────────────────────────────────');
    
    const smsMode = require('./src/config/smsMode.js');
    const modeInfo = smsMode.getSMSModeInfo();
    
    console.log('📋 Режим SMS:', modeInfo.description);
    console.log('   Реальные SMS:', modeInfo.realSMS ? 'ДА' : 'НЕТ');
    console.log('   Dev сборка:', modeInfo.isDev ? 'ДА' : 'НЕТ');

    // 3. Тестируем инициализацию
    console.log('\n3️⃣ ТЕСТ ИНИЦИАЛИЗАЦИИ');
    console.log('─────────────────────────────────');
    
    const { initializeSMSServices } = require('./src/services/smsServiceInitializer.ts');
    
    console.log('🚀 Запуск инициализации SMS сервисов...');
    const result = await initializeSMSServices();
    
    if (result.success) {
      console.log('✅ Инициализация успешна!');
    } else {
      console.log('❌ Ошибка инициализации:', result.error);
    }

    // 4. Тестируем EskizSMSService
    console.log('\n4️⃣ ТЕСТ ESKIZ SMS SERVICE');
    console.log('─────────────────────────────────');
    
    const { eskizSMSService } = require('./src/services/eskizSMSService.ts');
    
    // Проверяем статус сервиса
    const statusCheck = await eskizSMSService.checkServiceStatus();
    
    console.log('📊 Статус сервиса:');
    console.log('   Успех:', statusCheck.success ? 'ДА' : 'НЕТ');
    console.log('   Аутентифицирован:', statusCheck.authenticated ? 'ДА' : 'НЕТ');
    console.log('   Баланс:', statusCheck.balance || 'неизвестно');
    
    if (statusCheck.error) {
      console.log('   Ошибка:', statusCheck.error);
    }

    // 5. Итоговый статус
    console.log('\n📊 ИТОГОВЫЙ СТАТУС');
    console.log('═══════════════════════════════════════════════════════════');
    
    const allGood = validation.isValid && result.success && statusCheck.success;
    
    if (allGood) {
      console.log('🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!');
      console.log('✅ Конфигурация валидна');
      console.log('✅ Сервисы инициализированы');
      console.log('✅ Eskiz подключение работает');
      console.log('📱 Приложение готово отправлять SMS');
    } else {
      console.log('⚠️ ЕСТЬ ПРОБЛЕМЫ:');
      if (!validation.isValid) {
        console.log('❌ Проблемы с конфигурацией');
      }
      if (!result.success) {
        console.log('❌ Ошибка инициализации сервисов');
      }
      if (!statusCheck.success) {
        console.log('❌ Проблемы с Eskiz подключением');
      }
    }

  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
    console.error('📋 Stack:', error.stack);
  }
};

testSMSInitialization();
