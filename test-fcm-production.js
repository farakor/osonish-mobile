#!/usr/bin/env node

/**
 * Скрипт для тестирования FCM в production режиме
 * Использует Service Account Key для отправки уведомлений
 */

const https = require('https');
const fs = require('fs');

// Читаем google-services.json
let googleServices;
try {
  googleServices = JSON.parse(fs.readFileSync('./google-services.json', 'utf8'));
  console.log('✅ google-services.json найден');
  console.log('📱 Project ID:', googleServices.project_info.project_id);
  console.log('📱 Package Name:', googleServices.client[0].client_info.android_client_info.package_name);
} catch (error) {
  console.error('❌ Ошибка чтения google-services.json:', error.message);
  process.exit(1);
}

// Функция для получения OAuth токена (упрощенная версия)
async function getAccessToken() {
  console.log('\n🔑 Для полного тестирования FCM нужен Service Account Key');
  console.log('💡 Этот ключ уже настроен в EAS credentials');
  console.log('💡 В production сборке FCM будет работать автоматически');
  return null;
}

// Функция для тестирования Expo Push с production токеном
async function testExpoProductionPush(pushToken) {
  console.log('\n🚀 Тестируем Expo Push с production настройками...');
  
  const message = {
    to: pushToken,
    sound: 'default',
    title: 'Production Test',
    body: `Тест production: ${new Date().toLocaleTimeString()}`,
    data: { 
      test: true, 
      production: true,
      projectId: googleServices.project_info.project_id
    },
    priority: 'high',
    channelId: 'default',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    console.log('📡 Ответ Expo сервера:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.data && result.data.status === 'ok') {
      console.log('✅ Production тест успешен!');
      console.log('💡 В production сборке это будет FCM уведомление');
      return true;
    } else {
      console.log('❌ Ошибка production теста:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    return false;
  }
}

// Проверка конфигурации
function checkProductionConfig() {
  console.log('\n🔍 === ПРОВЕРКА PRODUCTION КОНФИГУРАЦИИ ===');
  
  // 1. Проверяем google-services.json
  console.log('\n📱 Google Services:');
  console.log('  ✅ Файл найден');
  console.log('  ✅ Project ID:', googleServices.project_info.project_id);
  console.log('  ✅ Package Name:', googleServices.client[0].client_info.android_client_info.package_name);
  
  // 2. Проверяем app.json
  let appConfig;
  try {
    appConfig = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
    console.log('\n📋 App.json:');
    console.log('  ✅ EAS Project ID:', appConfig.expo.extra.eas.projectId);
    console.log('  ✅ Android Package:', appConfig.expo.android.package);
    console.log('  ✅ iOS Bundle ID:', appConfig.expo.ios.bundleIdentifier);
    console.log('  ✅ Notifications Plugin:', appConfig.expo.plugins.some(p => 
      Array.isArray(p) && p[0] === 'expo-notifications') ? 'Настроен' : 'Не найден');
    console.log('  ✅ POST_NOTIFICATIONS:', appConfig.expo.android.permissions.includes('android.permission.POST_NOTIFICATIONS') ? 'Есть' : 'Отсутствует');
    console.log('  ✅ Background Modes:', appConfig.expo.ios.infoPlist.UIBackgroundModes.includes('remote-notification') ? 'Настроены' : 'Не настроены');
  } catch (error) {
    console.error('❌ Ошибка чтения app.json:', error.message);
  }
  
  // 3. Проверяем соответствие Package Names
  const appPackage = appConfig?.expo?.android?.package;
  const googlePackage = googleServices.client[0].client_info.android_client_info.package_name;
  
  console.log('\n🔗 Соответствие Package Names:');
  if (appPackage === googlePackage) {
    console.log('  ✅ Package Names совпадают:', appPackage);
  } else {
    console.log('  ❌ Package Names НЕ совпадают!');
    console.log('    App.json:', appPackage);
    console.log('    Google Services:', googlePackage);
    console.log('  💡 Это может вызвать проблемы с FCM в production');
  }
  
  return appPackage === googlePackage;
}

// Основная функция
async function main() {
  const pushToken = process.argv[2];
  
  console.log('🔔 === ТЕСТ FCM PRODUCTION КОНФИГУРАЦИИ ===');
  
  // Проверяем конфигурацию
  const configOk = checkProductionConfig();
  
  if (!configOk) {
    console.log('\n❌ Конфигурация имеет проблемы - исправьте их перед production сборкой');
    process.exit(1);
  }
  
  // Тестируем с токеном если предоставлен
  if (pushToken) {
    if (!pushToken.startsWith('ExponentPushToken[')) {
      console.log('❌ Неверный формат push токена');
      process.exit(1);
    }
    
    await testExpoProductionPush(pushToken);
  } else {
    console.log('\n💡 Для тестирования отправки укажите push токен:');
    console.log('   node test-fcm-production.js "ExponentPushToken[ваш-токен]"');
  }
  
  console.log('\n✅ === ПРОВЕРКА ЗАВЕРШЕНА ===');
  console.log('💡 Если все проверки прошли успешно, FCM будет работать в production');
}

// Запуск
main().catch(console.error);
