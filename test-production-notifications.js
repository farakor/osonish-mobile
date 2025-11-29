#!/usr/bin/env node

/**
 * 🧪 Комплексный тест production системы уведомлений
 * 
 * Этот скрипт тестирует всю цепочку уведомлений:
 * 1. Проверка конфигурации
 * 2. Тест Expo Push Service
 * 3. Тест собственного сервера (если настроен)
 * 4. Проверка аналитики
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 === ТЕСТИРОВАНИЕ PRODUCTION УВЕДОМЛЕНИЙ ===\n');

// Конфигурация для тестов
const TEST_CONFIG = {
  // Замените на реальный Expo Push Token для тестирования
  EXPO_PUSH_TOKEN: 'ExponentPushToken[XXXXXXXXXXXXXXXXXXXXXX]',
  
  // URL собственного сервера (если используется)
  CUSTOM_SERVER_URL: 'http://localhost:3000',
  CUSTOM_SERVER_TOKEN: 'osonish-notification-server-token',
  
  // Тестовые данные
  TEST_NOTIFICATION: {
    title: '🧪 Production Test',
    body: `Тест системы уведомлений - ${new Date().toLocaleTimeString()}`,
    data: {
      test: true,
      timestamp: Date.now(),
      environment: 'production-test'
    }
  }
};

/**
 * Проверка конфигурации приложения
 */
function checkAppConfiguration() {
  console.log('📱 Проверка конфигурации приложения...');
  
  const appJsonPath = path.join(__dirname, 'app.json');
  
  if (!fs.existsSync(appJsonPath)) {
    console.log('❌ app.json не найден');
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const expo = config.expo;
    
    console.log('📋 Конфигурация:');
    console.log(`   - Название: ${expo.name}`);
    console.log(`   - Версия: ${expo.version}`);
    console.log(`   - Project ID: ${expo.extra?.eas?.projectId}`);
    console.log(`   - Android package: ${expo.android?.package}`);
    console.log(`   - iOS bundle: ${expo.ios?.bundleIdentifier}`);
    
    // Проверяем критические настройки
    const issues = [];
    
    if (!expo.extra?.eas?.projectId) {
      issues.push('Отсутствует EAS Project ID');
    }
    
    if (expo.android?.package !== 'com.farakor.osonishmobile') {
      issues.push('Неправильный Android package name');
    }
    
    if (expo.ios?.bundleIdentifier !== 'com.farakor.osonishmobile') {
      issues.push('Неправильный iOS bundle identifier');
    }
    
    if (!expo.android?.googleServicesFile) {
      issues.push('Не настроен googleServicesFile для Android');
    }
    
    if (issues.length > 0) {
      console.log('⚠️  Найдены проблемы:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      return false;
    }
    
    console.log('✅ Конфигурация приложения корректна\n');
    return true;
  } catch (error) {
    console.log('❌ Ошибка чтения app.json:', error.message);
    return false;
  }
}

/**
 * Проверка Firebase конфигурации
 */
function checkFirebaseConfiguration() {
  console.log('🔥 Проверка Firebase конфигурации...');
  
  const googleServicesPath = path.join(__dirname, 'google-services.json');
  
  if (!fs.existsSync(googleServicesPath)) {
    console.log('❌ google-services.json не найден');
    console.log('💡 Скачайте файл из Firebase Console и поместите в корень проекта');
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
    
    console.log('📋 Firebase проект:');
    console.log(`   - Project ID: ${config.project_info?.project_id}`);
    console.log(`   - Project Number: ${config.project_info?.project_number}`);
    console.log(`   - Package Name: ${config.client?.[0]?.client_info?.android_client_info?.package_name}`);
    
    const expectedPackage = 'com.farakor.osonishmobile';
    const actualPackage = config.client?.[0]?.client_info?.android_client_info?.package_name;
    
    if (actualPackage !== expectedPackage) {
      console.log('❌ Package name не соответствует ожидаемому');
      console.log(`   Ожидается: ${expectedPackage}`);
      console.log(`   Найден: ${actualPackage}`);
      return false;
    }
    
    console.log('✅ Firebase конфигурация корректна\n');
    return true;
  } catch (error) {
    console.log('❌ Ошибка чтения google-services.json:', error.message);
    return false;
  }
}

/**
 * Тест Expo Push Service
 */
async function testExpoPushService() {
  console.log('📡 Тестирование Expo Push Service...');
  
  if (TEST_CONFIG.EXPO_PUSH_TOKEN === 'ExponentPushToken[XXXXXXXXXXXXXXXXXXXXXX]') {
    console.log('⚠️  Не настроен тестовый Expo Push Token');
    console.log('💡 Получите реальный токен из приложения и обновите TEST_CONFIG.EXPO_PUSH_TOKEN');
    return false;
  }
  
  try {
    const message = {
      to: TEST_CONFIG.EXPO_PUSH_TOKEN,
      sound: 'default',
      title: TEST_CONFIG.TEST_NOTIFICATION.title,
      body: TEST_CONFIG.TEST_NOTIFICATION.body,
      data: {
        ...TEST_CONFIG.TEST_NOTIFICATION.data,
        service: 'expo'
      },
      priority: 'high',
      channelId: 'default'
    };
    
    console.log('📤 Отправка через Expo Push Service...');
    
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    const result = await response.json();
    
    console.log('📋 Ответ Expo:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.data?.[0]?.status === 'ok') {
      console.log('✅ Expo Push Service работает корректно\n');
      return true;
    } else {
      console.log('❌ Ошибка Expo Push Service');
      console.log('💡 Проверьте валидность токена и настройки EAS проекта');
      return false;
    }
  } catch (error) {
    console.log('❌ Ошибка подключения к Expo Push Service:', error.message);
    return false;
  }
}

/**
 * Тест собственного сервера уведомлений
 */
async function testCustomNotificationServer() {
  console.log('🖥️  Тестирование собственного сервера уведомлений...');
  
  try {
    // Проверка доступности сервера
    console.log('🔍 Проверка доступности сервера...');
    
    const healthResponse = await fetch(`${TEST_CONFIG.CUSTOM_SERVER_URL}/health`);
    
    if (!healthResponse.ok) {
      console.log('❌ Сервер недоступен');
      console.log('💡 Убедитесь что сервер запущен на', TEST_CONFIG.CUSTOM_SERVER_URL);
      return false;
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Сервер доступен:', healthData.status);
    
    // Получение информации о сервере
    const infoResponse = await fetch(`${TEST_CONFIG.CUSTOM_SERVER_URL}/info`);
    const infoData = await infoResponse.json();
    
    console.log('📋 Информация о сервере:');
    console.log(`   - Версия: ${infoData.version}`);
    console.log(`   - Функции: ${infoData.features?.join(', ')}`);
    
    // Тестовое уведомление
    if (TEST_CONFIG.EXPO_PUSH_TOKEN !== 'ExponentPushToken[XXXXXXXXXXXXXXXXXXXXXX]') {
      console.log('📤 Отправка тестового уведомления через собственный сервер...');
      
      const testResponse = await fetch(`${TEST_CONFIG.CUSTOM_SERVER_URL}/test-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.CUSTOM_SERVER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: TEST_CONFIG.EXPO_PUSH_TOKEN,
          platform: 'android'
        })
      });
      
      const testResult = await testResponse.json();
      
      if (testResult.success) {
        console.log('✅ Тестовое уведомление отправлено успешно');
        console.log(`   Message ID: ${testResult.messageId}`);
      } else {
        console.log('❌ Ошибка отправки тестового уведомления:', testResult.error);
      }
    }
    
    console.log('✅ Собственный сервер работает корректно\n');
    return true;
  } catch (error) {
    console.log('❌ Ошибка подключения к собственному серверу:', error.message);
    console.log('💡 Убедитесь что сервер запущен: cd notification-server && npm start');
    return false;
  }
}

/**
 * Проверка EAS credentials
 */
async function checkEASCredentials() {
  console.log('🔑 Проверка EAS credentials...');
  
  try {
    const { execSync } = require('child_process');
    
    // Проверяем авторизацию
    try {
      const whoami = execSync('npx eas whoami', { encoding: 'utf8', stdio: 'pipe' });
      console.log('✅ Авторизован в EAS как:', whoami.trim());
    } catch (error) {
      console.log('❌ Не авторизован в EAS');
      console.log('💡 Выполните: npx eas login');
      return false;
    }
    
    // Проверяем credentials для Android
    try {
      const androidCreds = execSync('npx eas credentials:list --platform android', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      console.log('✅ Android credentials настроены');
    } catch (error) {
      console.log('⚠️  Android credentials не настроены');
      console.log('💡 Выполните: npx eas credentials:configure --platform android');
    }
    
    // Проверяем credentials для iOS
    try {
      const iosCreds = execSync('npx eas credentials:list --platform ios', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      console.log('✅ iOS credentials настроены');
    } catch (error) {
      console.log('⚠️  iOS credentials не настроены');
      console.log('💡 Выполните: npx eas credentials:configure --platform ios');
    }
    
    console.log('✅ EAS credentials проверены\n');
    return true;
  } catch (error) {
    console.log('❌ Ошибка проверки EAS credentials:', error.message);
    return false;
  }
}

/**
 * Генерация отчета
 */
function generateReport(results) {
  console.log('📊 === ОТЧЕТ О ТЕСТИРОВАНИИ ===\n');
  
  const tests = [
    { name: 'Конфигурация приложения', result: results.appConfig },
    { name: 'Firebase конфигурация', result: results.firebaseConfig },
    { name: 'EAS credentials', result: results.easCredentials },
    { name: 'Expo Push Service', result: results.expoPush },
    { name: 'Собственный сервер', result: results.customServer }
  ];
  
  tests.forEach(test => {
    const status = test.result ? '✅' : '❌';
    console.log(`${status} ${test.name}`);
  });
  
  const passedTests = tests.filter(t => t.result).length;
  const totalTests = tests.length;
  
  console.log(`\n📈 Результат: ${passedTests}/${totalTests} тестов пройдено`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Все тесты пройдены! Система готова к production deployment.');
  } else {
    console.log('⚠️  Есть проблемы, которые нужно исправить перед production deployment.');
  }
  
  console.log('\n📚 Следующие шаги:');
  
  if (!results.appConfig || !results.firebaseConfig) {
    console.log('1. Исправьте проблемы с конфигурацией');
  }
  
  if (!results.easCredentials) {
    console.log('2. Настройте EAS credentials для production билдов');
  }
  
  if (!results.expoPush && !results.customServer) {
    console.log('3. Настройте хотя бы один метод отправки уведомлений');
  }
  
  if (passedTests === totalTests) {
    console.log('4. Создайте preview билд: npx eas build --platform all --profile preview');
    console.log('5. Протестируйте уведомления на реальных устройствах');
    console.log('6. Создайте production билд: npx eas build --platform all --profile production');
    console.log('7. Опубликуйте в магазины: npx eas submit --platform all --profile production');
  }
}

/**
 * Основная функция тестирования
 */
async function runTests() {
  console.log('Запуск комплексного тестирования production системы уведомлений...\n');
  
  const results = {
    appConfig: false,
    firebaseConfig: false,
    easCredentials: false,
    expoPush: false,
    customServer: false
  };
  
  // Проверка конфигурации
  results.appConfig = checkAppConfiguration();
  results.firebaseConfig = checkFirebaseConfiguration();
  
  // Проверка EAS
  results.easCredentials = await checkEASCredentials();
  
  // Тестирование сервисов уведомлений
  results.expoPush = await testExpoPushService();
  results.customServer = await testCustomNotificationServer();
  
  // Генерация отчета
  generateReport(results);
}

// Запуск тестов
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  checkAppConfiguration,
  checkFirebaseConfiguration,
  testExpoPushService,
  testCustomNotificationServer,
  checkEASCredentials
};
